from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SpråkKollen API", version="0.1")

# Allow React frontend to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory "database" 
words = [
    {"id": 1, "word": "hus", "article": "ett", "source": "local"},
    {"id": 2, "word": "bil", "article": "en", "source": "local"},
    {"id": 3, "word": "barn", "article": "ett", "source": "local"},
    {"id": 4, "word": "bok", "article": "en", "source": "local"},
]


@app.get("/")
def root():
    return {"message": "SpråkKollen API is running"}


# READ: list words
@app.get("/words")
def list_words(limit: int = 10):
    return words[:limit]


# READ: get word by ID
@app.get("/words/{word_id}")
def get_word(word_id: int):
    for entry in words:
        if entry["id"] == word_id:
            return entry
    raise HTTPException(status_code=404, detail="Word not found")


# CORE FEATURE: lookup ett/en
@app.get("/lookup")
def lookup_word(word: str):
    for entry in words:
        if entry["word"] == word.lower():
            return {
                "word": word,
                "article": entry["article"],
                "confidence": "confirmed",
                "source": entry["source"],
            }

    return {
        "word": word,
        "article": "unknown",
        "confidence": "unknown",
        "source": None,
    }

