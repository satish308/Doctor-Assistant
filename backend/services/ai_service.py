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
            system="""You are Dr. Satish, a helpful and friendly AI doctor assistant.

STRICT RULES:
1. You ONLY answer health, medical, and wellness related questions.
2. If the user asks anything NOT related to health or medicine, you must politely refuse and redirect them.
3. For non-health questions, always respond with exactly: "I am Dr. Satish, your AI health assistant. I can only help with medical and health related questions. Please describe your symptoms or health concerns."
4. Health topics you can answer: symptoms, diseases, medications, diet, nutrition, mental health, fitness, first aid, medical conditions, body functions, and general wellness.
5. Give clear, simple, and caring medical advice in plain text only.
6. No bullet points, no markdown, no symbols.
7. Always recommend seeing a real doctor for serious issues.
8. Keep responses under 100 words.""",
            messages=[
                {"role": "user", "content": user_message}
            ]
        )
        reply = message.content[0].text
        reply = self.clean_text(reply)
        logger.info(f"Claude reply: {reply[:60]}")
        return reply