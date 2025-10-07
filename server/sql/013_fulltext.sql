-- Full-text search support for kb_entries
-- Uses a generated tsvector column with weighted fields and a GIN index

-- Optional helper extension; on some managed DBs this may not be available. Ignore failures.
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS unaccent;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping unaccent extension creation: %', SQLERRM;
  END;
END $$;

-- Add generated column for full-text search (idempotent)
alter table if exists kb_entries
  add column if not exists fts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(canonical_citation, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(rule_no, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(section_no, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(text, '')), 'C')
  ) stored;

-- Index to accelerate ts_rank_cd() queries
-- On low-memory managed Postgres, index build may fail due to maintenance_work_mem.
-- Wrap in a DO block so failures are non-fatal; the app will still function without this index.
DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS kb_entries_fts_gin ON kb_entries USING gin (fts);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping kb_entries_fts_gin creation: %', SQLERRM;
  END;
END $$;


