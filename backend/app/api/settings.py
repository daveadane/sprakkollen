from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DB_URL: str = Field(..., alias="DB_URL")

    JWT_SECRET: str = Field("change-me", alias="JWT_SECRET")
    JWT_ALG: str = Field("HS256", alias="JWT_ALG")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_REFRESH_SECRET: str = Field("change-me-refresh", alias="JWT_REFRESH_SECRET")
    
    API_PREFIX: str = Field("/api", alias="API_PREFIX")
    CORS_ORIGINS: str = Field("http://localhost:5173", alias="CORS_ORIGINS")
    LOOKUP_CACHE_TTL_MINUTES: int = 1  # example: 60 minutes
    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

settings = Settings()
