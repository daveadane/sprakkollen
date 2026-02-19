from app.main import app
from fastapi.middleware.cors import CORSMiddleware
from app.api.settings import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

