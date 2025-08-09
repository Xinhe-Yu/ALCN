from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID

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
