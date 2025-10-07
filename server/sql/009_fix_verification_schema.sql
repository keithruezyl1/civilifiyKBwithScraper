-- Fix verification schema and add missing columns
DO $$
BEGIN
  -- Fix verified column to default to null instead of false
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='kb_entries' AND column_name='verified' AND column_default = 'false'
  ) THEN
    ALTER TABLE kb_entries ALTER COLUMN verified DROP DEFAULT;
    ALTER TABLE kb_entries ALTER COLUMN verified SET DEFAULT NULL;
  END IF;

  -- Add verified_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='kb_entries' AND column_name='verified_at'
  ) THEN
    ALTER TABLE kb_entries ADD COLUMN verified_at timestamp with time zone NULL;
  END IF;

  -- Add last_reviewed column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='kb_entries' AND column_name='last_reviewed'
  ) THEN
    ALTER TABLE kb_entries ADD COLUMN last_reviewed date NULL;
  END IF;

  -- Update existing entries to set verified to null if it's currently false
  UPDATE kb_entries SET verified = NULL WHERE verified = false;

END $$;
