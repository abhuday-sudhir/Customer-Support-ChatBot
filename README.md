# Spur Chat – AI Live-Chat Support Agent

A full-stack mini customer support chat agent with a demo e-commerce FAQ knowledge base.  
Built with **React + TypeScript** (frontend) and **FastAPI + Python** (backend), using **SQLite** by default and **Anthropic Claude** (or OpenAI) as the LLM.

---

## Project Structure

```
spur-chat/
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
│       │   ├── chat_service.py   # Business logic (persist + LLM call)
│       │   └── llm_service.py    # Provider-agnostic LLM wrapper
│       ├── db/
│       │   ├── database.py       # SQLAlchemy engine + session
│       │   └── seed.py           # FAQ seed script
│       ├── models/
│       │   ├── orm.py            # SQLAlchemy ORM models
│       │   └── schemas.py        # Pydantic request/response schemas
│       ├── middleware/
│       │   └── error_handler.py  # Global exception handler
│       └── utils/
│           └── faq.py            # FAQ knowledge base + prompt builder
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    ├── .env.example
    └── src/
        ├── App.tsx / App.css
        ├── main.tsx
        ├── components/
        │   ├── ChatWindow.tsx/css   # Main chat panel
        │   ├── MessageBubble.tsx    # Single message bubble
        │   ├── TypingIndicator.tsx  # Animated "agent is typing"
        │   ├── MessageInput.tsx     # Textarea + send button
        │   └── ErrorBanner.tsx      # Error display
        ├── hooks/
        │   └── useChat.ts           # All chat state & logic
        ├── services/
        │   └── api.ts               # HTTP calls to backend
        └── types/
            └── index.ts             # Shared TypeScript types
```

---

## Local Setup

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**

---

### 1. Clone & navigate

```bash
git clone <your-repo-url>
cd spur-chat
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
# Edit .env and set ANTHROPIC_API_KEY (or OPENAI_API_KEY + LLM_PROVIDER=openai)
```

#### Database setup (SQLite – zero config)

The database and tables are **created automatically on first run**.  
The FAQ is seeded automatically too. No manual migration step required for SQLite.

#### To use PostgreSQL instead

```bash
# In .env:
DATABASE_URL=postgresql://user:password@localhost:5432/spur_chat

# Create the DB, then run:
python -m src.db.seed    # seeds FAQ entries
```

#### Run the backend

```bash
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

### 3. Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# (Optional) configure API base URL if running backend on a different host
cp .env.example .env
# Leave VITE_API_BASE_URL blank to use the Vite dev proxy (recommended)

# Start dev server
npm run dev
```

Open: http://localhost:5173

---

### 4. Environment Variables

#### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | If using Anthropic | – | Your Anthropic API key |
| `OPENAI_API_KEY` | If using OpenAI | – | Your OpenAI API key |
| `LLM_PROVIDER` | No | `anthropic` | `anthropic` or `openai` |
| `DATABASE_URL` | No | `sqlite:///./spur_chat.db` | SQLAlchemy DB URL |
| `CORS_ORIGINS` | No | `http://localhost:5173,...` | Comma-separated allowed origins |
| `LLM_CONTEXT_WINDOW` | No | `20` | Max prior messages sent to LLM (cost control) |
| `LLM_MAX_TOKENS` | No | `512` | Max tokens per LLM reply |
| `MAX_MESSAGE_LENGTH` | No | `2000` | Hard cap on incoming message length (chars) |
| `APP_ENV` | No | `development` | `development` or `production` |

#### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | No | `` (empty) | Backend URL for production deployments |

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

Fetch full conversation history. Used on page reload.

**Response:**
```json
{
  "id": "550e8400-...",
  "created_at": "2026-06-10T10:00:00Z",
  "messages": [
    { "id": "...", "sender": "user", "text": "...", "created_at": "..." },
    { "id": "...", "sender": "ai",   "text": "...", "created_at": "..." }
  ]
}
```

### `GET /health`

```json
{ "status": "ok", "provider": "anthropic" }
```

---

## Architecture Overview

### Backend layers

