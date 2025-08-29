# app/services/firestore.py
from dotenv import load_dotenv
load_dotenv() 
import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase only once
if not firebase_admin._apps:
    cred_path = os.getenv("FIREBASE_CREDENTIALS_JSON")  # path to JSON key
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# -------------------------------
# Firestore helper functions
# -------------------------------
def add_document(collection_name: str, doc_data: dict, doc_id: str = None):
    if doc_id:
        db.collection(collection_name).document(doc_id).set(doc_data)
    else:
        db.collection(collection_name).add(doc_data)

def get_document(collection_name: str, doc_id: str):
    doc = db.collection(collection_name).document(doc_id).get()
    if doc.exists:
        return doc.to_dict()
    return None

def get_all_documents(collection_name: str):
    docs = db.collection(collection_name).stream()
    return [doc.to_dict() for doc in docs]
