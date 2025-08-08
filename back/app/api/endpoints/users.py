from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.crud import users as crud_users
from app.schemas.users import UserResponse, UserUpdate
from app.schemas.auth import UserResponse as AuthUserResponse
from app.api.endpoints.auth import get_current_user, get_current_admin_user

router = APIRouter()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: AuthUserResponse = Depends(get_current_user)
):
    """
    Get user by ID. Users can only see their own profile unless they're admin.
    """
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    user = crud_users.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse.from_orm(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: AuthUserResponse = Depends(get_current_user)
):
    """
    Update user profile. Users can only update their own profile unless they're admin.
    Only admins can change roles.
    """
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # Only admins can change roles
    if user_update.role and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can change user roles"
        )

    updated_user = crud_users.update_user(db, user_id=user_id, user_update=user_update)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse.from_orm(updated_user)


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: AuthUserResponse = Depends(get_current_admin_user)
):
    """
    List all users. Admin only.
    """
    users = db.query(crud_users.User).offset(skip).limit(limit).all()
    return [UserResponse.from_orm(user) for user in users]
