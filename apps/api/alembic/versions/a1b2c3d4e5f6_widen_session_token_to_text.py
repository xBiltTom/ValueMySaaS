"""widen encrypted_session_token to Text

Revision ID: a1b2c3d4e5f6
Revises: 75d7f1ce681e
Create Date: 2026-06-14

The __Secure-next-auth.session-token cookie is a long JWT; after Fernet
encryption its length easily exceeds VARCHAR(2048). Text has no length limit.
"""

import sqlalchemy as sa
from alembic import op

revision = "a1b2c3d4e5f6"
down_revision = "75d7f1ce681e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "chatgpt_web_accounts",
        "encrypted_session_token",
        existing_type=sa.String(2048),
        type_=sa.Text(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "chatgpt_web_accounts",
        "encrypted_session_token",
        existing_type=sa.Text(),
        type_=sa.String(2048),
        existing_nullable=True,
    )
