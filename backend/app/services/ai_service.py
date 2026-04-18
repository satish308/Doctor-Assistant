import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash")

def get_medical_response(patient_text: str) -> str:
    prompt = f"""You are a helpful medical assistant. 
A patient says: {patient_text}

Please provide a helpful, clear medical response. 
Always remind the patient to consult a real doctor for serious concerns."""

    response = model.generate_content(prompt)
    return response.text