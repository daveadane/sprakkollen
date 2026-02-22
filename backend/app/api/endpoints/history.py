from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.db_setup import get_db
from app.api.security import get_current_user
from app.api.models import SearchHistory, User
from app.api.schemas import SearchHistoryOut

router = APIRouter(prefix="/history", tags=["history"])

@router.get("", response_model=list[SearchHistoryOut])
def list_history(limit: int = 20, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == user.id)
        .order_by(SearchHistory.created_at.desc(), SearchHistory.id.desc())
        .limit(limit)
        .all()
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_one(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.query(SearchHistory).filter(SearchHistory.id == id, SearchHistory.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(row)
    db.commit()
    return None

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_all(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(SearchHistory).filter(SearchHistory.user_id == user.id).delete()
    db.commit()
    return None