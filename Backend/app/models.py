# app/models.py
import os
import uuid
import io
import tempfile
from typing import List, Dict, Tuple

import torch
from transformers import BertTokenizer, BertForSequenceClassification
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import Tokenizer
from PIL import Image
import numpy as np
import cv2

# SHAP
import shap

# ------------------------------
# Helper: check file existence
# ------------------------------
def check_file(path: str):
    exists = os.path.exists(path)
    print(f"Checking {path}: {exists}")
    return exists

# ------------------------------
# Sentence Model (BERT, PyTorch) with SHAP + batching
# ------------------------------
SENTENCE_MODEL_DIR = r"C:/Users/Arushi/Desktop/Important/Axios/biaslab/backend/models/sentence_model"
check_file(SENTENCE_MODEL_DIR)
print("Files in sentence model folder:", os.listdir(SENTENCE_MODEL_DIR))

sentence_tokenizer = BertTokenizer.from_pretrained(SENTENCE_MODEL_DIR)
sentence_model = BertForSequenceClassification.from_pretrained(
    SENTENCE_MODEL_DIR,
    torch_dtype=torch.float32
)
sentence_model.eval()
print("BERT model loaded successfully.")

def run_sentence_model(text: str, batch_size: int = 8) -> List[Dict]:
    from nltk.tokenize import sent_tokenize
    sentences = sent_tokenize(text)
    results = []

    # Function wrapper for SHAP
    def f(input_texts):
        if isinstance(input_texts, np.ndarray):
            input_texts = input_texts.tolist()
        if isinstance(input_texts, str):
            input_texts = [input_texts]
        elif isinstance(input_texts, (list, tuple)):
            input_texts = [str(x) for x in input_texts]
        else:
            raise ValueError(f"Unexpected input type: {type(input_texts)}")

        all_probs = []
        for i in range(0, len(input_texts), batch_size):
            batch = input_texts[i:i + batch_size]
            inputs = sentence_tokenizer(
                batch,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=128
            )
            with torch.no_grad():
                logits = sentence_model(**inputs).logits
            probs = torch.softmax(logits, dim=-1)[:, 1].numpy()
            all_probs.extend(probs)
        return np.array(all_probs)

    # SHAP explainer
    explainer = shap.Explainer(f, shap.maskers.Text(sentence_tokenizer))

    # Batch processing for SHAP
    for i in range(0, len(sentences), batch_size):
        batch_sents = sentences[i:i + batch_size]
        batch_scores = f(batch_sents)
        batch_shap_values = explainer(batch_sents)

        for sent, score, shap_val_obj in zip(batch_sents, batch_scores, batch_shap_values):
            try:
                shap_vals = shap_val_obj.values[0]
                explanation_words = []
                for word, val in zip(sent.split(), shap_vals):
                    if val > 0.05:
                        explanation_words.append(f"'{word}' increases bias")
                    elif val < -0.05:
                        explanation_words.append(f"'{word}' reduces bias")
                explanation = "; ".join(explanation_words) if explanation_words else "No strong bias detected"
            except Exception:
                explanation = "Bias contribution could not be mapped to words."

            if score > 0.3:
                start = text.find(sent)
                end = start + len(sent)
                results.append({
                    "start": start,
                    "end": end,
                    "sentence": sent,
                    "score": float(score),
                    "explanation": explanation,
                })

    return results

# ------------------------------
# Article Model (BiLSTM, TensorFlow)
# ------------------------------
ARTICLE_MODEL_PATH = r"C:/Users/Arushi/Desktop/Important/Axios/biaslab/backend/models/article_model.h5"
check_file(ARTICLE_MODEL_PATH)
article_model = load_model(ARTICLE_MODEL_PATH)
article_tokenizer = Tokenizer(num_words=5000)

def run_article_model(text: str) -> Tuple[float, List[str]]:
    seq = article_tokenizer.texts_to_sequences([text])
    expected_len = article_model.input_shape[1]
    padded = pad_sequences(seq, maxlen=expected_len)
    score = float(article_model.predict(padded)[0,0])
    themes = []
    return score, themes

# ------------------------------
# Image Model (CNN, TensorFlow)
# ------------------------------
IMAGE_MODEL_PATH = r"C:/Users/Arushi/Desktop/Important/Axios/biaslab/backend/models/image_model.h5"
check_file(IMAGE_MODEL_PATH)
image_model = load_model(IMAGE_MODEL_PATH)

def preprocess_image(file_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    img = img.resize((128, 128))
    arr = np.array(img) / 255.0
    arr = np.expand_dims(arr, axis=0)
    return arr

def run_image_model(file_bytes: bytes) -> Dict:
    arr = preprocess_image(file_bytes)
    pred = image_model.predict(arr)[0, 0]
    label = "manipulated" if pred > 0.5 else "real"
    score = float(pred) if label == "manipulated" else float(1 - pred)
    return {"label": label, "score": score}

# ------------------------------
# Video Model (YOLO/ViT, PyTorch)
# ------------------------------
VIDEO_MODEL_PATH = r"C:/Users/Arushi/Desktop/Important/Axios/biaslab/backend/models/video_model.pth"
check_file(VIDEO_MODEL_PATH)
video_model = torch.load(VIDEO_MODEL_PATH, map_location="cpu", weights_only=False)
video_model.eval()

_jobs: Dict[str, Dict] = {}

def run_video_model(file_path: str) -> Dict:
    cap = cv2.VideoCapture(file_path)
    frames = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frames += 1
    cap.release()
    return {"label": "deepfake", "score": 0.88}

def enqueue_video_job(file_bytes: bytes) -> str:
    job_id = str(uuid.uuid4())
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    temp_file.write(file_bytes)
    temp_file.close()
    temp_path = temp_file.name

    _jobs[job_id] = {"status": "queued"}
    try:
        _jobs[job_id]["status"] = "running"
        result = run_video_model(temp_path)
        _jobs[job_id]["status"] = "done"
        _jobs[job_id]["result"] = result
    except Exception as e:
        _jobs[job_id]["status"] = "error"
        _jobs[job_id]["error"] = str(e)
    return job_id

def get_job_status(job_id: str):
    return _jobs.get(job_id)
