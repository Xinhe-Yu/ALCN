from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.models import User, VerificationCode
from app.schemas.users import UserCreate, UserUpdate
from typing import Optional
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
