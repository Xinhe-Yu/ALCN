from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.crud import entries as crud_entries
from app.crud import translation_votes as crud_votes
from app.schemas.entries import (
    EntryCreate, EntryUpdate, EntryResponse, EntryWithTranslations, EntryWithTranslationsAndVotes,
    EntryMetadata, PaginatedEntries, EntryWithComment, BulkEntryUpdateRequest
)
from app.schemas.translations import TranslationResponse
from app.schemas.comments import CommentResponse, CommentWithUser
from app.schemas.auth import UserResponse
from app.api.endpoints.auth import get_current_user, get_current_admin_user
from app.core.security import verify_token
from app.crud import users as crud_users

router = APIRouter()
security = HTTPBearer(auto_error=False)

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[UserResponse]:
    """
    Get current user from token if provided, otherwise return None.
    """
    if not credentials:
        return None

    try:
        token = credentials.credentials
        user_id = verify_token(token)

        if not user_id:
            return None

        user = crud_users.get_user(db, user_id=user_id)
        if not user:
            return None

        return UserResponse.model_validate(user)
    except:
        return None


@router.get("/", response_model=PaginatedEntries)
async def list_entries(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Full-text search"),
    fuzzy_search: Optional[str] = Query(
        None, description="Fuzzy search using trigrams"
    ),
    language_code: Optional[str] = Query(
        None, description="Filter by primary language"
    ),
    other_language_code: Optional[str] = Query(
        None, description="Filter by other language codes"
    ),
    entry_type: Optional[str] = Query(None, description="Filter by entry type"),
    include_translations: bool = Query(True, description="Include translations in response"),
    sorted_by: Optional[str] = Query(None, description="Sort by field"),
    sort_direction: Optional[str] = Query("asc", description="Sort direction: 'asc' or 'desc'"),
    db: Session = Depends(get_db)
):
    """
    List entries with optional filtering and search.
    Supports both full-text search and fuzzy trigram search.
    Can filter by primary language_code or other_language_codes.
    """
    result = crud_entries.get_entries(
        db,
        skip=skip,
        limit=limit,
        search=search,
        fuzzy_search=fuzzy_search,
        language_code=language_code,
        other_language_code=other_language_code,
        entry_type=entry_type,
        sorted_by=sorted_by,
        sort_direction=sort_direction,
        include_translations=include_translations
    )

    if include_translations:
        result["items"] = [EntryWithTranslations.model_validate(entry) for entry in result["items"]]
    else:
        result["items"] = [EntryResponse.model_validate(entry) for entry in result["items"]]

    return result

def _map_entry_with_comment(entry) -> EntryWithComment:
    """
    Helper function to map Entry model with dynamic comment to EntryWithComment schema.
    """
    # Convert entry to dict first
    entry_data = {
        'id': entry.id,
        'primary_name': entry.primary_name,
        'original_script': entry.original_script,
        'language_code': entry.language_code,
        'entry_type': entry.entry_type,
        'alternative_names': entry.alternative_names,
        'other_language_codes': entry.other_language_codes,
        'etymology': entry.etymology,
        'definition': entry.definition,
        'historical_context': entry.historical_context,
        'created_by': entry.created_by,
        'updated_by': entry.updated_by,
        'is_verified': entry.is_verified,
        'verification_notes': entry.verification_notes,
        'created_at': entry.created_at,
        'updated_at': entry.updated_at,
        'newest_comment': CommentWithUser.model_validate(entry.newest_comment) if hasattr(entry, 'newest_comment') and entry.newest_comment else None
    }
    return EntryWithComment.model_validate(entry_data)


@router.get("/metadata", response_model=EntryMetadata)
async def get_entries_metadata(db: Session = Depends(get_db)):
    """
    Get comprehensive metadata about entries including:
    - Total number of entries
    - 20 newest updated entries
    - 20 entries with newest updated translations
    - 20 translations with newest comments

    This endpoint provides overview data useful for dashboards and activity feeds.
    """
    metadata = crud_entries.get_entries_metadata(db)

    # Convert the raw data to proper schema models
    processed_metadata = EntryMetadata(
        total_entries=metadata['total_entries'],
        recently_updated_count=metadata['recently_updated_count'],
        newest_updated_entries=[
            EntryWithTranslations.model_validate(entry)
            for entry in metadata['newest_updated_entries']
        ],
        entries_with_newest_translations=[
            EntryWithTranslations.model_validate(entry)
            for entry in metadata['entries_with_newest_translations']
        ],
        entries_with_newest_comments=[
            _map_entry_with_comment(entry)
            for entry in metadata['entries_with_newest_comments']
        ]
    )

    return processed_metadata


