import re
import requests as http_requests

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import WordImageCache, User
from app.api.settings import settings
from app.api.endpoints.auth import get_current_user

router = APIRouter(tags=["images"])


def get_english_translation(swedish_word: str) -> str:
    """
    Try to get the English translation of a Swedish word via Wiktionary.
    Falls back to the original word if anything fails.
    """
    try:
        url = f"https://en.wiktionary.org/api/rest_v1/page/definition/{swedish_word.lower()}"
        resp = http_requests.get(url, timeout=4)
        if resp.status_code != 200:
            return swedish_word

        data = resp.json()
        sv_sections = data.get("sv", [])

        for section in sv_sections:
            for defn in section.get("definitions", []):
                raw = defn.get("definition", "")
                # Strip HTML tags
                clean = re.sub(r"<[^>]+>", "", raw).strip()
                if not clean:
                    continue
                # Take first significant word from definition
                first = clean.split()[0].rstrip(".,;:()")
                if len(first) > 2:
                    return first
    except Exception:
        pass

    return swedish_word


@router.get("/word-image")
def get_word_image(
    word: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Return a cached Unsplash image URL for a Swedish word."""
    word_lower = word.lower().strip()

    cached = db.query(WordImageCache).filter(WordImageCache.word == word_lower).first()
    if cached:
        return {"word": word, "image_url": cached.image_url}

    image_url = None

    if settings.UNSPLASH_ACCESS_KEY:
        search_term = get_english_translation(word_lower)

        try:
            resp = http_requests.get(
                "https://api.unsplash.com/photos/random",
                params={"query": search_term, "orientation": "squarish", "count": 1},
                headers={"Authorization": f"Client-ID {settings.UNSPLASH_ACCESS_KEY}"},
                timeout=5,
            )
            if resp.status_code == 200:
                photos = resp.json()
                if isinstance(photos, dict):
                    photos = [photos]
                if photos:
                    image_url = photos[0].get("urls", {}).get("small")
        except Exception:
            pass

    # Upsert cache
    if cached:
        cached.image_url = image_url
    else:
        db.add(WordImageCache(word=word_lower, image_url=image_url))
    db.commit()

    return {"word": word, "image_url": image_url}
