"""add dictation_sessions table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-05

"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "dictation_sessions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("words", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("score", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_questions", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_dictation_user_created", "dictation_sessions", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_dictation_user_created", table_name="dictation_sessions")
    op.drop_table("dictation_sessions")
