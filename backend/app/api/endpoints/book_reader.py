"""
Swedish Books reader — Project Gutenberg via gutendex.com free API.
Books are fetched on demand, split into ~400-word chapters, and cached in memory.
AI generates 4 comprehension questions per chapter.
"""
import json
import re
import traceback
from functools import lru_cache
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import BookReadingSession, User
from app.api.endpoints.auth import get_current_user
from app.api.settings import settings

router = APIRouter(tags=["book_reader"])

GUTENDEX = "https://gutendex.com"
WORDS_PER_CHAPTER = 450   # ~2-3 minute read
GUTENBERG_SKIP_WORDS = 250  # skip Project Gutenberg header

# Subject keywords that indicate reference/non-narrative books to exclude
_SKIP_SUBJECT_KEYWORDS = {
    "dictionar", "encyclop", "lexikon", "ordbok", "ordlista",
    "grammar", "grammatik", "glossar", "vocabular", "wörterbuch",
    "index", "catalog", "bibliography",
}
_SKIP_TITLE_KEYWORDS = {
    "ordbok", "lexikon", "ordlista", "dictionary", "encyclop",
    "grammatik", "grammar", "vokabulär",
}


# ---------------------------------------------------------------------------
# Gutenberg / gutendex helpers
# ---------------------------------------------------------------------------
@lru_cache(maxsize=10)
def _fetch_library(page: int = 1) -> dict:
    """Fetch a page of Swedish books from gutendex that have plain-text format."""
    url = f"{GUTENDEX}/books/?languages=sv&mime_type=text%2Fplain&page_size=32&page={page}"
    try:
        resp = httpx.get(url, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        traceback.print_exc()
        return {"results": [], "count": 0, "next": None}


def _get_text_url(formats: dict) -> Optional[str]:
    """Extract the best plain-text URL from a Gutenberg formats dict."""
    for mime in ("text/plain; charset=utf-8", "text/plain; charset=us-ascii", "text/plain"):
        if mime in formats:
            return formats[mime]
    return None


@lru_cache(maxsize=30)
def _fetch_and_split(text_url: str) -> list[str]:
    """Fetch a book's full text and split into chapters. Cached in memory."""
    try:
        resp = httpx.get(text_url, timeout=40, follow_redirects=True)
        resp.raise_for_status()
        raw = resp.text
    except Exception:
        traceback.print_exc()
        return []

    # Remove Project Gutenberg header/footer boilerplate
    start_markers = [
        r"\*\*\* START OF THE PROJECT GUTENBERG",
        r"\*\*\* START OF THIS PROJECT GUTENBERG",
        "*** START OF THE PROJECT GUTENBERG",
    ]
    end_markers = [
        r"\*\*\* END OF THE PROJECT GUTENBERG",
        r"\*\*\* END OF THIS PROJECT GUTENBERG",
        "*** END OF THE PROJECT GUTENBERG",
    ]
    text = raw
    for marker in start_markers:
        m = re.search(marker, text, re.IGNORECASE)
        if m:
            text = text[m.end():]
            break
    for marker in end_markers:
        m = re.search(marker, text, re.IGNORECASE)
        if m:
            text = text[:m.start()]
            break

    text = text.strip()

    # Try to split on chapter headings (Swedish and English)
    chapter_pattern = re.compile(
        r'\n\s*(?:KAPITEL|CHAPTER|Kapitel|Chapter|KAP\.)\s+(?:[IVXLCDM]+|\d+)\b[^\n]*\n',
        re.IGNORECASE,
    )
    parts = chapter_pattern.split(text)
    headings = chapter_pattern.findall(text)

    if len(parts) > 2:
        chapters = []
        for i, part in enumerate(parts[1:]):  # skip pre-chapter text
            heading = headings[i].strip() if i < len(headings) else f"Chapter {i + 1}"
            content = part.strip()
            if len(content) > 100:
                chapters.append(f"**{heading}**\n\n{content}")
        if chapters:
            return chapters

    # Fallback: split by word count
    words = text.split()
    if len(words) > GUTENBERG_SKIP_WORDS:
        words = words[GUTENBERG_SKIP_WORDS:]
    chunks = []
    for i in range(0, len(words), WORDS_PER_CHAPTER):
        chunk = " ".join(words[i : i + WORDS_PER_CHAPTER])
        if chunk.strip():
            chunks.append(chunk)
    return chunks


def _get_chapter(text_url: str, chapter_num: int) -> Optional[str]:
    chapters = _fetch_and_split(text_url)
    if not chapters or chapter_num < 1 or chapter_num > len(chapters):
        return None
    return chapters[chapter_num - 1]


def _chapter_count(text_url: str) -> int:
    return len(_fetch_and_split(text_url))


# ---------------------------------------------------------------------------
# AI questions
# ---------------------------------------------------------------------------
def _generate_questions(chapter_text: str, book_title: str, level: str = "intermediate") -> list[dict]:
    if not settings.ANTHROPIC_API_KEY:
        return _fallback_questions()
    try:
        import anthropic
    except ImportError:
        return _fallback_questions()

    # Truncate to first 1200 chars for the prompt (saves tokens)
    excerpt = chapter_text[:1200].replace("\n", " ")

    level_desc = {
        "beginner": "simple vocabulary and basic plot events, suitable for A1-A2 learners",
        "intermediate": "character motivations, themes, and moderate vocabulary, suitable for B1-B2 learners",
        "advanced": "deeper themes, nuanced language, literary devices, suitable for C1+ learners",
    }.get(level, "moderate difficulty")

    prompt = (
        f"Du är en svensk lärare i litteratur. En elev har precis läst ett kapitel från den svenska boken '{book_title}'.\n\n"
        f"Kapitelutdrag: {excerpt}\n\n"
        f"Skapa exakt 4 flervalssfrågor på svenska om detta kapitel.\n"
        f"Svårighetsgrad: {level_desc}.\n"
        f"Varje fråga måste ha 4 svarsalternativ (A, B, C, D) med exakt ett korrekt svar.\n\n"
        f"Svara ENDAST med en JSON-array, ingen extra text:\n"
        f'[\n'
        f'  {{"question": "...", "choices": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct_answer": "A) ..."}}\n'
        f']\n\n'
        f"Testa förståelse av händelser, karaktärer, teman eller ordförråd i kapitlet."
    )

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=700,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        start = text.find("[")
        end = text.rfind("]") + 1
        if start == -1 or end == 0:
            return _fallback_questions()
        questions = json.loads(text[start:end])
        valid = []
        for q in questions[:4]:
            if "question" in q and "choices" in q and "correct_answer" in q:
                valid.append({
                    "question": q["question"],
                    "choices": q["choices"][:4],
                    "correct_answer": q["correct_answer"],
                })
        return valid if valid else _fallback_questions()
    except Exception:
        traceback.print_exc()
        return _fallback_questions()


def _fallback_questions() -> list[dict]:
    return [
        {
            "question": "Vad är det huvudsakliga temat i det här avsnittet?",
            "choices": ["A) Äventyr", "B) Kärlek och förlust", "C) Natur", "D) Sociala konflikter"],
            "correct_answer": "A) Äventyr",
        },
        {
            "question": "Vilket språk är boken ursprungligen skriven på?",
            "choices": ["A) Norska", "B) Danska", "C) Svenska", "D) Finska"],
            "correct_answer": "C) Svenska",
        },
        {
            "question": "Böcker på Project Gutenberg är:",
            "choices": ["A) Upphovsrättsskyddade", "B) I det fria (public domain)", "C) Betalböcker", "D) Bara på engelska"],
            "correct_answer": "B) I det fria (public domain)",
        },
        {
            "question": "Att läsa på svenska är bra för dina:",
            "choices": ["A) Bara ordförrådet", "B) Bara grammatiken", "C) Alla språkfärdigheter", "D) Bara uttal"],
            "correct_answer": "C) Alla språkfärdigheter",
        },
    ]


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class BookOut(BaseModel):
    id: str
    title: str
    author: str
    language: str
    subjects: list[str]
    text_url: Optional[str] = None
    cover_url: Optional[str] = None


class LibraryOut(BaseModel):
    books: list[BookOut]
    total: int
    has_next: bool


class ChapterOut(BaseModel):
    gutenberg_id: str
    book_title: str
    chapter_num: int
    total_chapters: int
    text: str
    questions: list[dict]


class ChapterSubmitIn(BaseModel):
    gutenberg_id: str
    book_title: str
    chapter_num: int
    answers: list[str]
    correct_answers: list[str]


class ChapterResultOut(BaseModel):
    score: int
    total: int
    correct_flags: list[bool]
    message: str


class ReadingProgressItem(BaseModel):
    gutenberg_id: str
    book_title: str
    chapter_num: int
    score: int
    total_questions: int
    created_at: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get("/book-reader/library", response_model=LibraryOut)
def get_library(
    page: int = 1,
    current_user: User = Depends(get_current_user),
):
    """List Swedish books from Project Gutenberg via gutendex."""
    data = _fetch_library(page)
    books = []
    for b in data.get("results", []):
        formats = b.get("formats", {})
        text_url = _get_text_url(formats)
        if not text_url:
            continue  # skip books without plain text

        cover_url = formats.get("image/jpeg")
        authors = b.get("authors", [])
        author = authors[0]["name"] if authors else "Unknown"
        all_subjects = b.get("subjects", [])
        title = b.get("title", "").lower()

        # Skip reference/dictionary books — not suitable for reading practice
        if any(kw in title for kw in _SKIP_TITLE_KEYWORDS):
            continue
        if any(
            kw in s.lower()
            for s in all_subjects
            for kw in _SKIP_SUBJECT_KEYWORDS
        ):
            continue

        subjects = all_subjects[:3]

        books.append(BookOut(
            id=str(b["id"]),
            title=b.get("title", "Untitled"),
            author=author,
            language="Swedish",
            subjects=subjects,
            text_url=text_url,
            cover_url=cover_url,
        ))

    return LibraryOut(
        books=books,
        total=data.get("count", 0),
        has_next=bool(data.get("next")),
    )


@router.get("/book-reader/{gutenberg_id}/chapter/{chapter_num}", response_model=ChapterOut)
def get_chapter(
    gutenberg_id: str,
    chapter_num: int,
    text_url: str,
    title: str = "",
    current_user: User = Depends(get_current_user),
):
    """Fetch a specific chapter and generate comprehension questions."""
    if chapter_num < 1:
        raise HTTPException(status_code=422, detail="Chapter number must be >= 1.")

    chapter_text = _get_chapter(text_url, chapter_num)
    if chapter_text is None:
        total = _chapter_count(text_url)
        raise HTTPException(
            status_code=404,
            detail=f"Chapter {chapter_num} not found. This book has {total} chapter(s).",
        )

    total_chapters = _chapter_count(text_url)
    questions = _generate_questions(chapter_text, title or f"Gutenberg #{gutenberg_id}", current_user.level)

    return ChapterOut(
        gutenberg_id=gutenberg_id,
        book_title=title or f"Book #{gutenberg_id}",
        chapter_num=chapter_num,
        total_chapters=total_chapters,
        text=chapter_text,
        questions=questions,
    )


@router.post("/book-reader/submit", response_model=ChapterResultOut)
def submit_chapter(
    body: ChapterSubmitIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit quiz answers and save reading session."""
    if len(body.answers) != len(body.correct_answers):
        raise HTTPException(status_code=422, detail="answers and correct_answers must be same length.")

    correct_flags = [a.strip() == c.strip() for a, c in zip(body.answers, body.correct_answers)]
    score = sum(correct_flags)
    total = len(correct_flags)

    session = BookReadingSession(
        user_id=current_user.id,
        gutenberg_id=body.gutenberg_id,
        book_title=body.book_title,
        chapter_num=body.chapter_num,
        score=score,
        total_questions=total,
    )
    db.add(session)
    db.commit()

    pct = round(score / total * 100) if total > 0 else 0
    if pct == 100:
        message = "Perfect! Excellent reading comprehension!"
    elif pct >= 75:
        message = "Great job! You understood the chapter well."
    elif pct >= 50:
        message = "Good effort! Keep reading to improve."
    else:
        message = "Keep practicing — re-reading the chapter can help!"

    return ChapterResultOut(score=score, total=total, correct_flags=correct_flags, message=message)


@router.get("/book-reader/progress", response_model=list[ReadingProgressItem])
def get_reading_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the user's book reading history."""
    sessions = (
        db.query(BookReadingSession)
        .filter(BookReadingSession.user_id == current_user.id)
        .order_by(BookReadingSession.created_at.desc())
        .limit(30)
        .all()
    )
    return [
        ReadingProgressItem(
            gutenberg_id=s.gutenberg_id,
            book_title=s.book_title,
            chapter_num=s.chapter_num,
            score=s.score,
            total_questions=s.total_questions,
            created_at=s.created_at.isoformat(),
        )
        for s in sessions
    ]
