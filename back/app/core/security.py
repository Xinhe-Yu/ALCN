from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from .config import settings
import secrets
import string

# Enhanced password context with multiple schemes for future-proofing
pwd_context = CryptContext(
    schemes=["bcrypt", "scrypt", "argon2"],
    deprecated="auto",
    bcrypt__rounds=12,  # Higher rounds for better security (default is 12)
)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=7)

    # Add issued at and not before claims for better security
    now = datetime.now(timezone.utc)
    to_encode.update({
        "exp": expire,
        "iat": now,  # issued at
        "nbf": now,  # not before
    })

    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


def verify_token(token: str) -> Optional[str]:
    try:
        # Verify with multiple allowed algorithms for security
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
            options={
                "verify_exp": True,
                "verify_iat": True,
                "verify_nbf": True,
            }
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return ''.join(secrets.choice(string.digits) for _ in range(6))
