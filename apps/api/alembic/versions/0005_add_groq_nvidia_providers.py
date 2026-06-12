"""add_groq_nvidia_providers

Adds GROQ and NVIDIA to the aiprovider PostgreSQL enum.
ALTER TYPE ... ADD VALUE runs in autocommit mode (required for PG < 12).

Revision ID: 0005
Revises: c676191521ad
Create Date: 2026-06-11
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "c676191521ad"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE aiprovider ADD VALUE IF NOT EXISTS 'GROQ'")
        op.execute("ALTER TYPE aiprovider ADD VALUE IF NOT EXISTS 'NVIDIA'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values.
    # To roll back, drop and recreate the type without GROQ/NVIDIA
    # (only safe if no rows reference these values).
    pass
