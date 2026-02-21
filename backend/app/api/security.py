import base64
from datetime import datetime, timedelta, UTC
from random import SystemRandom
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import User, Token
from app.api.settings import settings

# IMPORTANT: tokenUrl must match your login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

password_hash = PasswordHash.recommended()  # Argon2 recommended

DEFAULT_ENTROPY = 32
_sysrand = SystemRandom()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def _token_bytes(nbytes: int = DEFAULT_ENTROPY) -> bytes:
    return _sysrand.randbytes(nbytes)


def _token_urlsafe(nbytes: int = DEFAULT_ENTROPY) -> str:
    tok = _token_bytes(nbytes)
    return base64.urlsafe_b64encode(tok).rstrip(b"=").decode("ascii")


def create_database_token(user_id: int, db: Session) -> Token:
    token_str = _token_urlsafe()
    row = Token(token=token_str, user_id=user_id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def verify_token_access(token_str: str, db: Session) -> Token:
    max_age = timedelta(minutes=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES))

    # IMPORTANT: DB column is "timestamp without time zone" -> use naive UTC time
    cutoff = datetime.utcnow() - max_age

    token = (
        db.execute(
            select(Token).where(
                Token.token == token_str,
                Token.created_at >= cutoff,   # MUST be created_at (matches your DB)
            )
        )
        .scalars()
        .first()
    )

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db),
) -> User:
    token_row = verify_token_access(token_str=token, db=db)
    user = token_row.user
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive or missing user",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin only",
        )
    return user

def get_current_admin_user(
    user: User = Depends(get_current_user),
) -> User:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user

def get_current_token(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db),
) -> Token:
    return verify_token_access(token_str=token, db=db)