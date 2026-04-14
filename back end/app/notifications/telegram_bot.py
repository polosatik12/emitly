import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = getattr(settings, "TELEGRAM_BOT_TOKEN", "")
TELEGRAM_BOT_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"


async def send_telegram_message(chat_id: str, text: str) -> bool:
    """Send a message to a Telegram user/group via bot."""
    if not TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not configured")
        return False

    url = f"{TELEGRAM_BOT_URL}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML",
                "disable_web_page_preview": True,
            })
            resp.raise_for_status()
            logger.info("Telegram notification sent to %s", chat_id)
            return True
    except Exception as e:
        logger.error("Failed to send Telegram message to %s: %s", chat_id, e)
        return False


async def notify_emitter_subscribers(emitter_ticker: str, news_title: str, news_text: str):
    """Send notification to all users subscribed to an emitter."""
    from sqlalchemy import select
    from app.core.database import async_session_factory
    from app.subscriptions.models import EmitterSubscription
    from app.auth.models import User

    async with async_session_factory() as session:
        # Find all users subscribed to this emitter
        result = await session.execute(
            select(EmitterSubscription).where(
                EmitterSubscription.emitter_ticker == emitter_ticker,
                EmitterSubscription.notify_telegram == True,
            )
        )
        subs = result.scalars().all()

        for sub in subs:
            user_result = await session.execute(
                select(User).where(User.id == sub.user_id)
            )
            user = user_result.scalar_one_or_none()
            if not user or not user.telegram_id:
                continue

            message = (
                f"📢 <b>{emitter_ticker}</b>\n"
                f"<b>{news_title}</b>\n\n"
                f"{news_text[:500]}"
            )
            await send_telegram_message(user.telegram_id, message)
