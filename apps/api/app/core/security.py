from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: Any, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])


# --- BYOK encryption stubs ---
# These will be completed when the AI key management service is implemented.
# We use Fernet symmetric encryption with the ENCRYPTION_KEY from settings.

def encrypt_api_key(plain_key: str) -> str:
    """Encrypt a BYOK API key before storing it. Stub for future implementation."""
    raise NotImplementedError("BYOK encryption not yet implemented")


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt a stored BYOK API key. Stub for future implementation."""
    raise NotImplementedError("BYOK decryption not yet implemented")
