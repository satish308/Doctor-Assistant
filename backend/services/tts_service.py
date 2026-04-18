import io
import logging
from gtts import gTTS

logger = logging.getLogger(__name__)

class TTSService:
    def __init__(self, device="cpu"):
        self.device = device

    def synthesize(self, text: str) -> bytes:
        try:
            logger.info(f"Synthesizing: {text[:60]}...")
            tts = gTTS(text=text, lang="en", slow=False)
            buf = io.BytesIO()
            tts.write_to_fp(buf)
            buf.seek(0)
            return buf.read()
        except Exception as e:
            logger.error(f"gTTS failed: {e}")
            return b""