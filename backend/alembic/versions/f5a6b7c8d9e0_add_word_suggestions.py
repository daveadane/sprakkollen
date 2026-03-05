"""add word_suggestions table

Revision ID: f5a6b7c8d9e0
Revises: e4f5a6b7c8d9
Create Date: 2026-03-05

"""
from alembic import op
import sqlalchemy as sa

revision = 'f5a6b7c8d9e0'
down_revision = 'e4f5a6b7c8d9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "word_suggestions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("word", sa.String(120), nullable=False),
        sa.Column("article", sa.String(10), nullable=False),
        sa.Column("suggestion_type", sa.String(10), nullable=False),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("admin_note", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("reviewed_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_suggestions_status", "word_suggestions", ["status"])


def downgrade() -> None:
    op.drop_index("ix_suggestions_status", table_name="word_suggestions")
    op.drop_table("word_suggestions")
