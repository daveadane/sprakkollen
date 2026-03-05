from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import LookupCache, SearchHistory, SwedishWord, User
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
        db.add(SearchHistory(user_id=user.id, word=normalized))
        db.commit()
        return {
            "word": row.word,
            "article": row.article,
            "confidence": float(row.confidence) if row.confidence != "unknown" else None,
            "source": "cache",
            "examples": row.examples or [],
        }

    # 2) Check SwedishWord DB table (fast indexed lookup)
    sw = db.query(SwedishWord).filter(SwedishWord.word == normalized).first()
    if sw:
        hit = {
            "word": sw.word,
            "article": sw.article,
            "confidence": sw.confidence,
            "examples": sw.examples or [],
            "source": "dataset",
        }
    else:
        # 3) Fall back to JSON file
        hit = dataset_lookup(normalized)

    if not hit:
        raise HTTPException(status_code=404, detail="Not found")

    # 4) Save/update cache with examples
    if row:
        row.article = hit["article"]
        row.confidence = str(hit["confidence"])
        row.source = hit["source"]
        row.examples = hit["examples"]
        db.commit()
        db.refresh(row)
    else:
        db.add(LookupCache(
            word=hit["word"],
            article=hit["article"],
            confidence=str(hit["confidence"]),
            source="dataset",
            examples=hit["examples"],
        ))
        db.commit()

    # 5) Record search history
    db.add(SearchHistory(user_id=user.id, word=normalized))
    db.commit()

    return hit
