import asyncio
import hashlib
import logging
import os
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.tasks.celery_app import celery_app
from app.parsers.registry import ParserRegistry
from app.parsers.telegram_parser import TelegramParser
from app.parsers.website_parser import WebsiteParser
from app.llm.client import OllamaClient
from app.emitters.matcher import EmitterMatcher
from app.emitters.tickers import TICKERS
from app.admin.parser_control import can_parse, SourceControl

logger = logging.getLogger(__name__)

DB_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://news_user:news_password@localhost:5432/news_parser")


def _hash_text(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def _run_async(coro):
    """Helper to run an async coroutine in a Celery sync task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def _get_engine_and_session():
    """Create a fresh async engine and session factory."""
    engine = create_async_engine(DB_URL, pool_size=2, max_overflow=0)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return engine, factory


@celery_app.task(bind=True, name="app.tasks.parse_tasks.parse_telegram_channels")
def parse_telegram_channels(self):
    """Parse all Telegram channels and save new articles."""
    if not can_parse():
        logger.info("Parser is stopped/emergency — skipping Telegram parse")
        return {"saved": 0, "source": "telegram", "skipped": True}

    registry = ParserRegistry()
    channels = [
        ch for ch in registry.get_channels()
        if SourceControl.is_source_active(f"tg:{ch}")
    ]
    parser = TelegramParser(channels)

    articles = _run_async(parser.parse())

    engine, session_factory = _get_engine_and_session()

    async def _save():
        from app.models.news_article import NewsArticle
        from app.models.news_source import NewsSource, SourceTypeEnum
        import uuid

        saved_count = 0
        async with session_factory() as session:
            result = await session.execute(
                select(NewsSource).where(NewsSource.source_type == SourceTypeEnum.telegram)
            )
            source = result.scalar_one_or_none()
            if not source:
                source = NewsSource(
                    id=str(uuid.uuid4()),
                    name="Telegram Channels",
                    source_type=SourceTypeEnum.telegram,
                    url="t.me",
                )
                session.add(source)
                await session.flush()

            for article in articles:
                article_hash = _hash_text(article.raw_text)

                exists = await session.execute(
                    select(NewsArticle).where(NewsArticle.hash == article_hash)
                )
                if exists.scalar_one_or_none():
                    continue

                news = NewsArticle(
                    id=str(uuid.uuid4()),
                    source_id=source.id,
                    raw_text=article.raw_text,
                    title=article.title,
                    original_url=article.original_url,
                    published_at=article.published_at or datetime.utcnow(),
                    hash=article_hash,
                )
                session.add(news)
                saved_count += 1

            source.last_parsed = datetime.utcnow()
            await session.commit()

            # Queue LLM processing for new articles
            if saved_count > 0:
                result = await session.execute(
                    select(NewsArticle)
                    .where(NewsArticle.llm_processed == False)
                    .order_by(NewsArticle.created_at.desc())
                    .limit(saved_count)
                )
                for n in result.scalars().all():
                    process_news_with_llm.delay(n.id)

            return saved_count

    try:
        saved = _run_async(_save())
    finally:
        _run_async(engine.dispose())

    logger.info("Telegram parse completed, сохранено %d новостей", saved)
    return {"saved": saved, "source": "telegram"}


@celery_app.task(bind=True, name="app.tasks.parse_tasks.parse_websites")
def parse_websites(self):
    """Parse all websites and save new articles."""
    if not can_parse():
        logger.info("Parser is stopped/emergency — skipping website parse")
        return {"saved": 0, "source": "websites", "skipped": True}

    registry = ParserRegistry()
    urls = [
        url for url in registry.get_websites()
        if SourceControl.is_source_active(f"web:{url}")
    ]
    parser = WebsiteParser(urls)

    articles = _run_async(parser.parse())

    engine, session_factory = _get_engine_and_session()

    async def _save():
        from app.models.news_article import NewsArticle
        from app.models.news_source import NewsSource, SourceTypeEnum
        import uuid

        saved_count = 0
        async with session_factory() as session:
            for article in articles:
                article_hash = _hash_text(article.raw_text)

                exists = await session.execute(
                    select(NewsArticle).where(NewsArticle.hash == article_hash)
                )
                if exists.scalar_one_or_none():
                    continue

                source_result = await session.execute(
                    select(NewsSource).where(NewsSource.url == (article.original_url or ""))
                )
                source = source_result.scalar_one_or_none()
                if not source:
                    source = NewsSource(
                        id=str(uuid.uuid4()),
                        name=article.original_url or "Unknown",
                        source_type=SourceTypeEnum.website,
                        url=article.original_url or "",
                    )
                    session.add(source)
                    await session.flush()

                news = NewsArticle(
                    id=str(uuid.uuid4()),
                    source_id=source.id,
                    raw_text=article.raw_text,
                    title=article.title,
                    original_url=article.original_url,
                    published_at=article.published_at or datetime.utcnow(),
                    hash=article_hash,
                )
                session.add(news)
                saved_count += 1

            await session.commit()

            # Queue LLM processing
            if saved_count > 0:
                result = await session.execute(
                    select(NewsArticle)
                    .where(NewsArticle.llm_processed == False)
                    .order_by(NewsArticle.created_at.desc())
                    .limit(saved_count)
                )
                for n in result.scalars().all():
                    process_news_with_llm.delay(n.id)

            return saved_count

    try:
        saved = _run_async(_save())
    finally:
        _run_async(engine.dispose())

    logger.info("Website parse completed, сохранено %d новостей", saved)
    return {"saved": saved, "source": "websites"}


@celery_app.task(bind=True, name="app.tasks.parse_tasks.process_news_with_llm")
def process_news_with_llm(self, news_id: str):
    """Process a single news article with LLM."""
    engine, session_factory = _get_engine_and_session()

    async def _process():
        from app.models.news_article import NewsArticle
        from app.models.news_emitter import NewsEmitter, MethodEnum
        import uuid

        async with session_factory() as session:
            result = await session.execute(
                select(NewsArticle).where(NewsArticle.id == news_id)
            )
            news = result.scalar_one_or_none()
            if not news:
                logger.warning("News %s not found", news_id)
                return {"status": "not_found"}

            llm = OllamaClient()
            llm_result = await llm.process_news(news.raw_text)

            news.cleaned_text = llm_result.get("cleaned_text", news.raw_text)
            news.llm_processed = True

            # Merge LLM-detected tickers with keyword matches
            detected = llm_result.get("detected_tickers", [])
            matcher = EmitterMatcher(TICKERS)
            keyword_matches = matcher.match(news.raw_text)

            # Build ticker -> confidence map
            ticker_confidence: dict[str, float] = {}
            for t in detected:
                ticker_confidence[t] = 0.90  # LLM detected = high confidence
            for ticker, conf in keyword_matches:
                current = ticker_confidence.get(ticker, 0.0)
                ticker_confidence[ticker] = max(current, conf)

            for ticker, conf in ticker_confidence.items():
                ne = NewsEmitter(
                    id=str(uuid.uuid4()),
                    news_id=news_id,
                    emitter_ticker=ticker,
                    confidence=conf,
                    method=MethodEnum.auto,
                )
                session.add(ne)

            await session.commit()

            # Send notifications to subscribed users
            for ticker in ticker_confidence.keys():
                try:
                    from app.notifications.telegram_bot import notify_emitter_subscribers
                    await notify_emitter_subscribers(
                        ticker,
                        news.title or "Новость",
                        news.cleaned_text or news.raw_text,
                    )
                except Exception as e:
                    logger.error("Notification failed for %s: %s", ticker, e)

            return {"status": "ok", "emitters": list(ticker_confidence.keys())}

    try:
        result = _run_async(_process())
    finally:
        _run_async(engine.dispose())

    return result


@celery_app.task(bind=True, name="app.tasks.parse_tasks.run_full_parse_cycle")
def run_full_parse_cycle(self):
    """Orchestrator: run both Telegram and website parsing."""
    logger.info("Starting full parse cycle")

    # Run both in parallel — they're independent
    telegram_task = parse_telegram_channels.delay()
    website_task = parse_websites.delay()

    telegram_task.wait(timeout=600)
    website_task.wait(timeout=600)

    logger.info("Full parse cycle completed")
    return {
        "telegram": telegram_task.result,
        "websites": website_task.result,
    }
