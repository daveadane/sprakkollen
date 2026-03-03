# app/api/endpoints/auth.py

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import User, Token
from app.api.schemas import RegisterIn, TokenOut
from app.api.security import (
    create_database_token,
    get_current_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# -------------------------
# REGISTER
# -------------------------
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()

    new_user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        first_name=(payload.first_name.strip() if payload.first_name else None),
        last_name=(payload.last_name.strip() if payload.last_name else None),
        is_active=True,
        is_admin=False,
    )

    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")

    db.refresh(new_user)
    return {"id": new_user.id, "email": new_user.email}


# -------------------------
# LOGIN (ACCESS TOKEN ONLY)
# -------------------------
@router.post("/token", response_model=TokenOut)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
) -> TokenOut:

    email = (form_data.username or "").strip().lower()

    user = db.execute(select(User).where(User.email == email)).scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not exist",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_obj: Token = create_database_token(user_id=user.id, db=db)

    return TokenOut(
        access_token=token_obj.token,
        token_type="bearer",
    )


# -------------------------
# CURRENT USER
# -------------------------
@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "is_admin": current_user.is_admin,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
    }


# -------------------------
# LOGOUT (DELETE ACCESS TOKEN)
# -------------------------
@router.delete("/logout")
def logout(
    current_token: Token = Depends(get_current_token),
    db: Session = Depends(get_db),
):
    db.delete(current_token)
    db.commit()
    return {"message": "Logged out"}
