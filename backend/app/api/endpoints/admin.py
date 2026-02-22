from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.db_setup import get_db
from app.api.models import User
from app.api.schemas import UserOut, UserRoleUpdate
from app.api.security import require_admin
from datetime import datetime, timedelta
from sqlalchemy import func

from app.api.models import LookupCache
from app.api.settings import settings

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    users = db.execute(select(User).order_by(User.id.asc())).scalars().all()
    return users


@router.patch("/users/{user_id}/role", response_model=UserOut)
def set_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.execute(select(User).where(User.id == user_id)).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Optional safety: prevent admin from demoting themselves
    if user.id == admin.id and payload.is_admin is False:
        raise HTTPException(status_code=400, detail="You cannot demote yourself")

    user.is_admin = payload.is_admin
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.execute(select(User).where(User.id == user_id)).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Optional safety: prevent deleting yourself
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete yourself")

    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/admin/cache-stats")
def cache_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    ttl_delta = timedelta(minutes=settings.LOOKUP_CACHE_TTL_MINUTES)
    now = datetime.utcnow()

    total = db.query(func.count(LookupCache.id)).scalar()

    oldest = db.query(func.min(LookupCache.updated_at)).scalar()
    newest = db.query(func.max(LookupCache.updated_at)).scalar()

    rows = db.query(LookupCache.updated_at).all()

    fresh = 0
    expired = 0

    for (updated_at,) in rows:
        if (now - updated_at) <= ttl_delta:
            fresh += 1
        else:
            expired += 1

    return {
        "total_entries": total,
        "fresh_entries": fresh,
        "expired_entries": expired,
        "oldest_entry": oldest,
        "newest_entry": newest,
        "ttl_minutes": settings.LOOKUP_CACHE_TTL_MINUTES,
    }