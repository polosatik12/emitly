import asyncio
import logging
from datetime import datetime
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from app.parsers.base import BaseParser, ParsedArticle

logger = logging.getLogger(__name__)

TELEGRAM_RATE_LIMIT = 2.0  # seconds between requests


class TelegramParser(BaseParser):
    def __init__(self, channels: list[str]):
        self.channels = channels
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

    async def parse(self) -> list[ParsedArticle]:
        articles = []
        async with httpx.AsyncClient(
            timeout=30.0, headers=self.headers, follow_redirects=True
        ) as client:
            for channel in self.channels:
                try:
                    channel_articles = await self._parse_channel(client, channel)
                    articles.extend(channel_articles)
                    logger.info(
                        "Parsed channel %s: %d articles", channel, len(channel_articles)
                    )
                except Exception as e:
                    logger.error("Failed to parse channel %s: %s", channel, e)
                await asyncio.sleep(TELEGRAM_RATE_LIMIT)
        return articles

    async def _parse_channel(
        self, client: httpx.AsyncClient, channel: str
    ) -> list[ParsedArticle]:
        url = f"https://t.me/s/{channel}"
        resp = await client.get(url)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")
        messages = soup.select("div.tgme_widget_message_wrap")

        articles = []
        for msg in messages:
            text_el = msg.select_one("div.tgme_widget_message_text")
            if not text_el:
                continue

            raw_text = text_el.get_text(separator="\n", strip=True)
            if not raw_text:
                continue

            date_el = msg.select_one("time.tgme_widget_message_date")
            published_at = None
            if date_el and date_el.get("datetime"):
                try:
                    published_at = datetime.fromisoformat(date_el["datetime"])
                except (ValueError, TypeError):
                    pass

            link_el = msg.select_one("a.tgme_widget_message_date")
            original_url = None
            if link_el and link_el.get("href"):
                href = link_el["href"]
                if href.startswith("http"):
                    original_url = href
                else:
                    original_url = f"https://t.me{href}"

            # Use first ~500 chars as title
            title = None
            first_line = raw_text.split("\n")[0]
            if len(first_line) > 10:
                title = first_line[:200]

            articles.append(
                ParsedArticle(
                    title=title,
                    raw_text=raw_text,
                    original_url=original_url,
                    published_at=published_at,
                )
            )

        # Return newest first, limit to 20 per fetch
        return articles[:20]
