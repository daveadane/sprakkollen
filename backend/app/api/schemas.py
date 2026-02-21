from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Literal, Optional

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
    id: int
    word: str
    article: Article
    source: Optional[str] = None

    class Config:
        from_attributes = True

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)  # bcrypt limit
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserOut(BaseModel):
    id: int
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_admin: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # pydantic v2

class UserRoleUpdate(BaseModel):
    is_admin: bool