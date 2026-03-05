"""add test_sessions table

Revision ID: a1b2c3d4e5f6
Revises: f5a6b7c8d9e0
Create Date: 2026-03-05

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = 'f5a6b7c8d9e0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "test_sessions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("questions", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("score", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_questions", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_test_user_created", "test_sessions", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_test_user_created", table_name="test_sessions")
    op.drop_table("test_sessions")
