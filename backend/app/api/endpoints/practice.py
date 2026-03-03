from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.db_setup import get_db
from app.api.models import PracticeSession, PracticeAnswer, PracticeQuestion, User, VocabularyWord
from app.api.security import get_current_user
from app.api.schemas import PracticeResultOut, PracticeSubmitIn, PracticeSessionOut, PracticeSessionCreateOut
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

@router.post("/sessions/{session_id}/submit", response_model=PracticeResultOut)
def submit_practice(
    session_id: int,
    payload: PracticeSubmitIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    s = db.get(PracticeSession, session_id)
    if not s or s.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    # Map stored questions for correctness lookup
    qmap = {q.word: q.correct_article for q in s.questions}
    if not qmap:
        raise HTTPException(status_code=400, detail="No questions generated")

    score = 0
    total = len(qmap)

    # Optional: prevent double-submit
    existing = db.execute(
        select(PracticeAnswer.id).where(PracticeAnswer.session_id == s.id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Session already submitted")

    for a in payload.answers:
        correct = qmap.get(a.word)
        if not correct:
            continue

        is_correct = (a.chosen == correct)
        if is_correct:
            score += 1

        db.add(
            PracticeAnswer(
                session_id=s.id,
                word=a.word,
                correct_article=correct,
                user_answer=a.chosen,
                is_correct=is_correct,
            )
        )

    s.total_questions = total
    s.score = score
    db.commit()

    accuracy = int((score / total) * 100) if total else 0
    return {"score": score, "total": total, "accuracy": accuracy}

