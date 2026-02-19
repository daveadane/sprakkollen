from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import User

bearer = HTTPBearer(auto_error=False)

def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if creds is None or not creds.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # TEMP: accept any token, attach to a demo user
    email = "demo@sprakkollen.local"

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, hashed_password="not-used")
        db.add(user)
        db.commit()
        db.refresh(user)

    return user

