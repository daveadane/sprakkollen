from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import ReadingText, ReadingQuestion, ReadingSession, User
from app.api.schemas import ReadingTextOut, ReadingTextDetailOut, ReadingSubmitIn, ReadingResultOut
from app.api.security import get_current_user

router = APIRouter(tags=["reading"])


@router.get("/reading/texts", response_model=list[ReadingTextOut])
def list_texts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(ReadingText).order_by(ReadingText.level, ReadingText.id).all()


@router.get("/reading/texts/{text_id}", response_model=ReadingTextDetailOut)
def get_text(text_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    text = db.query(ReadingText).filter(ReadingText.id == text_id).first()
    if not text:
        raise HTTPException(status_code=404, detail="Text not found")
    return text


@router.post("/reading/texts/{text_id}/submit", response_model=ReadingResultOut)
def submit_answers(
    text_id: int,
    payload: ReadingSubmitIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    text = db.query(ReadingText).filter(ReadingText.id == text_id).first()
    if not text:
        raise HTTPException(status_code=404, detail="Text not found")

    question_map = {q.id: q for q in text.questions}
    score = 0
    feedback = []

    for answer in payload.answers:
        q = question_map.get(answer.question_id)
        if not q:
            continue
        correct = answer.chosen.strip().lower() == q.correct_answer.strip().lower()
        if correct:
            score += 1
        feedback.append({
            "question_id": q.id,
            "question": q.question,
            "chosen": answer.chosen,
            "correct_answer": q.correct_answer,
            "is_correct": correct,
        })

    total = len(feedback)
    accuracy = round((score / total) * 100) if total > 0 else 0

    # Record reading session for progress/streak tracking
    db.add(ReadingSession(user_id=user.id, text_id=text_id, score=score, total=total))
    db.commit()

    return {"score": score, "total": total, "accuracy": accuracy, "feedback": feedback}
