from __future__ import annotations

import random

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, or_

from app.api.db_setup import get_db
from app.api.models import GrammarSession, GrammarAnswer, GrammarQuestion, User
from app.api.settings import settings
from app.api.security import get_current_user
from app.api.schemas import GrammarResultOut, GrammarSubmitIn, GrammarSessionOut

router = APIRouter(prefix="/grammar", tags=["grammar"])


@router.post("/sessions")
def create_grammar_session(
    count: int = 5,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    count = max(1, min(count, 30))
    all_questions = db.execute(
        select(GrammarQuestion).where(
            or_(GrammarQuestion.level == user.level, GrammarQuestion.level.is_(None))
        )
    ).scalars().all()
    if not all_questions:
        raise HTTPException(status_code=500, detail="No grammar questions in database")

    selected = random.sample(all_questions, min(count, len(all_questions)))

    s = GrammarSession(user_id=user.id, total_questions=len(selected), score=0)
    db.add(s)
    db.commit()
    db.refresh(s)

    for q in selected:
        db.add(GrammarAnswer(
            session_id=s.id,
            question=q.question,
            correct_answer=q.correct_answer,
            user_answer="",
            is_correct=False,
        ))

    db.commit()
    return {"id": s.id}


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

    # Look up choices from grammar_questions by question text
    question_texts = [r.question for r in rows]
    gq_map = {}
    if question_texts:
        gq_list = db.execute(
            select(GrammarQuestion).where(GrammarQuestion.question.in_(question_texts))
        ).scalars().all()
        gq_map = {gq.question: gq for gq in gq_list}

    questions_out = []
    for r in rows:
        gq = gq_map.get(r.question)
        questions_out.append({
            "question_id": r.id,
            "question": r.question,
            "choices": gq.choices if gq else [],
            "correct_answer": r.correct_answer,
        })

    return {"id": s.id, "questions": questions_out}


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

    rows = db.execute(
        select(GrammarAnswer).where(GrammarAnswer.session_id == s.id)
    ).scalars().all()

    if not rows:
        raise HTTPException(status_code=400, detail="No questions in this session")

    # Key by GrammarAnswer.id (which the frontend sends as question_id)
    answer_map = {a.id: a for a in rows}

    score = 0
    total = len(rows)

    for item in payload.answers:
        stored = answer_map.get(item.question_id)
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


class CheckTextIn(BaseModel):
    text: str


@router.post("/check-text")
def check_text(
    body: CheckTextIn,
    user: User = Depends(get_current_user),
):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="AI not configured")

    try:
        import anthropic
    except ImportError:
        raise HTTPException(status_code=503, detail="anthropic package not installed")

    prompt = f"""You are a Swedish language teacher. A student has written the following Swedish text.

Text: "{body.text.strip()}"

Please analyse this text and provide feedback in English:
1. List any grammar, spelling, or word order mistakes. For each mistake write: what was wrong, what it should be, and a short explanation.
2. If the text has no mistakes, say so clearly.
3. End with one sentence of encouragement.

Be concise and friendly. Format mistakes as a short numbered list."""

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    return {"feedback": response.content[0].text.strip()}
