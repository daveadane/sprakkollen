"""add image_quiz_sessions table

Revision ID: d4e5f6a7b8c9
Revises: c3e4f5a6b7c8
Create Date: 2026-03-05


"""
from alembic import op
import sqlalchemy as sa

revision = 'd4e5f6a7b8c9'
down_revision = 'c3e4f5a6b7c8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "image_quiz_sessions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("words", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("score", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_questions", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_image_quiz_user_created", "image_quiz_sessions", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_image_quiz_user_created", table_name="image_quiz_sessions")
    op.drop_table("image_quiz_sessions")
