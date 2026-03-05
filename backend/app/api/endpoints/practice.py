from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.api.db_setup import get_db
from app.api.models import PracticeSession, PracticeAnswer, PracticeQuestion, User, SwedishWord
from app.api.security import get_current_user
from app.api.schemas import PracticeResultOut, PracticeSubmitIn, PracticeSessionOut, PracticeSessionCreateOut

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

    # Pick 10 random words from the global swedish_words DB
    selected_words = (
        db.query(SwedishWord)
        .order_by(func.random())
        .limit(10)
        .all()
    )
    if not selected_words:
        raise HTTPException(status_code=503, detail="Word database is empty. Run load_words_to_db.py first.")

    selected = [(w.word, w.article) for w in selected_words]

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

