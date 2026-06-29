# AI Knowledge Analyst Copilot

A full-stack RAG (Retrieval-Augmented Generation) platform that lets you upload documents and chat with them using a LangGraph-powered AI pipeline.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11, LangChain, LangGraph |
| Auth & DB | Supabase (PostgreSQL + Auth + Storage) |
| Vector DB | Qdrant |
| LLM | Groq (llama-3.3-70b-versatile) |
| Embeddings | sentence-transformers all-MiniLM-L6-v2 (384-dim) |
| Cache | Redis |
| Containers | Docker + Docker Compose |

## Features

- Upload PDF, DOCX, and TXT documents
- LangGraph RAG pipeline: query rewriting → retrieval → reranking → answer generation → confidence evaluation → fallback
- Document filtering: select specific docs to scope chat context
- Conversation history with inline title editing and delete
- Thumbs up/down feedback on AI responses
- Re-ingest failed documents
- Forgot password / reset password flow
- Rate limiting (30 req/min on chat and upload endpoints)
- Analytics tracking on chat, upload, and delete events
- Mobile-responsive UI with slide-over document sidebar
- Docker Compose for one-command local deployment

## Project Structure

```
AI_Knowledge_Analyst_Copilot/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # chat.py, documents.py
│   │   ├── models/          # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── rag/         # LangGraph nodes, graph, state
│   │   │   ├── embedder.py
│   │   │   ├── ingestion.py
│   │   │   └── vector_store.py
│   │   └── main.py
│   ├── supabase/schema.sql
│   ├── tests/
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages (chat, login, signup, forgot/reset-password)
│   │   ├── components/      # chat, documents, layout, ui
│   │   └── lib/             # api.ts, types.ts, supabase client
│   ├── Dockerfile
│   └── next.config.ts
├── docker-compose.yml
└── qdrant_storage/          # Qdrant persistent data volume
```

## Prerequisites

- Docker and Docker Compose
- Supabase project (get URL + anon key + service role key)
- Groq API key

## Quick Start (Docker)

1. Clone the repo and copy the example env files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

2. Fill in your credentials (see Environment Variables below).

3. Run the Supabase schema:
   - Go to your Supabase project → SQL Editor
   - Paste and run `backend/supabase/schema.sql`

4. Start everything:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Qdrant dashboard: http://localhost:6333/dashboard

## Manual Start (Development)

**Backend:**

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

**Qdrant** (required — run once):

```bash
docker run -d -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

## Environment Variables

**`backend/.env`**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
GROQ_API_KEY=your-groq-api-key
QDRANT_HOST=localhost
QDRANT_PORT=6333
REDIS_URL=redis://localhost:6379
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## RAG Pipeline

```
User query
    │
    ▼
query_rewriter      — expands and clarifies the query
    │
    ▼
retriever           — fetches top-k chunks from Qdrant (384-dim embeddings)
    │
    ▼
reranker            — re-scores chunks by relevance
    │
    ▼
answer_generator    — Groq LLM generates answer with citations
    │
    ▼
confidence_evaluator — scores answer confidence (0–1)
    │
    ├── score < 0.5 and retries < 2 → back to query_rewriter
    │
    └── score ≥ 0.5 or max retries → response returned to user
```

## Running Tests

```bash
cd backend
uv run pytest tests/ -v
```

11 RAG unit tests (reranker, confidence evaluator, routing logic) and 10 ingestion tests (extractor, chunker, embedder).

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/chat/` | Send a message, get an AI answer |
| GET | `/api/v1/chat/conversations` | List conversations |
| GET | `/api/v1/chat/conversations/{id}` | Get conversation with messages |
| PATCH | `/api/v1/chat/conversations/{id}` | Rename a conversation |
| DELETE | `/api/v1/chat/conversations/{id}` | Delete a conversation |
| POST | `/api/v1/chat/messages/{id}/feedback` | Submit thumbs up/down |
| POST | `/api/v1/documents/upload` | Upload a document |
| GET | `/api/v1/documents/` | List documents |
| DELETE | `/api/v1/documents/{id}` | Delete a document |
| POST | `/api/v1/documents/{id}/reingest` | Re-process a failed document |
