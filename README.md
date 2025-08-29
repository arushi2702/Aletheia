# Aletheia 🔍

Aletheia is an AI-powered platform designed to **detect, explain, and mitigate irresponsible consumption of information** in textual, visual, and video content. It supports researchers, journalists, educators, and the general public in identifying implicit or explicit manipulation in data and responds factually.

---

## 📌 Objectives

- Provide **sentence-level and article-level bias detection** for accurate analysis of written content.  
- Help **rephrase biased statements** into neutral alternatives without losing factual accuracy.  
- Deepfake detection beyond text to **images and videos**, acknowledging the multi-modal nature of modern media.  
- Store and track analyses securely in **Firebase Firestore** for research and longitudinal studies.  
- Contribute to **media literacy and social awareness** by making bias measurable, explainable, and correctable.  

---

## ⚙️ Key Features  

### 1. Sentence-Level Bias Detection  
- Input: A single sentence.  
- Output: Bias classification (`neutral`, `low`, `medium`, `high`) with a **confidence score**.  
- Provides **token-level explanations** (which words influenced the bias decision).  
- **Use case**: Researchers studying framing in political speeches or policy documents.  

---

### 2. Article-Level Bias Detection (with Web Scraping)  
- Accepts either **direct text input** or a **URL**.  
- Uses a web scraper to extract article text (removing ads, scripts, and formatting noise).  
- Processes the article **sentence by sentence**, assigning bias levels and generating an **overall article bias score**.  
- **Use case**: Journalists verifying neutrality in coverage across different media outlets.  

---

### 3. Rephrasing Biased Text  
- Powered by the **Google Gemini API**.  
- Rewrites biased content into a **more factual and neutral version**, preserving key details like names, dates, and figures.  
- Both original and rephrased versions are stored in **Firestore** for reference.  
- **Use case**: Editors and educators ensuring materials are objective and inclusive.  

---

### 4. Image Bias Analysis  
- Upload an image to detect potential **visual framing bias** (e.g., selective cropping, focus, or sentiment conveyed through imagery).  
- Provides structured predictions to assist in **critical evaluation of visual media**.  
- **Use case**: Media analysts assessing bias in photojournalism.  

---

### 5. Video Bias Analysis  
- Supports video uploads for **asynchronous bias evaluation**.  
- Uses Celery + Redis for background processing.  
- Returns job IDs for tracking analysis progress.  
- **Use case**: Researchers studying political ads, campaign videos, or news broadcasts.  

---

### 6. Firebase Integration  
- **Firestore database** stores all analyses, including text inputs, rephrased outputs, confidence scores, and timestamps.  
- Enables **audit trails** and **long-term studies** of bias across sources and time periods.  
- **Use case**: Building datasets for academic research on media bias.  

---

## 🛠 Technology Stack  

- **Frontend**: React
- **Backend Framework**: FastAPI (Python 3.13), Uvicorn  
- **ML**: HuggingFace Transformers (BERT-based classifiers), SHAP for explanations, CNNs, YOLO, BiLSTM, OpenCV,  
- **Generative AI**: Google Gemini API for rephrasing  
- **Database**: Firebase Firestore  
- **Task Queue**: Celery + Redis for async video processing  
- **Web Scraping**: Requests + BeautifulSoup  

---

## 🚀 Setup Instructions  

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/biaslab.git
cd biaslab
```
### **2. Create Virtual Environment**
```bash
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows
```
### **3. Install Dependencies**
```bash
pip install -r requirements.txt
```
### **4. Configure Environment Variables**

Create a .env file inside backend/ with:
```ini
GOOGLE_API_KEY=<your-google-api-key>
FIREBASE_CREDENTIALS_JSON=app/secrets/firebase.json
```
### **5. Run the Backend API**
```bash
uvicorn app.main:app --reload
```
### **6. Run Frontend**

On a separate terminal, run:
```bash
npm install
npm run dev
```
