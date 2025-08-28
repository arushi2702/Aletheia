from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any
import os
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
import numpy as np
from dotenv import load_dotenv


load_dotenv()

from app.models import (
    run_sentence_model,
    run_article_model,
    run_image_model,
    enqueue_video_job,
    get_job_status,
)

app = FastAPI(title="BiasLab API")

# ------------------------------
# CORS
# ------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust in production
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
# Article analysis
# ------------------------------
@app.post("/analyze/article")
async def analyze_article(text: str = Form(...)) -> Dict:
    # URL handling
    text_content = extract_text_from_url(text) if text.startswith("http") else text

    # Article-level score
    try:
        article_score, themes = run_article_model(text_content)
        article_score = float(article_score or 0.0)
    except Exception as e:
        print("run_article_model error:", e)
        article_score, themes = 0.0, []

    # Sentence-level
    try:
        sentence_results = run_sentence_model(text_content) or []
    except Exception as e:
        print("run_sentence_model error:", e)
        sentence_results = []

    highlights: List[Dict[str, Any]] = []
    for r in sentence_results:
        sent = r.get("sentence") if isinstance(r, dict) else str(r)
        try:
            score_val = float(r.get("score", 0.0))
        except Exception:
            score_val = 0.0
        explanation = r.get("explanation", "") if isinstance(r, dict) else ""

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
            "score": round(score_val, 4),
            "bias": bias_level,
            "explanation": explanation
        })

    # Confidence
    if highlights:
        bias_prob = float(np.mean([h["score"] for h in highlights]))
    else:
        bias_prob = float(article_score)

    bias_prob = float(max(0.0, min(1.0, bias_prob)))
    overall_bias = "biased" if bias_prob >= 0.5 else "neutral"

    return {
        "overall_bias": overall_bias,
        "confidence_score": round(bias_prob, 4),
        "confidence_pct": round(bias_prob * 100, 2),
        "highlights": highlights,
        "themes": themes,
        "original_text": text_content
    }

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

        # ✅ safer parsing
        neutral = ""
        if response and hasattr(response, "candidates") and response.candidates:
            parts = response.candidates[0].content.parts
            if parts and hasattr(parts[0], "text"):
                neutral = parts[0].text.strip()

        if not neutral:
            neutral = text  # fallback

        return {"neutral_text": neutral}

    except HTTPException:
        raise
    except Exception as e:
        # ✅ log raw response if debugging
        print("Gemini error:", str(e))
        raise HTTPException(status_code=500, detail=f"Rephrase failed: {str(e)}")
