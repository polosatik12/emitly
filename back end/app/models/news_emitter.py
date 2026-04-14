import enum
import uuid

from sqlalchemy import Column, Enum, Float, ForeignKey, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class MethodEnum(enum.Enum):
    auto = "auto"
    manual = "manual"


class NewsEmitter(Base):
    __tablename__ = "news_emitters"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    news_id = Column(String, ForeignKey("news_articles.id"), nullable=False)
    emitter_ticker = Column(String, ForeignKey("emitters.ticker"), nullable=False)
    confidence = Column(Float, nullable=False)
    method = Column(Enum(MethodEnum), nullable=False)

    article = relationship("NewsArticle", back_populates="emitters")
