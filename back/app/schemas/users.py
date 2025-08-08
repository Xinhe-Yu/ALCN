from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    VERIFIED_TRANSLATOR = "verified_translator"
    CONTRIBUTOR = "contributor"


class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.CONTRIBUTOR


class UserCreate(UserBase):
    userdata: Optional[Dict[str, Any]] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_activated: Optional[bool] = None
    userdata: Optional[Dict[str, Any]] = None


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    is_activated: bool
    userdata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
