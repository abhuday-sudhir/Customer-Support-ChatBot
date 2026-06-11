# Customer Support ChatBot – AI Live-Chat Agent

A full-stack customer support chat agent with a demo e-commerce FAQ knowledge base.  
Built with **React + TypeScript** (frontend) and **FastAPI + Python** (backend), using **SQLite** by default and **Google Gemini** as the LLM.

## Live Demo

**[https://customer-support-chatbot-ui.onrender.com/](https://customer-support-chatbot-ui.onrender.com/)**

### Render free tier – please read before trying the demo

This app is hosted on [Render](https://render.com/)’s **free tier**. Free web services **spin down after ~15 minutes of inactivity** and must **cold-start** when someone visits again.

- The **first request after idle time can take 30–90 seconds** (sometimes longer). The page may look blank or the first message may appear to hang — this is normal.
- If the backend is also on Render free tier, **both** the UI and API need to wake up.
- Refresh once and wait a moment if nothing loads immediately.

### Gemini API quota (important for reviewers)

The live demo uses the **Google Gemini API** on the **free tier**, which is limited to roughly **20 API calls per day** for this project’s key.

What that means in practice:

- **FAQ shortcut:** Questions that match a known FAQ entry (including the suggested-question chips in the UI) are answered **without calling Gemini**, so they do not count against the daily limit.
- **LLM calls:** Open-ended or paraphrased questions that do not match the FAQ use one Gemini call each.
- Once the daily quota is exhausted, new LLM-backed messages will show a friendly error until the quota resets (typically the next UTC day).
- When testing locally, use **your own** [Gemini API key](https://aistudio.google.com/apikey) so you are not sharing the demo quota.

---

## Project Structure

```
Customer-Support-ChatBot/
├── backend/
│   ├── main.py                   # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   └── src/
│       ├── config.py             # Pydantic settings (env vars)
│       ├── routes/
│       │   ├── chat.py           # POST /chat/message, GET /chat/history/:id
│       │   └── health.py         # GET /health
│       ├── services/
│       │   ├── chat_service.py   # Business logic (persist + FAQ match + LLM)
│       │   └── llm_service.py    # Provider-agnostic LLM wrapper (Gemini default)
│       ├── db/
│       │   ├── database.py       # SQLAlchemy engine + session
│       │   └── seed.py           # FAQ seed script
│       ├── models/
│       │   ├── orm.py            # SQLAlchemy ORM models
│       │   └── schemas.py        # Pydantic request/response schemas
│       ├── middleware/
│       │   └── error_handler.py  # Global exception handler
│       └── utils/
│           └── faq.py            # FAQ knowledge base, matching & prompt builder
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    ├── .env.example
    └── src/
        ├── App.tsx / App.css
        ├── main.tsx
        ├── components/
        │   ├── ChatWindow.tsx    # Main chat panel
        │   ├── Sidebar.tsx       # Conversation history sidebar
        │   ├── MessageBubble.tsx # Single message bubble
        │   ├── TypingIndicator.tsx
        │   ├── MessageInput.tsx
        │   ├── RobotIcon.tsx
        │   └── ErrorBanner.tsx
        ├── hooks/
        │   └── useChat.ts        # Chat state, session & history management
        ├── services/
        │   └── api.ts            # HTTP calls to backend
        └── types/
            └── index.ts
```

---

## Local Setup

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- A **Gemini API key** ([get one free at Google AI Studio](https://aistudio.google.com/apikey))

---

### 1. Clone & navigate

```bash
git clone https://github.com/abhuday-sudhir/Customer-Support-ChatBot.git
cd Customer-Support-ChatBot
```

---

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Edit `backend/.env` — minimum required for local dev:

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
APP_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Database (SQLite – zero config)

Tables and FAQ seed data are **created automatically on first run**. No manual migration step is required for SQLite.

#### Optional: PostgreSQL

```env
DATABASE_URL=postgresql://user:password@localhost:5432/spur_chat
```

Then create the database and run:

```bash
python -m src.db.seed
```

#### Run the backend

```bash
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

---

### 3. Frontend

```bash
cd ../frontend

npm install

# Optional – only needed if the backend is not on localhost:8000
cp .env.example .env
# Leave VITE_API_BASE_URL blank for local dev (Vite proxies /chat and /health to :8000)

npm run dev
```

Open: http://localhost:5173

---

## Configuration Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `LLM_PROVIDER` | No | `anthropic` | Set to `gemini` for this project (`anthropic` or `openai` also supported) |
| `GEMINI_API_KEY` | Yes (if `gemini`) | – | Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name |
| `ANTHROPIC_API_KEY` | If using Anthropic | – | Anthropic API key |
| `OPENAI_API_KEY` | If using OpenAI | – | OpenAI API key |
| `DATABASE_URL` | No | `sqlite:///./spur_chat.db` | SQLAlchemy database URL |
| `CORS_ORIGINS` | No | `http://localhost:5173,...` | Comma-separated allowed frontend origins |
| `LLM_CONTEXT_WINDOW` | No | `20` | Max prior messages sent to the LLM (cost control) |
| `LLM_MAX_TOKENS` | No | `512` | Max tokens per LLM reply |
| `MAX_MESSAGE_LENGTH` | No | `2000` | Hard cap on incoming message length (chars) |
| `APP_ENV` | No | `development` | `development` or `production` |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | No | `` (empty) | Backend URL in production (e.g. your Render backend URL). Leave blank for local dev. |

### Quick configuration checklist

1. **Backend:** copy `.env.example` → `.env`, set `LLM_PROVIDER=gemini` and `GEMINI_API_KEY`.
2. **Frontend (local):** no `.env` needed — Vite proxies API calls to `localhost:8000`.
3. **Frontend (production):** set `VITE_API_BASE_URL` to your deployed backend URL before `npm run build`.
4. **CORS:** add your frontend origin to `CORS_ORIGINS` on the backend (e.g. `https://customer-support-chatbot-ui.onrender.com`).
5. **Start backend first**, then frontend.

---

## API Reference

### `POST /chat/message`

Send a user message and receive an AI reply.

**Request:**
```json
{
  "message": "What is your return policy?",
  "session_id": "optional-existing-session-id"
}
```

**Response:**
```json
{
  "reply": "Items can be returned within 30 days...",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### `GET /chat/history/{session_id}`

Fetch full conversation history (used on page reload).

### `GET /health`

```json
{ "status": "ok", "provider": "gemini" }
```

---

## Architecture Overview

### Request flow

```
HTTP Request
    │
    ▼
routes/chat.py           ← validates input (Pydantic)
    │
    ▼
services/chat_service.py ← session mgmt, DB persistence, FAQ match check
    │                      ├─ FAQ match? → canned answer (no LLM call)
    │                      └─ no match   → llm_service.generate_reply()
    ▼
services/llm_service.py  ← Gemini / Anthropic / OpenAI wrapper
    │
    ▼
utils/faq.py             ← FAQ knowledge base & system-prompt builder
    │
    ▼
db/database.py           ← SQLAlchemy persistence (conversations, messages, FAQ)
```

### Key design decisions

**FAQ-first, LLM-second** – Matching FAQ questions are answered from the database without calling Gemini. This keeps the demo responsive and preserves the limited free-tier quota.

**Provider-agnostic LLM interface** – `generate_reply(history, faq_list)` is the only function the rest of the app calls. Swapping providers is a single branch in `llm_service.py`.

**FAQ in two places** – Hard-coded in `utils/faq.py` (fallback) and seeded to the `faq_entries` DB table. The chat service prefers DB rows.

**Session & history** – `sessionId` is stored in `sessionStorage`; conversation list metadata is in `localStorage`. The sidebar lets users switch between past chats.

**Cost control** – `LLM_CONTEXT_WINDOW` caps history sent to the LLM. FAQ direct matches skip the LLM entirely.

**Graceful errors** – Provider failures (auth, rate limit, timeout) return a friendly fallback message; the conversation is never left broken.

---

## LLM Notes

**Provider (this deployment):** Google Gemini (`gemini-2.5-flash` by default).

**Free-tier limit:** ~20 Gemini API calls per day on the demo key. Plan testing accordingly — use suggested FAQ questions when possible, or run locally with your own key.

**Prompting strategy:**
1. A system prompt is built from the store FAQ and injected on every LLM call.
2. Conversation history (capped at `LLM_CONTEXT_WINDOW`) is passed for context.
3. The model is instructed to answer only from store knowledge and refuse off-topic questions.

**Alternative providers:** Set `LLM_PROVIDER=anthropic` or `openai` and the matching API key in `.env`.

---

## Deployment (Render)

The live UI is deployed at [customer-support-chatbot-ui.onrender.com](https://customer-support-chatbot-ui.onrender.com/).

### Backend (Render Web Service)

| Setting | Value |
|---|---|
| **Root directory** | `backend` |
| **Build command** | `pip install -r requirements.txt` |
| **Start command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

**Environment variables** (set in the Render dashboard):

```
LLM_PROVIDER=gemini
GEMINI_API_KEY=<your-key>
APP_ENV=production
CORS_ORIGINS=https://customer-support-chatbot-ui.onrender.com
DATABASE_URL=<sqlite default works on ephemeral disk; use Render PostgreSQL for persistence>
```

> **Note:** Render’s free-tier filesystem is ephemeral. SQLite data may be lost on redeploy. For persistent conversations in production, attach a PostgreSQL database and set `DATABASE_URL`.

### Frontend (Render Static Site)

| Setting | Value |
|---|---|
| **Root directory** | `frontend` |
| **Build command** | `npm install && npm run build` |
| **Publish directory** | `dist` |

**Environment variable:**

```
VITE_API_BASE_URL=https://<your-backend-service>.onrender.com
```

### Render sleep behaviour

On the **free tier**, both services sleep after inactivity. Expect slow first loads and occasional timeouts right after wake-up. Upgrading to a paid instance disables spin-down.

Pushing to the connected Git branch triggers a redeploy. **README-only changes** will also trigger a rebuild if auto-deploy is enabled, but they do not change runtime behaviour.

---

## Trade-offs & "If I had more time…"

| What | Trade-off / note |
|---|---|
| **Gemini free tier (20 calls/day)** | Fine for a demo; production would need a paid key or heavier FAQ matching to minimise LLM usage. |
| **Render free tier sleep** | Cold starts hurt UX; paid tier or a keep-alive ping would help. |
| **SQLite default** | Zero setup for dev. PostgreSQL recommended on Render for persistent data. |
| **No auth** | Sessions are anonymous. Production would tie chats to user accounts. |
| **No streaming** | Replies arrive all at once. SSE/WebSocket would feel more responsive. |
| **No per-IP rate limiting** | Demo quota can be exhausted by shared traffic; `slowapi` would help in production. |
| **No retry logic** | Transient Gemini errors surface immediately; retries with back-off would help. |

---

## Repository

https://github.com/abhuday-sudhir/Customer-Support-ChatBot
