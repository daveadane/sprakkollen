import hashlib
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import text, func
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import SwedishWord
from app.api.security import get_current_user

router = APIRouter(tags=["general"])

@router.get("/")
def api_root():
  return {"message": "SpråkKollen API is running"}

@router.get("/health")
def health():
  return {"status": "ok"}

@router.get("/db-check")
def db_check(db: Session = Depends(get_db)):
  db.execute(text("SELECT 1"))
  return {"db": "ok"}


@router.get("/word-of-day")
def word_of_day(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    count = db.query(func.count(SwedishWord.id)).scalar() or 0
    if count == 0:
        return None
    # Deterministic index based on today's date — same word all day for everyone
    seed = int(hashlib.md5(str(date.today()).encode()).hexdigest(), 16) % count
    word = db.query(SwedishWord).offset(seed).limit(1).first()
    if not word:
        return None
    return {"word": word.word, "article": word.article}




