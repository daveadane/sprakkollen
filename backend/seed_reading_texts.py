#!/usr/bin/env python3
"""
Seeds reading_texts and reading_questions tables with Swedish short texts.
Run from the backend/ folder:
    python seed_reading_texts.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.api.db_setup import engine
from app.api.models import ReadingText, ReadingQuestion
from sqlalchemy.orm import Session

TEXTS = [
    {
        "title": "Min familj",
        "level": "A1",
        "topic": "Familj",
        "content": (
            "Jag heter Anna. Jag har en familj med fyra personer. "
            "Min man heter Erik. Vi har två barn, en son och en dotter. "
            "Sonen heter Liam och han är åtta år. Dottern heter Maja och hon är fem år. "
            "Vi bor i en lägenhet i Stockholm. Vi tycker om att gå på promenader tillsammans."
        ),
        "questions": [
            {
                "question": "Hur många personer finns det i Annas familj?",
                "correct_answer": "Fyra",
                "choices": ["Två", "Tre", "Fyra", "Fem"],
            },
            {
                "question": "Vad heter Annas son?",
                "correct_answer": "Liam",
                "choices": ["Erik", "Liam", "Maja", "Johan"],
            },
            {
                "question": "Hur gammal är Maja?",
                "correct_answer": "Fem år",
                "choices": ["Tre år", "Fyra år", "Fem år", "Åtta år"],
            },
            {
                "question": "Var bor familjen?",
                "correct_answer": "I en lägenhet i Stockholm",
                "choices": ["I ett hus på landet", "I en lägenhet i Stockholm", "I Göteborg", "I en villa i Malmö"],
            },
        ],
    },
    {
        "title": "En dag på jobbet",
        "level": "A2",
        "topic": "Arbete",
        "content": (
            "Karin arbetar på ett kontor i Göteborg. Hon börjar jobbet klockan åtta på morgonen. "
            "Först dricker hon kaffe och läser e-post. Sedan har hon ett möte med sina kollegor. "
            "På lunchen äter hon i restaurangen nära kontoret. "
            "Eftermiddagen jobbar hon med en rapport. Klockan fem slutar hon och åker hem med tunnelbanan. "
            "Hon är trött men nöjd efter en lång arbetsdag."
        ),
        "questions": [
            {
                "question": "Var arbetar Karin?",
                "correct_answer": "På ett kontor i Göteborg",
                "choices": ["På ett sjukhus", "På ett kontor i Göteborg", "I en butik", "På en skola"],
            },
            {
                "question": "Vad gör Karin först på morgonen?",
                "correct_answer": "Dricker kaffe och läser e-post",
                "choices": ["Har ett möte", "Dricker kaffe och läser e-post", "Äter lunch", "Skriver en rapport"],
            },
            {
                "question": "Hur åker Karin hem?",
                "correct_answer": "Med tunnelbanan",
                "choices": ["Med bilen", "Med bussen", "Med tunnelbanan", "Till fots"],
            },
            {
                "question": "Hur känner sig Karin när hon slutar jobbet?",
                "correct_answer": "Trött men nöjd",
                "choices": ["Glad och pigg", "Ledsen och trött", "Trött men nöjd", "Arg och stressad"],
            },
        ],
    },
    {
        "title": "Sverige och naturen",
        "level": "B1",
        "topic": "Natur",
        "content": (
            "Sverige är ett land med mycket natur. Det finns stora skogar, sjöar och fjäll. "
            "Allemansrätten är en viktig del av den svenska kulturen. Den ger alla rätt att röra sig fritt i naturen, "
            "även på privat mark, så länge man inte stör eller förstör. "
            "På sommaren är det ljust nästan hela dygnet i norra Sverige, vilket kallas midnattssol. "
            "Vintern är däremot mörk och kall, men många svenskar tycker om att åka skidor och ägna sig åt friluftsliv även då."
        ),
        "questions": [
            {
                "question": "Vad innebär allemansrätten?",
                "correct_answer": "Rätten att röra sig fritt i naturen",
                "choices": [
                    "Rätten att jaga djur",
                    "Rätten att röra sig fritt i naturen",
                    "Rätten att bygga stugor i skogen",
                    "Rätten att hugga ner träd",
                ],
            },
            {
                "question": "Vad kallas det när det är ljust nästan hela dygnet på sommaren?",
                "correct_answer": "Midnattssol",
                "choices": ["Polarnatt", "Midnattssol", "Sommarsol", "Midnatt"],
            },
            {
                "question": "Vilka naturtyper nämns i texten?",
                "correct_answer": "Skogar, sjöar och fjäll",
                "choices": [
                    "Öar, hav och öken",
                    "Skogar, sjöar och fjäll",
                    "Stäpper och savanner",
                    "Vulkaner och glaciärer",
                ],
            },
            {
                "question": "Vad gör många svenskar på vintern?",
                "correct_answer": "Åker skidor och ägnar sig åt friluftsliv",
                "choices": [
                    "Stannar hemma hela vintern",
                    "Åker till varma länder",
                    "Åker skidor och ägnar sig åt friluftsliv",
                    "Arbetar mer än vanligt",
                ],
            },
        ],
    },
    {
        "title": "Att handla mat i Sverige",
        "level": "A2",
        "topic": "Vardagsliv",
        "content": (
            "I Sverige finns det många olika mataffärer. De vanligaste kedjorna är ICA, Coop och Lidl. "
            "De flesta affärer är öppna sju dagar i veckan, även på helger. "
            "När man handlar tar man ofta en korg eller en vagn. Vid kassan betalar de flesta med kort — "
            "kontanter används allt mer sällan i Sverige. "
            "Många butiker har också självscanning, där kunden skannar varorna själv. "
            "Det är vanligt att ta med sig egna kassar för att minska plastanvändningen."
        ),
        "questions": [
            {
                "question": "Vilka mataffärer nämns i texten?",
                "correct_answer": "ICA, Coop och Lidl",
                "choices": ["Willys, Hemköp och Aldi", "ICA, Coop och Lidl", "Systembolaget och ICA", "Netto och Lidl"],
            },
            {
                "question": "Hur betalar de flesta i Sverige?",
                "correct_answer": "Med kort",
                "choices": ["Med kontanter", "Med kort", "Med swish", "Med check"],
            },
            {
                "question": "Varför tar många med egna kassar?",
                "correct_answer": "För att minska plastanvändningen",
                "choices": [
                    "För att spara pengar",
                    "För att minska plastanvändningen",
                    "För att de är snyggare",
                    "För att affärerna kräver det",
                ],
            },
            {
                "question": "Vad är självscanning?",
                "correct_answer": "Kunden skannar varorna själv",
                "choices": [
                    "En app för att beställa mat",
                    "Kunden skannar varorna själv",
                    "En maskin som packar varorna",
                    "Ett sätt att betala utan kort",
                ],
            },
        ],
    },
    {
        "title": "Hälsa och motion",
        "level": "B1",
        "topic": "Hälsa",
        "content": (
            "Att hålla sig frisk är viktigt för många svenskar. Regelbunden motion, som promenader, cykling eller gym, "
            "är en del av vardagen för många. Sverige har ett väl utbyggt system för sjukvård, "
            "och alla medborgare har rätt till vård oavsett ekonomisk situation. "
            "Friskvård är också vanligt på arbetsplatser — många arbetsgivare erbjuder friskvårdsbidrag "
            "så att anställda kan betala för träning eller andra hälsoaktiviteter. "
            "Stress och psykisk ohälsa är ett växande problem i samhället, och det finns allt mer fokus på "
            "mental hälsa i Sverige."
        ),
        "questions": [
            {
                "question": "Vad är friskvårdsbidrag?",
                "correct_answer": "Pengar från arbetsgivaren för hälsoaktiviteter",
                "choices": [
                    "En typ av sjukförsäkring",
                    "Pengar från arbetsgivaren för hälsoaktiviteter",
                    "Gratis gym från kommunen",
                    "En statlig hälsokontroll",
                ],
            },
            {
                "question": "Vem har rätt till sjukvård i Sverige?",
                "correct_answer": "Alla medborgare oavsett ekonomisk situation",
                "choices": [
                    "Bara de som betalar försäkring",
                    "Alla medborgare oavsett ekonomisk situation",
                    "Bara svenska medborgare",
                    "Bara de som arbetar",
                ],
            },
            {
                "question": "Vilket problem växer i det svenska samhället?",
                "correct_answer": "Stress och psykisk ohälsa",
                "choices": [
                    "Fetma och diabetes",
                    "Stress och psykisk ohälsa",
                    "Hjärtsjukdomar",
                    "Allergier",
                ],
            },
            {
                "question": "Vilka motionsformer nämns i texten?",
                "correct_answer": "Promenader, cykling och gym",
                "choices": [
                    "Simning och löpning",
                    "Promenader, cykling och gym",
                    "Fotboll och tennis",
                    "Yoga och dans",
                ],
            },
        ],
    },
]


def main():
    with Session(engine) as db:
        existing = db.query(ReadingText).count()
        if existing > 0:
            print(f"Already have {existing} reading texts — skipping.")
            return

        for t in TEXTS:
            text = ReadingText(
                title=t["title"],
                level=t["level"],
                topic=t["topic"],
                content=t["content"],
            )
            db.add(text)
            db.flush()

            for q in t["questions"]:
                db.add(ReadingQuestion(
                    text_id=text.id,
                    question=q["question"],
                    correct_answer=q["correct_answer"],
                    choices=q["choices"],
                ))

        db.commit()
        print(f"Done! Seeded {len(TEXTS)} reading texts with questions.")


if __name__ == "__main__":
    main()
