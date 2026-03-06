"""
Podcasts feature — Swedish Radio (SR) Klartext episodes with AI comprehension questions.
SR public API: https://api.sr.se/api/v2/episodes/index?programid=4914&format=json
No API key needed.
"""
import traceback
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import PodcastSession, User
from app.api.endpoints.auth import get_current_user
from app.api.settings import settings

router = APIRouter(tags=["podcasts"])

# SR program IDs we support
PROGRAMS = {
    "klartext": {"id": 4914, "name": "Klartext", "description": "News in simplified Swedish — perfect for learners."},
    "radiosporten": {"id": 2938, "name": "Radiokorrespondenterna", "description": "Swedish Radio correspondents around the world."},
}
DEFAULT_PROGRAM = "klartext"

SR_BASE = "https://api.sr.se/api/v2"


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class EpisodeOut(BaseModel):
    id: str
    title: str
    description: str
    publish_date: str
    audio_url: Optional[str] = None
    image_url: Optional[str] = None
    duration_seconds: Optional[int] = None


class EpisodesListOut(BaseModel):
    program_name: str
    program_description: str
    episodes: list[EpisodeOut]


class QuestionOut(BaseModel):
    question: str
    choices: list[str]
    correct_answer: str


class QuestionsOut(BaseModel):
    episode_id: str
    episode_title: str
    questions: list[QuestionOut]


class QuizSubmitIn(BaseModel):
    episode_id: str
    episode_title: str
    answers: list[str]          # user's chosen answers, indexed by question
    correct_answers: list[str]  # correct answers in same order


class QuizResultOut(BaseModel):
    score: int
    total: int
    correct_flags: list[bool]
    message: str


class ListeningHistoryItem(BaseModel):
    episode_id: str
    episode_title: str
    score: int
    total_questions: int
    created_at: str


# ---------------------------------------------------------------------------
# SR API helper
# ---------------------------------------------------------------------------
def _fetch_episodes(program_id: int, size: int = 12) -> list[dict]:
    url = (
        f"{SR_BASE}/episodes/index"
        f"?programid={program_id}&format=json&size={size}&page=1"
    )
    try:
        resp = httpx.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        episodes = data.get("episodes", [])
        result = []
        for ep in episodes:
            audio_url = None
            if ep.get("downloadpodcast"):
                audio_url = ep["downloadpodcast"]
            elif ep.get("broadcast") and ep["broadcast"].get("broadcastfiles"):
                audio_url = ep["broadcast"]["broadcastfiles"][0].get("url")

            image_url = None
            if ep.get("imageurl"):
                image_url = ep["imageurl"]
            elif ep.get("imageurltemplate"):
                image_url = ep["imageurltemplate"].replace("{format}", "square").replace("{width}", "200")

            result.append({
                "id": str(ep.get("id", "")),
                "title": ep.get("title", ""),
                "description": ep.get("description", ""),
                "publish_date": ep.get("publishdateutc", ""),
                "audio_url": audio_url,
                "image_url": image_url,
                "duration_seconds": ep.get("duration"),
            })
        return result
    except Exception:
        traceback.print_exc()
        return []


