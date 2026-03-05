import requests as http_requests

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import WordImageCache, User
from app.api.settings import settings
from app.api.endpoints.auth import get_current_user

router = APIRouter(tags=["images"])

HEADERS = {"User-Agent": "SpråkKollen/1.0 (language learning app)"}


def fetch_from_swedish_wikipedia(word: str) -> str | None:
    """
    Fetch a thumbnail from Swedish Wikipedia for the word.
    sv.wikipedia.org already knows Swedish word meanings — no translation needed.
    """
    try:
        resp = http_requests.get(
            f"https://sv.wikipedia.org/api/rest_v1/page/summary/{word}",
            headers=HEADERS,
            timeout=5,
        )
        if resp.status_code == 200:
            data = resp.json()
            thumbnail = data.get("thumbnail") or data.get("originalimage")
            if thumbnail:
                return thumbnail.get("source")
    except Exception:
        pass
    return None


def fetch_from_unsplash(word: str) -> str | None:
    """Fallback: fetch from Unsplash using the Swedish word directly."""
    if not settings.UNSPLASH_ACCESS_KEY:
        return None
    try:
        resp = http_requests.get(
            "https://api.unsplash.com/photos/random",
            params={"query": word, "orientation": "squarish", "count": 1},
            headers={"Authorization": f"Client-ID {settings.UNSPLASH_ACCESS_KEY}"},
            timeout=5,
        )
        if resp.status_code == 200:
            photos = resp.json()
            if isinstance(photos, dict):
                photos = [photos]
            if photos:
                return photos[0].get("urls", {}).get("small")
    except Exception:
        pass
    return None


@router.get("/word-image")
def get_word_image(
    word: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Return an image URL for a Swedish word.
    Strategy: Swedish Wikipedia first (no translation needed), then Unsplash as fallback.
    Results are cached in the DB.
    """
    word_lower = word.lower().strip()

    cached = db.query(WordImageCache).filter(WordImageCache.word == word_lower).first()
    if cached and cached.image_url:
        return {"word": word, "image_url": cached.image_url}

    # 1. Try Unsplash first (clear photos, better for image quiz)
    image_url = fetch_from_unsplash(word_lower)

    # 2. Fallback to Swedish Wikipedia
    if not image_url:
        image_url = fetch_from_swedish_wikipedia(word_lower)

    # Cache the result (upsert)
    if cached:
        cached.image_url = image_url
    else:
        db.add(WordImageCache(word=word_lower, image_url=image_url))
    db.commit()

    return {"word": word, "image_url": image_url}