@router.get("/{entry_id}")
async def get_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[UserResponse] = Depends(get_current_user_optional)
):
    """
    Get entry by ID.
    """
    # if include_translations:
    entry = crud_entries.get_entry_with_translations(db, entry_id=entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found"
        )

    if current_user:
        # Enrich translations with user vote data
        enriched_translations = crud_votes.enrich_translations_with_user_votes(
            entry.translations, current_user.id, db
        )
        # Create entry with enriched translations
        entry_dict = {
            'id': entry.id,
            'primary_name': entry.primary_name,
            'original_script': entry.original_script,
            'language_code': entry.language_code,
            'entry_type': entry.entry_type,
            'alternative_names': entry.alternative_names,
            'other_language_codes': entry.other_language_codes,
            'etymology': entry.etymology,
            'definition': entry.definition,
            'historical_context': entry.historical_context,
            'created_by': entry.created_by,
            'updated_by': entry.updated_by,
            'is_verified': entry.is_verified,
            'verification_notes': entry.verification_notes,
            'created_at': entry.created_at,
            'updated_at': entry.updated_at,
            'translations': enriched_translations
        }
        return EntryWithTranslationsAndVotes(**entry_dict)
    else:
        return EntryWithTranslations.model_validate(entry)
    # else:
    #     entry = crud_entries.get_entry(db, entry_id=entry_id)
    #     if not entry:
    #         raise HTTPException(
    #             status_code=status.HTTP_404_NOT_FOUND,
    #             detail="Entry not found"
    #         )
    #     return EntryResponse.model_validate(entry)


@router.post("/", response_model=EntryResponse)
async def create_entry(
    entry: EntryCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Create new entry.
    """
    created_entry = crud_entries.create_entry(
        db, entry=entry, user_id=current_user.id
    )
    return EntryResponse.model_validate(created_entry)

@router.put("/bulk", response_model=List[EntryResponse])
async def bulk_update_entries(
    payload: BulkEntryUpdateRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Bulk update entries' language_code or entry_type.
    Admin or verified translator only.
    """
    if not payload.entry_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No entry IDs provided."
        )

    updated_entries = crud_entries.bulk_update_entries(
        db=db,
        entry_ids=payload.entry_ids,
        updates=payload.updates,
        verify_user_id=None if current_user.role in ["admin", "verified_translator"] else current_user.id
    )

    if not updated_entries:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No matching entries found."
        )

    return [EntryResponse.model_validate(entry) for entry in updated_entries]


@router.put("/{entry_id}", response_model=EntryResponse)
async def update_entry(
    entry_id: str,
    entry_update: EntryUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update entry. Only creator or admins can update.
    """
    existing_entry = crud_entries.get_entry(db, entry_id=entry_id)
    if not existing_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found"
        )

    # Check permissions
    if (str(existing_entry.created_by) != current_user.id and
        current_user.role not in ["admin", "verified_translator"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    updated_entry = crud_entries.update_entry(
        db, entry_id=entry_id, entry_update=entry_update, user_id=current_user.id
    )
    return EntryResponse.model_validate(updated_entry)


@router.delete("/{entry_id}")
async def delete_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Delete entry. Only creator or admins can delete.
    """
    existing_entry = crud_entries.get_entry(db, entry_id=entry_id)
    if not existing_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found"
        )

    # Check permissions
    if (str(existing_entry.created_by) != current_user.id and
        current_user.role != "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    success = crud_entries.delete_entry(db, entry_id=entry_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found"
        )

    return {"message": "Entry deleted successfully"}


@router.post("/{entry_id}/verify", response_model=EntryResponse)
async def verify_entry(
    entry_id: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin_user)
):
    """
    Verify entry. Admin or verified translator only.
    """
    verified_entry = crud_entries.verify_entry(
        db, entry_id=entry_id, user_id=current_user.id, notes=notes
    )
    if not verified_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found"
        )

    return EntryResponse.model_validate(verified_entry)
