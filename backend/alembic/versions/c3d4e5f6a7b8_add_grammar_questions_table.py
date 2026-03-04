"""add grammar questions table

Revision ID: c3d4e5f6a7b8
Revises: b89fa3397ff7
Create Date: 2026-03-04 12:00:00.000000

"""
from typing import Sequence, Union
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b89fa3397ff7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


SEED_QUESTIONS = [
    {"question": "Jag ___ i Sverige.", "correct_answer": "bor", "choices": ["bor", "bott", "bo"], "category": "present"},
    {"question": "Hon ___ en bok igår.", "correct_answer": "läste", "choices": ["läser", "läste", "läs"], "category": "past"},
    {"question": "Vi ___ till skolan varje dag.", "correct_answer": "går", "choices": ["går", "gick", "gå"], "category": "present"},
    {"question": "De ___ hemma nu.", "correct_answer": "är", "choices": ["är", "var", "vara"], "category": "present"},
    {"question": "Jag ___ kaffe just nu.", "correct_answer": "dricker", "choices": ["dricker", "drack", "dricka"], "category": "present"},
    {"question": "Han ___ mycket musik.", "correct_answer": "lyssnar", "choices": ["lyssnar", "lyssnade", "lyssna"], "category": "present"},
    {"question": "Vi ___ pizza till middag igår.", "correct_answer": "åt", "choices": ["äter", "åt", "äta"], "category": "past"},
    {"question": "De ___ i Göteborg förra året.", "correct_answer": "bodde", "choices": ["bor", "bodde", "bo"], "category": "past"},
    {"question": "Barnen ___ i parken just nu.", "correct_answer": "leker", "choices": ["leker", "lekte", "leka"], "category": "present"},
    {"question": "Jag ___ hem från jobbet klockan fem.", "correct_answer": "kommer", "choices": ["kommer", "kom", "komma"], "category": "present"},
    {"question": "Hon ___ sin läxa redan.", "correct_answer": "har gjort", "choices": ["gör", "gjorde", "har gjort"], "category": "perfect"},
    {"question": "Vi ___ träffa dig snart.", "correct_answer": "vill", "choices": ["vill", "ville", "vilja"], "category": "modal"},
    {"question": "Han ___ inte hem igår kväll.", "correct_answer": "kom", "choices": ["kommer", "kom", "komma"], "category": "past"},
    {"question": "Jag ___ svenska i två år.", "correct_answer": "har lärt mig", "choices": ["lär mig", "lärde mig", "har lärt mig"], "category": "perfect"},
    {"question": "Du ___ cykla utan hjälm.", "correct_answer": "får inte", "choices": ["kan inte", "får inte", "vill inte"], "category": "modal"},
]


def upgrade() -> None:
    grammar_questions = op.create_table(
        'grammar_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('correct_answer', sa.String(length=120), nullable=False),
        sa.Column('choices', sa.JSON(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('question', name='uq_grammar_question_text'),
    )

    now = datetime.utcnow()
    op.bulk_insert(grammar_questions, [
        {
            "question": q["question"],
            "correct_answer": q["correct_answer"],
            "choices": q["choices"],
            "category": q["category"],
            "created_at": now,
        }
        for q in SEED_QUESTIONS
    ])


def downgrade() -> None:
    op.drop_table('grammar_questions')
