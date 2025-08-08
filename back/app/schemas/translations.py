from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TranslationBase(BaseModel):
    language_code: str
    translated_name: str
    notes: Optional[str] = None
    source_id: Optional[str] = None


class TranslationCreate(TranslationBase):
    entry_id: str


class TranslationUpdate(BaseModel):
    language_code: Optional[str] = None
    translated_name: Optional[str] = None
    notes: Optional[str] = None
    source_id: Optional[str] = None


class TranslationResponse(TranslationBase):
    id: str
    entry_id: str
    created_by: str
    updated_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
