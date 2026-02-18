from fastapi import APIRouter, HTTPException

router = APIRouter()

WORDS = [
    {"id": 1, "word": "hus", "article": "ett", "source": "local"},
    {"id": 2, "word": "bil", "article": "en", "source": "local"},
    {"id": 3, "word": "barn", "article": "ett", "source": "local"},
    {"id": 4, "word": "bok", "article": "en", "source": "local"},
]

@router.get("/words")
def list_words(limit: int = 10):
    return WORDS[:limit]

@router.get("/words/{word_id}")
def get_word(word_id: int):
    for entry in WORDS:
        if entry["id"] == word_id:
            return entry
    raise HTTPException(status_code=404, detail="Word not found")
