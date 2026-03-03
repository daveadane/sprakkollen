from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from app.api.db_setup import get_db
from app.api.models import (
    User,
    PracticeSession, PracticeAnswer,
    GrammarSession, GrammarAnswer
)
from app.api.security import get_current_user

router = APIRouter(prefix="/progress", tags=["progress"])

@router.get("")
def get_progress(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # --- Practice ---
    practice_sessions = db.execute(
        select(func.count(PracticeSession.id)).where(PracticeSession.user_id == user.id)
    ).scalar() or 0

    practice_correct = db.execute(
        select(func.count(PracticeAnswer.id))
        .join(PracticeSession, PracticeSession.id == PracticeAnswer.session_id)
        .where(PracticeSession.user_id == user.id, PracticeAnswer.is_correct == True)
    ).scalar() or 0

    practice_total = db.execute(
        select(func.count(PracticeAnswer.id))
        .join(PracticeSession, PracticeSession.id == PracticeAnswer.session_id)
        .where(PracticeSession.user_id == user.id)
    ).scalar() or 0

    practice_accuracy = int((practice_correct / practice_total) * 100) if practice_total else 0

    last_practice = db.execute(
        select(PracticeSession)
        .where(PracticeSession.user_id == user.id)
        .order_by(desc(PracticeSession.created_at))
        .limit(1)
    ).scalars().first()

    # --- Grammar ---
    grammar_sessions = db.execute(
        select(func.count(GrammarSession.id)).where(GrammarSession.user_id == user.id)
    ).scalar() or 0

    grammar_correct = db.execute(
        select(func.count(GrammarAnswer.id))
        .join(GrammarSession, GrammarSession.id == GrammarAnswer.session_id)
        .where(GrammarSession.user_id == user.id, GrammarAnswer.is_correct == True)
    ).scalar() or 0

    grammar_total = db.execute(
        select(func.count(GrammarAnswer.id))
        .join(GrammarSession, GrammarSession.id == GrammarAnswer.session_id)
        .where(GrammarSession.user_id == user.id)
    ).scalar() or 0

    grammar_accuracy = int((grammar_correct / grammar_total) * 100) if grammar_total else 0

    last_grammar = db.execute(
        select(GrammarSession)
        .where(GrammarSession.user_id == user.id)
        .order_by(desc(GrammarSession.created_at))
        .limit(1)
    ).scalars().first()

    # --- Weak words (top 5 wrong) ---
    weak = db.execute(
        select(PracticeAnswer.word, func.count(PracticeAnswer.id).label("mistakes"))
        .join(PracticeSession, PracticeSession.id == PracticeAnswer.session_id)
        .where(PracticeSession.user_id == user.id, PracticeAnswer.is_correct == False)
        .group_by(PracticeAnswer.word)
        .order_by(desc("mistakes"))
        .limit(5)
    ).all()
    weak_words = [w[0] for w in weak]

    xp = (practice_correct + grammar_correct) * 10

    return {
        "xp": xp,
        "streakDays": 0,
        "practice": {
            "sessions": practice_sessions,
            "correct": practice_correct,
            "total": practice_total,
            "accuracy": practice_accuracy,
            "lastPractice": (
                {"score": last_practice.score, "total": last_practice.total_questions}
                if last_practice else None
            ),
        },
        "grammar": {
            "sessions": grammar_sessions,
            "correct": grammar_correct,
            "total": grammar_total,
            "accuracy": grammar_accuracy,
            "lastQuiz": (
                {"score": last_grammar.score, "total": last_grammar.total_questions}
                if last_grammar else None
            ),
        },
        "weakWords": weak_words,
    }