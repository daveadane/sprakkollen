"""add word_image_cache table

Revision ID: c3e4f5a6b7c8
Revises: b2c3d4e5f6a7
Create Date: 2026-03-05

"""
from alembic import op
import sqlalchemy as sa

revision = 'c3e4f5a6b7c8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "word_image_cache",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("word", sa.String(120), nullable=False, unique=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_word_image_word", "word_image_cache", ["word"])


def downgrade() -> None:
    op.drop_index("ix_word_image_word", table_name="word_image_cache")
    op.drop_table("word_image_cache")
