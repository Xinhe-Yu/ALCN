from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text, desc, asc, func
from app.models.models import Entry, Translation, Comment
from app.schemas.entries import BulkEntryUpdates, EntryCreate, EntryUpdate, PaginatedEntries
from typing import Optional, List, Dict, Any
import uuid


def get_entry(db: Session, entry_id: str) -> Optional[Entry]:
    return db.query(Entry).filter(Entry.id == entry_id).first()


def get_entry_with_translations(db: Session, entry_id: str) -> Optional[Entry]:
    # Fetch entry and explicitly order translations
    entry = db.query(Entry).filter(Entry.id == entry_id).first()
    if entry:
        # Manually load and order translations to ensure proper sorting
        ordered_translations = db.query(Translation).filter(
            Translation.entry_id == entry_id
        ).order_by(
            desc(Translation.is_preferred),
            asc(Translation.created_at)
        ).all()

        # Replace the lazy-loaded translations with our ordered list
        entry.translations = ordered_translations

    return entry


def get_entries(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    language_code: Optional[str] = None,
    entry_type: Optional[str] = None,
    fuzzy_search: Optional[str] = None,
    other_language_code: Optional[str] = None,
    sorted_by: Optional[str] = None,
    sort_direction: Optional[str] = "asc",
    include_translations: bool = False
) -> PaginatedEntries:
    query = db.query(Entry)

    if include_translations:
        query = query.options(joinedload(Entry.translations))

    if search:
        query = query.filter(
            Entry.search_vector.op("@@")(text("plainto_tsquery(:search)"))
        ).params(search=search)

    if fuzzy_search:
        sim_score = func.similarity(Entry.primary_name, fuzzy_search)
        query = query.filter(sim_score > 0.3).order_by(sim_score.desc())

    if language_code:
        query = query.filter(Entry.language_code == language_code)

    if other_language_code:
        query = query.filter(
            text("other_language_codes @> ARRAY[:other_language_code]")
        ).params(other_language_code=other_language_code)

    allowed_sort_columns = {
        "primary_name": Entry.primary_name,
        "original_script": Entry.original_script,
        "language_code": Entry.language_code,
        "entry_type": Entry.entry_type,
        "is_verified": Entry.is_verified,
        "created_at": Entry.created_at,
        "updated_at": Entry.updated_at
    }

    if not fuzzy_search and sorted_by in allowed_sort_columns:
        sort_column = allowed_sort_columns[sorted_by]
        if sort_direction and sort_direction.lower() == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

    if entry_type:
        query = query.filter(Entry.entry_type == entry_type)

    total = query.count()

    entries = query.offset(skip).limit(limit).all()

    if include_translations:
        for entry in entries:
            if hasattr(entry, "translations") and entry.translations:
                # Ensure ordering: preferred first, then oldest
                entry.translations = sorted(
                    entry.translations,
                    key=lambda t: (-t.is_preferred, t.created_at)
                )

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "page": (skip // limit) + 1 if limit > 0 else 1,
        "pages": (total + limit - 1) // limit if limit > 0 else 1,
        "items": entries
    }


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

    update_data = entry_update.model_dump(exclude_unset=True)
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

    # Explicitly delete translations first to avoid foreign key constraint issues
    db.query(Translation).filter(Translation.entry_id == entry_id).delete(synchronize_session=False)

    # Delete the entry
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


def _get_translations_with_newest_comments(db: Session, limit: int = 20) -> List[Translation]:
    """
    Helper function to get translations with their newest comments efficiently.
    Returns Translation objects with a dynamic 'newest_comment' attribute.
    """
    # Get the most recent comments with their entry_ids
    recent_comments_query = db.query(
        Comment.entry_id,
        func.max(Comment.created_at).label('max_created_at')
    ).group_by(Comment.entry_id).subquery()

    # Get actual comment objects for the most recent comments
    newest_comments = db.query(Comment).join(
        recent_comments_query,
        (Comment.entry_id == recent_comments_query.c.entry_id) &
        (Comment.created_at == recent_comments_query.c.max_created_at)
    ).all()

    # Create a mapping of entry_id -> newest_comment
    entry_comment_map = {comment.entry_id: comment for comment in newest_comments}

    # Get translations for entries that have comments, ordered by comment recency
    translations_with_comments = db.query(Translation).filter(
        Translation.entry_id.in_(entry_comment_map.keys())
    ).order_by(
        desc(Translation.updated_at)
    ).limit(limit).all()

    # Attach the newest comment to each translation
    for translation in translations_with_comments:
        translation.newest_comment = entry_comment_map.get(translation.entry_id)

    return translations_with_comments


def get_entries_metadata(db: Session) -> Dict[str, Any]:
    """
    Get comprehensive metadata about entries including:
    1. Total number of entries
    2. 20 newest updated entries
    3. 20 entries with newest updated translations
    4. 20 translations with newest comments
    """

    # 1. Total number of entries
    total_entries = db.query(Entry).count()

    # 2. 20 newest updated entries
    newest_updated_entries = db.query(Entry).join(Translation).options(
        joinedload(Entry.translations)
    ).order_by(
        desc(Entry.updated_at)
    ).limit(20).all()

    # 3. 20 entries with newest updated translations
    # Find entries that have translations, ordered by the newest translation update
    entries_with_newest_translations = db.query(Entry).join(Translation).options(
        joinedload(Entry.translations)
    ).order_by(
        desc(Translation.updated_at)
    ).distinct().limit(20).all()

    # 4. 20 translations with newest comments
    enriched_translations = _get_translations_with_newest_comments(db, limit=20)

    return {
        'total_entries': total_entries,
        'newest_updated_entries': newest_updated_entries,
        'entries_with_newest_translations': entries_with_newest_translations,
        'translations_with_newest_comments': enriched_translations
    }

def bulk_update_entries(db: Session, entry_ids: List[int], updates: BulkEntryUpdates, verify_user_id: Optional[str]) -> List[Entry]:
    query = db.query(Entry).filter(Entry.id.in_(entry_ids))
    if verify_user_id is not None:
        query = query.filter(Entry.created_by == verify_user_id)

    entries_to_update = query.all()
    if not entries_to_update:
        return []

    for entry in entries_to_update:
        if updates.language_code is not None:
            entry.language_code = updates.language_code
        if updates.entry_type is not None or updates.entry_type is None:
            entry.entry_type = updates.entry_type
        if updates.is_verified is not None:
            entry.is_verified = updates.is_verified

    db.commit()
    return entries_to_update
