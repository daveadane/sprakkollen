from app.api.db_setup import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS level VARCHAR(20) NOT NULL DEFAULT 'beginner'"))
    conn.execute(text("ALTER TABLE grammar_questions ADD COLUMN IF NOT EXISTS level VARCHAR(20)"))
    conn.commit()
    print("Done!")
