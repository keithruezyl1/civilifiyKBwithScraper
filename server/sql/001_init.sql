-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- Try to enable pgvector extension (requires Postgres >= 15 with pgvector installed)
-- If pgvector is not available, embedding features will be disabled
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
  RAISE NOTICE 'pgvector extension enabled';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgvector extension not available - embedding features will be disabled: %', SQLERRM;
END $$;

-- Users table for authentication
create table if not exists users (
  id serial primary key,
  username varchar(50) unique not null,
  password_hash varchar(255) not null,
  name varchar(100) not null,
  person_id varchar(10) not null, -- P1, P2, P3, P4, P5
  role varchar(20) default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insert default team members
insert into users (username, password_hash, name, person_id, role) values
  ('arda', '$2b$10$rQZ8K9mN2pL3vX1yU7wE4t', 'Arda', 'P1', 'user'),
  ('deloscientos', '$2b$10$rQZ8K9mN2pL3vX1yU7wE4t', 'Delos Cientos', 'P2', 'user'),
  ('paden', '$2b$10$rQZ8K9mN2pL3vX1yU7wE4t', 'Paden', 'P3', 'user'),
  ('sendrijas', '$2b$10$rQZ8K9mN2pL3vX1yU7wE4t', 'Sendrijas', 'P4', 'user'),
  ('tagarao', '$2b$10$rQZ8K9mN2pL3vX1yU7wE4t', 'Tagarao', 'P5', 'user')
on conflict (username) do nothing;

-- Use dimensions matching model: text-embedding-3-small = 1536 dims
-- If using text-embedding-3-small (1536), adjust accordingly and set env OPENAI_EMBEDDING_MODEL
-- Create table with conditional embedding column based on pgvector availability
DO $$
BEGIN
  -- Check if vector type exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
    -- Create table with embedding column
    CREATE TABLE IF NOT EXISTS kb_entries (
  entry_id text primary key,
  type text not null,
  title text not null,
  canonical_citation text,
  summary text,
  text text,
      tags text[],
  jurisdiction text,
  law_family text,
  created_by integer references users(id),
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

    -- For KNN search (only if vector extension is available)
    CREATE INDEX IF NOT EXISTS kb_entries_embedding_ivff ON kb_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  ELSE
    -- Create table without embedding column
    CREATE TABLE IF NOT EXISTS kb_entries (
      entry_id text primary key,
      type text not null,
      title text not null,
      canonical_citation text,
      summary text,
      text text,
      tags text[],
      jurisdiction text,
      law_family text,
      created_by integer references users(id),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    RAISE NOTICE 'kb_entries created without embedding column (pgvector not available)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If table already exists, that's fine
  IF SQLSTATE = '42P07' THEN
    RAISE NOTICE 'kb_entries table already exists';
  ELSE
    RAISE;
  END IF;
END $$;

-- Helpful GIN index on tags (works for TEXT[] via default gin array ops)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_entries' AND column_name = 'tags'
  ) THEN
    BEGIN
      CREATE INDEX IF NOT EXISTS kb_entries_tags_gin ON kb_entries USING gin (tags);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping kb_entries_tags_gin: %', SQLERRM;
    END;
  END IF;
END $$;

-- Index for user tracking
create index if not exists kb_entries_created_by_idx on kb_entries(created_by);
create index if not exists kb_entries_created_at_idx on kb_entries(created_at);



