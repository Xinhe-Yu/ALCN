from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.models import TranslationVote, Translation
from app.schemas.translations import VoteCreate, VoteType, TranslationWithUserVote
from typing import Optional, List, Dict
import uuid


def get_user_vote(db: Session, translation_id: str, user_id: str) -> Optional[TranslationVote]:
    """Get a user's vote for a specific translation"""
    return db.query(TranslationVote).filter(
        and_(
            TranslationVote.translation_id == translation_id,
            TranslationVote.user_id == user_id
        )
    ).first()


def create_or_update_vote(
    db: Session, 
    translation_id: str, 
    user_id: str, 
    vote: VoteCreate
) -> TranslationVote:
    """Create a new vote or update an existing vote"""
    # Check if user already voted on this translation
    existing_vote = get_user_vote(db, translation_id, user_id)
    
    if existing_vote:
        # Update existing vote
        old_vote_type = existing_vote.vote_type
        existing_vote.vote_type = vote.vote_type
        db.commit()
        db.refresh(existing_vote)
        
        # Update vote counts on translation
        update_vote_counts_after_change(db, translation_id, old_vote_type, vote.vote_type)
        
        return existing_vote
    else:
        # Create new vote
        db_vote = TranslationVote(
            id=uuid.uuid4(),
            translation_id=translation_id,
            user_id=user_id,
            vote_type=vote.vote_type
        )
        db.add(db_vote)
        db.commit()
        db.refresh(db_vote)
        
        # Update vote counts on translation
        update_vote_counts_after_new(db, translation_id, vote.vote_type)
        
        return db_vote


def delete_vote(db: Session, translation_id: str, user_id: str) -> bool:
    """Delete a user's vote"""
    existing_vote = get_user_vote(db, translation_id, user_id)
    if not existing_vote:
        return False
    
    vote_type = existing_vote.vote_type
    db.delete(existing_vote)
    db.commit()
    
    # Update vote counts on translation
    update_vote_counts_after_delete(db, translation_id, vote_type)
    
    return True


def update_vote_counts_after_new(db: Session, translation_id: str, vote_type: str):
    """Update vote counts after adding a new vote"""
    translation = db.query(Translation).filter(Translation.id == translation_id).first()
    if translation:
        if vote_type == VoteType.UP:
            translation.upvotes += 1
        elif vote_type == VoteType.DOWN:
            translation.downvotes += 1
        db.commit()


def update_vote_counts_after_change(db: Session, translation_id: str, old_vote_type: str, new_vote_type: str):
    """Update vote counts after changing a vote"""
    translation = db.query(Translation).filter(Translation.id == translation_id).first()
    if translation:
        # Remove old vote
        if old_vote_type == VoteType.UP:
            translation.upvotes = max(0, translation.upvotes - 1)
        elif old_vote_type == VoteType.DOWN:
            translation.downvotes = max(0, translation.downvotes - 1)
        
        # Add new vote
        if new_vote_type == VoteType.UP:
            translation.upvotes += 1
        elif new_vote_type == VoteType.DOWN:
            translation.downvotes += 1
        
        db.commit()


def update_vote_counts_after_delete(db: Session, translation_id: str, vote_type: str):
    """Update vote counts after deleting a vote"""
    translation = db.query(Translation).filter(Translation.id == translation_id).first()
    if translation:
        if vote_type == VoteType.UP:
            translation.upvotes = max(0, translation.upvotes - 1)
        elif vote_type == VoteType.DOWN:
            translation.downvotes = max(0, translation.downvotes - 1)
        db.commit()


def recalculate_vote_counts(db: Session, translation_id: str):
    """Recalculate vote counts from actual votes (for data integrity)"""
    upvotes = db.query(TranslationVote).filter(
        and_(
            TranslationVote.translation_id == translation_id,
            TranslationVote.vote_type == VoteType.UP
        )
    ).count()
    
    downvotes = db.query(TranslationVote).filter(
        and_(
            TranslationVote.translation_id == translation_id,
            TranslationVote.vote_type == VoteType.DOWN
        )
    ).count()
    
    translation = db.query(Translation).filter(Translation.id == translation_id).first()
    if translation:
        translation.upvotes = upvotes
        translation.downvotes = downvotes
        db.commit()
        
    return upvotes, downvotes


def get_user_votes_for_translations(db: Session, translation_ids: List[str], user_id: str) -> Dict[str, str]:
    """Get user's votes for multiple translations"""
    votes = db.query(TranslationVote).filter(
        and_(
            TranslationVote.translation_id.in_(translation_ids),
            TranslationVote.user_id == user_id
        )
    ).all()
    
    return {str(vote.translation_id): vote.vote_type for vote in votes}


def enrich_translations_with_user_votes(
    translations: List[Translation], 
    user_id: Optional[str], 
    db: Session
) -> List[TranslationWithUserVote]:
    """Convert Translation objects to TranslationWithUserVote including user vote data"""
    if not translations:
        return []
    
    # Get user votes if user is authenticated
    user_votes = {}
    if user_id:
        translation_ids = [str(t.id) for t in translations]
        user_votes = get_user_votes_for_translations(db, translation_ids, user_id)
    
    # Convert to TranslationWithUserVote
    enriched_translations = []
    for translation in translations:
        translation_dict = {
            'id': translation.id,
            'entry_id': translation.entry_id,
            'language_code': translation.language_code,
            'translated_name': translation.translated_name,
            'notes': translation.notes,
            'source_id': translation.source_id,
            'is_preferred': translation.is_preferred,
            'upvotes': translation.upvotes,
            'downvotes': translation.downvotes,
            'created_by': translation.created_by,
            'updated_by': translation.updated_by,
            'created_at': translation.created_at,
            'updated_at': translation.updated_at,
            'user_vote': user_votes.get(str(translation.id))
        }
        enriched_translations.append(TranslationWithUserVote(**translation_dict))
    
    return enriched_translations