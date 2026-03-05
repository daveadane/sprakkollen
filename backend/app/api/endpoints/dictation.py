from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import DictationSession, SwedishWord, User
from app.api.schemas import (
    DictationFeedbackItem,
    DictationResultOut,
    DictationSessionOut,
    DictationSubmitIn,
)
from app.api.endpoints.auth import get_current_user

router = APIRouter(tags=["dictation"])

WORD_COUNT = 8


@router.post("/dictation/sessions", response_model=DictationSessionOut)
def create_dictation_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    words_db = db.query(SwedishWord).order_by(func.random()).limit(WORD_COUNT).all()
    words = [w.word for w in words_db]

    session = DictationSession(
        user_id=current_user.id,
        words=words,
        total_questions=len(words),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return DictationSessionOut(id=session.id, words=words)


@router.post("/dictation/sessions/{session_id}/submit", response_model=DictationResultOut)
def submit_dictation(
    session_id: int,
    body: DictationSubmitIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(DictationSession)
        .filter(DictationSession.id == session_id, DictationSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.score > 0:
        raise HTTPException(status_code=400, detail="Already submitted")

    correct_words = session.words
    score = 0
    feedback = []

    for i, typed in enumerate(body.answers):
        if i >= len(correct_words):
            break
        correct = correct_words[i]
        is_correct = typed.strip().lower() == correct.strip().lower()
        if is_correct:
            score += 1
        feedback.append(DictationFeedbackItem(word=correct, typed=typed, correct=is_correct))

    total = len(feedback)
    accuracy = round(score / total * 100) if total > 0 else 0

    session.score = score
    session.total_questions = total
    db.commit()

    return DictationResultOut(score=score, total=total, accuracy=accuracy, feedback=feedback)
