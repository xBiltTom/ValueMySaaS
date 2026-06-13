import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


async def hash_password_async(plain_password: str) -> str:
    return await asyncio.to_thread(hash_password, plain_password)


async def verify_password_async(plain_password: str, hashed_password: str) -> bool:
    return await asyncio.to_thread(verify_password, plain_password, hashed_password)


def create_access_token(
    subject: Any,
    email: str | None = None,
    is_active: bool = True,
    role: str = "USER",
    expires_delta: timedelta | None = None
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": str(subject),
        "email": email,
        "is_active": is_active,
        "role": role,
        "exp": expire
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])


def encrypt_api_key(plain_key: str) -> str:
    """Encrypt a BYOK API key before storing it."""
    return _fernet().encrypt(plain_key.encode("utf-8")).decode("utf-8")


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt a stored BYOK API key only when calling a provider."""
    try:
        return _fernet().decrypt(encrypted_key.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise RuntimeError("Stored API key could not be decrypted") from exc


def _fernet() -> Fernet:
    try:
        return Fernet(settings.ENCRYPTION_KEY.encode("utf-8"))
    except Exception as exc:
        raise RuntimeError("Invalid ENCRYPTION_KEY configuration for BYOK encryption") from exc
