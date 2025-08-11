from pydantic import BaseModel, field_validator
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID

from app.schemas.users import UserBasic

class CommentBase(BaseModel):
    content: str
    parent_comment_id: Optional[str] = None


class CommentCreate(CommentBase):
    entry_id: str


class CommentUpdate(BaseModel):
    content: Optional[str] = None


class CommentResponse(CommentBase):
    id: UUID
    entry_id: UUID
    user_id: UUID
    is_edited: bool
    edit_history: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommentWithUser(CommentResponse):
    user: UserBasic

    class Config:
        from_attributes = True
    
    @field_validator('user', mode='before')
    @classmethod
    def validate_user(cls, v):
        # If it's already a UserBasic instance or dict, return as-is
        if isinstance(v, (dict, UserBasic)):
            return v
        # If it's a SQLAlchemy User model, convert it to dict
        if hasattr(v, 'id') and hasattr(v, 'username'):
            return {
                'id': v.id,
                'username': v.username
            }
        return v
