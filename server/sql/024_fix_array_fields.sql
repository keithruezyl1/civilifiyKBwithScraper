-- Migration 024: Fix array fields for constitution entries
-- Purpose: Convert TEXT fields to TEXT[] for proper array handling
-- Idempotent: Skips if columns are already TEXT[]

DO $$
DECLARE
  rc_udt TEXT;
  ap_udt TEXT;
  jp_udt TEXT;
  lb_udt TEXT;
BEGIN
  -- Check current column udt_name (e.g., 'text[]' for arrays)
  SELECT udt_name INTO rc_udt
  FROM information_schema.columns
  WHERE table_name = 'kb_entries' AND column_name = 'rights_callouts';
  
  SELECT udt_name INTO ap_udt
  FROM information_schema.columns
  WHERE table_name = 'kb_entries' AND column_name = 'advice_points';
  
  SELECT udt_name INTO jp_udt
  FROM information_schema.columns
  WHERE table_name = 'kb_entries' AND column_name = 'jurisprudence';
  
  SELECT udt_name INTO lb_udt
  FROM information_schema.columns
  WHERE table_name = 'kb_entries' AND column_name = 'legal_bases';

  -- Skip if all columns are already text[] or do not exist (null)
  IF (rc_udt = 'text[]' OR rc_udt IS NULL) AND
     (ap_udt = 'text[]' OR ap_udt IS NULL) AND
     (jp_udt = 'text[]' OR jp_udt IS NULL) AND
     (lb_udt = 'text[]' OR lb_udt IS NULL) THEN
    RETURN;
  END IF;

  -- First, add new columns with correct types
  ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS rights_callouts_new TEXT[];
  ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS advice_points_new TEXT[];
  ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS jurisprudence_new TEXT[];
  ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS legal_bases_new TEXT[];

  -- Copy data from old columns to new columns (handle empty strings and nulls safely)
  IF rc_udt IS NOT NULL AND rc_udt <> 'text[]' THEN
    UPDATE kb_entries SET rights_callouts_new = ARRAY[rights_callouts]::TEXT[]
      WHERE rights_callouts IS NOT NULL AND NULLIF(TRIM(rights_callouts), '') IS NOT NULL;
  END IF;

  IF ap_udt IS NOT NULL AND ap_udt <> 'text[]' THEN
    UPDATE kb_entries SET advice_points_new = ARRAY[advice_points]::TEXT[]
      WHERE advice_points IS NOT NULL AND NULLIF(TRIM(advice_points), '') IS NOT NULL;
  END IF;

  IF jp_udt IS NOT NULL AND jp_udt <> 'text[]' THEN
    UPDATE kb_entries SET jurisprudence_new = ARRAY[jurisprudence]::TEXT[]
      WHERE jurisprudence IS NOT NULL AND NULLIF(TRIM(jurisprudence), '') IS NOT NULL;
  END IF;

  IF lb_udt IS NOT NULL AND lb_udt <> 'text[]' THEN
    UPDATE kb_entries SET legal_bases_new = ARRAY[legal_bases]::TEXT[]
      WHERE legal_bases IS NOT NULL AND NULLIF(TRIM(legal_bases), '') IS NOT NULL;
  END IF;

  -- Drop old columns (only if they exist and are TEXT, not TEXT[])
  IF rc_udt IS NOT NULL AND rc_udt <> 'text[]' THEN
    ALTER TABLE kb_entries DROP COLUMN IF EXISTS rights_callouts;
    ALTER TABLE kb_entries RENAME COLUMN rights_callouts_new TO rights_callouts;
  END IF;

  IF ap_udt IS NOT NULL AND ap_udt <> 'text[]' THEN
    ALTER TABLE kb_entries DROP COLUMN IF EXISTS advice_points;
    ALTER TABLE kb_entries RENAME COLUMN advice_points_new TO advice_points;
  END IF;

  IF jp_udt IS NOT NULL AND jp_udt <> 'text[]' THEN
    ALTER TABLE kb_entries DROP COLUMN IF EXISTS jurisprudence;
    ALTER TABLE kb_entries RENAME COLUMN jurisprudence_new TO jurisprudence;
  END IF;

  IF lb_udt IS NOT NULL AND lb_udt <> 'text[]' THEN
    ALTER TABLE kb_entries DROP COLUMN IF EXISTS legal_bases;
    ALTER TABLE kb_entries RENAME COLUMN legal_bases_new TO legal_bases;
  END IF;

  -- Clean up any leftover _new columns
  ALTER TABLE kb_entries DROP COLUMN IF EXISTS rights_callouts_new;
  ALTER TABLE kb_entries DROP COLUMN IF EXISTS advice_points_new;
  ALTER TABLE kb_entries DROP COLUMN IF EXISTS jurisprudence_new;
  ALTER TABLE kb_entries DROP COLUMN IF EXISTS legal_bases_new;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN kb_entries.rights_callouts IS 'Array of important rights or protections mentioned';
COMMENT ON COLUMN kb_entries.advice_points IS 'Array of key advice or guidance points';
COMMENT ON COLUMN kb_entries.jurisprudence IS 'Array of relevant case law or precedents';
COMMENT ON COLUMN kb_entries.legal_bases IS 'Array of legal foundations or authorities';
