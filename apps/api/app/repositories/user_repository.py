from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self.db.execute(
            select(User).where(User.id == user_id, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.email == email.lower(), User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.username == username, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        email: str,
        hashed_password: str,
        username: str | None = None,
        full_name: str | None = None,
    ) -> User:
        user = User(
            email=email.lower(),
            username=username,
            full_name=full_name,
            hashed_password=hashed_password,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def decrement_credits(self, *, user_id: UUID) -> bool:
        """Descuenta 1 crédito de forma atómica. Retorna False si el saldo es 0.

        Usa UPDATE condicional para evitar race conditions: solo actualiza si
        ai_credits > 0, por lo que si retorna 0 filas afectadas significa que
        el usuario no tenía créditos.
        """
        result = await self.db.execute(
            update(User)
            .where(User.id == user_id, User.ai_credits > 0)
            .values(ai_credits=User.ai_credits - 1)
            .returning(User.ai_credits)
        )
        row = result.fetchone()
        return row is not None

    async def increment_credits(self, *, user_id: UUID, delta: int) -> User:
        """Suma `delta` créditos al usuario. Usado por el admin."""
        result = await self.db.execute(
            update(User)
            .where(User.id == user_id, User.deleted_at.is_(None))
            .values(ai_credits=User.ai_credits + delta)
            .returning(User)
        )
        await self.db.flush()
        user = await self.get_by_id(user_id)
        return user  # type: ignore[return-value]

    async def list_all(
        self,
        *,
        search: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[User]:
        """Lista usuarios para el admin panel. Soporta búsqueda por email/username."""
        statement = select(User).where(User.deleted_at.is_(None))
        if search:
            like = f"%{search.lower()}%"
            statement = statement.where(
                (User.email.ilike(like)) | (User.username.ilike(like))
            )
        statement = statement.order_by(User.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(statement)
        return list(result.scalars().all())

    async def count_all(self, *, search: str | None = None) -> int:
        from sqlalchemy import func
        statement = select(func.count()).select_from(User).where(User.deleted_at.is_(None))
        if search:
            like = f"%{search.lower()}%"
            statement = statement.where(
                (User.email.ilike(like)) | (User.username.ilike(like))
            )
        result = await self.db.execute(statement)
        return result.scalar_one()

