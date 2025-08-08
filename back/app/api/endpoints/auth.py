from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    create_access_token,
    verify_token,
    generate_verification_code
)
from app.crud import users as crud_users
from app.schemas.auth import LoginRequest, VerifyCodeRequest, Token, UserResponse
from app.schemas.users import UserCreate

router = APIRouter()
security = HTTPBearer()


@router.post("/login", response_model=dict)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Send verification code to user's email.
    In dev mode, always use code "123456".
    """
    user = crud_users.get_user_by_email(db, email=request.email)

    if not user:
        # Create new user if doesn't exist
        user_create = UserCreate(email=request.email)
        user = crud_users.create_user(db, user_create)

    # Generate verification code
    if settings.environment == "development":
        code = "123456"  # Dev mode always uses this code
    else:
        code = generate_verification_code()
        # TODO: Send email with verification code

    # Store verification code in database
    crud_users.create_verification_code(db, user_id=str(user.id), code=code)

    return {
        "message": "Verification code sent to your email",
        "dev_code": code if settings.environment == "development" else None
    }


@router.post("/verify", response_model=Token)
async def verify_code(request: VerifyCodeRequest, db: Session = Depends(get_db)):
    """
    Verify the 6-digit code and return access token.
    """
    user = crud_users.get_user_by_email(db, email=request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email"
        )

    # Check verification code
    verification_code = crud_users.get_valid_verification_code(
        db, user_id=str(user.id), code=request.code
    )

    if not verification_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )

    # Mark code as used
    crud_users.mark_verification_code_used(db, verification_code)

    # Activate user if not already activated
    if not user.is_activated:
        crud_users.activate_user(db, user_id=str(user.id))

    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Get current authenticated user from token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        user_id = verify_token(token)
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    user = crud_users.get_user(db, user_id=user_id)
    if user is None:
        raise credentials_exception

    return UserResponse.from_orm(user)


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserResponse = Depends(get_current_user)):
    """
    Get current user profile.
    """
    return current_user


# Admin-only endpoint to verify entries
async def get_current_admin_user(
    current_user: UserResponse = Depends(get_current_user)
) -> UserResponse:
    """
    Ensure current user is admin.
    """
    if current_user.role not in ["admin", "verified_translator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
