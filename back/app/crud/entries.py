from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import text, desc, asc, func
from app.models.models import Entry, Translation, Comment
from app.schemas.entries import EntryCreate, EntryUpdate
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
    include_translations: bool = False
) -> List[Entry]:
    query = db.query(Entry)
    
    if include_translations:
        query = query.options(
            joinedload(Entry.translations)
        )

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

    entries = query.offset(skip).limit(limit).all()
    
    # Post-process to ensure proper translation ordering if needed
    if include_translations:
        for entry in entries:
            # Re-order translations to ensure proper sorting
            if hasattr(entry, 'translations') and entry.translations:
                entry.translations = sorted(
                    entry.translations,
                    key=lambda t: (-t.is_preferred, t.created_at)
                )
    
    return entries


def search_entries_trigram(
    db: Session,
    search_term: str,
    skip: int = 0,
    limit: int = 100,
    similarity_threshold: float = 0.3,
    include_translations: bool = False
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
        if entry and include_translations:
            # Manually load and order translations
            entry.translations = db.query(Translation).filter(
                Translation.entry_id == entry.id
            ).order_by(
                desc(Translation.is_preferred), 
                asc(Translation.created_at)
            ).all()
        if entry:
            entries.append(entry)

    return entries


def search_entries_by_any_language(
    db: Session,
    language_code: str,
    skip: int = 0,
    limit: int = 100,
    include_translations: bool = False
) -> List[Entry]:
    """
    Search entries where the language_code matches either the primary language_code
    or is present in the other_language_codes array.
    """
    query = db.query(Entry)
    
    if include_translations:
        query = query.options(
            joinedload(Entry.translations)
        )
    
    query = query.filter(
        text(
            "language_code = :lang_code OR "
            "other_language_codes @> ARRAY[:lang_code]"
        )
    ).params(lang_code=language_code)

    entries = query.offset(skip).limit(limit).all()
    
    # Post-process to ensure proper translation ordering if needed
    if include_translations:
        for entry in entries:
            if hasattr(entry, 'translations') and entry.translations:
                entry.translations = sorted(
                    entry.translations,
                    key=lambda t: (-t.is_preferred, t.created_at)
                )
    
    return entries


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
    newest_updated_entries = db.query(Entry).order_by(
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
