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
    # Animals — domestic & farm
    "hund", "katt", "häst", "ko", "får", "gris", "kanin", "kyckling", "anka",
    "gås", "kalkon", "åsna", "get", "lamm", "kalv",
    # Animals — wild
    "björn", "lejon", "tiger", "elefant", "orm", "apa", "uggla", "räv", "varg",
    "sköldpadda", "delfin", "krokodil", "flodhäst", "zebra", "giraff", "pingvin",
    "papegoja", "hamster", "ekorre", "igelkott", "groda", "haj", "val",
    "bläckfisk", "fasan", "örn", "flamingo", "känguru", "koala", "panda",
    "gorilla", "isbjörn", "säl", "älg", "ren", "kamel", "lama", "gepard",
    "puma", "jaguar", "bäver", "lo",
    # Fish & insects
    "fisk", "lax", "tonfisk", "bi", "fjäril", "myra", "nyckelpiga",
    # Food — fruit
    "äpple", "banan", "apelsin", "jordgubbe", "plommon", "päron", "druva",
    "ananas", "mango", "melon", "citron", "körsbär", "persika", "kiwi",
    "kokosnöt", "papaya", "granatäpple", "avokado", "hallon", "blåbär",
    "lingon", "fikon",
    # Food — vegetables
    "tomat", "potatis", "morot", "lök", "gurka", "broccoli", "blomkål",
    "majs", "svamp", "vitlök", "spenat", "kål", "rödbeta", "selleri",
    "purjolök", "sparris", "paprika", "ärtskida", "zucchini", "aubergine",
    "ingefära", "rädisa",
    # Food — other
    "bröd", "ägg", "mjölk", "ost", "smör", "kött", "pizza", "soppa",
    "kaffe", "te", "juice", "vatten", "tårta", "glass", "choklad", "ris",
    "pasta", "sallad", "hamburgare", "sushi", "tacos", "pannkaka", "våffla",
    "kanelbulle", "smörgås", "gryta", "grädde", "yoghurt", "sylt", "honung",
    "salt", "socker", "olja",
    # Clothing & accessories
    "skjorta", "jacka", "sko", "mössa", "handskar", "klänning", "byxor",
    "kjol", "strumpor", "tröja", "kappa", "halsduk", "hatt", "solglasögon",
    "bälte", "slips", "kostym", "pyjamas", "shorts", "kofta", "jeans",
    "sandal", "stövel", "sneakers", "väska", "ryggsäck", "portfölj",
    # Body parts
    "öga", "öra", "näsa", "hand", "fot", "finger", "huvud", "rygg",
    "mage", "axel", "arm", "knä", "armbåge", "tand", "läpp", "panna",
    "nacke", "tumme", "handled", "ankel",
    # Household — furniture & rooms
    "stol", "bord", "säng", "soffa", "garderob", "hylla", "matta", "kudde",
    "filt", "spegel", "lampa", "gardin", "blomkruka", "vas", "korg",
    # Household — kitchen
    "kniv", "gaffel", "sked", "tallrik", "kopp", "glas", "flaska", "skål",
    "kastrull", "stekpanna", "ugn", "spis", "kylskåp", "mikrovågsugn",
    "vattenkokare", "blandare", "diskmaskin", "korkskruv",
    # Household — bathroom & other
    "handduk", "tvål", "schampo", "tandborste", "kamm", "rakapparat",
    "hammare", "skruvmejsel", "sax", "lim", "tejp", "ljus", "ficklampa",
    "brandsläckare",
    # Nature — landscape
    "träd", "blomma", "sol", "måne", "stjärna", "moln", "berg", "sjö",
    "hav", "flod", "skog", "strand", "sten", "sand", "gräs", "löv",
    "rot", "gren", "snö", "is", "regnbåge", "vulkan", "ö", "dal",
    "äng", "fält", "bäck", "vattenfall", "öken", "kaktus", "palm", "bambu",
    # Flowers & plants
    "ros", "solros", "tulpan", "lilja", "lavendel", "orkidé", "nejlika",
    "hyacint", "bonsai",
    # Transport
    "bil", "buss", "tåg", "cykel", "båt", "flygplan", "motorcykel",
    "helikopter", "ubåt", "lastbil", "ambulans", "brandmobil", "spårvagn",
    "taxi", "segelbåt", "kanot", "skateboard", "sparkcykel", "rullskridskor",
    "skidor", "snowboard", "traktor",
    # Places & buildings
    "hus", "skola", "kyrka", "bro", "torn", "sjukhus", "bibliotek",
    "museum", "stadion", "teatern", "biograf", "restaurang", "hotell",
    "slott", "fyr", "hamn", "flygplats", "station", "tält", "koja",
    "stall", "bondgård", "fängelse", "fabrik",
    # Technology & electronics
    "telefon", "dator", "surfplatta", "hörlurar", "tangentbord", "mus",
    "skärm", "kamera", "printer", "tv", "radio", "spelkonsol", "projektor",
    "router", "usb",
    # Musical instruments
    "gitarr", "piano", "trummor", "violin", "flöjt", "saxofon", "trumpet",
    "harpa", "cello", "klarinett", "banjo", "ukulele", "tuba", "dragspel",
    "xylofon",
    # Sports & hobbies
    "fotboll", "tennis", "basket", "golf", "boxing", "boll", "nät",
    "racket", "mål", "hantel", "hopprep", "skridskor", "surfbräda",
    "fiskespö", "tält", "karta", "kompass", "kikare",
    # School & office
    "bok", "penna", "linjal", "suddgummi", "krita", "häftapparat",
    "mapp", "glob", "mikroskop", "teleskop", "kalkylator", "anteckningsbok",
    # Everyday objects
    "flagga", "paraply", "klocka", "nyckel", "lås", "kedja", "ring",
    "armband", "halsband", "örhänge", "glasögon", "plånbok", "mynt",
    "sedel", "kuvert", "stämpel", "ballong", "present", "band", "rosett",
    "termos", "matlåda", "picknikkorg",
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
