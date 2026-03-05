#!/usr/bin/env python3
"""
Fetches thousands of Swedish nouns with gender (en/ett) from the
English Wiktionary API and writes them to app/data/lookup_seed.json.

Usage (run from the backend/ folder):
    python scripts/import_words.py

Requirements: pip install requests
Estimated time: 2-4 minutes (batched API calls, rate-limited)
"""

import json
import re
import time
from pathlib import Path

import requests

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_PATH = SCRIPT_DIR.parent / "app" / "data" / "lookup_seed.json"
API_URL = "https://en.wiktionary.org/w/api.php"

# ── Config ───────────────────────────────────────────────────────────────────
MAX_WORDS = 12000      # Maximum nouns to fetch from the category
BATCH_SIZE = 50        # Wiktionary allows up to 50 pages per request
DELAY_BETWEEN_BATCHES = 0.3   # Seconds between batch requests (be polite)
HEADERS = {"User-Agent": "SprakKollen/1.0 (Swedish noun gender importer; educational project)"}


# ── Step 1: Collect word list from the "Swedish nouns" category ───────────────
def fetch_word_list(max_words: int) -> list[str]:
    words = []
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": "Category:Swedish_nouns",
        "cmlimit": "500",
        "format": "json",
    }

    print(f"Fetching up to {max_words} Swedish nouns from Wiktionary category…")
    while len(words) < max_words:
        resp = requests.get(API_URL, params=params, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        members = data["query"]["categorymembers"]
        for m in members:
            title = m["title"]
            # Skip category pages and multi-word entries (contains spaces/hyphens in middle)
            if ":" not in title and len(title) <= 40:
                words.append(title)

        if "continue" not in data or len(words) >= max_words:
            break

        params["cmcontinue"] = data["continue"]["cmcontinue"]
        time.sleep(0.1)

    return words[:max_words]


# ── Step 2: Detect gender from wikitext ──────────────────────────────────────
def parse_gender(wikitext: str, title: str) -> str | None:
    """Return 'en' (common) or 'ett' (neuter), or None if undetermined."""
    # Only look at the Swedish section of the page
    if "==Swedish==" not in wikitext:
        return None
    swedish = wikitext[wikitext.index("==Swedish=="):]

    # Neuter indicators
    neuter_patterns = [
        r"\{\{sv-noun\|[^}]*g=n",              # {{sv-noun|g=n...}}
        r"\{\{sv-noun-n-",                      # {{sv-noun-n-...}} inflection tables
        r"\{\{sv-infl-noun-n",                  # {{sv-infl-noun-n-...}}
        r"\{\{head\|sv\|noun[^}]*g=n",          # {{head|sv|noun|g=n}}
        r"\{\{sv-noun\|[^}]*neuter",
        r"'''ett''' " + re.escape(title.lower()),
        r"\|g=n\b",                             # bare |g=n in any template
        r"\|g2=n\b",
    ]
    for pat in neuter_patterns:
        if re.search(pat, swedish, re.IGNORECASE):
            return "ett"

    # Common (utrum) indicators
    common_patterns = [
        r"\{\{sv-noun\|[^}]*g=c",              # {{sv-noun|g=c...}}
        r"\{\{sv-noun-c-",                      # {{sv-noun-c-...}} inflection tables
        r"\{\{sv-infl-noun-c",                  # {{sv-infl-noun-c-...}}
        r"\{\{head\|sv\|noun[^}]*g=c",          # {{head|sv|noun|g=c}}
        r"\{\{sv-noun\|[^}]*common",
        r"'''en''' " + re.escape(title.lower()),
        r"\|g=c\b",                             # bare |g=c in any template
        r"\|g2=c\b",
    ]
    for pat in common_patterns:
        if re.search(pat, swedish, re.IGNORECASE):
            return "en"

    return None


# ── Step 3: Batch-fetch wikitext for up to 50 words at once ─────────────────
def fetch_batch(words: list[str]) -> dict[str, str]:
    """Returns {word_lower: article} for words where gender was found."""
    params = {
        "action": "query",
        "titles": "|".join(words),
        "prop": "revisions",
        "rvprop": "content",
        "rvslots": "main",
        "format": "json",
    }

    resp = requests.get(API_URL, params=params, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    results = {}
    for page in data["query"]["pages"].values():
        title = page.get("title", "")
        revisions = page.get("revisions")
        if not revisions:
            continue

        rev = revisions[0]
        # API returns content under "slots.main.*" in newer versions
        wikitext = (
            rev.get("slots", {}).get("main", {}).get("*")
            or rev.get("*")
            or ""
        )

        article = parse_gender(wikitext, title)
        if article:
            results[title.strip().lower()] = article

    return results


# ── Step 4: Generate example sentences ───────────────────────────────────────
def make_examples(word: str, article: str) -> list[str]:
    det = "det" if article == "ett" else "den"
    adj = "nytt" if article == "ett" else "ny"
    return [
        f"{article.capitalize()} {word}.",
        f"Jag har {article} {word}.",
        f"Var är {det} {word}?",
        f"Det är {article} {adj} {word}.",
        f"Jag ser {article} {word} där borta.",
    ]


# ── Main ─────────────────────────────────────────────────────────────────────
def main() -> None:
    all_words = fetch_word_list(MAX_WORDS)
    print(f"Collected {len(all_words)} candidate words.\n")

    dataset: list[dict] = []
    batches = [all_words[i:i + BATCH_SIZE] for i in range(0, len(all_words), BATCH_SIZE)]

    for idx, batch in enumerate(batches):
        print(f"  Batch {idx + 1}/{len(batches)} ({len(batch)} words)…", end=" ", flush=True)
        try:
            found = fetch_batch(batch)
        except Exception as e:
            print(f"ERROR: {e} — skipping batch")
            time.sleep(1)
            continue

        for word, article in found.items():
            dataset.append({
                "word": word,
                "article": article,
                "confidence": 0.88,
                "examples": make_examples(word, article),
            })

        print(f"found gender for {len(found)}/{len(batch)} words. Total so far: {len(dataset)}")
        time.sleep(DELAY_BETWEEN_BATCHES)

    # Remove duplicates (keep first occurrence)
    seen: set[str] = set()
    unique = []
    for entry in dataset:
        if entry["word"] not in seen:
            seen.add(entry["word"])
            unique.append(entry)

    # Sort alphabetically for readability
    unique.sort(key=lambda x: x["word"])

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(unique, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"\nDone! {len(unique)} unique Swedish nouns saved to:\n  {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
