from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    VERIFIED_TRANSLATOR = "verified_translator"
    CONTRIBUTOR = "contributor"


class EntryType(str, Enum):
    TERM = "term"
    PERSONAL_NAME = "personal_name"
    PLACE_NAME = "place_name"
    ARTWORK_TITLE = "artwork_title"
    CONCEPT = "concept"

class RelationshipType(str, Enum):
    SYNONYM = "synonym"
    ANTONYM = "antonym"
    RELATED = "related"
    VARIANT = "variant"
    SEE_ALSO = "see_also"
    BROADER_TERM = "broader_term"
    NARROWER_TERM = "narrower_term"
    CROSS_LANGUAGE_EQUIVALENT = "cross_language_equivalent"


# Base schemas
class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.CONTRIBUTOR


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_activated: Optional[bool] = None


class User(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_activated: bool
    created_at: datetime
    updated_at: datetime


class VerificationCodeCreate(BaseModel):
    code: str
    expires_at: datetime


class VerificationCode(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    code: str
    expires_at: datetime
    used_at: Optional[datetime] = None
    created_at: datetime


class SourceBase(BaseModel):
    title: str
    author: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    language_code: str
    isbn: Optional[str] = None
    description: Optional[str] = None


class SourceCreate(SourceBase):
    pass


class SourceUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    language_code: Optional[str] = None
    isbn: Optional[str] = None
    description: Optional[str] = None


class Source(SourceBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class EntryBase(BaseModel):
    primary_name: str
    language_code: str
    latinized_form: Optional[str] = None
    entry_type: EntryType
    original_script: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    definition: Optional[str] = None
    etymology: Optional[str] = None
    historical_context: Optional[str] = None


class EntryCreate(EntryBase):
    pass


class EntryUpdate(BaseModel):
    primary_name: Optional[str] = None
    language_code: Optional[str] = None
    latinized_form: Optional[str] = None
    entry_type: Optional[EntryType] = None
    original_script: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    definition: Optional[str] = None
    etymology: Optional[str] = None
    historical_context: Optional[str] = None
    is_verified: Optional[bool] = None
    verification_notes: Optional[str] = None


class Entry(EntryBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_by: UUID
    is_verified: bool
    verification_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class EntryWithTranslations(Entry):
    translations: List["Translation"] = []
    creator: User


class TranslationBase(BaseModel):
    language_code: str
    translated_name: str
    alternative_names: Optional[List[str]] = None
    notes: Optional[str] = None
    source_id: Optional[UUID] = None


class TranslationCreate(TranslationBase):
    entry_id: UUID


class TranslationUpdate(BaseModel):
    language_code: Optional[str] = None
    translated_name: Optional[str] = None
    alternative_names: Optional[List[str]] = None
    notes: Optional[str] = None
    source_id: Optional[UUID] = None


class Translation(TranslationBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    entry_id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class TranslationWithDetails(Translation):
    entry: Entry
    creator: User
    source: Optional[Source] = None


class CommentBase(BaseModel):
    content: str
    parent_comment_id: Optional[UUID] = None


class CommentCreate(CommentBase):
    entry_id: UUID


class CommentUpdate(BaseModel):
    content: Optional[str] = None


class Comment(CommentBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    entry_id: UUID
    user_id: UUID
    is_edited: bool
    created_at: datetime
    updated_at: datetime


class CommentWithDetails(Comment):
    user: User
    replies: List["Comment"] = []


class EntryRelationshipBase(BaseModel):
    target_entry_id: UUID
    relationship_type: RelationshipType
    notes: Optional[str] = None


class EntryRelationshipCreate(EntryRelationshipBase):
    source_entry_id: UUID


class EntryRelationship(EntryRelationshipBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_entry_id: UUID
    created_by: UUID
    created_at: datetime


class EntryRelationshipWithDetails(EntryRelationship):
    source_entry: Entry
    target_entry: Entry
    creator: User


# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[str] = None


class VerifyCode(BaseModel):
    email: EmailStr
    code: str


class RequestVerificationCode(BaseModel):
    email: EmailStr


# Search and pagination schemas
class SearchParams(BaseModel):
    query: Optional[str] = None
    entry_type: Optional[EntryType] = None
    category: Optional[str] = None
    language_code: Optional[str] = None
    is_verified: Optional[bool] = None
    skip: int = 0
    limit: int = 20


class PaginatedResponse(BaseModel):
    items: List[dict]
    total: int
    skip: int
    limit: int
    has_next: bool
    has_previous: bool


# Update forward references
CommentWithDetails.model_rebuild()
EntryWithTranslations.model_rebuild()
