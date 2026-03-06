import traceback
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.models import User
from app.api.endpoints.auth import get_current_user
from app.api.settings import settings

router = APIRouter(tags=["ai_feedback"])


class WrongAnswer(BaseModel):
    word: str
    typed: str


class AIFeedbackIn(BaseModel):
    exercise_type: str  # "practice" | "grammar" | "dictation" | "image_quiz" | "test"
    score: int
    total: int
    wrong_answers: list[WrongAnswer] = []


class AIFeedbackOut(BaseModel):
    feedback: str
    available: bool


def _build_prompt(exercise_type: str, score: int, total: int, wrong_answers: list[WrongAnswer]) -> str:
    pct = round(score / total * 100) if total > 0 else 0
    exercise_labels = {
        "practice":   "vocabulary practice",
        "grammar":    "grammar exercise",
        "dictation":  "dictation exercise",
        "image_quiz": "image quiz (identifying Swedish words from pictures)",
        "test":       "mixed vocabulary test",
    }
    label = exercise_labels.get(exercise_type, exercise_type)

    if wrong_answers:
        pairs = [f'  • "{w.word}" — you typed "{w.typed}"' for w in wrong_answers[:10]]
        wrong_lines = "Mistakes:\n" + "\n".join(pairs)
    else:
        wrong_lines = "No mistakes — perfect score!"

    return f"""You are a friendly Swedish language tutor giving brief, encouraging feedback to a learner.

The student just completed a {label} and scored {score}/{total} ({pct}%).
{wrong_lines}

Write 2-4 sentences of personalised feedback in English:
- Acknowledge their score warmly.
- If there are mistakes, pick 1-2 interesting ones to comment on (pronunciation tip, memory trick, or common confusion).
- End with a short motivating sentence.

Keep it concise and upbeat. Do not use bullet points — write in flowing prose."""


@router.post("/ai-feedback", response_model=AIFeedbackOut)
def get_ai_feedback(
    body: AIFeedbackIn,
    _: User = Depends(get_current_user),
):
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI feedback is not configured. Add ANTHROPIC_API_KEY to .env.",
        )

    try:
        import anthropic
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="anthropic package not installed. Run: pip install anthropic",
        )

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        prompt = _build_prompt(body.exercise_type, body.score, body.total, body.wrong_answers)

        # Try newest model first, fall back to a widely-supported one
        for model in ("claude-opus-4-6", "claude-3-5-sonnet-20241022"):
            try:
                response = client.messages.create(
                    model=model,
                    max_tokens=300,
                    messages=[{"role": "user", "content": prompt}],
                )
                feedback_text = response.content[0].text.strip()
                return AIFeedbackOut(feedback=feedback_text, available=True)
            except Exception as model_err:
                last_err = model_err
                traceback.print_exc()
                continue

        raise last_err

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI feedback error: {type(e).__name__}: {str(e)}")


@router.get("/ai-feedback/status")
def ai_feedback_status(_: User = Depends(get_current_user)):
    """Check if AI feedback is available."""
    return {"available": bool(settings.ANTHROPIC_API_KEY)}
