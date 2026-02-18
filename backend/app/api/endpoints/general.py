from fastapi import APIRouter

router = APIRouter(tags=["general"])

@router.get("/")
def root():
    return {"message": "SpråkKollen API is running"}

@router.get("/health")
def health():
    return {"status": "ok"}


