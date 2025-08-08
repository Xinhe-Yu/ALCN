from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.crud import entries as crud_entries
from app.schemas.entries import EntryCreate, EntryUpdate, EntryResponse
from app.schemas.auth import UserResponse
from app.api.endpoints.auth import get_current_user, get_current_admin_user

router = APIRouter()


@router.get("/", response_model=List[EntryResponse])
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
    db: Session = Depends(get_db)
):
    """
    List entries with optional filtering and search.
    Supports both full-text search and fuzzy trigram search.
    Can filter by primary language_code or other_language_codes.
    """
    entries = crud_entries.get_entries(
        db,
        skip=skip,
        limit=limit,
        search=search,
        fuzzy_search=fuzzy_search,
        language_code=language_code,
        other_language_code=other_language_code,
        entry_type=entry_type
    )
    return [EntryResponse.from_orm(entry) for entry in entries]


@router.get("/search/trigram", response_model=List[EntryResponse])
async def trigram_search_entries(
    q: str = Query(..., description="Search term for trigram similarity"),
    skip: int = 0,
    limit: int = 100,
    threshold: float = Query(
        0.3,
        description="Similarity threshold (0.0-1.0)",
        ge=0.0,
        le=1.0
    ),
    db: Session = Depends(get_db)
):
    """
    Search entries using trigram similarity on primary_name.
    Returns results ordered by similarity score (highest first).
    """
    entries = crud_entries.search_entries_trigram(
        db,
        search_term=q,
        skip=skip,
        limit=limit,
        similarity_threshold=threshold
    )
    return [EntryResponse.from_orm(entry) for entry in entries]


@router.get("/search/by-language/{language_code}", response_model=List[EntryResponse])
async def search_entries_by_any_language(
    language_code: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Search entries by language code in both primary language_code and
    other_language_codes. Useful for finding all entries associated with
    a specific language.
    """
    entries = crud_entries.search_entries_by_any_language(
        db, language_code=language_code, skip=skip, limit=limit
    )
    return [EntryResponse.from_orm(entry) for entry in entries]


@router.get("/{entry_id}", response_model=EntryResponse)
async def get_entry(entry_id: str, db: Session = Depends(get_db)):
    """
    Get entry by ID.
    """
    entry = crud_entries.get_entry(db, entry_id=entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found"
        )

    return EntryResponse.from_orm(entry)


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
    return EntryResponse.from_orm(created_entry)


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
    return EntryResponse.from_orm(updated_entry)


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

    return EntryResponse.from_orm(verified_entry)
