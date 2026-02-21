import json
from pathlib import Path

DATASET_PATH = Path(__file__).resolve().parents[2] / "data" / "lookup_seed.json"

def dataset_lookup(word: str):
    if not DATASET_PATH.exists():
        return None

    data = json.loads(DATASET_PATH.read_text(encoding="utf-8"))

    for item in data:
        if item["word"].strip().lower() == word:
            return {
                "word": word,
                "article": item["article"],
                "confidence": item["confidence"],
                "examples": item.get("examples", []),
                "source": "dataset",
            }
    return None