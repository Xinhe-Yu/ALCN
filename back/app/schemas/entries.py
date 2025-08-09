from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum
from uuid import UUID

class EntryType(str, Enum):
    TERM = "term"
    PERSONAL_NAME = "personal_name"
    PLACE_NAME = "place_name"
    ARTWORK_TITLE = "artwork_title"
    CONCEPT = "concept"


class EntryBase(BaseModel):
    primary_name: str
    original_script: Optional[str] = None
    language_code: str
    entry_type: Optional[EntryType] = None
    alternative_names: Optional[List[str]] = None
    other_language_codes: Optional[List[str]] = None
    etymology: Optional[str] = None
    definition: Optional[str] = None
    historical_context: Optional[str] = None


class EntryCreate(EntryBase):
    pass


class EntryUpdate(BaseModel):
    primary_name: Optional[str] = None
    original_script: Optional[str] = None
    language_code: Optional[str] = None
    entry_type: Optional[EntryType] = None
    alternative_names: Optional[List[str]] = None
    other_language_codes: Optional[List[str]] = None
    etymology: Optional[str] = None
    definition: Optional[str] = None
    historical_context: Optional[str] = None
    verification_notes: Optional[str] = None


class EntryResponse(EntryBase):
    id: UUID
    created_by: UUID
    updated_by: UUID
    is_verified: bool
    verification_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


from app.schemas.translations import TranslationResponse, TranslationWithUserVote
from app.schemas.comments import CommentResponse

class EntryWithTranslations(EntryResponse):
    translations: List[TranslationResponse] = []

    class Config:
        from_attributes = True


class EntryWithTranslationsAndVotes(EntryResponse):
    """Entry with translations including user vote information"""
    translations: List[TranslationWithUserVote] = []

    class Config:
        from_attributes = True


# Metadata schemas
class TranslationWithComment(TranslationResponse):
    """Translation with its newest comment"""
    newest_comment: Optional[CommentResponse] = None

    class Config:
        from_attributes = True


class EntryMetadata(BaseModel):
    """Comprehensive metadata about entries and activity"""
    total_entries: int
    newest_updated_entries: List[EntryResponse]
    entries_with_newest_translations: List[EntryWithTranslations]
    translations_with_newest_comments: List[TranslationWithComment]

    class Config:
        from_attributes = True