def _generate_questions(episode_title: str, episode_description: str) -> list[dict]:
    """Ask Claude to generate 4 comprehension questions based on the episode description."""
    if not settings.ANTHROPIC_API_KEY:
        return _fallback_questions()

    try:
        import anthropic
    except ImportError:
        return _fallback_questions()

    prompt = (
        f"You are a Swedish language teacher. A student just listened to a Swedish radio episode.\n\n"
        f"Episode title: {episode_title}\n"
        f"Episode description: {episode_description}\n\n"
        f"Create exactly 4 multiple-choice comprehension questions in English about this episode.\n"
        f"Each question must have 4 answer choices (A, B, C, D) with exactly one correct answer.\n\n"
        f"Respond ONLY with a JSON array in this exact format, no extra text:\n"
        f'[\n'
        f'  {{"question": "...", "choices": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct_answer": "A) ..."}},\n'
        f'  ...\n'
        f']\n\n'
        f"Make the questions test understanding of the topic, vocabulary, or main ideas."
    )

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()

        # Extract JSON from the response
        import json
        start = text.find("[")
        end = text.rfind("]") + 1
        if start == -1 or end == 0:
            return _fallback_questions()
        questions = json.loads(text[start:end])
        # Validate structure
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
            "question": "What was the main topic of this episode?",
            "choices": ["A) Current news", "B) Sports", "C) Weather", "D) History"],
            "correct_answer": "A) Current news",
        },
        {
            "question": "Klartext is aimed at which audience?",
            "choices": ["A) Advanced speakers", "B) Language learners and children", "C) Politicians", "D) Scientists"],
            "correct_answer": "B) Language learners and children",
        },
        {
            "question": "Which language is Klartext broadcast in?",
            "choices": ["A) English", "B) Norwegian", "C) Swedish", "D) Danish"],
            "correct_answer": "C) Swedish",
        },
        {
            "question": "Which Swedish radio station produces Klartext?",
            "choices": ["A) SR P1", "B) SR P3", "C) SR P4", "D) SR P5"],
            "correct_answer": "A) SR P1",
        },
    ]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get("/podcasts/episodes", response_model=EpisodesListOut)
def get_episodes(
    program: str = DEFAULT_PROGRAM,
    size: int = 12,
    current_user: User = Depends(get_current_user),
):
    """Fetch latest episodes from Sveriges Radio for a given program."""
    prog = PROGRAMS.get(program, PROGRAMS[DEFAULT_PROGRAM])
    episodes_raw = _fetch_episodes(prog["id"], min(size, 20))

    if not episodes_raw:
        raise HTTPException(status_code=502, detail="Could not fetch episodes from Sveriges Radio. Please try again later.")

    return EpisodesListOut(
        program_name=prog["name"],
        program_description=prog["description"],
        episodes=[EpisodeOut(**ep) for ep in episodes_raw],
    )


@router.get("/podcasts/questions/{episode_id}", response_model=QuestionsOut)
def get_questions(
    episode_id: str,
    title: str = "",
    description: str = "",
    current_user: User = Depends(get_current_user),
):
    """Generate AI comprehension questions for a given episode."""
    if not title:
        raise HTTPException(status_code=422, detail="Episode title is required.")

    questions_raw = _generate_questions(title, description or title)
    questions = [QuestionOut(**q) for q in questions_raw]

    return QuestionsOut(
        episode_id=episode_id,
        episode_title=title,
        questions=questions,
    )


@router.post("/podcasts/submit", response_model=QuizResultOut)
def submit_quiz(
    body: QuizSubmitIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit quiz answers and save the listening session."""
    if len(body.answers) != len(body.correct_answers):
        raise HTTPException(status_code=422, detail="Answers and correct_answers must be same length.")

    correct_flags = [
        a.strip() == c.strip()
        for a, c in zip(body.answers, body.correct_answers)
    ]
    score = sum(correct_flags)
    total = len(correct_flags)

    # Save session
    session = PodcastSession(
        user_id=current_user.id,
        episode_id=body.episode_id,
        episode_title=body.episode_title,
        score=score,
        total_questions=total,
    )
    db.add(session)
    db.commit()

    pct = round(score / total * 100) if total > 0 else 0
    if pct == 100:
        message = "Perfect score! Excellent listening comprehension!"
    elif pct >= 75:
        message = "Great job! You understood most of the episode."
    elif pct >= 50:
        message = "Good effort! Keep listening to improve your comprehension."
    else:
        message = "Keep practicing! Listening to Swedish every day will help a lot."

    return QuizResultOut(
        score=score,
        total=total,
        correct_flags=correct_flags,
        message=message,
    )


@router.get("/podcasts/history", response_model=list[ListeningHistoryItem])
def get_listening_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the user's podcast listening history."""
    sessions = (
        db.query(PodcastSession)
        .filter(PodcastSession.user_id == current_user.id)
        .order_by(PodcastSession.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        ListeningHistoryItem(
            episode_id=s.episode_id,
            episode_title=s.episode_title,
            score=s.score,
            total_questions=s.total_questions,
            created_at=s.created_at.isoformat(),
        )
        for s in sessions
    ]
