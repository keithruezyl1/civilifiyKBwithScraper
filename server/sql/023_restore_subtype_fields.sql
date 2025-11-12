-- Migration 023: Restore subtype-specific fields for statute sections
-- Purpose: Add back subtype_fields column to store subtype-specific data

-- Add subtype_fields column back to kb_entries
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS subtype_fields JSONB DEFAULT '{}'::jsonb;

-- Create index for subtype_fields queries
CREATE INDEX IF NOT EXISTS idx_kb_entries_subtype_fields ON kb_entries USING GIN(subtype_fields);

-- Add comment for documentation
COMMENT ON COLUMN kb_entries.subtype_fields IS 'Subtype-specific fields stored as JSON (e.g., ra_number, ca_number, mbp_number, act_number, section_number, etc.)';


















