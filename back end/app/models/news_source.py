import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.core.database import Base


class SourceTypeEnum(enum.Enum):
    telegram = "telegram"
    website = "website"


class NewsSource(Base):
    __tablename__ = "news_sources"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    source_type = Column(Enum(SourceTypeEnum), nullable=False)
    url = Column(String, nullable=False)
    parser_config = Column(JSONB, nullable=False, server_default="{}")
    enabled = Column(Boolean, nullable=False, default=True)
    last_parsed = Column(DateTime, nullable=True)
