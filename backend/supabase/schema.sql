-- ============================================================
-- AI Knowledge Analyst Copilot - Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- DOCUMENTS
-- ============================================================
create table public.documents (
    id          uuid primary key default uuid_generate_v4(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    filename    text not null,
    file_type   text not null,
    file_size   bigint not null,
    storage_path text,                          -- Supabase Storage path
    status      text not null default 'pending' -- pending | processing | ready | failed
                check (status in ('pending', 'processing', 'ready', 'failed')),
    chunk_count int not null default 0,
    error_msg   text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- ============================================================
-- CHUNKS
-- ============================================================
create table public.chunks (
    id              uuid primary key default uuid_generate_v4(),
    document_id     uuid not null references public.documents(id) on delete cascade,
    user_id         uuid not null references auth.users(id) on delete cascade,
    chunk_index     int not null,
    content         text not null,
    page_number     int,
    token_count     int,
    qdrant_point_id uuid,                       -- matching point ID in Qdrant
    created_at      timestamptz not null default now()
);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
create table public.conversations (
    id         uuid primary key default uuid_generate_v4(),
    user_id    uuid not null references auth.users(id) on delete cascade,
    title      text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- MESSAGES
-- ============================================================
create table public.messages (
    id              uuid primary key default uuid_generate_v4(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    user_id         uuid not null references auth.users(id) on delete cascade,
    role            text not null check (role in ('user', 'assistant')),
    content         text not null,
    citations       jsonb default '[]',         -- [{document_id, filename, page_number, chunk_text, score}]
    confidence      float,
    tokens_used     int,
    created_at      timestamptz not null default now()
);

-- ============================================================
-- FEEDBACK
-- ============================================================
create table public.feedback (
    id         uuid primary key default uuid_generate_v4(),
    user_id    uuid not null references auth.users(id) on delete cascade,
    message_id uuid not null references public.messages(id) on delete cascade,
    rating     int not null check (rating in (1, -1)),  -- 1 = thumbs up, -1 = thumbs down
    comment    text,
    created_at timestamptz not null default now(),
    unique (user_id, message_id)
);

-- ============================================================
-- ANALYTICS
-- ============================================================
create table public.analytics (
    id                uuid primary key default uuid_generate_v4(),
    user_id           uuid not null references auth.users(id) on delete cascade,
    event_type        text not null,             -- query | upload | delete | feedback
    document_id       uuid references public.documents(id) on delete set null,
    conversation_id   uuid references public.conversations(id) on delete set null,
    metadata          jsonb default '{}',
    created_at        timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index on public.documents(user_id);
create index on public.documents(status);
create index on public.chunks(document_id);
create index on public.chunks(user_id);
create index on public.chunks(qdrant_point_id);
create index on public.conversations(user_id);
create index on public.messages(conversation_id);
create index on public.messages(user_id);
create index on public.feedback(message_id);
create index on public.analytics(user_id);
create index on public.analytics(event_type);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_documents_updated_at
    before update on public.documents
    for each row execute function public.set_updated_at();

create trigger trg_conversations_updated_at
    before update on public.conversations
    for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.documents    enable row level security;
alter table public.chunks       enable row level security;
alter table public.conversations enable row level security;
alter table public.messages     enable row level security;
alter table public.feedback     enable row level security;
alter table public.analytics    enable row level security;

-- Documents: users see only their own
create policy "users_own_documents" on public.documents
    for all using (auth.uid() = user_id);

-- Chunks: users see only their own
create policy "users_own_chunks" on public.chunks
    for all using (auth.uid() = user_id);

-- Conversations: users see only their own
create policy "users_own_conversations" on public.conversations
    for all using (auth.uid() = user_id);

-- Messages: users see only their own
create policy "users_own_messages" on public.messages
    for all using (auth.uid() = user_id);

-- Feedback: users see only their own
create policy "users_own_feedback" on public.feedback
    for all using (auth.uid() = user_id);

-- Analytics: users see only their own
create policy "users_own_analytics" on public.analytics
    for all using (auth.uid() = user_id);
