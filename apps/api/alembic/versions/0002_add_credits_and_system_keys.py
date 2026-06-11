"""Add ai_credits to users, system_ai_keys and credit_transactions tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-10 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Nuevos Enums ---
    creditreason = postgresql.ENUM(
        "ADMIN_GRANT", "ADMIN_REVOKE", "AI_ANALYSIS", "CHAT_MESSAGE",
        name="creditreason", create_type=False,
    )
    creditreason.create(op.get_bind(), checkfirst=True)

    # --- 1. Añadir ai_credits a users ---
    op.add_column(
        "users",
        sa.Column(
            "ai_credits",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("5"),
        ),
    )

    # --- 2. Crear tabla system_ai_keys ---
    op.create_table(
        "system_ai_keys",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "provider",
            postgresql.ENUM(
                "OPENAI", "GEMINI", "ANTHROPIC", "OPENROUTER", "OTHER",
                name="aiprovider", create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("label", sa.String(100), nullable=False),
        sa.Column("encrypted_api_key", sa.String(1024), nullable=False),
        sa.Column("key_last_four", sa.String(4), nullable=True),
        sa.Column("default_model", sa.String(100), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider", "label", name="uq_system_ai_keys_provider_label"),
    )
    op.create_index(
        "ix_system_ai_keys_active_priority",
        "system_ai_keys",
        ["is_active", "priority"],
    )

    # --- 3. Crear tabla credit_transactions ---
    op.create_table(
        "credit_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("reason", creditreason, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "related_analysis_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
        sa.Column(
            "granted_by_admin_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["related_analysis_id"], ["ai_analyses.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["granted_by_admin_id"], ["users.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_credit_transactions_user_id",
        "credit_transactions",
        ["user_id"],
    )
    op.create_index(
        "ix_credit_transactions_user_created",
        "credit_transactions",
        ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_credit_transactions_user_created")
    op.drop_index("ix_credit_transactions_user_id")
    op.drop_table("credit_transactions")

    op.drop_index("ix_system_ai_keys_active_priority")
    op.drop_table("system_ai_keys")

    op.drop_column("users", "ai_credits")

    op.execute("DROP TYPE IF EXISTS creditreason")
