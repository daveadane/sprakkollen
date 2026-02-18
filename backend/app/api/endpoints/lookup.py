from fastapi import APIRouter

router = APIRouter()

# In-memory "database" (temporary)
WORDS = [
    {"id": 1, "word": "hus", "article": "ett", "source": "local"},
    {"id": 2, "word": "bil", "article": "en", "source": "local"},
    {"id": 3, "word": "barn", "article": "ett", "source": "local"},
    {"id": 4, "word": "bok", "article": "en", "source": "local"},
]

@router.get("/lookup")
def lookup_word(word: str):
    w = word.lower().strip()
    for entry in WORDS:
        if entry["word"] == w:
            return {
                "word": w,
                "article": entry["article"],
                "confidence": "confirmed",
                "source": entry["source"],
            }

    return {
        "word": w,
        "article": "unknown",
        "confidence": "unknown",
        "source": None,
    }
