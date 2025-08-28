# main.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List
import os
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
import numpy as np
from dotenv import load_dotenv
import torch
from nltk.tokenize import sent_tokenize

load_dotenv()

from app.models import (
    run_sentence_model,
    run_article_model,
    run_image_model,
    enqueue_video_job,
    get_job_status,
    sentence_tokenizer,
    sentence_model
)
from app.xai import get_top_bias_words

app = FastAPI(title="BiasLab API")

# ------------------------------
# CORS
# ------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------
# Gemini setup
# ------------------------------
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# ------------------------------
# Helpers
# ------------------------------
def extract_text_from_url(url: str) -> str:
    """Scrape webpage text content"""
    try:
        resp = requests.get(url, timeout=10)
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        return " ".join(p.get_text() for p in soup.find_all("p")).strip()
    except Exception as e:
        print("Error scraping:", e)
        return url  # fallback

# ------------------------------
# Schemas
# ------------------------------
class TextRequest(BaseModel):
    text: str

# ------------------------------
# Health check
# ------------------------------
@app.get("/health")
async def health():
    return {"status": "ok"}

# ------------------------------
# Sentence analysis
# ------------------------------
@app.post("/analyze/sentence")
async def analyze_sentence(text: str = Form(...)) -> List[Dict]:
    return run_sentence_model(text)

# ------------------------------
# Article analysis logic
# ------------------------------
def analyze_article_logic(text_content: str) -> Dict:
    """
    Analyze an article, compute sentence-level bias, and attach SHAP-like explanations.
    """
    sentences = sent_tokenize(text_content)
    highlights: List[Dict] = []

    if sentences:
        try:
            highlights = get_top_bias_words(sentence_model, sentence_tokenizer, sentences)
        except Exception as e:
            print("SHAP analysis error:", e)
            # fallback scoring if SHAP fails
            inputs = sentence_tokenizer(
                sentences,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=128
            )
            with torch.no_grad():
                logits = sentence_model(**inputs).logits
            probs = torch.softmax(logits, dim=-1)[:, 1].numpy()
            for sent, score_val in zip(sentences, probs):
                if score_val > 0.6:
                    bias_level = "high"
                elif score_val > 0.3:
                    bias_level = "medium"
                elif score_val > 0:
                    bias_level = "low"
                else:
                    bias_level = "neutral"
                highlights.append({
                    "sentence": sent,
                    "score": float(score_val),
                    "bias": bias_level,
                    "explanation": "; ".join(sent.split()[:5])
                })

    # Compute overall confidence
    bias_prob = float(np.mean([h["score"] for h in highlights])) if highlights else 0.0
    bias_prob = max(0.0, min(1.0, bias_prob))
    overall_bias = "biased" if bias_prob >= 0.5 else "neutral"
    confidence_score = bias_prob if overall_bias == "biased" else 1 - bias_prob

    return {
        "overall_bias": overall_bias,
        "confidence_score": round(confidence_score, 4),
        "confidence_pct": round(confidence_score * 100, 2),
        "highlights": highlights,
        "themes": [],
        "original_text": text_content
    }

# ------------------------------
# Article analysis endpoint
# ------------------------------
@app.post("/analyze/article")
async def analyze_article(text: str = Form(...)) -> Dict:
    text_content = extract_text_from_url(text) if text.startswith("http") else text
    return analyze_article_logic(text_content)

# ------------------------------
# Image analysis
# ------------------------------
@app.post("/analyze/image")
async def analyze_image(file: UploadFile = File(...)) -> Dict:
    content = await file.read()
    return run_image_model(content)

# ------------------------------
# Video analysis
# ------------------------------
@app.post("/analyze/video")
async def analyze_video(file: UploadFile = File(...)) -> Dict:
    content = await file.read()
    job_id = enqueue_video_job(content)
    return {"job_id": job_id}

@app.get("/analyze/video/status/{job_id}")
async def video_status(job_id: str) -> Dict:
    status = get_job_status(job_id)
    if not status:
        return {"error": "Job ID not found"}
    return status

# ------------------------------
# Rephrase
# ------------------------------
@app.post("/rephrase")
async def rephrase(payload: TextRequest) -> Dict:
    try:
        text = payload.text.strip()
        if not text:
            raise HTTPException(status_code=422, detail="Field 'text' is required.")

        prompt = f"""
Rewrite the following text in a clear, factual, and unbiased way.
- Remove emotionally loaded or opinionated language.
- Preserve verifiable facts, dates, numbers, and named entities. Do NOT invent.
- Attribute opinions explicitly (e.g., "X said...") without endorsing.
- Return only the rewritten text.

Text:
{text}
"""
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)

        neutral = ""
        if response and hasattr(response, "candidates") and response.candidates:
            parts = response.candidates[0].content.parts
            if parts and hasattr(parts[0], "text"):
                neutral = parts[0].text.strip()
        if not neutral:
            neutral = text

        return {"neutral_text": neutral}

    except HTTPException:
        raise
    except Exception as e:
        print("Gemini error:", str(e))
        raise HTTPException(status_code=500, detail=f"Rephrase failed: {str(e)}")

# ------------------------------
# Scrape and analyze
# ------------------------------
@app.post("/scrape-and-analyze")
async def scrape_and_analyze(url: str = Form(...)) -> Dict:
    if not url.startswith("http"):
        raise HTTPException(status_code=422, detail="Invalid URL.")
    text_content = extract_text_from_url(url)
    if not text_content:
        raise HTTPException(status_code=500, detail="Failed to extract text from URL.")
    return analyze_article_logic(text_content)
