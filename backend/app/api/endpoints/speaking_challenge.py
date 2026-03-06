import traceback

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.db_setup import get_db
from app.api.models import SpeakingChallengeSession, User
from app.api.endpoints.auth import get_current_user
from app.api.settings import settings

router = APIRouter(tags=["speaking_challenge"])

# ---------------------------------------------------------------------------
# 30 daily prompts — progressively more challenging
# ---------------------------------------------------------------------------
PROMPTS = [
    # Days 1–5: Introductions & basics
    {"prompt": "Introduce yourself in Swedish. Say your name, where you are from, and how old you are.", "tip": "Try: 'Jag heter... Jag kommer från... Jag är ... år gammal.'"},
    {"prompt": "Describe your family in Swedish. Who do they are, what do they look like?", "tip": "Try: 'Min familj har... Min mamma heter... Hon är...'"},
    {"prompt": "Talk about your daily routine in Swedish. What do you do every morning?", "tip": "Try present tense: 'Jag vaknar klockan... Sedan...'"},
    {"prompt": "Describe the weather today and your favourite season in Swedish.", "tip": "Try: 'Idag är det... Min favoritårstid är... för att...'"},
    {"prompt": "Talk about what you ate today in Swedish — breakfast, lunch, or dinner.", "tip": "Try: 'Till frukost åt jag... Det var... Det smakade...'"},

    # Days 6–10: Places & surroundings
    {"prompt": "Describe your home in Swedish. How many rooms does it have? What does it look like?", "tip": "Try: 'Jag bor i... Det finns... rum. Mitt favoritrum är...'"},
    {"prompt": "Talk about your city or neighbourhood in Swedish. What is special about it?", "tip": "Try: 'Jag bor i... Det finns... Det är nära...'"},
    {"prompt": "Describe a place you love to visit in Swedish — a park, café, or city.", "tip": "Try: 'Jag älskar att gå till... Det är... Där kan man...'"},
    {"prompt": "Give directions in Swedish from your home to the nearest shop or school.", "tip": "Try: 'Gå rakt fram... Sväng vänster/höger vid... Det tar... minuter.'"},
    {"prompt": "Describe a typical Swedish thing you have seen or experienced.", "tip": "Try: 'Jag tyckte att... Det var intressant att... I Sverige verkar...'"},

    # Days 11–15: Preferences & opinions
    {"prompt": "Talk about your favourite food in Swedish. Why do you like it?", "tip": "Try: 'Min favoritmat är... Det är... Jag tycker om det för att...'"},
    {"prompt": "Describe your favourite hobby or free-time activity in Swedish.", "tip": "Try: 'På fritiden brukar jag... Det är... för mig därför att...'"},
    {"prompt": "Talk about a film or book you like in Swedish. What is it about?", "tip": "Try: 'Jag gillar filmen/boken... Den handlar om... Jag tycker att...'"},
    {"prompt": "Share your opinion about learning Swedish — what is easy and what is hard?", "tip": "Try: 'Det är lätt att... men svårt att... Jag övar på...'"},
    {"prompt": "Describe your favourite time of day in Swedish and what you usually do then.", "tip": "Try: 'Min favoritdel av dagen är... Då brukar jag... Det är lugnt/roligt...'"},

    # Days 16–20: Past events & stories
    {"prompt": "Describe what you did last weekend in Swedish.", "tip": "Use past tense: 'I helgen... Jag gick/åt/såg... Det var kul att...'"},
    {"prompt": "Share a childhood memory in Swedish — something fun you did as a child.", "tip": "Try: 'När jag var liten... Jag minns att... Det var...'"},
    {"prompt": "Tell a short story in Swedish about something funny or interesting that happened to you.", "tip": "Try: 'En gång... Jag var på väg till... Plötsligt...'"},
    {"prompt": "Describe a trip or holiday you have taken in Swedish.", "tip": "Try: 'Jag har rest till... Det var... Vi besökte... Det bästa var...'"},
    {"prompt": "Talk about a challenge you overcame in Swedish — something difficult you managed to do.", "tip": "Try: 'Det var svårt för mig att... Men jag övade och... Nu kan jag...'"},

    # Days 21–25: Abstract topics
    {"prompt": "Talk about your dreams and goals for the future in Swedish.", "tip": "Try future tense: 'I framtiden vill jag... Jag hoppas att... Min dröm är...'"},
    {"prompt": "Describe what makes you happy in Swedish — people, things, or moments.", "tip": "Try: 'Jag blir glad när... Det som gör mig lycklig är... Till exempel...'"},
    {"prompt": "Talk about a person who inspires you in Swedish and why.", "tip": "Try: 'Jag beundrar... för att han/hon... Det inspirerar mig att...'"},
    {"prompt": "Describe the differences between Sweden and your home country in Swedish.", "tip": "Try: 'I Sverige är det... men i mitt hemland är det... Jag tycker att...'"},
    {"prompt": "Give your opinion on a Swedish tradition — like Midsommar, fika, or Lucia — in Swedish.", "tip": "Try: 'Jag tycker att... är en fin tradition. Det handlar om... Det är intressant att...'"},

    # Days 26–30: Complex conversation
    {"prompt": "Discuss the importance of learning languages in Swedish.", "tip": "Try: 'Jag tror att det är viktigt att lära sig språk för att... Det hjälper en att...'"},
    {"prompt": "Talk about what you would do if you lived in Sweden for a year — in Swedish.", "tip": "Try conditional: 'Om jag bodde i Sverige... skulle jag... Det vore kul att...'"},
    {"prompt": "Describe your perfect day in Sweden from morning to night — in Swedish.", "tip": "Try: 'Min perfekta dag i Sverige skulle börja med... Sedan... På kvällen...'"},
    {"prompt": "Give a short speech in Swedish encouraging other beginners to keep learning.", "tip": "Try: 'Hej alla! Jag vill säga att... Det är svårt ibland men... Ni kan göra det!'"},
    {"prompt": "Speak freely for one minute in Swedish about anything you want — your thoughts, your day, your dreams.", "tip": "This is your moment — just speak! Use everything you have learned. Lycka till!"},
]


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class ChallengeStatusOut(BaseModel):
    completed_days: list[int]
    next_day: int
    total_completed: int


