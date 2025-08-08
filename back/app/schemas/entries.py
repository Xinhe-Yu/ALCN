from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


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
    entry_type: EntryType
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
    id: str
    created_by: str
    updated_by: str
    is_verified: bool
    verification_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
