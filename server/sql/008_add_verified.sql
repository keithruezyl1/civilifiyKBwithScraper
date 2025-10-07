-- Add verified flags to kb_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='kb_entries' AND column_name='verified'
  ) THEN
    ALTER TABLE kb_entries ADD COLUMN verified boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='kb_entries' AND column_name='verified_by'
  ) THEN
    ALTER TABLE kb_entries ADD COLUMN verified_by text NULL;
  END IF;
END $$;

