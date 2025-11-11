-- Migration 022: Add effective_date and amendment_date fields
-- Purpose: Add date fields for constitution entries

-- Add effective_date field
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS effective_date DATE;

-- Add amendment_date field  
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS amendment_date DATE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kb_entries_effective_date ON kb_entries(effective_date);
CREATE INDEX IF NOT EXISTS idx_kb_entries_amendment_date ON kb_entries(amendment_date);

-- Add comments for documentation
COMMENT ON COLUMN kb_entries.effective_date IS 'Date when the legal provision became effective';
COMMENT ON COLUMN kb_entries.amendment_date IS 'Date when the legal provision was amended, if applicable';

