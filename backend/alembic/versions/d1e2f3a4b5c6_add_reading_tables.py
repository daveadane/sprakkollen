"""add reading tables

Revision ID: d1e2f3a4b5c6
Revises: c3d4e5f6a7b8
Create Date: 2026-03-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

revision = 'd1e2f3a4b5c6'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    reading_texts = op.create_table(
        "reading_texts",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("level", sa.String(10), nullable=False),
        sa.Column("topic", sa.String(80), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )

    reading_questions = op.create_table(
        "reading_questions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("text_id", sa.Integer, sa.ForeignKey("reading_texts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question", sa.Text, nullable=False),
        sa.Column("correct_answer", sa.String(200), nullable=False),
        sa.Column("choices", sa.JSON, nullable=False),
    )

    # ── Seed reading texts ─────────────────────────────────────────────────────
    op.bulk_insert(reading_texts, [
        {
            "id": 1,
            "title": "Min dag",
            "content": (
                "Jag heter Anna. Jag bor i Stockholm. Varje morgon vaknar jag klockan sju. "
                "Jag dricker kaffe och äter frukost. Till frukost äter jag macka med ost. "
                "Sedan går jag till jobbet. Jag arbetar på ett kontor. "
                "På lunchen äter jag soppa. På kvällen lagar jag mat hemma. "
                "Jag lagar ofta pasta eller ris med grönsaker. Sedan tittar jag på TV och går och lägger mig."
            ),
            "level": "A1",
            "topic": "Vardag",
        },
        {
            "id": 2,
            "title": "Sverige",
            "content": (
                "Sverige är ett land i norra Europa. Landet har ungefär tio miljoner invånare. "
                "Huvudstaden heter Stockholm och ligger vid vattnet. "
                "Sverige är känt för sin natur med många skogar, sjöar och berg. "
                "På sommaren är det ljust hela natten i norr — det kallas midnattssolen. "
                "På vintern kan det vara mycket kallt och snöigt. "
                "Svenska traditioner inkluderar midsommar, lucia och kräftskiva. "
                "Sverige är också känt för IKEA, Volvo och ABBA."
            ),
            "level": "A2",
            "topic": "Geografi",
        },
        {
            "id": 3,
            "title": "Midsommar",
            "content": (
                "Midsommar är en av Sveriges viktigaste traditioner. Det firas i juni när dagarna är som längst. "
                "Familjer och vänner samlas på landsbygden för att fira tillsammans. "
                "En midsommarstång reses och dekoreras med löv och blommor. "
                "Sedan dansar man runt stången och sjunger visor som Små grodorna. "
                "Det är tradition att plocka sju olika sorters blommor och lägga dem under kudden — "
                "då ska man drömma om sin framtida partner. "
                "Till mat äter man färskpotatis med sill och gräddfil. "
                "Jordgubbar med grädde är en klassisk midsommardessert."
            ),
            "level": "B1",
            "topic": "Traditioner",
        },
        {
            "id": 4,
            "title": "På kafét",
            "content": (
                "Lisa och Erik går till ett kafé på lördagen. De sätter sig vid ett bord nära fönstret. "
                "Servitören kommer fram och frågar vad de vill ha. "
                "Lisa beställer en cappuccino och ett kanelbulle. Erik tar en te och en smörgås. "
                "De pratar om sina planer för helgen. Erik ska besöka sina föräldrar på söndagen. "
                "Lisa ska träna och sedan läsa en bok. "
                "Kaffet är gott och bullen är varm och söt. De stannar på kafét i en timme."
            ),
            "level": "A1",
            "topic": "Vardag",
        },
        {
            "id": 5,
            "title": "Klimat och miljö",
            "content": (
                "Klimatförändringar är ett av vår tids största problem. Jordens temperatur stiger på grund av "
                "utsläpp av växthusgaser som koldioxid och metan. Detta leder till smältande isar, "
                "stigande havsnivåer och extremt väder. "
                "Sverige har satt upp ambitiösa mål för att minska sina utsläpp. "
                "Landet investerar i förnybar energi som vindkraft och solenergi. "
                "Många svenskar väljer också att resa kollektivt eller med cykel istället för bil. "
                "Klimataktivisten Greta Thunberg, som kommer från Sverige, har inspirerat ungdomar "
                "världen över att kämpa för miljön."
            ),
            "level": "B1",
            "topic": "Miljö",
        },
    ])

    # ── Seed questions ────────────────────────────────────────────────────────
    op.bulk_insert(reading_questions, [
        # Text 1 — Min dag (A1)
        {"id": 1,  "text_id": 1, "question": "Vad heter personen i texten?",
         "correct_answer": "Anna",
         "choices": ["Anna", "Erik", "Lisa", "Maria"]},
        {"id": 2,  "text_id": 1, "question": "Vad dricker Anna på morgonen?",
         "correct_answer": "Kaffe",
         "choices": ["Te", "Juice", "Kaffe", "Mjölk"]},
        {"id": 3,  "text_id": 1, "question": "Var arbetar Anna?",
         "correct_answer": "På ett kontor",
         "choices": ["På ett sjukhus", "På ett kontor", "På en skola", "Hemma"]},
        {"id": 4,  "text_id": 1, "question": "Vad äter Anna till lunch?",
         "correct_answer": "Soppa",
         "choices": ["Pasta", "Smörgås", "Soppa", "Sallad"]},

        # Text 2 — Sverige (A2)
        {"id": 5,  "text_id": 2, "question": "Vad heter huvudstaden i Sverige?",
         "correct_answer": "Stockholm",
         "choices": ["Göteborg", "Malmö", "Stockholm", "Uppsala"]},
        {"id": 6,  "text_id": 2, "question": "Vad kallas det när solen inte går ner på sommaren i norr?",
         "correct_answer": "Midnattssolen",
         "choices": ["Polarnatt", "Midnattssolen", "Norrsken", "Sommarsolen"]},
        {"id": 7,  "text_id": 2, "question": "Vilket av dessa är ett känt svenskt företag?",
         "correct_answer": "IKEA",
         "choices": ["IKEA", "BMW", "Samsung", "Nike"]},

        # Text 3 — Midsommar (B1)
        {"id": 8,  "text_id": 3, "question": "När firas midsommar?",
         "correct_answer": "I juni",
         "choices": ["I december", "I mars", "I juni", "I september"]},
        {"id": 9,  "text_id": 3, "question": "Vilken sång sjunger man ofta vid midsommar?",
         "correct_answer": "Små grodorna",
         "choices": ["Helan går", "Små grodorna", "Trollmors vaggsång", "Sverige"]},
        {"id": 10, "text_id": 3, "question": "Vad är en klassisk midsommardessert?",
         "correct_answer": "Jordgubbar med grädde",
         "choices": ["Kladdkaka", "Prinsesstårta", "Jordgubbar med grädde", "Kanelbulle"]},

        # Text 4 — På kafét (A1)
        {"id": 11, "text_id": 4, "question": "Vilket bord väljer Lisa och Erik?",
         "correct_answer": "Vid fönstret",
         "choices": ["Vid dörren", "Vid fönstret", "I mitten", "Utomhus"]},
        {"id": 12, "text_id": 4, "question": "Vad beställer Lisa?",
         "correct_answer": "En cappuccino och ett kanelbulle",
         "choices": ["Te och smörgås", "En cappuccino och ett kanelbulle", "Kaffe och tårta", "Juice och bulle"]},
        {"id": 13, "text_id": 4, "question": "Hur länge stannar de på kafét?",
         "correct_answer": "En timme",
         "choices": ["En halvtimme", "Två timmar", "En timme", "Hela dagen"]},

        # Text 5 — Klimat och miljö (B1)
        {"id": 14, "text_id": 5, "question": "Vad är ett av klimatförändringarnas orsaker?",
         "correct_answer": "Utsläpp av växthusgaser",
         "choices": ["För lite regn", "Utsläpp av växthusgaser", "För många träd", "Havsströmmar"]},
        {"id": 15, "text_id": 5, "question": "Vilken typ av energi investerar Sverige i?",
         "correct_answer": "Vindkraft och solenergi",
         "choices": ["Kärnkraft", "Kolkraft", "Vindkraft och solenergi", "Vattenkraft"]},
        {"id": 16, "text_id": 5, "question": "Vad heter den svenska klimataktivisten som nämns i texten?",
         "correct_answer": "Greta Thunberg",
         "choices": ["Greta Thunberg", "Malala Yousafzai", "Emma Carlsson", "Anna Lindh"]},
    ])


def downgrade() -> None:
    op.drop_table("reading_questions")
    op.drop_table("reading_texts")
