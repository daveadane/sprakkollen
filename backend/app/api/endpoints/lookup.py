from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import LookupCache
from app.api.schemas import LookupOut
from app.api.services.lookup_dataset import dataset_lookup

router = APIRouter(tags=["lookup"])


@router.get("/lookup", response_model=LookupOut)
def lookup_word(word: str, db: Session = Depends(get_db)):
    normalized = word.strip().lower()
    if not normalized:
        raise HTTPException(status_code=422, detail="word is required")

    # 1️⃣ Check cache
    row = db.query(LookupCache).filter(LookupCache.word == normalized).first()
    if row:
        return {
            "word": row.word,
            "article": row.article,
            "confidence": float(row.confidence) if row.confidence != "unknown" else None,
            "source": "cache",
            "examples": [],  # your model does not store examples yet
        }

    # 2️⃣ Check dataset
    hit = dataset_lookup(normalized)
    if not hit:
        raise HTTPException(status_code=404, detail="Not found")

    # 3️⃣ Save to cache
    cache_row = LookupCache(
        word=hit["word"],
        article=hit["article"],
        confidence=str(hit["confidence"]),
        source="dataset",
    )
    db.add(cache_row)
    db.commit()

    return hit