```
HTTP Request
    │
    ▼
routes/chat.py          ← validates input (Pydantic), routes to service
    │
    ▼
services/chat_service.py ← business logic: session mgmt, DB persistence,
    │                       history assembly, LLM delegation
    ▼
services/llm_service.py  ← provider-agnostic LLM wrapper
    │                       (Anthropic / OpenAI, error normalisation)
    ▼
utils/faq.py             ← FAQ knowledge base, system-prompt builder
    │
    ▼
db/database.py + models/orm.py  ← SQLAlchemy persistence
```

### Key design decisions

**Separation of concerns** – routes know nothing about the LLM; the LLM service knows nothing about the DB. Each layer has one job.

**Provider-agnostic LLM interface** – `generate_reply(history, faq_list)` is the only function the rest of the app calls. Swapping providers (or adding a new one) is a single `if/elif` block in `llm_service.py`. Same pattern that would let us plug in WhatsApp/Instagram channels later.

**FAQ in two places** – The FAQ is hard-coded in `utils/faq.py` (always available, zero setup) and also seeded to the `faq_entries` DB table. The chat service prefers the DB rows; if the table is empty it falls back to the hard-coded list. This means the knowledge base can be managed via the DB without a code deploy.

**Graceful error handling** – `LLMError` is the single exception type for all provider errors. It is caught in `chat_service.py` and turned into a friendly fallback message; the conversation is never left in a broken state.

**Cost control** – `LLM_CONTEXT_WINDOW` caps how many prior messages are sent to the LLM (default 20). `LLM_MAX_TOKENS` caps reply length (default 512). Both are env-configurable.

**Session persistence** – `sessionId` is stored in `localStorage` on the client. On reload, the frontend calls `GET /chat/history/:id` and restores the full message list.

---

## LLM Notes

**Provider:** Anthropic Claude (`claude-sonnet-4-20250514` by default).  
Switch to OpenAI by setting `LLM_PROVIDER=openai` and `OPENAI_API_KEY` in `.env`.

**Prompting strategy:**
1. A system prompt is built from the store FAQ and injected on every call.
2. The full conversation history (capped at `LLM_CONTEXT_WINDOW` messages) is passed so replies are contextual.
3. The model is instructed to answer only from the provided knowledge, stay concise, and direct unknown queries to human support.

**Guardrails:**
- All provider-specific exceptions (auth, rate-limit, timeout, connection) are caught and normalised to a friendly error message.
- Empty messages are rejected at the Pydantic validation layer.
- Long messages are silently truncated to `MAX_MESSAGE_LENGTH` characters rather than rejected, so the agent always responds.

---

## Trade-offs & "If I had more time…"

| What | Trade-off / note |
|---|---|
| **SQLite default** | Zero setup, great for dev/demo. Would use PostgreSQL in production for connection pooling and concurrent writes. |
| **No auth** | Not required by spec. In production, sessions would be tied to a user ID or at minimum a signed cookie. |
| **In-memory FAQ fallback** | Convenient, but means a code deploy is needed to update FAQ if DB is empty. Ideally an admin UI would manage the `faq_entries` table. |
| **No streaming** | Replies arrive all at once. Streaming (SSE / WebSocket) would feel much more responsive and is the natural next step. |
| **No retry logic** | LLM errors surface immediately. Exponential back-off with 1–2 retries would improve resilience against transient rate limits. |
| **No rate limiting** | The backend has no per-IP rate limiting. In production, add a middleware (e.g. `slowapi`) to prevent abuse. |
| **Context window trim** | Oldest messages are simply dropped. A smarter strategy (e.g. summarise older turns) would retain more context at the same cost. |
| **No WebSocket** | HTTP polling via individual POST requests. For a production chat product, a WebSocket or SSE channel would be used. |

---

## Deployment

### Backend (Render / Railway / Fly.io)

```bash
# Start command:
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set all environment variables in the platform dashboard. Use a PostgreSQL add-on and set `DATABASE_URL` accordingly.

### Frontend (Vercel / Netlify)

```bash
# Build command:
npm run build

# Publish directory:
dist

# Environment variable:
VITE_API_BASE_URL=https://your-backend-url.onrender.com
```
