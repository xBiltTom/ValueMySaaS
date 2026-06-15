"""add_g4f_to_aiprovider

Revision ID: 54aca002ba19
Revises: a1b2c3d4e5f6
Create Date: 2026-06-14 23:07:41.516355

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '54aca002ba19'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Disable transactions for ALTER TYPE operations
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE aiprovider ADD VALUE IF NOT EXISTS 'CHATGPT_WEB'")
        op.execute("ALTER TYPE aiprovider ADD VALUE IF NOT EXISTS 'G4F'")


def downgrade() -> None:
    pass
