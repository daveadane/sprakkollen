import secrets
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import select

_VALID_LEVELS = {"beginner", "intermediate", "advanced"}

class UpdateLevelIn(BaseModel):
    level: str

class ForgotPasswordIn(BaseModel):
    email: EmailStr

class ResetPasswordIn(BaseModel):
    new_password: str = Field(min_length=6, max_length=72)
    token: str

from app.api.db_setup import get_db
from app.api.models import User, Token, PasswordResetToken, EmailVerificationToken
from app.api.schemas import RegisterIn, TokenOut
from app.api.email import send_welcome_email, send_password_reset_email, send_verification_email
from app.api.security import (
    create_database_token,
    get_current_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


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

    # Create email verification token
    verification_token = secrets.token_urlsafe(32)
    db.add(EmailVerificationToken(
        user_id=new_user.id,
        token=verification_token,
        expires_at=datetime.utcnow() + timedelta(hours=24),
    ))
    db.commit()

    send_verification_email(new_user.email, new_user.first_name or "", verification_token)

    return {"id": new_user.id, "email": new_user.email}


@router.post("/token", response_model=TokenOut)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
) -> TokenOut:
    email = (form_data.username or "").strip().lower()

    user = db.execute(select(User).where(User.email == email)).scalars().first()
    if not user:
        raise HTTPException(status_code=400, detail="User does not exist")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before logging in. Check your inbox.")

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token_obj: Token = create_database_token(user_id=user.id, db=db)
    return TokenOut(access_token=token_obj.token, token_type="bearer")


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "is_admin": current_user.is_admin,
        "is_active": current_user.is_active,
        "level": current_user.level,
        "created_at": current_user.created_at,
    }


@router.patch("/me")
def update_me(
    payload: UpdateLevelIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.level not in _VALID_LEVELS:
        raise HTTPException(status_code=422, detail=f"level must be one of {sorted(_VALID_LEVELS)}")
    current_user.level = payload.level
    db.commit()
    return {"level": current_user.level}


@router.delete("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    current_token: Token = Depends(get_current_token),
    db: Session = Depends(get_db),
):
    db.delete(current_token)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordIn, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == payload.email.strip().lower())).scalars().first()
    # Always return 200 — never reveal whether email is registered (security)
    if not user or not user.is_active:
        return {"message": "If that email is registered, you will receive a reset link shortly."}

    # Invalidate any existing unused tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,
    ).update({"used": True})

    token = secrets.token_urlsafe(32)
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )
    db.add(reset_token)
    db.commit()

    send_password_reset_email(user.email, user.first_name or "", token)
    return {"message": "If that email is registered, you will receive a reset link shortly."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)):
    reset_token = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token == payload.token,
            PasswordResetToken.used == False,
        )
        .first()
    )

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")

    if reset_token.expires_at < datetime.utcnow():
        reset_token.used = True
        db.commit()
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    user.hashed_password = hash_password(payload.new_password)
    reset_token.used = True
    db.commit()

    return {"message": "Password reset successfully. You can now log in with your new password."}


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    record = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.token == token,
        EmailVerificationToken.used == False,
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link.")

    if record.expires_at < datetime.utcnow():
        record.used = True
        db.commit()
        raise HTTPException(status_code=400, detail="This verification link has expired. Please register again.")

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    user.is_verified = True
    record.used = True
    db.commit()

    return {"message": "Email verified successfully. You can now log in."}
