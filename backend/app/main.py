from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints.general import router as general_router
from app.api.endpoints.lookup import router as lookup_router

app = FastAPI(title="SpråkKollen API", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routes under /api
app.include_router(general_router, prefix="/api")
app.include_router(lookup_router, prefix="/api")


