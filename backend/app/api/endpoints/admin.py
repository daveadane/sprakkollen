from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.db_setup import get_db

router = APIRouter(tags=["admin"])

@router.get("/admin/db-info")
def db_info(db: Session = Depends(get_db)):
    # row counts
    words_count = db.execute(text("SELECT COUNT(*) FROM words")).scalar() or 0

    # current alembic version (may not exist early)
    version = None
    try:
        version = db.execute(text("SELECT version_num FROM alembic_version LIMIT 1")).scalar()
    except Exception:
        version = None

    # quick health
    db.execute(text("SELECT 1"))

    return {
        "ok": True,
        "tables": [
            {"name": "words", "rows": int(words_count)},
            {"name": "alembic_version", "rows": 1 if version else 0},
        ],
        "alembic_version": version,
    }
