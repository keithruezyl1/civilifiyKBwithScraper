-- 027_related_laws.sql
-- Drop legal_bases and rename related_sections -> related_laws
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kb_entries' AND column_name = 'legal_bases'
  ) THEN
    ALTER TABLE kb_entries DROP COLUMN legal_bases;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kb_entries' AND column_name = 'related_sections'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kb_entries' AND column_name = 'related_laws'
  ) THEN
    ALTER TABLE kb_entries RENAME COLUMN related_sections TO related_laws;
  END IF;
END $$;
















