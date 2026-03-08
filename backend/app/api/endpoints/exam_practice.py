import random
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, desc, func

from app.api.db_setup import get_db
from app.api.models import ExamPracticeSession, ExamPassage, ExamQuestion
from app.api.security import get_current_user
from app.api.models import User

router = APIRouter(prefix="/exam-practice", tags=["exam-practice"])

# ---------------------------------------------------------------------------
# Hardcoded exam content (SVA1 and SVA3)
# All texts and questions are original, inspired by the Skolverket SVA format.
# ---------------------------------------------------------------------------

EXAMS = {
    "sva1": {
        "level": "sva1",
        "title": "SVA1 Mock Exam",
        "description": "Basic Swedish — daily life vocabulary, simple grammar, and reading comprehension.",
        "time_limit_minutes": 30,
        "reading_passage": (
            "Anna bor i Göteborg med sin familj. Hon har en man och två barn. "
            "Barnen heter Erik och Lisa. Erik är åtta år och Lisa är fem år. "
            "Anna arbetar på ett sjukhus som sjuksköterska. Hon börjar jobba klockan sju på morgonen. "
            "På eftermiddagen hämtar hon barnen på dagis och skola. "
            "På kvällen lagar hon mat och läser böcker med barnen. "
            "Familjen tycker om att gå på promenader i parken på helgerna."
        ),
        "questions": [
            # Reading comprehension (q1–q5)
            {
                "id": "q1",
                "section": "reading",
                "question": "Var bor Anna?",
                "choices": ["Stockholm", "Malmö", "Göteborg", "Uppsala"],
                "correct_answer": "Göteborg",
            },
            {
                "id": "q2",
                "section": "reading",
                "question": "Hur många barn har Anna?",
                "choices": ["Ett", "Två", "Tre", "Fyra"],
                "correct_answer": "Två",
            },
            {
                "id": "q3",
                "section": "reading",
                "question": "Vilket yrke har Anna?",
                "choices": ["Lärare", "Läkare", "Sjuksköterska", "Polis"],
                "correct_answer": "Sjuksköterska",
            },
            {
                "id": "q4",
                "section": "reading",
                "question": "Hur gammal är Erik?",
                "choices": ["Fem år", "Sex år", "Sju år", "Åtta år"],
                "correct_answer": "Åtta år",
            },
            {
                "id": "q5",
                "section": "reading",
                "question": "Vad gör familjen på helgerna?",
                "choices": [
                    "Tittar på TV",
                    "Går på promenader i parken",
                    "Åker till stranden",
                    "Spelar fotboll",
                ],
                "correct_answer": "Går på promenader i parken",
            },
            # Grammar (q6–q10)
            {
                "id": "q6",
                "section": "grammar",
                "question": "Välj rätt artikel: ___ bil är röd.",
                "choices": ["En", "Ett", "Den", "Det"],
                "correct_answer": "En",
            },
            {
                "id": "q7",
                "section": "grammar",
                "question": "Välj rätt form: Jag ___ i Stockholm.",
                "choices": ["bor", "borar", "boras", "bore"],
                "correct_answer": "bor",
            },
            {
                "id": "q8",
                "section": "grammar",
                "question": "Välj rätt artikel: ___ hus är stort.",
                "choices": ["En", "Ett", "Den", "Det"],
                "correct_answer": "Ett",
            },
            {
                "id": "q9",
                "section": "grammar",
                "question": "Välj rätt preposition: Jag går ___ skolan.",
                "choices": ["på", "till", "i", "av"],
                "correct_answer": "till",
            },
            {
                "id": "q10",
                "section": "grammar",
                "question": "Välj rätt form: Hon ___ kaffe varje morgon.",
                "choices": ["dricker", "drickar", "dricker sig", "dricks"],
                "correct_answer": "dricker",
            },
        ],
    },
    "sva3": {
        "level": "sva3",
        "title": "SVA3 Mock Exam",
        "description": "Advanced Swedish — work culture, complex grammar, and deeper reading comprehension.",
        "time_limit_minutes": 45,
        "reading_passage": (
            "Sverige är känt för sin starka arbetskultur som betonar balansen mellan arbetsliv och privatliv. "
            "Det svenska begreppet 'lagom' — ungefär 'lagom mycket' eller 'precis rätt' — genomsyrar många aspekter av det svenska samhället, "
            "inklusive hur man förhåller sig till arbete och fritid. "
            "Svenska arbetsplatser kännetecknas ofta av platta hierarkier, där anställda uppmuntras att delta aktivt i beslutsprocesser. "
            "Chefer förväntas lyssna på sina medarbetare snarare än att bara ge order. "
            "Friskvård och välmående på arbetsplatsen prioriteras högt, och många arbetsgivare erbjuder friskvårdsbidrag. "
            "Föräldraledigheten i Sverige är en av de mest generösa i världen — både mammor och pappor uppmuntras att ta ut ledighet. "
            "Detta bidrar till en mer jämställd fördelning av hemarbete och barnomsorg."
        ),
        "questions": [
            # Reading comprehension (q1–q5)
            {
                "id": "q1",
                "section": "reading",
                "question": "Vad betyder det svenska begreppet 'lagom' enligt texten?",
                "choices": [
                    "Mycket och gott",
                    "Ungefär 'precis rätt' eller 'lagom mycket'",
                    "Hårt arbete och disciplin",
                    "Frihet och oberoende",
                ],
                "correct_answer": "Ungefär 'precis rätt' eller 'lagom mycket'",
            },
            {
                "id": "q2",
                "section": "reading",
                "question": "Hur beskrivs hierarkin på svenska arbetsplatser?",
                "choices": [
                    "Mycket strikt och toppstyrd",
                    "Platt, med aktivt deltagande från anställda",
                    "Baserad på ålder och erfarenhet",
                    "Styrd av fackföreningar",
                ],
                "correct_answer": "Platt, med aktivt deltagande från anställda",
            },
            {
                "id": "q3",
                "section": "reading",
                "question": "Vad innebär 'friskvårdsbidrag' i texten?",
                "choices": [
                    "Bidrag till barnomsorgen",
                    "Ekonomiskt stöd för hälsa och välmående",
                    "Gratis sjukvård för alla anställda",
                    "Rabatt på gymkort för chefer",
                ],
                "correct_answer": "Ekonomiskt stöd för hälsa och välmående",
            },
            {
                "id": "q4",
                "section": "reading",
                "question": "Vad är huvudpoängen med den svenska föräldraledigheten enligt texten?",
                "choices": [
                    "Att mammor ska stanna hemma längre",
                    "Att bidra till en mer jämställd fördelning av hemarbete",
                    "Att minska antalet arbetslösa",
                    "Att öka födelsetalen i Sverige",
                ],
                "correct_answer": "Att bidra till en mer jämställd fördelning av hemarbete",
            },
            {
                "id": "q5",
                "section": "reading",
                "question": "Vilket ord i texten betyder ungefär 'genomtränger' eller 'präglar'?",
                "choices": ["betonar", "kännetecknas", "genomsyrar", "prioriteras"],
                "correct_answer": "genomsyrar",
            },
            # Grammar (q6–q10)
            {
                "id": "q6",
                "section": "grammar",
                "question": "Välj rätt form (konjunktiv/konditionalis): Om jag ___ mer tid, skulle jag resa mer.",
                "choices": ["har", "hade", "har haft", "skulle ha"],
                "correct_answer": "hade",
            },
            {
                "id": "q7",
                "section": "grammar",
                "question": "Välj rätt bisatsinledare: Jag vet inte ___ han kommer imorgon.",
                "choices": ["att", "om", "när", "vilket"],
                "correct_answer": "om",
            },
            {
                "id": "q8",
                "section": "grammar",
                "question": "Välj rätt form av adjektivet: Det är ___ viktigt att träna regelbundet.",
                "choices": ["mycket", "många", "mer", "mest"],
                "correct_answer": "mycket",
            },
            {
                "id": "q9",
                "section": "grammar",
                "question": "Välj rätt relativpronomen: Boken, ___ jag läste, var spännande.",
                "choices": ["som", "vilket", "vars", "vad"],
                "correct_answer": "som",
            },
            {
                "id": "q10",
                "section": "grammar",
                "question": "Välj rätt konstruktion (passiv): Rapporten ___ av chefen igår.",
                "choices": ["skrevs", "skrev", "skriver", "har skrivit"],
                "correct_answer": "skrevs",
            },
        ],
    },
}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ExamMetaOut(BaseModel):
    level: str
    title: str
    description: str
    time_limit_minutes: int
    question_count: int


