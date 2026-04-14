import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class PlanTier(enum.Enum):
    free = "free"
    base = "base"
    premium = "premium"
    pro = "pro"


class Plan(Base):
    """Subscription plan definitions."""
    __tablename__ = "plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tier = Column(Enum(PlanTier), unique=True, nullable=False)
    name = Column(String, nullable=False)
    price = Column(Integer, nullable=False)  # in rubles
    max_emitters = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    features = Column(Text, nullable=True)  # JSON array
    is_active = Column(Boolean, nullable=False, default=True)


class UserSubscription(Base):
    """User's active subscription."""
    __tablename__ = "user_subscriptions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    plan_id = Column(String, ForeignKey("plans.id"), nullable=False)
    started_at = Column(DateTime, nullable=False, server_default=func.now())
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    payment_id = Column(String, nullable=True)  # external payment reference
    auto_renew = Column(Boolean, nullable=False, default=True)


class EmitterSubscription(Base):
    """User's subscription to specific emitters."""
    __tablename__ = "emitter_subscriptions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    emitter_ticker = Column(String, ForeignKey("emitters.ticker"), nullable=False)
    notify_telegram = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Payment(Base):
    """Payment records."""
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)  # in rubles
    currency = Column(String, nullable=False, default="RUB")
    status = Column(String, nullable=False, default="pending")  # pending, success, failed, refunded
    payment_method = Column(String, nullable=True)
    external_id = Column(String, nullable=True)  # payment provider ID
    plan_id = Column(String, ForeignKey("plans.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
