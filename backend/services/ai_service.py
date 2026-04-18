import logging
import anthropic
import os
import re
from dotenv import load_dotenv
load_dotenv()
logger = logging.getLogger(__name__)

class AIService:
    def __init__(self, api_key: str = None):
        self.client = anthropic.Anthropic(
            api_key=api_key or os.getenv("ANTHROPIC_API_KEY")
        )

    def clean_text(self, text: str) -> str:
        text = re.sub(r"#+ ", "", text)
        text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
        text = re.sub(r"\*(.*?)\*", r"\1", text)
        text = re.sub(r"- ", "", text)
        text = re.sub(r"\n+", " ", text)
        return text.strip()

    def get_response(self, user_message: str) -> str:
        logger.info(f"Sending to Claude: {user_message[:60]}")
        message = self.client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            system="You are Dr. Satish, a helpful and friendly AI doctor assistant. Give clear, simple, and caring medical advice in plain text only. No bullet points, no markdown, no symbols. Always recommend seeing a real doctor for serious issues. Keep responses under 100 words.",
            messages=[
                {"role": "user", "content": user_message}
            ]
        )
        reply = message.content[0].text
        reply = self.clean_text(reply)
        logger.info(f"Claude reply: {reply[:60]}")
        return reply