from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import LookupCache, SearchHistory, User
from app.api.schemas import LookupOut
from app.api.services.lookup_dataset import dataset_lookup
from app.api.settings import settings
from app.api.security import get_current_user

router = APIRouter(tags=["lookup"])


def _is_cache_fresh(row: LookupCache) -> bool:
    ttl = timedelta(minutes=int(settings.LOOKUP_CACHE_TTL_MINUTES))
    return (datetime.utcnow() - row.updated_at) <= ttl


@router.get("/lookup", response_model=LookupOut)
def lookup_word(
    word: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    normalized = word.strip().lower()
    if not normalized:
        raise HTTPException(status_code=422, detail="word is required")

    # 1) Check cache (only if fresh)
    row = db.query(LookupCache).filter(LookupCache.word == normalized).first()
    if row and _is_cache_fresh(row):
        # Record search history (model supports only: user_id, word)
        db.add(SearchHistory(user_id=user.id, word=normalized))
        db.commit()

        return {
            "word": row.word,
            "article": row.article,
            "confidence": float(row.confidence) if row.confidence != "unknown" else None,
            "source": "cache",
            "examples": [],  # cache model doesn't store examples
        }

    # 2) Cache miss OR expired -> dataset lookup
    hit = dataset_lookup(normalized)
    if not hit:
        # Optionally still record that user searched (even if not found)
        # db.add(SearchHistory(user_id=user.id, word=normalized))
        # db.commit()
        raise HTTPException(status_code=404, detail="Not found")

    # 3) Save to cache (UPSERT-like: update if row existed but expired)
    if row:
        row.article = hit["article"]
        row.confidence = str(hit["confidence"])
        row.source = "dataset"
        db.commit()
        db.refresh(row)
    else:
        cache_row = LookupCache(
            word=hit["word"],
            article=hit["article"],
            confidence=str(hit["confidence"]),
            source="dataset",
        )
        db.add(cache_row)
        db.commit()

    # 4) Record search history
    db.add(SearchHistory(user_id=user.id, word=normalized))
    db.commit()

    return hit