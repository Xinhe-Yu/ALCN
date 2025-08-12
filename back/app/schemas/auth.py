from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID


class LoginRequest(BaseModel):
    email: EmailStr


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    role: str
    is_activated: bool
    username: str

    class Config:
        from_attributes = True
