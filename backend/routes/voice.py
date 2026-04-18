import base64
import logging
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from config import get_settings
from services import AIService, STTService, TTSService
from utils.session import session_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/voice", tags=["voice"])

class ChatResponse(BaseModel):
    session_id: str
    transcript: str
    reply_text: str
    audio_base64: str
    audio_mime: str = "audio/wav"

class SynthesizeRequest(BaseModel):
    text: str

class TextChatRequest(BaseModel):
    message: str
    session_id: str = ""

@router.get("/session/new")
async def new_session():
    session_id = session_manager.create_session()
    return {"session_id": session_id}

@router.delete("/session/{session_id}")
async def clear_session(session_id: str):
    session_manager.clear_session(session_id)
    return {"message": "Session cleared"}

@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    settings = get_settings()
    stt = STTService(model_name=settings.whisper_model)
    audio_bytes = await audio.read()
    if len(audio_bytes) < 100:
        raise HTTPException(400, "Audio file is too small or empty.")
    transcript = stt.transcribe(audio_bytes, mime_type=audio.content_type or "audio/webm")
    return {"transcript": transcript}

@router.post("/chat", response_model=ChatResponse)
async def voice_chat(
    audio: UploadFile = File(...),
    session_id: str = Form(default=""),
):
    settings = get_settings()
    stt = STTService(model_name=settings.whisper_model)
    ai = AIService(api_key=settings.anthropic_api_key)
    tts = TTSService(device=settings.csm_device)

    audio_bytes = await audio.read()
    if len(audio_bytes) < 100:
        raise HTTPException(400, "Audio file is too small or empty.")

    if not session_id:
        session_id = session_manager.create_session()

    logger.info(f"[{session_id}] Transcribing...")
    transcript = stt.transcribe(audio_bytes, mime_type=audio.content_type or "audio/webm")
    if not transcript:
        transcript = "Hello doctor, I need help."

    logger.info(f"[{session_id}] Getting AI response...")
    reply_text = ai.get_response(transcript)

    logger.info(f"[{session_id}] Synthesizing voice...")
    wav_bytes = tts.synthesize(reply_text)
    audio_b64 = base64.b64encode(wav_bytes).decode("utf-8")

    return ChatResponse(
        session_id=session_id,
        transcript=transcript,
        reply_text=reply_text,
        audio_base64=audio_b64,
    )

@router.post("/chat-text")
async def text_chat(req: TextChatRequest):
    settings = get_settings()
    ai = AIService(api_key=settings.anthropic_api_key)
    tts = TTSService(device=settings.csm_device)

    session_id = req.session_id
    if not session_id:
        session_id = session_manager.create_session()

    logger.info(f"[{session_id}] Text message: {req.message[:60]}")
    reply_text = ai.get_response(req.message)

    wav_bytes = tts.synthesize(reply_text)
    audio_b64 = base64.b64encode(wav_bytes).decode("utf-8")

    return ChatResponse(
        session_id=session_id,
        transcript=req.message,
        reply_text=reply_text,
        audio_base64=audio_b64,
    )

@router.post("/synthesize")
async def synthesize_text(req: SynthesizeRequest):
    settings = get_settings()
    tts = TTSService(device=settings.csm_device)
    wav_bytes = tts.synthesize(req.text)
    return Response(
        content=wav_bytes,
        media_type="audio/wav",
    )