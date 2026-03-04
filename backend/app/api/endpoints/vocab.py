from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import VocabularyWord, User
from app.api.schemas import VocabCreate, VocabUpdate, VocabOut
from app.api.security import get_current_user

router = APIRouter(prefix="/vocab", tags=["vocab"])

@router.get("", response_model=list[VocabOut])
def list_vocab(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(VocabularyWord)
        .filter(VocabularyWord.user_id == user.id)
        .order_by(VocabularyWord.created_at.desc(), VocabularyWord.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

@router.post("", response_model=VocabOut, status_code=status.HTTP_201_CREATED)
def create_vocab(
    payload: VocabCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    word = payload.word.strip().lower()
    if not word:
        raise HTTPException(status_code=422, detail="word is required")

    row = VocabularyWord(
        user_id=user.id,
        word=word,
        article=payload.article,
        source=payload.source,
    )

    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # This catches uq_vocab_user_word (user_id + word)
        raise HTTPException(status_code=409, detail="Word already exists")
    db.refresh(row)
    return row

@router.put("/{id}", response_model=VocabOut)
def update_vocab(
    id: int,
    payload: VocabUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = (
        db.query(VocabularyWord)
        .filter(VocabularyWord.id == id, VocabularyWord.user_id == user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Not found")

    if payload.word is not None:
        word = payload.word.strip().lower()
        if not word:
            raise HTTPException(status_code=422, detail="word is required")
        row.word = word

    if payload.article is not None:
        row.article = payload.article

    if payload.source is not None:
        row.source = payload.source

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Word already exists")
    db.refresh(row)
    return row

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vocab(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = (
        db.query(VocabularyWord)
        .filter(VocabularyWord.id == id, VocabularyWord.user_id == user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Not found")

    db.delete(row)
    db.commit()
    return None

