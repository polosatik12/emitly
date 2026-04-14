from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel


class EmitterOut(BaseModel):
    ticker: str
    name: str
    aliases: list[str]


class NewsEmitterOut(BaseModel):
    emitter_ticker: str
    confidence: float
    method: str


class NewsArticleOut(BaseModel):
    id: UUID
    source_id: UUID
    title: Optional[str]
    cleaned_text: Optional[str]
    raw_text: Optional[str]
    original_url: Optional[str]
    published_at: Optional[datetime]
    created_at: datetime
    llm_processed: bool
    emitters: list[NewsEmitterOut] = []


class NewsListResponse(BaseModel):
    items: list[NewsArticleOut]
    total: int
    page: int
    per_page: int


class NewsDetailResponse(NewsArticleOut):
    pass


class SourceOut(BaseModel):
    id: UUID
    name: str
    source_type: str
    url: str
    enabled: bool
    last_parsed: Optional[datetime]