class ChallengeDayOut(BaseModel):
    day: int
    prompt: str
    tip: str
    already_completed: bool


class ChallengeSubmitIn(BaseModel):
    transcript: str


class ChallengeResultOut(BaseModel):
    day: int
    feedback: str
    transcript: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_feedback(prompt: str, transcript: str) -> str:
    """Call Claude to get feedback on the speaking transcript."""
    if not settings.ANTHROPIC_API_KEY:
        return "AI feedback is not configured. Great job completing today's challenge!"

    try:
        import anthropic
    except ImportError:
        return "AI feedback package not available. Great job completing today's challenge!"

    user_prompt = (
        f"You are a friendly Swedish language tutor evaluating a student's speaking practice.\n\n"
        f"Today's prompt: \"{prompt}\"\n"
        f"Student's transcript (captured by speech recognition): \"{transcript}\"\n\n"
        f"Give 3–5 sentences of helpful feedback in English:\n"
        f"- Note what they did well (vocabulary, grammar, effort)\n"
        f"- Point out 1–2 specific improvements (a grammar mistake, a better word choice)\n"
        f"- If the transcript is very short or empty, gently encourage them to try again tomorrow\n"
        f"- End with a motivating sentence\n\n"
        f"Be warm and encouraging. This is private practice — they are brave for trying!"
    )

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        for model in ("claude-opus-4-6", "claude-3-5-sonnet-20241022"):
            try:
                response = client.messages.create(
                    model=model,
                    max_tokens=350,
                    messages=[{"role": "user", "content": user_prompt}],
                )
                return response.content[0].text.strip()
            except Exception:
                traceback.print_exc()
                continue
        return "Could not generate AI feedback right now. Well done for completing the challenge!"
    except Exception:
        traceback.print_exc()
        return "Could not generate AI feedback right now. Well done for completing the challenge!"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get("/speaking-challenge/status", response_model=ChallengeStatusOut)
def get_challenge_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(SpeakingChallengeSession)
        .filter(SpeakingChallengeSession.user_id == current_user.id)
        .all()
    )
    completed_days = sorted({s.challenge_day for s in sessions})
    next_day = 1
    for d in range(1, 31):
        if d not in completed_days:
            next_day = d
            break
    return ChallengeStatusOut(
        completed_days=completed_days,
        next_day=next_day,
        total_completed=len(completed_days),
    )


@router.get("/speaking-challenge/{day}", response_model=ChallengeDayOut)
def get_challenge_day(
    day: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if day < 1 or day > 30:
        raise HTTPException(status_code=404, detail="Day must be between 1 and 30.")

    existing = (
        db.query(SpeakingChallengeSession)
        .filter(
            SpeakingChallengeSession.user_id == current_user.id,
            SpeakingChallengeSession.challenge_day == day,
        )
        .first()
    )

    p = PROMPTS[day - 1]
    return ChallengeDayOut(
        day=day,
        prompt=p["prompt"],
        tip=p["tip"],
        already_completed=existing is not None,
    )


@router.post("/speaking-challenge/{day}/submit", response_model=ChallengeResultOut)
def submit_challenge_day(
    day: int,
    body: ChallengeSubmitIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if day < 1 or day > 30:
        raise HTTPException(status_code=404, detail="Day must be between 1 and 30.")

    existing = (
        db.query(SpeakingChallengeSession)
        .filter(
            SpeakingChallengeSession.user_id == current_user.id,
            SpeakingChallengeSession.challenge_day == day,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You have already completed this day.")

    transcript = body.transcript.strip()
    if not transcript:
        raise HTTPException(status_code=422, detail="Transcript cannot be empty.")

    p = PROMPTS[day - 1]
    feedback = _get_feedback(p["prompt"], transcript)

    session = SpeakingChallengeSession(
        user_id=current_user.id,
        challenge_day=day,
        transcript=transcript,
        ai_feedback=feedback,
    )
    db.add(session)
    db.commit()

    return ChallengeResultOut(day=day, feedback=feedback, transcript=transcript)
