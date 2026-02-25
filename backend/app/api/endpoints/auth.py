# app/api/endpoints/auth.py

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import User, Token, RefreshToken
from app.api.schemas import RegisterIn, TokenOut, RefreshIn
from app.api.security import (
    create_database_token,
    get_current_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.api.settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])


# -------------------------
# Refresh token helpers
# -------------------------
def _new_refresh_token() -> str:
    # URL-safe random token (raw token is returned to client)
    return secrets.token_urlsafe(48)


def _hash_refresh_token(raw_token: str) -> str:
    # Store ONLY the hash in DB (never store raw refresh token)
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _refresh_expires_at() -> datetime:
    days = int(getattr(settings, "REFRESH_TOKEN_EXPIRE_DAYS", 7))
    return datetime.utcnow() + timedelta(days=days)


# -------------------------
# Routes
# -------------------------
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    """
    Create a user with hashed password.
    Returns minimal user info (never return hashed_password).
    """
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


@router.post("/token", response_model=TokenOut)
def login(
    response: Response,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
) -> TokenOut:
    """
    OAuth2 login endpoint. Expects form fields:
      - username (email)
      - password

    Returns:
      - access_token: stored in DB (Token table)
      - refresh_token: stored hashed in DB (RefreshToken table)
    """
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
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1) Create access token (DB token)
    token_obj: Token = create_database_token(user_id=user.id, db=db)

    # 2) Create refresh token (raw for client, hash in DB)
    refresh_raw = _new_refresh_token()
    refresh_hash = _hash_refresh_token(refresh_raw)

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=_refresh_expires_at(),
            revoked_at=None,
        )
    )
    db.commit()
    response.set_cookie(
        key="sprakkollen_refresh",
        value=refresh_raw,
        httponly=True,
        secure=False,  # True in HTTPS prod
        samesite="lax",
        max_age=60 * 60 * 24 * settings.REFRESH_TOKEN_EXPIRE_DAYS,
        path="/",
)
    return TokenOut(
        access_token=token_obj.token,
        token_type="bearer",
    )


@router.post("/refresh", response_model=TokenOut)
def refresh_access_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenOut:

    raw = request.cookies.get("sprakkollen_refresh")
    if not raw:
        raise HTTPException(status_code=401, detail="Missing refresh cookie")

    token_hash = _hash_refresh_token(raw)

    row = (
        db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
        .scalars()
        .first()
    )

    if not row or row.revoked_at is not None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if row.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Refresh token expired")

    user = db.execute(select(User).where(User.id == row.user_id)).scalars().first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    # revoke old
    row.revoked_at = datetime.utcnow()

    # new refresh
    new_refresh_raw = _new_refresh_token()
    new_refresh_hash = _hash_refresh_token(new_refresh_raw)

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=new_refresh_hash,
            expires_at=_refresh_expires_at(),
            revoked_at=None,
        )
    )

    # new access
    new_access = create_database_token(user_id=user.id, db=db)
    db.commit()

    # rotate cookie
    response.set_cookie(
        key="sprakkollen_refresh",
        value=new_refresh_raw,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24 * settings.REFRESH_TOKEN_EXPIRE_DAYS,
    )

    return TokenOut(access_token=new_access.token, token_type="bearer")


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    """
    Return current logged-in user (based on Bearer token).
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "is_admin": current_user.is_admin,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
    }


@router.delete("/logout")
def logout(
    request: Request,
    response: Response,
    current_token: Token = Depends(get_current_token),
    db: Session = Depends(get_db),
):
    # 1) delete current access token (DB token)
    db.delete(current_token)

    # 2) revoke refresh token from cookie (if present)
    raw = request.cookies.get("sprakkollen_refresh")
    if raw:
        token_hash = _hash_refresh_token(raw)
        row = (
            db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
            .scalars()
            .first()
        )
        if row and row.revoked_at is None:
            row.revoked_at = datetime.utcnow()

    db.commit()

    # 3) clear cookie
    response.delete_cookie(
        key="sprakkollen_refresh",
        path="/",
        httponly=True,
        secure=False,   # True in HTTPS prod
        samesite="lax",
    )

    return {"message": "Logged out"}