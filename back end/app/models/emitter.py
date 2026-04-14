from sqlalchemy import ARRAY, Column, String

from app.core.database import Base


class Emitter(Base):
    __tablename__ = "emitters"

    ticker = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    aliases = Column(ARRAY(String), nullable=False)
