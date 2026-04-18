import io
import logging
import speech_recognition as sr
from pydub import AudioSegment

logger = logging.getLogger(__name__)

class STTService:
    def __init__(self, model_name="tiny"):
        self.recognizer = sr.Recognizer()

    def transcribe(self, audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
        try:
            audio_file = io.BytesIO(audio_bytes)
            audio = AudioSegment.from_file(audio_file, format="webm")
            wav_buf = io.BytesIO()
            audio.export(wav_buf, format="wav")
            wav_buf.seek(0)
            with sr.AudioFile(wav_buf) as source:
                recorded = self.recognizer.record(source)
            text = self.recognizer.recognize_google(recorded)
            logger.info(f"Transcribed: {text}")
            return text
        except sr.UnknownValueError:
            logger.warning("Could not understand audio")
            return "I could not understand the audio. Please try again."
        except Exception as e:
            logger.error(f"STT error: {e}")
            return "Audio transcription failed. Please type your symptoms."