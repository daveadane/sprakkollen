from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DB_URL: str = Field(..., alias="DB_URL")
    JWT_SECRET: str = Field("change-me", alias="JWT_SECRET")
    API_PREFIX: str = Field("/api", alias="API_PREFIX")
    CORS_ORIGINS: str = Field("http://localhost:5173", alias="CORS_ORIGINS")

    @property
    def cors_origins_list(self) -> list[str]:
        # Allow: "a,b,c" or a single value
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()


