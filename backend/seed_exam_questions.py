"""
Seed script: generate SVA1 and SVA3 exam questions using Claude API.

Run from the backend/ folder:
    python seed_exam_questions.py

Requires ANTHROPIC_API_KEY in .env (or environment).
Generates:
  - 5 SVA1 reading passages × 5 comprehension questions each = 25 reading questions
  - 25 SVA1 standalone grammar questions
  - 5 SVA3 reading passages × 5 comprehension questions each = 25 reading questions
  - 25 SVA3 standalone grammar questions
Total: 100 questions across 10 passages
"""

import json
import os
import sys

import anthropic
from dotenv import load_dotenv

load_dotenv()

# Add project root to path so app imports work
sys.path.insert(0, os.path.dirname(__file__))

from app.api.db_setup import SessionLocal, engine, Base
from app.api import models  # registers all models
from app.api.models import ExamPassage, ExamQuestion

Base.metadata.create_all(bind=engine)

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


SVA1_PASSAGE_TOPICS = [
    "A person's daily routine in Sweden (work, family, hobbies)",
    "Shopping at a Swedish supermarket and paying",
    "Taking public transport in a Swedish city",
    "A family celebrating midsommar (Midsummer) in Sweden",
    "Visiting a Swedish healthcare center (vårdcentral) for a check-up",
]

SVA3_PASSAGE_TOPICS = [
    "Swedish workplace culture and the concept of 'lagom'",
    "The Swedish welfare system and its impact on families",
    "Environmental policy in Sweden and climate awareness",
    "Immigration and integration challenges in modern Sweden",
    "Gender equality in Sweden — achievements and remaining challenges",
]

SVA1_GRAMMAR_PROMPT = """
You are generating SVA1-level Swedish language exam questions (basic level, A2-B1).

Generate exactly 25 multiple-choice grammar questions. Focus on:
- en/ett article selection
- Simple verb conjugation (present tense, past tense)
- Basic prepositions (på, i, till, från, med, av, om)
- Plural forms of nouns
- Simple adjective agreement
- Word order in statements and questions

Format your response as a JSON array:
[
  {
    "question": "Välj rätt ord: Jag ___ på jobbet varje dag.",
    "choices": ["arbetar", "arbetat", "arbetas", "arbetade"],
    "correct_answer": "arbetar"
  },
  ...
]

Rules:
- All questions must be in Swedish
- Each question has exactly 4 choices
- Choices must be plausible (not obviously wrong)
- Questions should feel like a real Swedish language exam
- Do not repeat similar questions
- Return ONLY the JSON array, no other text
"""

SVA3_GRAMMAR_PROMPT = """
You are generating SVA3-level Swedish language exam questions (advanced level, B2-C1).

Generate exactly 25 multiple-choice grammar questions. Focus on:
- Subjunctive/conditional mood (konditionalis)
- Complex subordinate clauses and conjunctions
- Passive voice (s-passiv and bli-passiv)
- Participles (presens particip, perfekt particip)
- Advanced prepositions and prepositional phrases
- Formal/written Swedish register
- Complex sentence structures and relative clauses

Format your response as a JSON array:
[
  {
    "question": "Välj rätt form: Om jag ___ mer tid, hade jag rest mer.",
    "choices": ["har", "hade", "har haft", "skulle ha"],
    "correct_answer": "hade"
  },
  ...
]

Rules:
- All questions must be in Swedish
- Each question has exactly 4 choices
- Questions should reflect real advanced Swedish language exam difficulty
- Do not repeat similar questions
- Return ONLY the JSON array, no other text
"""


def generate_passage_with_questions(topic: str, level: str) -> dict:
    """Ask Claude to generate a reading passage + 5 comprehension questions."""
    if level == "sva1":
        instructions = (
            "Write a short Swedish reading passage (60-90 words) suitable for SVA1 level (A2-B1). "
            "Use simple vocabulary and sentence structures. Topic: " + topic
        )
        q_instructions = "Write 5 multiple-choice reading comprehension questions at SVA1 level (A2-B1). Questions should test direct comprehension (who, what, where, when). All in Swedish."
    else:
        instructions = (
            "Write a Swedish reading passage (110-150 words) suitable for SVA3 level (B2-C1). "
            "Use varied vocabulary and complex sentence structures. Topic: " + topic
        )
        q_instructions = "Write 5 multiple-choice reading comprehension questions at SVA3 level (B2-C1). Questions should test inference, vocabulary in context, and main ideas. All in Swedish."

    prompt = f"""
{instructions}

Then generate 5 multiple-choice comprehension questions about the passage.

Return ONLY a JSON object in this exact format:
{{
  "passage": "The Swedish text here...",
  "topic": "{topic}",
  "questions": [
    {{
      "question": "Question text in Swedish?",
      "choices": ["Choice A", "Choice B", "Choice C", "Choice D"],
      "correct_answer": "Choice A"
    }}
  ]
}}

{q_instructions}
Each question has exactly 4 choices. Return ONLY the JSON object, no other text.
"""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code blocks if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    return json.loads(raw)


def generate_grammar_questions(level: str) -> list:
    """Ask Claude to generate 25 standalone grammar questions."""
    prompt = SVA1_GRAMMAR_PROMPT if level == "sva1" else SVA3_GRAMMAR_PROMPT

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    return json.loads(raw)


def seed_level(db, level: str, topics: list):
    print(f"\n{'='*50}")
    print(f"Generating {level.upper()} content...")
    print(f"{'='*50}")

    # 1. Generate passages + reading questions
    for i, topic in enumerate(topics, 1):
        print(f"  [{i}/{len(topics)}] Passage: {topic[:50]}...")
        try:
            data = generate_passage_with_questions(topic, level)

            passage = ExamPassage(
                level=level,
                topic=data.get("topic", topic),
                text=data["passage"],
            )
            db.add(passage)
            db.flush()  # get passage.id

            for q in data["questions"]:
                db.add(ExamQuestion(
                    level=level,
                    section="reading",
                    passage_id=passage.id,
                    question=q["question"],
                    choices=q["choices"],
                    correct_answer=q["correct_answer"],
                ))
            print(f"    ✓ {len(data['questions'])} reading questions added")
        except Exception as e:
            print(f"    ✗ Error: {e}")

    # 2. Generate grammar questions
    print(f"  Generating 25 grammar questions...")
    try:
        grammar_qs = generate_grammar_questions(level)
        for q in grammar_qs:
            db.add(ExamQuestion(
                level=level,
                section="grammar",
                passage_id=None,
                question=q["question"],
                choices=q["choices"],
                correct_answer=q["correct_answer"],
            ))
        print(f"    ✓ {len(grammar_qs)} grammar questions added")
    except Exception as e:
        print(f"    ✗ Error: {e}")

    db.commit()


def main():
    db = SessionLocal()
    try:
        # Check if already seeded
        existing = db.query(ExamQuestion).count()
        if existing > 0:
            print(f"Database already has {existing} exam questions.")
            answer = input("Re-seed? This will DELETE all existing exam questions. (y/N): ")
            if answer.lower() != "y":
                print("Aborted.")
                return
            db.query(ExamQuestion).delete()
            db.query(ExamPassage).delete()
            db.commit()
            print("Cleared existing questions.")

        seed_level(db, "sva1", SVA1_PASSAGE_TOPICS)
        seed_level(db, "sva3", SVA3_PASSAGE_TOPICS)

        total_q = db.query(ExamQuestion).count()
        total_p = db.query(ExamPassage).count()
        print(f"\n{'='*50}")
        print(f"Done! {total_p} passages and {total_q} questions in database.")
        print(f"{'='*50}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