class SubmitExamIn(BaseModel):
    level: str
    answers: dict  # { "q1": "chosen answer", ... }
    time_taken_seconds: Optional[int] = None


class ReviewItem(BaseModel):
    id: str
    section: str
    question: str
    correct_answer: str
    chosen: Optional[str]
    is_correct: bool


class SubmitExamOut(BaseModel):
    score: int
    total: int
    percentage: float
    passed: bool
    review: list[ReviewItem]


class HistoryItem(BaseModel):
    id: int
    exam_level: str
    score: int
    total_questions: int
    percentage: float
    time_taken_seconds: Optional[int]
    created_at: datetime


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/exams", response_model=list[ExamMetaOut])
def list_exams(_: User = Depends(get_current_user)):
    return [
        ExamMetaOut(
            level=e["level"],
            title=e["title"],
            description=e["description"],
            time_limit_minutes=e["time_limit_minutes"],
            question_count=len(e["questions"]),
        )
        for e in EXAMS.values()
    ]


@router.get("/exams/{level}")
def get_exam(level: str, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    level = level.lower()
    if level not in EXAMS:
        raise HTTPException(status_code=404, detail=f"Exam '{level}' not found. Valid levels: sva1, sva3")

    # Try to build exam from DB question bank
    passages = db.execute(
        select(ExamPassage).where(ExamPassage.level == level)
    ).scalars().all()

    grammar_qs = db.execute(
        select(ExamQuestion).where(
            ExamQuestion.level == level,
            ExamQuestion.section == "grammar",
        )
    ).scalars().all()

    if passages and len(grammar_qs) >= 5:
        # Pick a random passage and its reading questions
        passage = random.choice(passages)
        reading_qs = db.execute(
            select(ExamQuestion).where(ExamQuestion.passage_id == passage.id)
        ).scalars().all()

        # Pick 5 random grammar questions
        chosen_grammar = random.sample(list(grammar_qs), min(5, len(grammar_qs)))

        questions = []
        for i, q in enumerate(reading_qs[:5], 1):
            questions.append({
                "id": f"r{q.id}",
                "section": "reading",
                "question": q.question,
                "choices": q.choices,
                "correct_answer": q.correct_answer,
            })
        for i, q in enumerate(chosen_grammar, 1):
            questions.append({
                "id": f"g{q.id}",
                "section": "grammar",
                "question": q.question,
                "choices": q.choices,
                "correct_answer": q.correct_answer,
            })

        meta = EXAMS[level]
        return {
            "level": level,
            "title": meta["title"],
            "description": meta["description"],
            "time_limit_minutes": meta["time_limit_minutes"],
            "reading_passage": passage.text,
            "questions": questions,
        }

    # Fallback to hardcoded exam if DB is empty
    return EXAMS[level]


@router.post("/submit", response_model=SubmitExamOut)
def submit_exam(
    payload: SubmitExamIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = EXAMS.get(payload.level.lower())
    if not exam:
        raise HTTPException(status_code=404, detail=f"Exam '{payload.level}' not found.")

    questions = exam["questions"]
    score = 0
    review = []

    for q in questions:
        chosen = payload.answers.get(q["id"])
        is_correct = chosen == q["correct_answer"]
        if is_correct:
            score += 1
        review.append(
            ReviewItem(
                id=q["id"],
                section=q["section"],
                question=q["question"],
                correct_answer=q["correct_answer"],
                chosen=chosen,
                is_correct=is_correct,
            )
        )

    total = len(questions)
    percentage = round((score / total) * 100, 1) if total > 0 else 0.0

    session = ExamPracticeSession(
        user_id=current_user.id,
        exam_level=payload.level.lower(),
        score=score,
        total_questions=total,
        time_taken_seconds=payload.time_taken_seconds,
        answers=payload.answers,
    )
    db.add(session)
    db.commit()

    return SubmitExamOut(
        score=score,
        total=total,
        percentage=percentage,
        passed=percentage >= 60.0,
        review=review,
    )


@router.get("/history", response_model=list[HistoryItem])
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = db.execute(
        select(ExamPracticeSession)
        .where(ExamPracticeSession.user_id == current_user.id)
        .order_by(desc(ExamPracticeSession.created_at))
        .limit(10)
    ).scalars().all()

    return [
        HistoryItem(
            id=s.id,
            exam_level=s.exam_level,
            score=s.score,
            total_questions=s.total_questions,
            percentage=round((s.score / s.total_questions) * 100, 1) if s.total_questions else 0.0,
            time_taken_seconds=s.time_taken_seconds,
            created_at=s.created_at,
        )
        for s in sessions
    ]
