import base64
import json
import logging
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import Response, StreamingResponse
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
    audio_mime: str = "audio/mpeg"

class SynthesizeRequest(BaseModel):
    text: str
    language: str = "english"

class TextChatRequest(BaseModel):
    message: str
    session_id: str = ""
    language: str = "english"

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
    language: str = Form(default="english"),
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
    logger.info(f"[{session_id}] Transcribing [{language}]...")
    transcript = stt.transcribe(audio_bytes, mime_type=audio.content_type or "audio/webm")
    if not transcript:
        transcript = "Hello doctor, I need help."
    logger.info(f"[{session_id}] Getting AI response...")
    reply_text = ai.get_response(transcript, language=language)
    logger.info(f"[{session_id}] Synthesizing voice [{language}]...")
    wav_bytes = tts.synthesize(reply_text, language=language)
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
    logger.info(f"[{session_id}] Text message [{req.language}]: {req.message[:60]}")
    reply_text = ai.get_response(req.message, language=req.language)
    wav_bytes = tts.synthesize(reply_text, language=req.language)
    audio_b64 = base64.b64encode(wav_bytes).decode("utf-8")
    return ChatResponse(
        session_id=session_id,
        transcript=req.message,
        reply_text=reply_text,
        audio_base64=audio_b64,
    )

@router.post("/stream-text")
async def stream_text_chat(req: TextChatRequest):
    settings = get_settings()
    ai = AIService(api_key=settings.anthropic_api_key)
    session_id = req.session_id or session_manager.create_session()
    logger.info(f"[{session_id}] Streaming [{req.language}]: {req.message[:60]}")

    def generate():
        for chunk in ai.get_streaming_response(req.message, language=req.language):
            data = json.dumps({"token": chunk, "session_id": session_id})
            yield f"data: {data}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/synthesize")
async def synthesize_text(req: SynthesizeRequest):
    settings = get_settings()
    tts = TTSService(device=settings.csm_device)
    wav_bytes = tts.synthesize(req.text, language=req.language)
    return Response(
        content=wav_bytes,
        media_type="audio/mpeg",
    )