import asyncio
import logging
from datetime import datetime
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from app.parsers.base import BaseParser, ParsedArticle

logger = logging.getLogger(__name__)

WEBSITE_RATE_LIMIT = 3.0

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
}


def _extract_generic(soup: BeautifulSoup, url: str) -> list[ParsedArticle]:
    """Fallback parser: extract headings and paragraphs."""
    articles = []
    for h in soup.find_all(["h1", "h2", "h3"]):
        text = h.get_text(strip=True)
        if len(text) > 15:
            articles.append(
                ParsedArticle(
                    title=text[:200],
                    raw_text=text,
                    original_url=url,
                    published_at=None,
                )
            )
    for p in soup.find_all("p"):
        text = p.get_text(strip=True)
        if len(text) > 50:
            articles.append(
                ParsedArticle(
                    title=None,
                    raw_text=text[:1000],
                    original_url=url,
                    published_at=None,
                )
            )
    return articles


def _parse_smartlab(soup: BeautifulSoup, url: str) -> list[ParsedArticle]:
    articles = []
    for item in soup.select("div.post, article, div.news-item, div.message"):
        title_el = item.select_one("h2, h3, a.post_title, a.topic_title")
        text_el = item.select_one("p, div.topic_text, div.post_body")
        title = title_el.get_text(strip=True) if title_el else None
        text = text_el.get_text(strip=True) if text_el else (title or "")
        if len(text) > 20:
            articles.append(
                ParsedArticle(
                    title=title[:200] if title else None,
                    raw_text=text,
                    original_url=url,
                    published_at=None,
                )
            )
    return articles or _extract_generic(soup, url)


def _parse_rbc(soup: BeautifulSoup, url: str) -> list[ParsedArticle]:
    articles = []
    for item in soup.select("article, .news-item, .news-list__item, .l-feed__item"):
        title_el = item.select_one("h2, h3, a, .news-item__title")
        text_el = item.select_one("p, .news-item__description, .l-feed__item_text")
        title = title_el.get_text(strip=True) if title_el else None
        text = text_el.get_text(strip=True) if text_el else (title or "")
        if len(text) > 20:
            articles.append(
                ParsedArticle(
                    title=title[:200] if title else None,
                    raw_text=text,
                    original_url=url,
                    published_at=None,
                )
            )
    return articles or _extract_generic(soup, url)


def _parse_finam(soup: BeautifulSoup, url: str) -> list[ParsedArticle]:
    articles = []
    for item in soup.select("article, .news-item, .news-list__item"):
        title_el = item.select_one("h2, h3, a")
        text_el = item.select_one("p, .news-item__text")
        title = title_el.get_text(strip=True) if title_el else None
        text = text_el.get_text(strip=True) if text_el else (title or "")
        if len(text) > 20:
            articles.append(
                ParsedArticle(
                    title=title[:200] if title else None,
                    raw_text=text,
                    original_url=url,
                    published_at=None,
                )
            )
    return articles or _extract_generic(soup, url)


SITE_PARSERS = {
    "smart-lab.ru": _parse_smartlab,
    "www.smart-lab.ru": _parse_smartlab,
    "rbc.ru": _parse_rbc,
    "www.rbc.ru": _parse_rbc,
    "finam.ru": _parse_finam,
    "www.finam.ru": _parse_finam,
}


class WebsiteParser(BaseParser):
    def __init__(self, urls: list[str]):
        self.urls = urls

    async def parse(self) -> list[ParsedArticle]:
        articles = []
        async with httpx.AsyncClient(
            timeout=30.0, headers=HEADERS, follow_redirects=True
        ) as client:
            for url in self.urls:
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    soup = BeautifulSoup(resp.text, "lxml")

                    domain = url.split("/")[2] if "//" in url else url.split("/")[0]
                    parser_fn = SITE_PARSERS.get(domain, _extract_generic)
                    site_articles = parser_fn(soup, url)
                    articles.extend(site_articles)
                    logger.info(
                        "Parsed site %s: %d articles", url, len(site_articles)
                    )
                except Exception as e:
                    logger.error("Failed to parse site %s: %s", url, e)
                await asyncio.sleep(WEBSITE_RATE_LIMIT)
        return articles
