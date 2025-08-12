from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.models.models import User, VerificationCode, Entry, Translation, Source
from app.schemas.users import UserCreate, UserUpdate
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid


def get_user(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: UserCreate) -> User:
    db_user = User(
        id=uuid.uuid4(),
        email=user.email,
        role=user.role,
        userdata=user.userdata
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: str, user_update: UserUpdate) -> Optional[User]:
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None

    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user


def activate_user(db: Session, user_id: str) -> Optional[User]:
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None

    db_user.is_activated = True
    db.commit()
    db.refresh(db_user)
    return db_user


def create_verification_code(
    db: Session, user_id: str, code: str, expires_minutes: int = 15
) -> VerificationCode:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)

    db_code = VerificationCode(
        id=uuid.uuid4(),
        user_id=user_id,
        code=code,
        expires_at=expires_at
    )
    db.add(db_code)
    db.commit()
    db.refresh(db_code)
    return db_code


def get_valid_verification_code(
    db: Session, user_id: str, code: str
) -> Optional[VerificationCode]:
    now = datetime.now(timezone.utc)
    return db.query(VerificationCode).filter(
        and_(
            VerificationCode.user_id == user_id,
            VerificationCode.code == code,
            VerificationCode.used_at.is_(None),
            VerificationCode.expires_at > now
        )
    ).first()


def mark_verification_code_used(
    db: Session, verification_code: VerificationCode
) -> VerificationCode:
    verification_code.used_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(verification_code)
    return verification_code


def cleanup_expired_codes(db: Session) -> int:
    now = datetime.now(timezone.utc)
    result = db.query(VerificationCode).filter(
        VerificationCode.expires_at <= now
    ).delete()
    db.commit()
    return result


def get_user_metadata(db: Session, user_id: str) -> Dict[str, Any]:
    """
    Get comprehensive metadata about a user including:
    1. Number of entries created
    2. Number of entries updated
    3. Number of translations created
    4. Number of translations updated
    5. Books they translated (from sources.translator_id)
    6. Recent activity statistics
    """
    
    # Count entries created by user
    entries_created = db.query(Entry).filter(Entry.created_by == user_id).count()
    
    # Count entries updated by user (but not created by them)
    entries_updated = db.query(Entry).filter(
        and_(Entry.updated_by == user_id, Entry.created_by != user_id)
    ).count()
    
    # Count translations created by user
    translations_created = db.query(Translation).filter(
        Translation.created_by == user_id
    ).count()
    
    # Count translations updated by user (but not created by them)
    translations_updated = db.query(Translation).filter(
        and_(Translation.updated_by == user_id, Translation.created_by != user_id)
    ).count()
    
    # Get books/sources the user has translated
    translated_books_query = db.query(Source).filter(
        Source.translator_id == user_id
    ).all()
    
    # Convert to dictionaries for serialization
    translated_books = [
        {
            'id': str(book.id),
            'title': book.title,
            'author': book.author,
            'publisher': book.publisher,
            'publication_year': book.publication_year,
            'language_code': book.language_code,
            'isbn': book.isbn,
            'description': book.description,
            'created_at': book.created_at.isoformat(),
            'updated_at': book.updated_at.isoformat()
        } for book in translated_books_query
    ]
    
    # Recent activity (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    recent_entries_created = db.query(Entry).filter(
        and_(Entry.created_by == user_id, Entry.created_at >= thirty_days_ago)
    ).count()
    
    recent_translations_created = db.query(Translation).filter(
        and_(Translation.created_by == user_id, Translation.created_at >= thirty_days_ago)
    ).count()
    
    # Get user's most recent entries and translations
    recent_entries_query = db.query(Entry).filter(
        Entry.created_by == user_id
    ).order_by(Entry.created_at.desc()).limit(5).all()
    
    recent_translations_query = db.query(Translation).filter(
        Translation.created_by == user_id
    ).order_by(Translation.created_at.desc()).limit(5).all()
    
    # Convert to dictionaries for serialization
    recent_entries = [
        {
            'id': str(entry.id),
            'primary_name': entry.primary_name,
            'language_code': entry.language_code,
            'entry_type': entry.entry_type,
            'created_at': entry.created_at.isoformat(),
            'updated_at': entry.updated_at.isoformat()
        } for entry in recent_entries_query
    ]
    
    recent_translations = [
        {
            'id': str(translation.id),
            'translated_name': translation.translated_name,
            'entry_id': str(translation.entry_id),
            'created_at': translation.created_at.isoformat(),
            'updated_at': translation.updated_at.isoformat()
        } for translation in recent_translations_query
    ]
    
    return {
        'entries_created': entries_created,
        'entries_updated': entries_updated,
        'translations_created': translations_created,
        'translations_updated': translations_updated,
        'translated_books': translated_books,
        'recent_activity': {
            'entries_created_last_30_days': recent_entries_created,
            'translations_created_last_30_days': recent_translations_created,
        },
        'recent_entries': recent_entries,
        'recent_translations': recent_translations
    }
