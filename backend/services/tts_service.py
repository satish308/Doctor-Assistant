import io
import logging
import pyttsx3
import tempfile
import os
from gtts import gTTS

logger = logging.getLogger(__name__)

LANGUAGE_CODES = {
    "english": "en",
    "telugu": "te",
    "hindi": "hi",
    "tamil": "ta",
    "kannada": "kn",
    "malayalam": "ml",
    "marathi": "mr",
    "bengali": "bn",
}

ENGLISH_LANGUAGES = {"english"}

class TTSService:
    def __init__(self, device="cpu"):
        self.device = device

    def synthesize_male_english(self, text: str) -> bytes:
        try:
            engine = pyttsx3.init()
            voices = engine.getProperty("voices")
            # Select male voice
            for voice in voices:
                if "male" in voice.name.lower() or "david" in voice.name.lower() or "mark" in voice.name.lower() or "james" in voice.name.lower():
                    engine.setProperty("voice", voice.id)
                    break
            else:
                # If no male found, use first available voice
                if voices:
                    engine.setProperty("voice", voices[0].id)

            engine.setProperty("rate", 165)
            engine.setProperty("volume", 1.0)

            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
                tmp_path = f.name

            engine.save_to_file(text, tmp_path)
            engine.runAndWait()
            engine.stop()

            with open(tmp_path, "rb") as f:
                audio_bytes = f.read()
            os.unlink(tmp_path)
            return audio_bytes
        except Exception as e:
            logger.error(f"pyttsx3 failed: {e}")
            return self.synthesize_gtts(text, "en")

    def synthesize_gtts(self, text: str, lang_code: str) -> bytes:
        try:
            tts = gTTS(text=text, lang=lang_code, slow=False)
            buf = io.BytesIO()
            tts.write_to_fp(buf)
            buf.seek(0)
            return buf.read()
        except Exception as e:
            logger.error(f"gTTS failed: {e}")
            return b""

    def synthesize(self, text: str, language: str = "english") -> bytes:
        lang_code = LANGUAGE_CODES.get(language.lower(), "en")
        logger.info(f"Synthesizing [{language}]: {text[:60]}...")

        if language.lower() == "english":
            return self.synthesize_male_english(text)
        else:
            return self.synthesize_gtts(text, lang_code)