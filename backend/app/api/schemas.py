from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Article = Literal["en", "ett"]


class VocabCreate(BaseModel):
    word: str = Field(..., min_length=1)
    article: Article
    source: Optional[str] = None


class VocabUpdate(BaseModel):
    word: Optional[str] = Field(None, min_length=1)
    article: Optional[Article] = None
    source: Optional[str] = None


class VocabOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    word: str
    article: Article
    source: Optional[str] = None


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)  # bcrypt/argon2 safety
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_admin: bool
    is_active: bool
    created_at: datetime


class UserRoleUpdate(BaseModel):
    is_admin: bool


class LookupOut(BaseModel):
    word: str
    article: Optional[str] = None
    confidence: Optional[float] = None
    source: str
    examples: List[str] = []


class SearchHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    word: str
    created_at: datetime

