from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.db_setup import engine, Base
from app.api import models  # IMPORTANT: ensures models are registered

from app.api.endpoints.general import router as general_router
from app.api.endpoints.lookup import router as lookup_router
from app.api.endpoints.admin import router as admin_router

app = FastAPI(title="SpråkKollen API", version="0.1")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# ✅ Auto-create tables (NO Alembic)
@app.on_event("startup")
def on_startup():
  Base.metadata.create_all(bind=engine)

app.include_router(general_router, prefix="/api")
app.include_router(lookup_router)
app.include_router(admin_router, prefix="/api")



