import json
import logging

import ollama

from app.core.config import settings
from app.llm.prompts import (
    DUPLICATE_CHECK_PROMPT,
    PROCESS_NEWS_PROMPT,
)

logger = logging.getLogger(__name__)


class OllamaClient:
    def __init__(self):
        self.client = ollama.AsyncClient(host=settings.OLLAMA_URL)
        self.model = settings.OLLAMA_MODEL

    async def process_news(self, raw_text: str) -> dict:
        """Process raw news text: clean, rewrite, detect tickers."""
        prompt = PROCESS_NEWS_PROMPT.format(raw_text=raw_text[:4000])
        try:
            response = await self.client.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": 0.1},
            )
            # ollama package returns a ChatResponse (dataclass-like)
            text = response.message.content
            return self._parse_json(text)
        except Exception as e:
            logger.error("LLM process_news failed: %s", e)
            return {
                "cleaned_text": raw_text,
                "detected_tickers": [],
                "is_summary": False,
            }

    async def is_duplicate(self, text1: str, text2: str) -> bool:
        """Check if two texts are duplicates of each other."""
        prompt = DUPLICATE_CHECK_PROMPT.format(
            text1=text1[:2000],
            text2=text2[:2000],
        )
        try:
            response = await self.client.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": 0.1},
            )
            text = response.message.content
            result = self._parse_json(text)
            return result.get("is_duplicate", False)
        except Exception as e:
            logger.error("LLM is_duplicate failed: %s", e)
            return False

    def _parse_json(self, text: str) -> dict:
        """Extract JSON from LLM response."""
        text = text.strip()
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            text = text[start : end + 1]
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            logger.warning("Failed to parse JSON from LLM response: %s", text[:200])
            return {}
