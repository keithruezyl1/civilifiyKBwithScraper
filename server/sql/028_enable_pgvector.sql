-- Ensure pgvector is available and the kb_entries embedding column/index exist
-- All statements are idempotent.
-- Note: If pgvector is not installed on this Postgres instance, the CREATE EXTENSION
-- will fail. The Node setup script will catch and log the error and continue.

-- 1) Enable pgvector extension (Postgres 15+ with pgvector installed)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2) Ensure embedding column exists (requires vector type)
ALTER TABLE IF EXISTS kb_entries
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3) Ensure vector index for KNN search exists
CREATE INDEX IF NOT EXISTS kb_entries_embedding_ivff
  ON kb_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);



