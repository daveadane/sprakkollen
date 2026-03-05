#!/usr/bin/env python3
"""
Loads words from app/data/lookup_seed.json into the swedish_words DB table.

Run from the backend/ folder AFTER running import_words.py:
    python scripts/load_words_to_db.py

Requirements: alembic upgrade head must have been run first.
"""
import json
import sys
from pathlib import Path

# Make sure app package is importable
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text
from app.api.db_setup import engine
from app.api.models import SwedishWord

DATA_PATH = Path(__file__).resolve().parents[1] / "app" / "data" / "lookup_seed.json"


def main() -> None:
    if not DATA_PATH.exists():
        print(f"ERROR: {DATA_PATH} not found. Run import_words.py first.")
        sys.exit(1)

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    print(f"Loading {len(data)} words into the database...")

    with engine.begin() as conn:
        conn.execute(text("DELETE FROM swedish_words"))
        conn.execute(
            SwedishWord.__table__.insert(),
            [
                {
                    "word": item["word"],
                    "article": item["article"],
                    "confidence": item.get("confidence", 0.88),
                    "examples": item.get("examples", []),
                }
                for item in data
            ],
        )

    print(f"Done! {len(data)} Swedish words loaded into the database.")


if __name__ == "__main__":
    main()
