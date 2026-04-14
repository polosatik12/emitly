from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func

from app.core.database import get_session
from app.auth.dependencies import get_current_user
from app.subscriptions.models import (
    EmitterSubscription,
    Payment,
    Plan,
    PlanTier,
    UserSubscription,
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


# --- Schemas ---
class PlanOut(BaseModel):
    id: str
    tier: str
    name: str
    price: int
    max_emitters: int
    description: str | None = None
    features: str | None = None


class SubscriptionStatus(BaseModel):
    current_plan: str | None = None
    expires_at: str | None = None
    emitters_count: int = 0
    max_emitters: int = 0
    is_active: bool = False


class EmitterSubReq(BaseModel):
    ticker: str


class EmitterSubOut(BaseModel):
    id: str
    emitter_ticker: str
    notify_telegram: bool


class CreatePaymentReq(BaseModel):
    plan_tier: str


class PaymentOut(BaseModel):
    id: str
    amount: int
    status: str
    created_at: str
    plan_id: str | None = None


# --- Endpoints ---
@router.get("/plans", response_model=list[PlanOut])
async def get_plans(session=Depends(get_session)):
    """Get all available subscription plans."""
    result = await session.execute(
        select(Plan).where(Plan.is_active == True).order_by(Plan.price)
    )
    plans = result.scalars().all()
    return [
        PlanOut(
            id=p.id,
            tier=p.tier.value,
            name=p.name,
            price=p.price,
            max_emitters=p.max_emitters,
            description=p.description,
            features=p.features,
        )
        for p in plans
    ]


@router.get("/status", response_model=SubscriptionStatus)
async def get_subscription_status(
    user: dict = Depends(get_current_user),
    session=Depends(get_session),
):
    """Get current user's subscription status."""
    user_id = user["user_id"]

    result = await session.execute(
        select(UserSubscription)
        .where(
            UserSubscription.user_id == user_id,
            UserSubscription.is_active == True,
            UserSubscription.expires_at > datetime.now(timezone.utc),
        )
    )
    sub = result.scalar_one_or_none()

    emitters_result = await session.execute(
        select(func.count()).select_from(EmitterSubscription).where(
            EmitterSubscription.user_id == user_id
        )
    )
    emitters_count = emitters_result.scalar()

    if sub:
        plan_result = await session.execute(select(Plan).where(Plan.id == sub.plan_id))
        plan = plan_result.scalar_one_or_none()
        return SubscriptionStatus(
            current_plan=plan.tier.value if plan else None,
            expires_at=sub.expires_at.isoformat(),
            emitters_count=emitters_count,
            max_emitters=plan.max_emitters if plan else 0,
            is_active=True,
        )

    return SubscriptionStatus(
        emitters_count=emitters_count,
        max_emitters=1,  # free tier
        is_active=False,
    )


@router.post("/emitters", response_model=EmitterSubOut)
async def subscribe_to_emitter(
    req: EmitterSubReq,
    user: dict = Depends(get_current_user),
    session=Depends(get_session),
):
    """Subscribe to notifications for a specific emitter."""
    user_id = user["user_id"]

    # Check subscription limits
    result = await session.execute(
        select(UserSubscription)
        .where(
            UserSubscription.user_id == user_id,
            UserSubscription.is_active == True,
            UserSubscription.expires_at > datetime.now(timezone.utc),
        )
    )
    sub = result.scalar_one_or_none()

    max_emitters = 1  # free tier
    if sub:
        plan_result = await session.execute(select(Plan).where(Plan.id == sub.plan_id))
        plan = plan_result.scalar_one_or_none()
        if plan:
            max_emitters = plan.max_emitters

    current_count_result = await session.execute(
        select(func.count()).select_from(EmitterSubscription).where(
            EmitterSubscription.user_id == user_id
        )
    )
    current_count = current_count_result.scalar()

    if current_count >= max_emitters:
        raise HTTPException(
            403, f"Limit reached: {max_emitters} emitters for your plan. Upgrade to add more."
        )

    # Check for existing subscription
    existing = await session.execute(
        select(EmitterSubscription).where(
            EmitterSubscription.user_id == user_id,
            EmitterSubscription.emitter_ticker == req.ticker.upper(),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Already subscribed to this emitter")

    ev = EmitterSubscription(
        user_id=user_id,
        emitter_ticker=req.ticker.upper(),
        notify_telegram=True,
    )
    session.add(ev)
    await session.commit()
    await session.refresh(ev)

    return EmitterSubOut(
        id=ev.id,
        emitter_ticker=ev.emitter_ticker,
        notify_telegram=ev.notify_telegram,
    )


@router.delete("/emitters/{ticker}")
async def unsubscribe_from_emitter(
    ticker: str,
    user: dict = Depends(get_current_user),
    session=Depends(get_session),
):
    """Unsubscribe from an emitter."""
    user_id = user["user_id"]

    result = await session.execute(
        select(EmitterSubscription).where(
            EmitterSubscription.user_id == user_id,
            EmitterSubscription.emitter_ticker == ticker.upper(),
        )
    )
    ev = result.scalar_one_or_none()
    if not ev:
        raise HTTPException(404, "Subscription not found")

    await session.delete(ev)
    await session.commit()
    return {"status": "unsubscribed"}


@router.get("/emitters", response_model=list[EmitterSubOut])
async def get_my_emitters(
    user: dict = Depends(get_current_user),
    session=Depends(get_session),
):
    """Get all emitters user is subscribed to."""
    user_id = user["user_id"]
    result = await session.execute(
        select(EmitterSubscription)
        .where(EmitterSubscription.user_id == user_id)
        .order_by(EmitterSubscription.created_at.desc())
    )
    emitters = result.scalars().all()
    return [
        EmitterSubOut(id=e.id, emitter_ticker=e.emitter_ticker, notify_telegram=e.notify_telegram)
        for e in emitters
    ]


@router.post("/create-payment")
async def create_payment(
    req: CreatePaymentReq,
    user: dict = Depends(get_current_user),
    session=Depends(get_session),
):
    """Create a payment intent for upgrading subscription."""
    tier_map = {
        "base": PlanTier.base,
        "premium": PlanTier.premium,
        "pro": PlanTier.pro,
    }
    tier = tier_map.get(req.plan_tier.lower())
    if not tier:
        raise HTTPException(400, f"Unknown plan: {req.plan_tier}")

    result = await session.execute(select(Plan).where(Plan.tier == tier))
    plan = result.scalar_one_or_none()
    if not plan or not plan.is_active:
        raise HTTPException(400, "Plan not available")

    payment = Payment(
        user_id=user["user_id"],
        amount=plan.price,
        plan_id=plan.id,
        status="pending",
    )
    session.add(payment)
    await session.commit()
    await session.refresh(payment)

    # In production: integrate with payment provider (YooKassa, CloudPayments, etc.)
    # Return payment URL or redirect link
    return {
        "payment_id": payment.id,
        "amount": payment.amount,
        "status": "pending",
        "payment_url": f"/pay/{payment.id}",  # placeholder
    }


@router.post("/webhook/payment")
async def payment_webhook(
    session=Depends(get_session),
):
    """
    Webhook endpoint for payment provider callbacks.
    In production: verify signature, update payment status, activate subscription.
    """
    # Placeholder for YooKassa / CloudPayments / etc webhook
    # Logic:
    # 1. Verify webhook signature
    # 2. Find payment by external_id
    # 3. Update payment status to "success"
    # 4. Create/update UserSubscription
    # 5. Send confirmation to user
    return {"status": "ok"}


@router.get("/payments", response_model=list[PaymentOut])
async def get_payments(
    user: dict = Depends(get_current_user),
    session=Depends(get_session),
):
    """Get user's payment history."""
    result = await session.execute(
        select(Payment)
        .where(Payment.user_id == user["user_id"])
        .order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()
    return [
        PaymentOut(
            id=p.id,
            amount=p.amount,
            status=p.status,
            created_at=p.created_at.isoformat(),
            plan_id=p.plan_id,
        )
        for p in payments
    ]


async def seed_plans(session):
    """Seed default subscription plans."""
    result = await session.execute(select(func.count()).select_from(Plan))
    if result.scalar() > 0:
        return

    default_plans = [
        {
            "tier": PlanTier.free,
            "name": "Free",
            "price": 0,
            "max_emitters": 1,
            "description": "Бесплатный тариф",
            "features": '["1 эмитент", "48 часов подписки", "Базовая лента новостей"]',
        },
        {
            "tier": PlanTier.base,
            "name": "Base",
            "price": 199,
            "max_emitters": 5,
            "description": "Базовый тариф",
            "features": '["5 эмитентов", "Мгновенные уведомления", "Архив 90 дней"]',
        },
        {
            "tier": PlanTier.premium,
            "name": "Premium",
            "price": 299,
            "max_emitters": 20,
            "description": "Премиум тариф",
            "features": '["20 эмитентов", "Персональная поддержка", "Аналитика", "Экспорт данных"]',
        },
        {
            "tier": PlanTier.pro,
            "name": "Pro",
            "price": 499,
            "max_emitters": 50,
            "description": "Профессиональный тариф",
            "features": '["50 эмитентов", "API доступ", "Кастомные уведомления", "Интеграция с терминалами", "Расширенная аналитика"]',
        },
    ]

    for p in default_plans:
        plan = Plan(**p)
        session.add(plan)
