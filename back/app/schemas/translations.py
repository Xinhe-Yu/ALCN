from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class VoteType(str, Enum):
    UP = "up"
    DOWN = "down"

class TranslationBase(BaseModel):
    language_code: str
    translated_name: str
    notes: Optional[str] = None
    source_id: Optional[UUID] = None
    is_preferred: bool = False


class TranslationCreate(TranslationBase):
    entry_id: UUID


class TranslationUpdate(BaseModel):
    language_code: Optional[str] = None
    translated_name: Optional[str] = None
    notes: Optional[str] = None
    source_id: Optional[UUID] = None
    is_preferred: Optional[bool] = None


class TranslationResponse(TranslationBase):
    id: UUID
    entry_id: UUID
    upvotes: int = 0
    downvotes: int = 0
    created_by: UUID
    updated_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Voting schemas
class VoteCreate(BaseModel):
    vote_type: VoteType


class VoteResponse(BaseModel):
    id: UUID
    translation_id: UUID
    user_id: UUID
    vote_type: VoteType
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TranslationWithUserVote(TranslationResponse):
    """Translation response that includes the current user's vote (if any)"""
    user_vote: Optional[VoteType] = None

    class Config:
        from_attributes = True
