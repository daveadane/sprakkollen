import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import ImageQuizSession, SwedishWord, WordImageCache, User
from app.api.schemas import (
    ImageQuizFeedbackItem,
    ImageQuizResultOut,
    ImageQuizSessionOut,
    ImageQuizSubmitIn,
)
from app.api.endpoints.auth import get_current_user
from app.api.endpoints.images import fetch_from_swedish_wikipedia, fetch_from_unsplash

router = APIRouter(tags=["image_quiz"])

WORD_COUNT = 8

# Curated list of common, visual Swedish nouns — always have clear Unsplash photos
VISUAL_WORDS = [
    # Animals
    "hund", "katt", "häst", "fågel", "fisk", "ko", "får", "gris", "kanin",
    "björn", "lejon", "tiger", "elefant", "orm", "apa", "uggla", "räv", "varg",
    "anka", "kyckling", "sköldpadda", "delfin", "krokodil", "flodhäst",
    # Food & drink
    "bröd", "ägg", "mjölk", "ost", "smör", "kött", "äpple", "banan", "tomat",
    "potatis", "morot", "lök", "gurka", "apelsin", "jordgubbe", "pizza", "soppa",
    "kaffe", "te", "juice", "vatten", "tårta", "glass", "choklad", "ris", "pasta",
    # Clothing
    "skjorta", "jacka", "sko", "mössa", "handskar", "klänning", "byxor",
    # Body
    "öga", "öra", "näsa", "hand", "fot", "finger", "huvud", "rygg",
    # Household objects
    "stol", "bord", "säng", "lampa", "spegel", "nyckel", "kniv", "gaffel",
    "tallrik", "kopp", "glas", "flaska", "paraply", "väska", "kamera",
    # Nature
    "träd", "blomma", "sol", "måne", "stjärna", "moln", "berg", "sjö",
    "hav", "flod", "skog", "strand", "sten", "sand",
    # Transport
    "bil", "buss", "tåg", "cykel", "båt", "flygplan", "motorcykel",
    # Places & buildings
    "hus", "skola", "kyrka", "bro", "torn",
    # Other everyday objects
    "bok", "penna", "telefon", "dator", "boll", "gitarr", "piano", "klocka",
    "lampa", "paraply", "flagga",
]


def get_or_cache_image(word: str, db: Session) -> str | None:
    """Return cached image URL, or fetch and cache it."""
    cached = db.query(WordImageCache).filter(WordImageCache.word == word).first()
    if cached and cached.image_url:
        return cached.image_url

    image_url = fetch_from_unsplash(word)
    if not image_url:
        image_url = fetch_from_swedish_wikipedia(word)

    if cached:
        cached.image_url = image_url
    else:
        db.add(WordImageCache(word=word, image_url=image_url))
    db.commit()
    return image_url


@router.post("/image-quiz/sessions", response_model=ImageQuizSessionOut)
def create_image_quiz_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Pick from curated visual words that exist in the SwedishWord table
    candidates = (
        db.query(SwedishWord.word)
        .filter(SwedishWord.word.in_(VISUAL_WORDS))
        .all()
    )
    pool = [r.word for r in candidates]
    random.shuffle(pool)
    words = pool[:WORD_COUNT]

    # Fallback: fill up with random DB words if curated list is too small
    if len(words) < WORD_COUNT:
        extra = (
            db.query(SwedishWord)
            .filter(SwedishWord.word.notin_(words))
            .order_by(func.random())
            .limit(WORD_COUNT - len(words))
            .all()
        )
        words += [w.word for w in extra]

    session = ImageQuizSession(
        user_id=current_user.id,
        words=words,
        total_questions=len(words),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return ImageQuizSessionOut(id=session.id, words=words)


@router.post("/image-quiz/sessions/{session_id}/submit", response_model=ImageQuizResultOut)
def submit_image_quiz(
    session_id: int,
    body: ImageQuizSubmitIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(ImageQuizSession)
        .filter(ImageQuizSession.id == session_id, ImageQuizSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.score > 0:
        raise HTTPException(status_code=400, detail="Already submitted")

    correct_words = session.words
    score = 0
    feedback = []

    for i, typed in enumerate(body.answers):
        if i >= len(correct_words):
            break
        correct = correct_words[i]
        is_correct = typed.strip().lower() == correct.strip().lower()
        if is_correct:
            score += 1
        image_url = get_or_cache_image(correct.lower(), db)
        feedback.append(
            ImageQuizFeedbackItem(word=correct, typed=typed, correct=is_correct, image_url=image_url)
        )

    total = len(feedback)
    accuracy = round(score / total * 100) if total > 0 else 0

    session.score = score
    session.total_questions = total
    db.commit()

    return ImageQuizResultOut(score=score, total=total, accuracy=accuracy, feedback=feedback)
