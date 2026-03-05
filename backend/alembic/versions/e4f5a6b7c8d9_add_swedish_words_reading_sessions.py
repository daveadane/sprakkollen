"""add swedish_words, reading_sessions, lookup_cache.examples

Revision ID: e4f5a6b7c8d9
Revises: d1e2f3a4b5c6
Create Date: 2026-03-05

"""
from alembic import op
import sqlalchemy as sa

revision = 'e4f5a6b7c8d9'
down_revision = 'd1e2f3a4b5c6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1) swedish_words table
    op.create_table(
        "swedish_words",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("word", sa.String(120), nullable=False, unique=True, index=True),
        sa.Column("article", sa.String(10), nullable=False),
        sa.Column("confidence", sa.Float, nullable=False, server_default="0.88"),
        sa.Column("examples", sa.JSON, nullable=False, server_default="[]"),
    )

    # 2) reading_sessions table
    op.create_table(
        "reading_sessions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("text_id", sa.Integer, sa.ForeignKey("reading_texts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("score", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_reading_user_created", "reading_sessions", ["user_id", "created_at"])

    # 3) Add examples column to lookup_cache
    op.add_column("lookup_cache", sa.Column("examples", sa.JSON, nullable=True))


def downgrade() -> None:
    op.drop_column("lookup_cache", "examples")
    op.drop_index("ix_reading_user_created", table_name="reading_sessions")
    op.drop_table("reading_sessions")
    op.drop_table("swedish_words")
