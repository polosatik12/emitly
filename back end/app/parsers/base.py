from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class ParsedArticle:
    title: Optional[str]
    raw_text: str
    original_url: Optional[str]
    published_at: Optional[datetime]


class BaseParser(ABC):
    @abstractmethod
    async def parse(self) -> list[ParsedArticle]:
        ...
