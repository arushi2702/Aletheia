# xai.py
import torch
import shap
from typing import List, Dict

def get_top_bias_words(model, tokenizer, sentences: List[str]) -> List[Dict]:
    """
    Returns sentence-level bias scores and top contributing words using SHAP.
    Each highlight has 'sentence', 'score', 'bias', and 'explanation' fields.
    """
    highlights = []

    # Tokenize all sentences in batch
    inputs = tokenizer(
        sentences,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=128
    )

    with torch.no_grad():
        logits = model(**inputs).logits
        probs = torch.softmax(logits, dim=-1)[:, 1].numpy()  # biased class prob

    # ---------------------------
    # SHAP explanation
    # ---------------------------
    # Define a simple forward function for SHAP
    def f(input_ids):
        with torch.no_grad():
            output = model(input_ids=input_ids, attention_mask=(input_ids > 0).long())
            probs = torch.softmax(output.logits, dim=-1)[:, 1]  # biased class
        return probs.numpy()

    # Use a subset of inputs for SHAP (can sample for large articles)
    explainer = shap.Explainer(f, masker=inputs["input_ids"])
    shap_values = explainer(inputs["input_ids"])

    # Iterate sentences
    for i, (sent, score_val, input_ids) in enumerate(zip(sentences, probs, inputs["input_ids"])):
        # Get top contributing tokens for this sentence
        token_shap_values = shap_values.values[i]
        tokens = tokenizer.convert_ids_to_tokens(input_ids)
        # Filter out special tokens
        token_shap_pairs = [
            (t, abs(s)) for t, s in zip(tokens, token_shap_values) if t not in tokenizer.all_special_tokens
        ]
        # Sort by absolute SHAP value
        token_shap_pairs.sort(key=lambda x: x[1], reverse=True)
        top_tokens = [t for t, _ in token_shap_pairs[:5]]  # top 5 words
        explanation = "; ".join(top_tokens) if top_tokens else "; ".join(sent.split()[:5])

        # Bias level
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
            "explanation": explanation
        })

    return highlights
