-- Ensure all enrichment-related columns exist on kb_entries (idempotent)
-- Safe to run repeatedly; adds columns only if missing

DO $$
BEGIN
  -- Core identification and status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='entry_subtype') THEN
    ALTER TABLE kb_entries ADD COLUMN entry_subtype TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='section_id') THEN
    ALTER TABLE kb_entries ADD COLUMN section_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='status') THEN
    ALTER TABLE kb_entries ADD COLUMN status TEXT DEFAULT 'unreleased';
  END IF;

  -- Enrichment fields (summary removed per user request)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='tags') THEN
    ALTER TABLE kb_entries ADD COLUMN tags TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='jurisdiction') THEN
    ALTER TABLE kb_entries ADD COLUMN jurisdiction TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='law_family') THEN
    ALTER TABLE kb_entries ADD COLUMN law_family TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='key_concepts') THEN
    ALTER TABLE kb_entries ADD COLUMN key_concepts TEXT[];
  END IF;

  -- Textual metadata fields used in inserts
  PERFORM 1;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='applicability') THEN ALTER TABLE kb_entries ADD COLUMN applicability TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='penalties') THEN ALTER TABLE kb_entries ADD COLUMN penalties TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='defenses') THEN ALTER TABLE kb_entries ADD COLUMN defenses TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='time_limits') THEN ALTER TABLE kb_entries ADD COLUMN time_limits TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='required_forms') THEN ALTER TABLE kb_entries ADD COLUMN required_forms TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='elements') THEN ALTER TABLE kb_entries ADD COLUMN elements TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='triggers') THEN ALTER TABLE kb_entries ADD COLUMN triggers TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='violation_code') THEN ALTER TABLE kb_entries ADD COLUMN violation_code TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='violation_name') THEN ALTER TABLE kb_entries ADD COLUMN violation_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='fine_schedule') THEN ALTER TABLE kb_entries ADD COLUMN fine_schedule TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='license_action') THEN ALTER TABLE kb_entries ADD COLUMN license_action TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='apprehension_flow') THEN ALTER TABLE kb_entries ADD COLUMN apprehension_flow TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='incident') THEN ALTER TABLE kb_entries ADD COLUMN incident TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='phases') THEN ALTER TABLE kb_entries ADD COLUMN phases TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='forms') THEN ALTER TABLE kb_entries ADD COLUMN forms TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='handoff') THEN ALTER TABLE kb_entries ADD COLUMN handoff TEXT; END IF;

  -- Constitution array fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='rights_callouts') THEN
    ALTER TABLE kb_entries ADD COLUMN rights_callouts TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='rights_scope') THEN
    ALTER TABLE kb_entries ADD COLUMN rights_scope TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='advice_points') THEN
    ALTER TABLE kb_entries ADD COLUMN advice_points TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='jurisprudence') THEN
    ALTER TABLE kb_entries ADD COLUMN jurisprudence TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='legal_bases') THEN
    ALTER TABLE kb_entries ADD COLUMN legal_bases TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='related_sections') THEN
    ALTER TABLE kb_entries ADD COLUMN related_sections TEXT[];
  END IF;

  -- Dates
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='effective_date') THEN
    ALTER TABLE kb_entries ADD COLUMN effective_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='amendment_date') THEN
    ALTER TABLE kb_entries ADD COLUMN amendment_date DATE;
  END IF;

  -- JSONB columns used
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='source_urls') THEN
    ALTER TABLE kb_entries ADD COLUMN source_urls JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='provenance') THEN
    ALTER TABLE kb_entries ADD COLUMN provenance JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='subtype_fields') THEN
    ALTER TABLE kb_entries ADD COLUMN subtype_fields JSONB;
  END IF;
END $$;


