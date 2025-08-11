from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.crud import entries as crud_entries
from app.models.models import Translation
from app.schemas.translations import (
    TranslationCreate,
    TranslationUpdate,
    TranslationResponse
)
from app.schemas.auth import UserResponse
from app.api.endpoints.auth import get_current_user
import uuid

router = APIRouter()


@router.get("/entry/{entry_id}", response_model=List[TranslationResponse])
async def get_entry_translations(entry_id: str, db: Session = Depends(get_db)):
    """
    Get all translations for an entry.
    """
    # Check if entry exists
    entry = crud_entries.get_entry(db, entry_id=entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found"
        )

    translations = db.query(Translation).filter(Translation.entry_id == entry_id).all()
    return [TranslationResponse.model_validate(translation) for translation in translations]


@router.post("/", response_model=TranslationResponse)
async def create_translation(
    translation: TranslationCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Create new translation.
    """
    # Check if entry exists
    entry = crud_entries.get_entry(db, entry_id=translation.entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found"
        )

    db_translation = Translation(
        id=uuid.uuid4(),
        entry_id=translation.entry_id,
        language_code=translation.language_code,
        translated_name=translation.translated_name,
        notes=translation.notes,
        source_id=translation.source_id,
        created_by=current_user.id,
        updated_by=current_user.id
    )

    try:
        db.add(db_translation)
        db.commit()
        db.refresh(db_translation)
    except Exception as e:
        db.rollback()
        if "unique constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Translation already exists for this entry and language"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error creating translation"
        )

    return TranslationResponse.model_validate(db_translation)


@router.put("/{translation_id}", response_model=TranslationResponse)
async def update_translation(
    translation_id: str,
    translation_update: TranslationUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update translation. Only creator or admins can update.
    """
    db_translation = db.query(Translation).filter(
        Translation.id == translation_id
    ).first()
    if not db_translation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Translation not found"
        )

    # Check permissions
    if (str(db_translation.created_by) != current_user.id and
        current_user.role not in ["admin", "verified_translator"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    update_data = translation_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_translation, field, value)

    db_translation.updated_by = current_user.id

    try:
        db.commit()
        db.refresh(db_translation)
    except Exception as e:
        db.rollback()
        if "unique constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Translation already exists for this entry and language"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error updating translation"
        )

    return TranslationResponse.model_validate(db_translation)


@router.delete("/{translation_id}")
async def delete_translation(
    translation_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Delete translation. Only creator or admins can delete.
    """
    db_translation = db.query(Translation).filter(
        Translation.id == translation_id
    ).first()
    if not db_translation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Translation not found"
        )

    # Check permissions
    if (db_translation.created_by != current_user.id and
        current_user.role != "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    db.delete(db_translation)
    db.commit()

    return {"message": "Translation deleted successfully"}
