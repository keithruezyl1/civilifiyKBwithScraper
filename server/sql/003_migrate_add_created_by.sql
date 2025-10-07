-- Migration script to add created_by column to existing kb_entries table
-- This script handles the case where the table already exists with data

-- Add created_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kb_entries' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE kb_entries ADD COLUMN created_by integer;
        
        -- Add foreign key constraint if users table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
            ALTER TABLE kb_entries ADD CONSTRAINT fk_kb_entries_created_by 
            FOREIGN KEY (created_by) REFERENCES users(id);
        END IF;
        
        -- Add index for created_by column
        CREATE INDEX IF NOT EXISTS kb_entries_created_by_idx ON kb_entries(created_by);
    END IF;
END $$;

-- Update existing entries to have a default created_by value
-- This assigns all existing entries to the first user (usually admin)
UPDATE kb_entries 
SET created_by = (SELECT id FROM users LIMIT 1)
WHERE created_by IS NULL;

-- Make created_by NOT NULL after setting default values
ALTER TABLE kb_entries ALTER COLUMN created_by SET NOT NULL;

-- Add created_at index if it doesn't exist
CREATE INDEX IF NOT EXISTS kb_entries_created_at_idx ON kb_entries(created_at);
