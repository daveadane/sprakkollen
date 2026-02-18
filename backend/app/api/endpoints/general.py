from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.db_setup import get_db

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/db-check")
def db_check(db: Session = Depends(get_db)):
    # simple ping query
    db.execute(text("SELECT 1"))
    return {"db": "ok"}

