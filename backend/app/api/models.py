from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.api.db_setup import Base

class Word(Base):
    __tablename__ = "words"

    id: Mapped[int] = mapped_column(primary_key=True)
    word: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    article: Mapped[str] = mapped_column(String(10), nullable=False)
    source: Mapped[str] = mapped_column(String(50), nullable=True)

