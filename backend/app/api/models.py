from __future__ import annotations
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Integer, DateTime, Boolean, ForeignKey, UniqueConstraint, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.api.db_setup import Base


from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    String,
    Integer,
    DateTime,
    Boolean,
    ForeignKey,
    UniqueConstraint,
    Index,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.api.db_setup import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    first_name: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    vocab_words: Mapped[List["VocabularyWord"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    practice_sessions: Mapped[List["PracticeSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    grammar_sessions: Mapped[List["GrammarSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
   
    search_history = relationship(
    "SearchHistory",
    back_populates="user",
    cascade="all, delete-orphan",
)


class VocabularyWord(Base):
    __tablename__ = "vocabulary_words"
    __table_args__ = (
        UniqueConstraint("user_id", "word", name="uq_vocab_user_word"),
        Index("ix_vocab_user_article", "user_id", "article"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    word: Mapped[str] = mapped_column(String(120), nullable=False)
    article: Mapped[str] = mapped_column(String(10), nullable=False)  # "en" or "ett"
    source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # local, user, api, etc.

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="vocab_words")


class LookupCache(Base):
    """
    Cache lookup results so you don't hit external sources repeatedly.
    """
    __tablename__ = "lookup_cache"
    __table_args__ = (UniqueConstraint("word", name="uq_lookup_word"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    word: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    article: Mapped[str] = mapped_column(String(10), nullable=False)  # en/ett/unknown
    confidence: Mapped[str] = mapped_column(String(30), nullable=False, default="unknown")
    source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class PracticeSession(Base):
    __tablename__ = "practice_sessions"
    __table_args__ = (Index("ix_practice_user_created", "user_id", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    total_questions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="practice_sessions")
    answers: Mapped[List["PracticeAnswer"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class PracticeAnswer(Base):
    __tablename__ = "practice_answers"
    __table_args__ = (Index("ix_practice_answer_session", "session_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("practice_sessions.id", ondelete="CASCADE"), nullable=False)

    word: Mapped[str] = mapped_column(String(120), nullable=False)
    correct_article: Mapped[str] = mapped_column(String(10), nullable=False)
    user_answer: Mapped[str] = mapped_column(String(10), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    session: Mapped["PracticeSession"] = relationship(back_populates="answers")


class GrammarSession(Base):
    __tablename__ = "grammar_sessions"
    __table_args__ = (Index("ix_grammar_user_created", "user_id", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    total_questions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="grammar_sessions")
    answers: Mapped[List["GrammarAnswer"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class GrammarAnswer(Base):
    __tablename__ = "grammar_answers"
    __table_args__ = (Index("ix_grammar_answer_session", "session_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("grammar_sessions.id", ondelete="CASCADE"), nullable=False)

    question: Mapped[str] = mapped_column(Text, nullable=False)
    correct_answer: Mapped[str] = mapped_column(Text, nullable=False)
    user_answer: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    session: Mapped["GrammarSession"] = relationship(back_populates="answers")





class Token(Base):
    __tablename__ = "tokens"
    __table_args__ = (
        Index("ix_tokens_user_created", "user_id", "created_at"),
        UniqueConstraint("token", name="uq_token_token"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    token: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user: Mapped["User"] = relationship("User")

class SearchHistory(Base):
    __tablename__ = "search_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    word: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="search_history")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    token_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user = relationship("User")




    