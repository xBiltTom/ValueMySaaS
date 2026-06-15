import logging
from uuid import UUID

from fastapi import HTTPException, status

from app.core.security import decrypt_api_key, encrypt_api_key
from app.repositories.chatgpt_web_account_repository import ChatGptWebAccountRepository

logger = logging.getLogger(__name__)


class ChatGptWebAccountService:
    def __init__(
        self,
        account_repository: ChatGptWebAccountRepository,
    ) -> None:
        self.account_repository = account_repository

    async def create_account(
        self,
        *,
        email: str,
        user_agent: str | None,
        priority: int,
    ) -> dict:
        data: dict = {
            "email": email,
            "priority": priority,
        }
        if user_agent:
            data["user_agent"] = user_agent
        account = await self.account_repository.create(data=data)
        return self._serialize(account)

    async def list_accounts(
        self, *, active_only: bool = False, limit: int = 50, offset: int = 0
    ) -> tuple[list[dict], int]:
        items = await self.account_repository.list_all(
            active_only=active_only, limit=limit, offset=offset
        )
        total = await self.account_repository.count_all(active_only=active_only)
        return [self._serialize(a) for a in items], total

    async def get_account(self, account_id: UUID) -> dict:
        account = await self.account_repository.get_by_id(account_id)
        if account is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cuenta de ChatGPT Web no encontrada.",
            )
        return self._serialize(account)

    async def update_account(self, account_id: UUID, data: dict) -> dict:
        account = await self.account_repository.get_by_id(account_id)
        if account is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cuenta de ChatGPT Web no encontrada.",
            )
        update_data: dict = {}
        if "email" in data:
            update_data["email"] = data["email"]
        if "user_agent" in data:
            update_data["user_agent"] = data["user_agent"]
        if "priority" in data:
            update_data["priority"] = data["priority"]
        if "is_active" in data:
            update_data["is_active"] = data["is_active"]
        if "is_locked" in data:
            update_data["is_locked"] = data["is_locked"]
        account = await self.account_repository.update(
            account=account, data=update_data
        )
        return self._serialize(account)

    async def delete_account(self, account_id: UUID) -> None:
        account = await self.account_repository.get_by_id(account_id)
        if account is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cuenta de ChatGPT Web no encontrada.",
            )
        await self.account_repository.soft_delete(account=account)

    async def inject_session_token(
        self,
        account_id: UUID,
        *,
        session_token_part0: str,
        session_token_part1: str = "",
        cf_clearance: str = "",
        user_agent: str | None = None,
        expires_at=None,
    ) -> dict:
        """Store cookies copied manually from the browser DevTools.

        ChatGPT now splits ``__Secure-next-auth.session-token`` into two
        cookies (``.0`` / ``.1``).  The ``cf_clearance`` cookie is required
        for httpx to pass Cloudflare.
        """
        account = await self.account_repository.get_by_id(account_id)
        if account is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cuenta de ChatGPT Web no encontrada.",
            )
        combined = f"{session_token_part0}|||{session_token_part1}|||{cf_clearance}"
        update_data: dict = {
            "encrypted_session_token": encrypt_api_key(combined),
            "error_count": 0,
            "is_locked": False,
        }
        if expires_at is not None:
            update_data["session_expires_at"] = expires_at
        if user_agent is not None:
            update_data["user_agent"] = user_agent
        account = await self.account_repository.update(
            account=account, data=update_data
        )
        return self._serialize(account)

    async def mark_token_expired(self, account_id: UUID) -> None:
        """Called when a 401 is received so the admin knows to re-inject the token."""
        account = await self.account_repository.get_by_id(account_id)
        if account is None:
            return
        await self.account_repository.update(
            account=account,
            data={"is_locked": True, "error_count": account.error_count + 1},
        )

    async def verify_account(self, account_id: UUID) -> dict:
        account = await self.account_repository.get_by_id(account_id)
        if account is None:
            return {"ok": False, "message": "Cuenta no encontrada."}
        if not account.encrypted_session_token:
            return {
                "ok": False,
                "message": "No hay cookies de sesión. Inyecta las cookies con /inject-token.",
            }
        try:
            token = decrypt_api_key(account.encrypted_session_token)
            from app.services.chatgpt_web_client import (
                ChatGptWebClient,
                ChatGptWebClientError,
            )

            client = ChatGptWebClient()
            try:
                await client.send_message(
                    session_token=token,
                    system_prompt="Responde solo con: OK",
                    user_prompt="OK",
                    user_agent=account.user_agent or None,
                )
                return {"ok": True, "message": "Conexión exitosa con ChatGPT Web."}
            except ChatGptWebClientError as exc:
                return {"ok": False, "message": str(exc)}
            finally:
                await client.close()
        except Exception as exc:
            return {"ok": False, "message": f"Error de verificación: {exc}"}

    def _serialize(self, account) -> dict:
        part0, part1, clearance = None, None, None
        if account.encrypted_session_token:
            try:
                decrypted = decrypt_api_key(account.encrypted_session_token)
                parts = decrypted.split("|||", 2)
                part0 = parts[0] if len(parts) > 0 else ""
                part1 = parts[1] if len(parts) > 1 else ""
                clearance = parts[2] if len(parts) > 2 else ""
            except Exception:
                pass
                
        return {
            "id": str(account.id),
            "email": account.email,
            "has_password": bool(account.encrypted_password),
            "has_session_token": bool(account.encrypted_session_token),
            "session_expires_at": account.session_expires_at.isoformat()
            if account.session_expires_at
            else None,
            "user_agent": account.user_agent,
            "session_token_part0": part0,
            "session_token_part1": part1,
            "cf_clearance": clearance,
            "is_active": account.is_active,
            "priority": account.priority,
            "error_count": account.error_count,
            "is_locked": account.is_locked,
            "last_used_at": account.last_used_at.isoformat()
            if account.last_used_at
            else None,
            "created_at": account.created_at.isoformat()
            if account.created_at
            else None,
            "updated_at": account.updated_at.isoformat()
            if account.updated_at
            else None,
        }
