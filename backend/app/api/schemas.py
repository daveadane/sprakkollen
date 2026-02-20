from pydantic import BaseModel, EmailStr, Field
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
    password: str = Field(..., min_length=6)
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
