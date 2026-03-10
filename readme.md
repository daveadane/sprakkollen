# SpråkKollen

A full-stack Swedish language learning web application built with FastAPI and React. SpråkKollen helps learners at all levels improve their Swedish through interactive exercises, AI-powered feedback, and exam preparation tools.

**Live:** [https://daveadane.space](https://daveadane.space)

---

## Features

| Feature | Description |
|---|---|
| **Grammar Checker** | Submit Swedish text and receive AI-powered grammar and style feedback |
| **Vocabulary Practice** | Flashcard-style drilling with spaced repetition across word categories |
| **Mixed Test** | Randomised quiz combining vocabulary and grammar in one session |
| **Image Quiz** | Identify Swedish vocabulary from images |
| **Dictation** | Listen to Swedish audio and type what you hear |
| **Short Texts** | Read curated Swedish passages with comprehension questions |
| **Book Reader** | Read full Swedish books from Project Gutenberg with AI chapter quizzes |
| **Podcasts** | Browse and listen to Sveriges Radio (SR) podcasts with comprehension quizzes |
| **Speech** | Record yourself speaking Swedish and get pronunciation feedback |
| **Speaking Challenge** | 30-day daily speaking challenge with calendar progress tracking |
| **Exam Practice** | Timed SVA1 and SVA3 mock exams — reading passage + grammar, auto-graded |
| **Progress** | Dashboard tracking scores and activity across all features |

---

## Tech Stack

### Backend
- **Python 3.11** with **FastAPI**
- **SQLAlchemy** ORM + **PostgreSQL** (Supabase in production, SQLite locally)
- **JWT** authentication (python-jose)
- **Anthropic Claude API** (`claude-opus-4-6`) for grammar feedback, quiz generation, and exam question generation
- **Uvicorn** ASGI server

### Frontend
- **React 18** with **Vite**
- **Tailwind CSS** for styling
- **React Router v6** for client-side routing
- **Web Speech API** for speech recognition and synthesis

### Infrastructure
- **AWS EC2** (eu-north-1, Stockholm) — Ubuntu server running Nginx + Supervisor
- **AWS RDS** — managed PostgreSQL database
- **Let's Encrypt** — HTTPS via Certbot

---

## Project Structure

```
webbramverk-l2-daveadane/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/        # One file per feature (grammar.py, podcasts.py, ...)
│   │   │   ├── models.py         # All SQLAlchemy models
│   │   │   ├── db_setup.py       # Engine + session
│   │   │   ├── security.py       # JWT auth helpers
│   │   │   └── auth.py           # Login/register endpoints
│   │   └── main.py               # FastAPI app, CORS, router registration
│   ├── seed_exam_questions.py    # AI-powered exam question generator
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/
        │   ├── public/           # Landing, About, Login, Register
        │   └── app/              # All protected feature pages
        ├── components/
        │   └── nav/              # Sidebar + TopBar
        ├── router/routes.jsx
        ├── state/useAuth.js      # Auth context hook
        └── utils/api.js          # apiFetch() wrapper
```

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

Create `backend/.env`:
```env
SECRET_KEY=your-secret-key-here
DB_URL=sqlite:///./sprakkollen.db
ANTHROPIC_API_KEY=sk-ant-...
CORS_ORIGINS=http://localhost:5173
```

Start the server:
```bash
uvicorn app.main:app --reload
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Start the dev server:
```bash
npm run dev
```

App available at: http://localhost:5173

---

## Database Setup

Tables are created automatically on backend startup. To create them manually:

```bash
cd backend
venv\Scripts\activate
python -c "from app.api.db_setup import engine, Base; from app.api import models; Base.metadata.create_all(bind=engine); print('Done!')"
```

### Seed Exam Questions (AI-generated)

Generates 100 exam questions (10 reading passages + 50 reading Qs + 50 grammar Qs across SVA1 and SVA3) using the Claude API:

```bash
cd backend
python seed_exam_questions.py
```

To seed a remote database without modifying `.env`, pass `DB_URL` as an environment variable:

```powershell
# PowerShell
$env:DB_URL="postgresql+psycopg2://user:pass@host:5432/postgres"
python seed_exam_questions.py
```

```bash
# bash / macOS / Linux
DB_URL="postgresql+psycopg2://user:pass@host:5432/postgres" python seed_exam_questions.py
```

---

## Deployment

Deployed on **AWS EC2** (eu-north-1, Stockholm) with **AWS RDS** PostgreSQL.

### Stack
- **Nginx** — reverse proxy for the API + serves the React `dist/` folder
- **Supervisor** — keeps uvicorn running with 4 workers, auto-restarts on crash
- **Certbot** — automatic HTTPS via Let's Encrypt

### Pushing updates

```bash
ssh -i ~/.ssh/sprokkollen_key.pem ubuntu@13.49.14.153
cd ~/webbramverk-l2-daveadane
git pull origin main

# If Python dependencies changed:
cd backend && source venv/bin/activate && pip install -r requirements.txt

# Restart backend:
sudo supervisorctl restart fastapi

# If frontend changed — rebuild:
cd ../frontend && npm run build

# Check logs:
sudo tail -20 /var/log/fastapi/fastapi.err.log
```

---

## Exam Practice

The Exam Practice feature provides timed mock exams inspired by the Swedish national exam format (Skolverket SVA).

- **SVA1** — Basic level (A2-B1): daily life vocabulary, en/ett articles, simple verb forms
- **SVA3** — Advanced level (B2-C1): work culture, conditional mood, passive voice, complex clauses

Each attempt draws a random reading passage + 5 comprehension questions and 5 grammar questions from the database, so every attempt is different. Results are saved with a full per-question review.

Run `seed_exam_questions.py` to populate the question bank (requires `ANTHROPIC_API_KEY`).

---

## API Overview

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/token` | Login, returns JWT |
| `GET` | `/api/grammar/check` | AI grammar feedback |
| `GET` | `/api/vocab/words` | Vocabulary list |
| `GET` | `/api/podcasts` | SR podcast episodes |
| `GET` | `/api/books` | Short reading texts |
| `GET` | `/api/book-reader/books` | Gutenberg book list |
| `GET` | `/api/exam-practice/exams` | List SVA1/SVA3 exams |
| `GET` | `/api/exam-practice/exams/{level}` | Full exam with questions |
| `POST` | `/api/exam-practice/submit` | Submit answers, get score |
| `GET` | `/api/exam-practice/history` | User's exam history |

Full interactive docs: `https://daveadane.space/docs`

---

## Author

Dawit Adane — Nackademin-PIA25, Web Development 2026