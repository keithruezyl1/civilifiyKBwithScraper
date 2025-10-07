-- Slim down kb_entries to a pragmatic middle-ground schema
-- KEEP: entry_id, type, canonical_citation, title, text, entry_subtype,
--       created_by, created_at, updated_at, batch_release_id, published_at,
--       provenance, source_urls, section_id, status, embedding, fts, visibility
-- DROP: summary, tags, jurisdiction, law_family, subtype_fields and the long tail

-- 1) Drop fts first to avoid dependency errors when removing columns it referenced
ALTER TABLE kb_entries
  DROP COLUMN IF EXISTS fts;

-- 2) Drop legacy/unused columns (idempotent)
ALTER TABLE kb_entries
  DROP COLUMN IF EXISTS summary,
  DROP COLUMN IF EXISTS tags,
  DROP COLUMN IF EXISTS jurisdiction,
  DROP COLUMN IF EXISTS law_family,
  DROP COLUMN IF EXISTS subtype_fields,
  DROP COLUMN IF EXISTS elements,
  DROP COLUMN IF EXISTS penalties,
  DROP COLUMN IF EXISTS defenses,
  DROP COLUMN IF EXISTS triggers,
  DROP COLUMN IF EXISTS time_limits,
  DROP COLUMN IF EXISTS required_forms,
  DROP COLUMN IF EXISTS circular_no,
  DROP COLUMN IF EXISTS applicability,
  DROP COLUMN IF EXISTS issuance_no,
  DROP COLUMN IF EXISTS instrument_no,
  DROP COLUMN IF EXISTS supersedes,
  DROP COLUMN IF EXISTS steps_brief,
  DROP COLUMN IF EXISTS forms_required,
  DROP COLUMN IF EXISTS failure_states,
  DROP COLUMN IF EXISTS violation_code,
  DROP COLUMN IF EXISTS violation_name,
  DROP COLUMN IF EXISTS license_action,
  DROP COLUMN IF EXISTS fine_schedule,
  DROP COLUMN IF EXISTS apprehension_flow,
  DROP COLUMN IF EXISTS incident,
  DROP COLUMN IF EXISTS phases,
  DROP COLUMN IF EXISTS forms,
  DROP COLUMN IF EXISTS handoff,
  DROP COLUMN IF EXISTS rights_callouts,
  DROP COLUMN IF EXISTS rights_scope,
  DROP COLUMN IF EXISTS advice_points,
  DROP COLUMN IF EXISTS topics,
  DROP COLUMN IF EXISTS jurisprudence,
  DROP COLUMN IF EXISTS legal_bases,
  DROP COLUMN IF EXISTS related_sections;

-- 3) Ensure source_urls and visibility exist
ALTER TABLE kb_entries
  ADD COLUMN IF NOT EXISTS source_urls jsonb DEFAULT '[]'::jsonb;

ALTER TABLE kb_entries
  ADD COLUMN IF NOT EXISTS visibility jsonb DEFAULT '["GLI","CPA"]'::jsonb;

-- 4) Recreate a simplified FTS column (without summary dependency) and index
ALTER TABLE kb_entries
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(canonical_citation, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(text, '')), 'C')
  ) STORED;

DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS kb_entries_fts_gin ON kb_entries USING gin (fts);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping kb_entries_fts_gin creation: %', SQLERRM;
  END;
END $$;




