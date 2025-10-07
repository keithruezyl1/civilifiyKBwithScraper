-- Very simple migration - just add the column
-- Run this step by step

-- Step 1: Add the column (this should work)
ALTER TABLE kb_entries ADD COLUMN created_by_name text;

-- Step 2: Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'kb_entries' 
  AND column_name = 'created_by_name';
