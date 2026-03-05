import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import GrammarQuestion, SwedishWord, TestSession, User
from app.api.schemas import (
    TestFeedbackItem,
    TestQuestionOut,
    TestResultOut,
    TestSessionOut,
    TestSubmitIn,
)
from app.api.endpoints.auth import get_current_user

router = APIRouter(tags=["test"])

ARTICLE_COUNT = 5
GRAMMAR_COUNT = 5


@router.post("/test/sessions", response_model=TestSessionOut)
def create_test_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article_words = db.query(SwedishWord).order_by(func.random()).limit(ARTICLE_COUNT).all()
    grammar_qs = db.query(GrammarQuestion).order_by(func.random()).limit(GRAMMAR_COUNT).all()

    questions = []

    for i, w in enumerate(article_words):
        questions.append({
            "id": f"a{i}",
            "type": "article",
            "question": f'What is the article for "{w.word}"?',
            "word": w.word,
            "choices": ["en", "ett"],
            "correct_answer": w.article,
        })

    for i, gq in enumerate(grammar_qs):
        questions.append({
            "id": f"g{i}",
            "type": "grammar",
            "question": gq.question,
            "word": None,
            "choices": gq.choices,
            "correct_answer": gq.correct_answer,
        })

    random.shuffle(questions)

    session = TestSession(
        user_id=current_user.id,
        questions=questions,
        total_questions=len(questions),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return TestSessionOut(
        id=session.id,
        questions=[TestQuestionOut(**q) for q in questions],
    )


@router.post("/test/sessions/{session_id}/submit", response_model=TestResultOut)
def submit_test(
    session_id: int,
    body: TestSubmitIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(TestSession)
        .filter(TestSession.id == session_id, TestSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.score > 0:
        raise HTTPException(status_code=400, detail="Already submitted")

    correct_map = {q["id"]: q for q in session.questions}

    score = 0
    feedback = []
    for ans in body.answers:
        q_data = correct_map.get(ans.id)
        if not q_data:
            continue
        is_correct = ans.chosen.strip().lower() == q_data["correct_answer"].strip().lower()
        if is_correct:
            score += 1
        feedback.append(TestFeedbackItem(
            id=ans.id,
            type=q_data["type"],
            question=q_data["question"],
            your_answer=ans.chosen,
            correct_answer=q_data["correct_answer"],
            correct=is_correct,
        ))

    total = len(body.answers)
    accuracy = round(score / total * 100) if total > 0 else 0

    session.score = score
    session.total_questions = total
    db.commit()

    return TestResultOut(score=score, total=total, accuracy=accuracy, feedback=feedback)
