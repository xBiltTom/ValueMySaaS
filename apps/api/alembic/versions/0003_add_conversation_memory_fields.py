"""Add conversation memory fields: summary, total_messages, context_window_size

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-10 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Resumen auto-generado para conversaciones largas
    op.add_column(
        "chat_conversations",
        sa.Column("summary", sa.Text(), nullable=True),
    )
    # Contador de mensajes para eficiencia (evita COUNT en cada request)
    op.add_column(
        "chat_conversations",
        sa.Column(
            "total_messages",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
    # Tamaño de ventana configurable por conversación
    op.add_column(
        "chat_conversations",
        sa.Column(
            "context_window_size",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("20"),
        ),
    )


def downgrade() -> None:
    op.drop_column("chat_conversations", "context_window_size")
    op.drop_column("chat_conversations", "total_messages")
    op.drop_column("chat_conversations", "summary")
