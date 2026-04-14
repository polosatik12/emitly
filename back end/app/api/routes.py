from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from typing import Optional

from app.core.database import get_session
from app.models.news_article import NewsArticle
from app.models.news_emitter import NewsEmitter
from app.models.emitter import Emitter
from app.models.news_source import NewsSource
from app.api.schemas import (
    NewsArticleOut,
    NewsListResponse,
    NewsEmitterOut,
    EmitterOut,
    SourceOut,
)

router = APIRouter()


def _article_to_out(article: NewsArticle) -> dict:
    emitters = [
        NewsEmitterOut(
            emitter_ticker=ne.emitter_ticker,
            confidence=ne.confidence,
            method=ne.method,
        )
        for ne in (article.emitters or [])
    ]
    return {
        "id": article.id,
        "source_id": article.source_id,
        "title": article.title,
        "cleaned_text": article.cleaned_text,
        "raw_text": article.raw_text,
        "original_url": article.original_url,
        "published_at": article.published_at,
        "created_at": article.created_at,
        "llm_processed": article.llm_processed,
        "emitters": emitters,
    }


@router.get("/news", response_model=NewsListResponse)
async def get_news(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    ticker: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
    llm_processed: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    """Получить список новостей с пагинацией и фильтрами."""
    offset = (page - 1) * per_page

    base_query = select(NewsArticle)

    if ticker:
        base_query = base_query.join(NewsEmitter).where(
            NewsEmitter.emitter_ticker == ticker.upper()
        )

    if source_type:
        base_query = base_query.join(NewsSource).where(
            NewsSource.source_type == source_type
        )

    if llm_processed is not None:
        base_query = base_query.where(NewsArticle.llm_processed == llm_processed)

    if search:
        base_query = base_query.where(
            NewsArticle.raw_text.ilike(f"%{search}%")
            | NewsArticle.cleaned_text.ilike(f"%{search}%")
            | NewsArticle.title.ilike(f"%{search}%")
        )

    base_query = base_query.order_by(NewsArticle.created_at.desc())

    # Count
    count_query = select(func.count()).select_from(base_query.subquery())
    count_result = await session.execute(count_query)
    total = count_result.scalar()

    # Data
    data_query = base_query.offset(offset).limit(per_page)
    data_query = data_query.options(
        joinedload(NewsArticle.emitters)
    )
    result = await session.execute(data_query)
    articles = result.unique().scalars().all()

    return NewsListResponse(
        items=[_article_to_out(a) for a in articles],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/news/{news_id}", response_model=NewsArticleOut)
async def get_news_detail(
    news_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Получить детальную информацию о новости."""
    from uuid import UUID

    result = await session.execute(
        select(NewsArticle)
        .where(NewsArticle.id == UUID(news_id))
        .options(
            __import__("sqlalchemy.orm", fromlist=["joinedload"]).joinedload(
                NewsArticle.emitters
            )
        )
    )
    article = result.unique().scalar_one_or_none()

    if not article:
        raise HTTPException(status_code=404, detail="News not found")

    return _article_to_out(article)


@router.get("/news/emitter/{ticker}", response_model=NewsListResponse)
async def get_news_by_emitter(
    ticker: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    """Получить все новости по конкретному эмитенту."""
    offset = (page - 1) * per_page

    query = (
        select(NewsArticle)
        .join(NewsEmitter)
        .where(NewsEmitter.emitter_ticker == ticker.upper())
        .order_by(NewsArticle.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )

    count_query = select(func.count()).select_from(
        select(NewsArticle)
        .join(NewsEmitter)
        .where(NewsEmitter.emitter_ticker == ticker.upper())
        .subquery()
    )

    count_result = await session.execute(count_query)
    total = count_result.scalar()

    data_result = await session.execute(query)
    articles = data_result.scalars().all()

    return NewsListResponse(
        items=[_article_to_out(a) for a in articles],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/emitters", response_model=list[EmitterOut])
async def get_emitters(
    session: AsyncSession = Depends(get_session),
):
    """Список всех эмитентов."""
    result = await session.execute(select(Emitter).order_by(Emitter.ticker))
    emitters = result.scalars().all()
    return [
        EmitterOut(ticker=e.ticker, name=e.name, aliases=e.aliases) for e in emitters
    ]


@router.get("/sources", response_model=list[SourceOut])
async def get_sources(
    session: AsyncSession = Depends(get_session),
):
    """Список всех источников."""
    result = await session.execute(
        select(NewsSource).order_by(NewsSource.name)
    )
    sources = result.scalars().all()
    return [
        SourceOut(
            id=s.id,
            name=s.name,
            source_type=s.source_type,
            url=s.url,
            enabled=s.enabled,
            last_parsed=s.last_parsed,
        )
        for s in sources
    ]


@router.post("/parse/telegram")
async def trigger_telegram_parse():
    """Запустить парсинг Telegram-каналов."""
    from app.tasks.parse_tasks import parse_telegram_channels

    task = parse_telegram_channels.delay()
    return {"task_id": task.id, "status": "started"}


@router.post("/parse/websites")
async def trigger_website_parse():
    """Запустить парсинг сайтов."""
    from app.tasks.parse_tasks import parse_websites

    task = parse_websites.delay()
    return {"task_id": task.id, "status": "started"}


@router.post("/parse/full")
async def trigger_full_parse():
    """Запустить полный цикл парсинга."""
    from app.tasks.parse_tasks import run_full_parse_cycle

    task = run_full_parse_cycle.delay()
    return {"task_id": task.id, "status": "started"}


@router.get("/stats")
async def get_stats(session: AsyncSession = Depends(get_session)):
    """Статистика системы."""
    total_news = await session.execute(select(func.count()).select_from(NewsArticle))
    processed = await session.execute(
        select(func.count())
        .select_from(NewsArticle)
        .where(NewsArticle.llm_processed == True)
    )

    emitters_count = await session.execute(
        select(func.count(distinct(NewsEmitter.emitter_ticker))).select_from(
            NewsEmitter
        )
    )

    sources_count = await session.execute(
        select(func.count()).select_from(NewsSource).where(NewsSource.enabled == True)
    )

    return {
        "total_news": total_news.scalar(),
        "processed_news": processed.scalar(),
        "unique_emitters": emitters_count.scalar(),
        "active_sources": sources_count.scalar(),
    }
