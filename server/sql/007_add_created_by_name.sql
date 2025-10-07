-- Migration script to add created_by_name column to kb_entries table
-- This column will store the user's name for easier access without joins

-- Add created_by_name column if it doesn't exist
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS created_by_name text;

-- Create index for created_by_name column for better query performance
CREATE INDEX IF NOT EXISTS kb_entries_created_by_name_idx ON kb_entries(created_by_name);
