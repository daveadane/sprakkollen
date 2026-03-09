from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import SwedishWord, WordSuggestion, User
from app.api.schemas import SuggestionCreate, SuggestionOut, SuggestionReview
from app.api.security import get_current_user

router = APIRouter(tags=["suggestions"])


def _require_admin(user: User):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")


# ── Any user: submit a suggestion ────────────────────────────────────────────
@router.post("/suggestions", response_model=SuggestionOut, status_code=status.HTTP_201_CREATED)
def create_suggestion(
    payload: SuggestionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    word = payload.word.strip().lower()
    if not word:
        raise HTTPException(status_code=422, detail="word is required")

    # Prevent duplicate pending suggestions from the same user
    existing = (
        db.query(WordSuggestion)
        .filter(
            WordSuggestion.user_id == user.id,
            WordSuggestion.word == word,
            WordSuggestion.status == "pending",
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You already have a pending suggestion for this word")

    suggestion = WordSuggestion(
        user_id=user.id,
        word=word,
        article=payload.article,
        suggestion_type=payload.suggestion_type,
        note=payload.note,
    )
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)
    return suggestion


# ── Admin: list all pending suggestions ──────────────────────────────────────
@router.get("/admin/suggestions", response_model=list[SuggestionOut])
def list_suggestions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_admin(user)
    suggestions = (
        db.query(WordSuggestion)
        .filter(WordSuggestion.status == "pending")
        .order_by(WordSuggestion.created_at.asc())
        .all()
    )
    user_ids = [s.user_id for s in suggestions]
    email_map = {
        u.id: u.email
        for u in db.query(User).filter(User.id.in_(user_ids)).all()
    }
    return [
        SuggestionOut(
            id=s.id,
            user_id=s.user_id,
            user_email=email_map.get(s.user_id),
            word=s.word,
            article=s.article,
            suggestion_type=s.suggestion_type,
            note=s.note,
            status=s.status,
            admin_note=s.admin_note,
            created_at=s.created_at,
        )
        for s in suggestions
    ]


# ── Admin: approve ────────────────────────────────────────────────────────────
@router.post("/admin/suggestions/{suggestion_id}/approve", response_model=SuggestionOut)
def approve_suggestion(
    suggestion_id: int,
    payload: SuggestionReview,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_admin(user)
    s = db.query(WordSuggestion).filter(WordSuggestion.id == suggestion_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    if s.suggestion_type == "add":
        # Add to SwedishWord if not already there
        exists = db.query(SwedishWord).filter(SwedishWord.word == s.word).first()
        if not exists:
            db.add(SwedishWord(
                word=s.word,
                article=s.article,
                confidence=0.75,
                examples=[
                    f"{s.article.capitalize()} {s.word}.",
                    f"Jag har {s.article} {s.word}.",
                    f"Det är {'ett' if s.article == 'ett' else 'en'} {'nytt' if s.article == 'ett' else 'ny'} {s.word}.",
                ],
            ))
        else:
            # Update article if already exists
            exists.article = s.article

    elif s.suggestion_type == "flag":
        # Update existing word's article
        sw = db.query(SwedishWord).filter(SwedishWord.word == s.word).first()
        if sw:
            sw.article = s.article

    s.status = "approved"
    s.admin_note = payload.admin_note
    db.commit()
    db.refresh(s)
    submitter = db.query(User).filter(User.id == s.user_id).first()
    return SuggestionOut(
        id=s.id, user_id=s.user_id, user_email=submitter.email if submitter else None,
        word=s.word, article=s.article, suggestion_type=s.suggestion_type,
        note=s.note, status=s.status, admin_note=s.admin_note, created_at=s.created_at,
    )


# ── Admin: reject ─────────────────────────────────────────────────────────────
@router.post("/admin/suggestions/{suggestion_id}/reject", response_model=SuggestionOut)
def reject_suggestion(
    suggestion_id: int,
    payload: SuggestionReview,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_admin(user)
    s = db.query(WordSuggestion).filter(WordSuggestion.id == suggestion_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    s.status = "rejected"
    s.admin_note = payload.admin_note
    db.commit()
    db.refresh(s)
    submitter = db.query(User).filter(User.id == s.user_id).first()
    return SuggestionOut(
        id=s.id, user_id=s.user_id, user_email=submitter.email if submitter else None,
        word=s.word, article=s.article, suggestion_type=s.suggestion_type,
        note=s.note, status=s.status, admin_note=s.admin_note, created_at=s.created_at,
    )
