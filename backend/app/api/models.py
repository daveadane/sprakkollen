from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
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
    examples: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

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
    questions: Mapped[List["PracticeQuestion"]] = relationship(
                back_populates="session", cascade="all, delete-orphan")
    answers: Mapped[List["PracticeAnswer"]] = relationship(back_populates="session", cascade="all, delete-orphan")

class PracticeQuestion(Base):
    __tablename__ = "practice_questions"
    __table_args__ = (Index("ix_practice_question_session", "session_id"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("practice_sessions.id", ondelete="CASCADE"), nullable=False)
    word: Mapped[str] = mapped_column(String(120), nullable=False)
    correct_article: Mapped[str] = mapped_column(String(10), nullable=False)  # "en" or "ett"
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    session: Mapped["PracticeSession"] = relationship(back_populates="questions")


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


class GrammarQuestion(Base):
    __tablename__ = "grammar_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    correct_answer: Mapped[str] = mapped_column(String(120), nullable=False)
    choices: Mapped[list] = mapped_column(JSON, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ReadingText(Base):
    __tablename__ = "reading_texts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    level: Mapped[str] = mapped_column(String(10), nullable=False)   # A1, A2, B1, B2
    topic: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    questions: Mapped[List["ReadingQuestion"]] = relationship(back_populates="text", cascade="all, delete-orphan")


class ReadingQuestion(Base):
    __tablename__ = "reading_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    text_id: Mapped[int] = mapped_column(ForeignKey("reading_texts.id", ondelete="CASCADE"), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    correct_answer: Mapped[str] = mapped_column(String(200), nullable=False)
    choices: Mapped[list] = mapped_column(JSON, nullable=False)

    text: Mapped["ReadingText"] = relationship(back_populates="questions")


class SwedishWord(Base):
    """All Swedish nouns imported from Wiktionary, used by the checker."""
    __tablename__ = "swedish_words"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    word: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    article: Mapped[str] = mapped_column(String(10), nullable=False)   # en / ett
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.88)
    examples: Mapped[list] = mapped_column(JSON, nullable=False, default=list)


class ReadingSession(Base):
    """Records when a user completes a reading exercise (for progress/streak)."""
    __tablename__ = "reading_sessions"
    __table_args__ = (Index("ix_reading_user_created", "user_id", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text_id: Mapped[int] = mapped_column(ForeignKey("reading_texts.id", ondelete="CASCADE"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class WordSuggestion(Base):
    """User-submitted suggestions: add a missing word or flag an incorrect one."""
    __tablename__ = "word_suggestions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    word: Mapped[str] = mapped_column(String(120), nullable=False)
    article: Mapped[str] = mapped_column(String(10), nullable=False)        # en / ett
    suggestion_type: Mapped[str] = mapped_column(String(10), nullable=False)  # "add" or "flag"
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")  # pending/approved/rejected
    admin_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship("User")






    