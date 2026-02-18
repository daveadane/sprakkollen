from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.settings import settings
from app.api.endpoints.general import router as general_router

app = FastAPI(title="Språkkollen API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Step 3 will introduce a central api_router; for Step 1/2 we can include directly:
app.include_router(general_router, prefix=settings.API_PREFIX, tags=["general"])

