from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.models import Entry
from app.schemas.entries import EntryCreate, EntryUpdate
from typing import Optional, List
import uuid


def get_entry(db: Session, entry_id: str) -> Optional[Entry]:
    return db.query(Entry).filter(Entry.id == entry_id).first()


def get_entries(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    language_code: Optional[str] = None,
    entry_type: Optional[str] = None,
    fuzzy_search: Optional[str] = None,
    other_language_code: Optional[str] = None
) -> List[Entry]:
    query = db.query(Entry)

    if search:
        # Use PostgreSQL full-text search
        query = query.filter(
            Entry.search_vector.op("@@")(text("plainto_tsquery(:search)"))
        ).params(search=search)

    if fuzzy_search:
        # Use trigram similarity search for fuzzy matching
        query = query.filter(
            text("similarity(primary_name, :fuzzy_search) > 0.3")
        ).params(fuzzy_search=fuzzy_search).order_by(
            text("similarity(primary_name, :fuzzy_search) DESC")
        ).params(fuzzy_search=fuzzy_search)

    if language_code:
        query = query.filter(Entry.language_code == language_code)

    if other_language_code:
        # Search in the other_language_codes array
        query = query.filter(
            text("other_language_codes @> ARRAY[:other_language_code]")
        ).params(other_language_code=other_language_code)

    if entry_type:
        query = query.filter(Entry.entry_type == entry_type)

    return query.offset(skip).limit(limit).all()


def search_entries_trigram(
    db: Session,
    search_term: str,
    skip: int = 0,
    limit: int = 100,
    similarity_threshold: float = 0.3
) -> List[Entry]:
    """
    Search entries using trigram similarity on primary_name.
    Returns results ordered by similarity score (highest first).
    """
    query = text("""
        SELECT *, similarity(primary_name, :search_term) as sim_score
        FROM entries
        WHERE similarity(primary_name, :search_term) > :threshold
        ORDER BY similarity(primary_name, :search_term) DESC
        LIMIT :limit OFFSET :skip
    """)

    result = db.execute(
        query,
        {
            "search_term": search_term,
            "threshold": similarity_threshold,
            "limit": limit,
            "skip": skip
        }
    )

    # Convert results to Entry objects
    entries = []
    for row in result:
        entry = db.query(Entry).filter(Entry.id == row[0]).first()
        if entry:
            entries.append(entry)

    return entries


def search_entries_by_any_language(
    db: Session,
    language_code: str,
    skip: int = 0,
    limit: int = 100
) -> List[Entry]:
    """
    Search entries where the language_code matches either the primary language_code
    or is present in the other_language_codes array.
    """
    query = db.query(Entry).filter(
        text(
            "language_code = :lang_code OR "
            "other_language_codes @> ARRAY[:lang_code]"
        )
    ).params(lang_code=language_code)

    return query.offset(skip).limit(limit).all()


def create_entry(db: Session, entry: EntryCreate, user_id: str) -> Entry:
    db_entry = Entry(
        id=uuid.uuid4(),
        primary_name=entry.primary_name,
        original_script=entry.original_script,
        language_code=entry.language_code,
        entry_type=entry.entry_type,
        alternative_names=entry.alternative_names,
        other_language_codes=entry.other_language_codes,
        etymology=entry.etymology,
        definition=entry.definition,
        historical_context=entry.historical_context,
        created_by=user_id,
        updated_by=user_id
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


def update_entry(
    db: Session, entry_id: str, entry_update: EntryUpdate, user_id: str
) -> Optional[Entry]:
    db_entry = db.query(Entry).filter(Entry.id == entry_id).first()
    if not db_entry:
        return None

    update_data = entry_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_entry, field, value)

    db_entry.updated_by = user_id
    db.commit()
    db.refresh(db_entry)
    return db_entry


def delete_entry(db: Session, entry_id: str) -> bool:
    db_entry = db.query(Entry).filter(Entry.id == entry_id).first()
    if not db_entry:
        return False

    db.delete(db_entry)
    db.commit()
    return True


def verify_entry(
    db: Session, entry_id: str, user_id: str, notes: Optional[str] = None
) -> Optional[Entry]:
    db_entry = db.query(Entry).filter(Entry.id == entry_id).first()
    if not db_entry:
        return None

    db_entry.is_verified = True
    db_entry.verification_notes = notes
    db_entry.updated_by = user_id
    db.commit()
    db.refresh(db_entry)
    return db_entry
