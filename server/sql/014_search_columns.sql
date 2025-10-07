-- Migration 014: Add search artifacts (columns only)
-- Purpose: Prepare server-side search without enabling triggers yet.
-- Safe: Adds columns; no destructive changes.

-- Required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add columns (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'law_entries' AND column_name = 'search_vec'
  ) THEN
    ALTER TABLE law_entries ADD COLUMN search_vec tsvector;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'law_entries' AND column_name = 'compact_citation'
  ) THEN
    ALTER TABLE law_entries ADD COLUMN compact_citation text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'law_entries' AND column_name = 'ra_number'
  ) THEN
    ALTER TABLE law_entries ADD COLUMN ra_number int;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'law_entries' AND column_name = 'bp_number'
  ) THEN
    ALTER TABLE law_entries ADD COLUMN bp_number int;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'law_entries' AND column_name = 'gr_number'
  ) THEN
    ALTER TABLE law_entries ADD COLUMN gr_number text;
  END IF;
END$$;

-- Backfill search artifacts for existing rows
UPDATE law_entries SET
  search_vec = 
    setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(canonical_citation,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(section_id,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(law_family,'')), 'C') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(tags,' '),'')), 'C') ||
    setweight(to_tsvector('simple', coalesce(summary,'')), 'D') ||
    setweight(to_tsvector('simple', coalesce(text,'')), 'D'),
  compact_citation = regexp_replace(lower(unaccent(coalesce(title,'')||' '||coalesce(canonical_citation,''))), '\s+', '', 'g'),
  ra_number = COALESCE(
    NULLIF((regexp_match(lower(coalesce(canonical_citation,'')), 'ra\.?\s*no\.?\s*(\d+)|republic act\s*(\d+)'))[1], '')::int,
    NULLIF((regexp_match(lower(coalesce(canonical_citation,'')), 'republic\s*act\s*no\.?\s*(\d+)'))[1], '')::int
  ),
  bp_number = (regexp_match(lower(coalesce(canonical_citation,'')), 'b\.?p\.?\s*(blg\.?)?\s*(\d+)'))[2]::int,
  gr_number = COALESCE((regexp_match(lower(coalesce(canonical_citation,'')), 'g\.?r\.?\s*no\.?\s*([0-9-]+)'))[1], NULL)
WHERE TRUE;

-- Note: Triggers to keep these fresh will be added in a separate migration.









