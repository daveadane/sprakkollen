from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints.vocab import router as vocab_router

from app.api.db_setup import engine, Base
from app.api import models  # IMPORTANT: ensures models are registered

from app.api.endpoints.general import router as general_router
from app.api.endpoints.lookup import router as lookup_router
from app.api.endpoints.admin import router as admin_router
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.history import router as history_router
from app.api.endpoints.practice import router as practice_router
from app.api.endpoints.grammar import router as grammar_router
from app.api.endpoints.progress import router as progress_router
from app.api.endpoints.reading import router as reading_router
from app.api.endpoints.suggestions import router as suggestions_router
from app.api.endpoints.test import router as test_router
from app.api.endpoints.dictation import router as dictation_router
from app.api.endpoints.images import router as images_router
from app.api.endpoints.image_quiz import router as image_quiz_router
from app.api.endpoints.ai_feedback import router as ai_feedback_router
from app.api.endpoints.speaking_challenge import router as speaking_challenge_router
from app.api.endpoints.podcasts import router as podcasts_router
from app.api.endpoints.book_reader import router as book_reader_router
from app.api.endpoints.exam_practice import router as exam_practice_router


app = FastAPI(title="SpråkKollen API", version="0.1")

from app.api.settings import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Auto-create tables (NO Alembic)
@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"WARNING: Could not create tables on startup: {e}")

app.include_router(general_router, prefix="/api")
app.include_router(lookup_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(vocab_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(history_router, prefix="/api")
app.include_router(practice_router, prefix="/api")
app.include_router(grammar_router, prefix="/api")
app.include_router(progress_router, prefix="/api")
app.include_router(reading_router, prefix="/api")
app.include_router(suggestions_router, prefix="/api")
app.include_router(test_router, prefix="/api")
app.include_router(dictation_router, prefix="/api")
app.include_router(images_router, prefix="/api")
app.include_router(image_quiz_router, prefix="/api")
app.include_router(ai_feedback_router, prefix="/api")
app.include_router(speaking_challenge_router, prefix="/api")
app.include_router(podcasts_router, prefix="/api")
app.include_router(book_reader_router, prefix="/api")
app.include_router(exam_practice_router, prefix="/api")


