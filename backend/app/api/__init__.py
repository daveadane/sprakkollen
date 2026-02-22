from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.api.models import LookupCache
from app.api.settings import settings


def cache_is_fresh(row: LookupCache) -> bool:
    ttl = timedelta(minutes=int(settings.LOOKUP_CACHE_TTL_MINUTES))
    return (datetime.utcnow() - row.updated_at) <= ttl


def get_cache(db: Session, word: str) -> LookupCache | None:
    return db.query(LookupCache).filter(LookupCache.word == word).first()


def upsert_cache(
    db: Session,
    *,
    word: str,
    article: str,
    confidence: float | str,
    source: str,
) -> LookupCache:
    row = get_cache(db, word)
    if row:
        row.article = article
        row.confidence = str(confidence)
        row.source = source
        db.commit()
        db.refresh(row)
        return row

    row = LookupCache(
        word=word,
        article=article,
        confidence=str(confidence),
        source=source,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row