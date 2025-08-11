from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import translation_votes as crud_votes
from app.schemas.translations import VoteCreate, VoteResponse
from app.schemas.auth import UserResponse
from app.api.endpoints.auth import get_current_user

router = APIRouter()


@router.post("/translations/{translation_id}/vote", response_model=VoteResponse)
async def vote_on_translation(
    translation_id: str,
    vote: VoteCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Vote on a translation (up or down).
    If user already voted, this will update their existing vote.
    """
    # The create_or_update_vote function already handles both creating new votes and updating existing ones
    db_vote = crud_votes.create_or_update_vote(
        db, translation_id=translation_id, user_id=current_user.id, vote=vote
    )
    return VoteResponse.model_validate(db_vote)


@router.delete("/translations/{translation_id}/vote")
async def remove_vote(
    translation_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Remove user's vote from a translation.
    """
    success = crud_votes.delete_vote(
        db, translation_id=translation_id, user_id=current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vote not found"
        )

    return {"message": "Vote removed successfully"}


@router.get("/translations/{translation_id}/vote", response_model=VoteResponse)
async def get_user_vote(
    translation_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get current user's vote on a translation.
    """
    vote = crud_votes.get_user_vote(
        db, translation_id=translation_id, user_id=current_user.id
    )
    if not vote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No vote found for this translation"
        )

    return VoteResponse.model_validate(vote)


@router.post("/translations/{translation_id}/recalculate-votes")
async def recalculate_votes(
    translation_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Recalculate vote counts for a translation (admin only).
    Useful for data integrity checks.
    """
    # TODO: Add admin check
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    upvotes, downvotes = crud_votes.recalculate_vote_counts(db, translation_id)

    return {
        "message": "Vote counts recalculated",
        "upvotes": upvotes,
        "downvotes": downvotes
    }
