from datetime import datetime
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.credit_transaction import CreditTransaction
from app.models.enums import CreditReason


class CreditTransactionRepository:
    """Repositorio para el historial de transacciones de créditos de IA."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self,
        *,
        user_id: UUID,
        delta: int,
        balance_after: int,
        reason: CreditReason,
        description: str | None = None,
        related_analysis_id: UUID | None = None,
        granted_by_admin_id: UUID | None = None,
    ) -> CreditTransaction:
        tx = CreditTransaction(
            user_id=user_id,
            delta=delta,
            balance_after=balance_after,
            reason=reason,
            description=description,
            related_analysis_id=related_analysis_id,
            granted_by_admin_id=granted_by_admin_id,
        )
        self.db.add(tx)
        await self.db.flush()
        await self.db.refresh(tx)
        return tx

    async def list_by_user(
        self,
        *,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> list[CreditTransaction]:
        result = await self.db.execute(
            select(CreditTransaction)
            .where(CreditTransaction.user_id == user_id)
            .order_by(CreditTransaction.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_user(self, *, user_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(CreditTransaction)
            .where(CreditTransaction.user_id == user_id)
        )
        return result.scalar_one()

    async def get_last_ai_activity_at(self, *, user_id: UUID) -> datetime | None:
        """Fecha de la última llamada a IA (análisis o chat) del usuario."""
        result = await self.db.execute(
            select(func.max(CreditTransaction.created_at))
            .where(
                CreditTransaction.user_id == user_id,
                CreditTransaction.reason.in_([
                    CreditReason.AI_ANALYSIS,
                    CreditReason.CHAT_MESSAGE,
                ]),
            )
        )
        return result.scalar_one_or_none()

    async def sum_consumed_today(self) -> int:
        """Total de créditos consumidos hoy (útil para estadísticas del admin)."""
        from sqlalchemy import func as sa_func, cast, Date
        from datetime import date
        result = await self.db.execute(
            select(sa_func.coalesce(sa_func.sum(CreditTransaction.delta * -1), 0))
            .where(
                CreditTransaction.reason.in_([
                    CreditReason.AI_ANALYSIS,
                    CreditReason.CHAT_MESSAGE,
                ]),
                sa_func.cast(CreditTransaction.created_at, Date) == date.today(),
            )
        )
        return result.scalar_one()
