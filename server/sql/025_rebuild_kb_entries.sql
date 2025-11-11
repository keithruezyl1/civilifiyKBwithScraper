-- Guarded rebuild of kb_entries when schema is over-inflated (column count too high)
-- This prevents failures like: "tables can have at most 1600 columns"
-- Safe to run multiple times; only triggers when column count is excessive.

DO $$
DECLARE
  col_count integer := 0;
  has_table boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name='kb_entries'
  ) INTO has_table;

  IF has_table THEN
    SELECT COUNT(1) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'kb_entries';
  END IF;

  -- If table doesn't exist, create it (fallback if 001_init.sql failed)
  IF NOT has_table THEN
    RAISE NOTICE 'kb_entries table does not exist. Creating it now.';
    -- Will create table below, so continue to table creation
  ELSIF col_count <= 60 THEN
    -- Table exists and column count is normal, skip rebuild
    RETURN;
  ELSE
    -- Rebuild: drop and recreate minimal, modern schema
    RAISE NOTICE 'Rebuilding kb_entries (columns=%) due to excessive columns. This will drop existing data.', col_count;
    -- Drop dependent indexes/constraints handled by DROP TABLE CASCADE
    EXECUTE 'DROP TABLE IF EXISTS kb_entries CASCADE';
  END IF;

  -- Create fresh schema aligned with application insert/UPSERT
  -- Check if vector type exists to conditionally include embedding column
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
    EXECUTE '
      CREATE TABLE kb_entries (
        entry_id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        canonical_citation TEXT,
        text TEXT,
        entry_subtype TEXT,
        tags TEXT[],
        jurisdiction TEXT,
        law_family TEXT,
        applicability TEXT,
        penalties TEXT,
        defenses TEXT,
        time_limits TEXT,
        required_forms TEXT,
        elements TEXT,
        triggers TEXT,
        violation_code TEXT,
        violation_name TEXT,
        fine_schedule TEXT,
        license_action TEXT,
        apprehension_flow TEXT,
        incident TEXT,
        phases TEXT,
        forms TEXT,
        handoff TEXT,
        rights_callouts TEXT[],
        rights_scope TEXT,
        advice_points TEXT[],
        jurisprudence TEXT[],
        legal_bases TEXT[],
        related_sections TEXT[],
        section_id TEXT,
        status TEXT DEFAULT ''unreleased'',
        source_urls JSONB DEFAULT ''[]''::jsonb,
        embedding vector(1536),
        batch_release_id uuid NULL,
        published_at timestamptz NULL,
        provenance JSONB,
        created_by INTEGER,
        created_by_name TEXT,
        effective_date DATE,
        amendment_date DATE,
        verified BOOLEAN NULL,
        verified_by TEXT NULL,
        verified_at timestamptz NULL,
        subtype_fields JSONB,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    ';
  ELSE
    EXECUTE '
      CREATE TABLE kb_entries (
        entry_id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        canonical_citation TEXT,
        text TEXT,
        entry_subtype TEXT,
        tags TEXT[],
        jurisdiction TEXT,
        law_family TEXT,
        applicability TEXT,
        penalties TEXT,
        defenses TEXT,
        time_limits TEXT,
        required_forms TEXT,
        elements TEXT,
        triggers TEXT,
        violation_code TEXT,
        violation_name TEXT,
        fine_schedule TEXT,
        license_action TEXT,
        apprehension_flow TEXT,
        incident TEXT,
        phases TEXT,
        forms TEXT,
        handoff TEXT,
        rights_callouts TEXT[],
        rights_scope TEXT,
        advice_points TEXT[],
        jurisprudence TEXT[],
        legal_bases TEXT[],
        related_sections TEXT[],
        section_id TEXT,
        status TEXT DEFAULT ''unreleased'',
        source_urls JSONB DEFAULT ''[]''::jsonb,
        batch_release_id uuid NULL,
        published_at timestamptz NULL,
        provenance JSONB,
        created_by INTEGER,
        created_by_name TEXT,
        effective_date DATE,
        amendment_date DATE,
        verified BOOLEAN NULL,
        verified_by TEXT NULL,
        verified_at timestamptz NULL,
        subtype_fields JSONB,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    ';
    RAISE NOTICE 'kb_entries rebuilt without embedding column (pgvector not available)';
  END IF;

  -- Helpful indexes recreated (idempotent guards not needed in fresh table)
  BEGIN
    CREATE INDEX kb_entries_created_by_idx ON kb_entries(created_by);
    CREATE INDEX kb_entries_created_at_idx ON kb_entries(created_at);
    CREATE INDEX idx_kb_entries_jurisdiction ON kb_entries(jurisdiction);
    CREATE INDEX idx_kb_entries_law_family ON kb_entries(law_family);
    CREATE INDEX idx_kb_entries_section_id ON kb_entries(section_id);
    CREATE INDEX idx_kb_entries_status ON kb_entries(status);
    CREATE INDEX idx_kb_entries_type_subtype_status ON kb_entries(type, entry_subtype, status);
    CREATE INDEX kb_entries_tags_gin on kb_entries using gin (tags);
    CREATE INDEX kb_entries_related_sections_gin on kb_entries using gin (related_sections);
    
    -- Full-text index re-created (without summary)
    CREATE INDEX kb_entries_fts_gin ON kb_entries USING GIN(
      to_tsvector('english', 
        COALESCE(title, '') || ' ' || 
        COALESCE(text, '') || ' ' || 
        COALESCE(canonical_citation, '')
      )
    );
    
    -- key_concepts index only if column exists (added by 026 migration)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kb_entries' AND column_name='key_concepts') THEN
      CREATE INDEX kb_entries_key_concepts_gin on kb_entries using gin (key_concepts);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some indexes may not have been created: %', SQLERRM;
  END;

END $$;


