from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.core.database import get_db
from app.crud import entries as crud_entries
from app.models.models import Comment, User
from app.schemas.comments import CommentCreate, CommentUpdate, CommentResponse, CommentWithUser
from app.schemas.auth import UserResponse
from app.api.endpoints.auth import get_current_user
import uuid

router = APIRouter()


@router.get("/entry/{entry_id}", response_model=List[CommentWithUser])
async def get_entry_comments(entry_id: str, db: Session = Depends(get_db)):
    """
    Get all comments for an entry with user information.
    """
    # Check if entry exists
    entry = crud_entries.get_entry(db, entry_id=entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found"
        )
    
    # Debug: Check the entry_id conversion
    import uuid as uuid_lib
    try:
        uuid_entry_id = uuid_lib.UUID(entry_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid entry ID format"
        )

    # Query comments with eagerly loaded user information
    comments = db.query(Comment).options(
        joinedload(Comment.user)
    ).filter(
        Comment.entry_id == uuid_entry_id
    ).order_by(Comment.created_at).all()
    
    # Debug: Check if we found any comments
    print(f"Found {len(comments)} comments for entry {entry_id}")
    
    # Convert to CommentWithUser objects using automatic mapping with custom validator
    # The field_validator in CommentWithUser handles SQLAlchemy User -> UserBasic conversion
    result = [CommentWithUser.model_validate(comment) for comment in comments]
    
    return result


@router.post("/", response_model=CommentResponse)
async def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Create new comment.
    """
    # Check if entry exists
    entry = crud_entries.get_entry(db, entry_id=comment.entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found"
        )

    # Check if parent comment exists (if specified)
    if comment.parent_comment_id:
        parent_comment = db.query(Comment).filter(
            Comment.id == comment.parent_comment_id
        ).first()
        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found"
            )

    db_comment = Comment(
        id=uuid.uuid4(),
        entry_id=comment.entry_id,
        user_id=current_user.id,
        parent_comment_id=comment.parent_comment_id,
        content=comment.content
    )

    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    return CommentResponse.model_validate(db_comment)


@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    comment_update: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update comment. Only creator can update.
    """
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # Check permissions
    if str(db_comment.user_id) != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # Store old content in edit history if updating content
    if comment_update.content and comment_update.content != db_comment.content:
        edit_history = db_comment.edit_history or {}
        edit_history[str(len(edit_history))] = {
            "old_content": db_comment.content,
            "edited_at": str(uuid.uuid4())  # Using uuid as timestamp placeholder
        }
        db_comment.edit_history = edit_history
        db_comment.is_edited = True

    update_data = comment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_comment, field, value)

    db.commit()
    db.refresh(db_comment)

    return CommentResponse.model_validate(db_comment)


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Delete comment. Only creator or admins can delete.
    """
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # Check permissions
    if (str(db_comment.user_id) != current_user.id and
        current_user.role != "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    db.delete(db_comment)
    db.commit()

    return {"message": "Comment deleted successfully"}
