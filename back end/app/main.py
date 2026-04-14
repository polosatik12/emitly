import logging

import structlog
from fastapi import FastAPI
from sqlalchemy import select, func

from app.api.routes import router as api_router
from app.auth.routes import router as auth_router
from app.subscriptions.routes import router as sub_router
from app.admin.routes import router as admin_router
from app.core.config import settings
from app.core.database import engine, Base, async_session_factory

# Import all models so SQLAlchemy registers them
import app.models  # noqa: F401
import app.auth.models  # noqa: F401
import app.subscriptions.models  # noqa: F401

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

logging.basicConfig(
    format="%(message)s",
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
)

app = FastAPI(
    title="News Parser API",
    description="Система парсинга и обработки финансовых новостей",
    version="1.0.0",
)


@app.on_event("startup")
async def startup():
    logger.info("News Parser API starting", host=settings.APP_HOST, port=settings.APP_PORT)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await _seed_emitters()
    await _seed_plans()


@app.on_event("shutdown")
async def shutdown():
    logger.info("News Parser API shutting down")
    await engine.dispose()


@app.get("/health")
async def health_check():
    return {"status": "ok"}


# --- Register routers ---
app.include_router(api_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(sub_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")


async def _seed_emitters():
    """Инициализировать список эмитентов при первом запуске."""
    from app.models.emitter import Emitter
    from app.emitters.tickers import TICKERS

    async with async_session_factory() as session:
        result = await session.execute(select(func.count()).select_from(Emitter))
        if result.scalar() > 0:
            return

        for ticker_data in TICKERS:
            emitter = Emitter(
                ticker=ticker_data["ticker"],
                name=ticker_data["name"],
                aliases=ticker_data["aliases"],
            )
            session.add(emitter)

        await session.commit()
        logger.info("Seeded emitters", count=len(TICKERS))


async def _seed_plans():
    """Инициализировать тарифные планы."""
    from app.subscriptions.routes import seed_plans

    async with async_session_factory() as session:
        await seed_plans(session)
        await session.commit()
        logger.info("Seeded subscription plans")
