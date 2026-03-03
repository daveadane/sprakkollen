from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.db_setup import get_db
from app.api.models import PracticeSession, PracticeQuestion, VocabularyWord, PracticeSession,User
from app.api.schemas import PracticeSessionCreateOut, PracticeSessionOut
from app.api.security import get_current_user
import random

router = APIRouter(prefix="/practice", tags=["practice"])

@router.post("/sessions", response_model=PracticeSessionCreateOut)
def create_practice_session(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    s = PracticeSession(user_id=user.id)
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"id": s.id}



@router.get("/sessions/{session_id}", response_model=PracticeSessionOut)
def get_practice_session(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = db.get(PracticeSession, session_id)

    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    # If questions already generated → return them
    if session.questions:
        return session

    # Load user vocabulary
    vocab = db.execute(
        select(VocabularyWord).where(VocabularyWord.user_id == user.id)
    ).scalars().all()

    # Fallback list if no vocab
    if not vocab:
        fallback = [
            ("hus", "ett"),
            ("bil", "en"),
            ("bord", "ett"),
            ("stol", "en"),
            ("fönster", "ett"),
        ]
        words = fallback
    else:
        words = [(v.word, v.article) for v in vocab]

    # Shuffle and take 5
    random.shuffle(words)
    selected = words[:5]

    # Create questions
    for word, article in selected:
        q = PracticeQuestion(
            session_id=session.id,
            word=word,
            correct_article=article,
        )
        db.add(q)

    session.total_questions = len(selected)
    db.commit()
    db.refresh(session)

    return session


