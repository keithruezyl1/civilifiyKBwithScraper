-- Convert kb_entries.tags from JSONB to TEXT[] if older schema exists
DO $$
DECLARE
  is_jsonb boolean := false;
BEGIN
  SELECT (data_type = 'jsonb') INTO is_jsonb
  FROM information_schema.columns
  WHERE table_name = 'kb_entries' AND column_name = 'tags'
  LIMIT 1;

  IF is_jsonb THEN
    RAISE NOTICE 'Converting kb_entries.tags from JSONB to TEXT[]';
    -- Drop any prior index using JSONB ops to avoid mismatch
    BEGIN
      DROP INDEX IF EXISTS kb_entries_tags_gin;
    EXCEPTION WHEN OTHERS THEN
      -- ignore
      NULL;
    END;

    -- Convert jsonb array -> text[]
    ALTER TABLE kb_entries
      ALTER COLUMN tags TYPE text[]
      USING (
        CASE
          WHEN tags IS NULL THEN NULL
          WHEN jsonb_typeof(tags) = 'array' THEN ARRAY(
            SELECT jsonb_array_elements_text(tags)
          )
          ELSE NULL
        END
      );

    -- Recreate index suitable for TEXT[]
    CREATE INDEX IF NOT EXISTS kb_entries_tags_gin ON kb_entries USING gin (tags);
  END IF;
END $$;










