from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
import whisper
import os
import uuid
from app.services.ai_service import get_medical_response

router = APIRouter()

whisper_model = whisper.load_model("base")

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    upload_dir = "uploads"
    file_path = os.path.join(upload_dir, f"{uuid.uuid4()}.wav")

    with open(file_path, "wb") as f:
        f.write(await file.read())

    result = whisper_model.transcribe(file_path)
    text = result["text"]

    ai_response = get_medical_response(text)

    os.remove(file_path)

    return JSONResponse({
        "patient_text": text,
        "ai_response": ai_response
    })