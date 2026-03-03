from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.db_setup import get_db
from app.api.models import GrammarSession, GrammarAnswer, User
from app.api.security import get_current_user
from app.api.schemas import GrammarResultOut, GrammarSubmitIn, GrammarSessionOut # make sure these exist

router = APIRouter(prefix="/grammar", tags=["grammar"])


# Minimal static grammar questions (you can improve later)
GRAMMAR_QUESTIONS = [
    {
        "question": "Choose correct word: Jag ___ i Sverige.",
        "correct": "bor",
        "choices": ["bor", "bott", "bo"],
    },
    {
        "question": "Choose correct: Hon ___ en bok igår.",
        "correct": "läste",
        "choices": ["läser", "läste", "läs"],
    },
    {
        "question": "Choose correct: Vi ___ till skolan varje dag.",
        "correct": "går",
        "choices": ["går", "gick", "gå"],
    },
    {
        "question": "Choose correct: De ___ hemma nu.",
        "correct": "är",
        "choices": ["är", "var", "vara"],
    },
    {
        "question": "Choose correct: Jag ___ kaffe just nu.",
        "correct": "dricker",
        "choices": ["dricker", "drack", "dricka"],
    },
]


@router.post("/sessions")
def create_grammar_session(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    s = GrammarSession(user_id=user.id, total_questions=0, score=0)
    db.add(s)
    db.commit()
    db.refresh(s)

    # Insert questions into grammar_answers (as "pending" answers)
    items = GRAMMAR_QUESTIONS[:5]
    for q in items:
        db.add(
            GrammarAnswer(
                session_id=s.id,
                question=q["question"],
                correct_answer=q["correct"],
                user_answer="",          # empty until submit
                is_correct=False,
            )
        )

    s.total_questions = len(items)
    db.commit()

    return {"id": s.id}


@router.post("/sessions/{session_id}/submit", response_model=GrammarResultOut)
def submit_grammar_session(
    session_id: int,
    payload: GrammarSubmitIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    s = db.get(GrammarSession, session_id)
    if not s or s.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    # Load stored questions for this session
    rows = db.execute(
        select(GrammarAnswer).where(GrammarAnswer.session_id == s.id)
    ).scalars().all()

    if not rows:
        raise HTTPException(status_code=400, detail="No questions in this session")

    # Map by question text (minimal & reliable for now)
    answer_map = {a.question: a for a in rows}

    score = 0
    total = len(rows)

    for item in payload.answers:
        # Expecting payload: {"answers":[{"question":"...", "chosen":"..."}]}
        stored = answer_map.get(item.question)
        if not stored:
            continue

        stored.user_answer = item.chosen
        stored.is_correct = (item.chosen.strip().lower() == stored.correct_answer.strip().lower())
        if stored.is_correct:
            score += 1

    s.score = score
    s.total_questions = total
    db.commit()

    accuracy = int((score / total) * 100) if total else 0
    return {"score": score, "total": total, "accuracy": accuracy}



@router.get("/sessions/{session_id}", response_model=GrammarSessionOut)
def get_grammar_session(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    s = db.get(GrammarSession, session_id)
    if not s or s.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    rows = db.execute(
        select(GrammarAnswer)
        .where(GrammarAnswer.session_id == s.id)
        .order_by(GrammarAnswer.id)
    ).scalars().all()

    # attach choices (same order as GRAMMAR_QUESTIONS)
    questions_out = []
    for idx, r in enumerate(rows):
        choices = GRAMMAR_QUESTIONS[idx]["choices"] if idx < len(GRAMMAR_QUESTIONS) else []
        questions_out.append(
            {"question_id": r.id, "question": r.question, "choices": choices}
        )

    return {"id": s.id, "questions": questions_out}  