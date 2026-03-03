from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, select

from app.api.db_setup import get_db
from app.api.models import PracticeSession, User
from app.api.schemas import PracticeSessionCreateOut
from app.api.security import get_current_user
from app.api.models import PracticeSession
from app.api.schemas import PracticeSessionOut

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
    s = db.execute(
        select(PracticeSession)
        .where(PracticeSession.id == session_id, PracticeSession.user_id == user.id)
    ).scalars().first()

    if not s:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": s.id,
        "questions": [{"word": q.word} for q in s.questions],
    }

