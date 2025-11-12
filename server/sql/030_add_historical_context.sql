-- Migration 030: Add historical_context column to kb_entries
-- Purpose: Store historical applicability notes for pre-1946 Acts (1930 Acts, Commonwealth Acts)

-- Add historical_context column to kb_entries
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS historical_context TEXT;

-- Add comment for documentation
COMMENT ON COLUMN kb_entries.historical_context IS 'One-line note about historical applicability for pre-1946 Acts (e.g., "Pre-Commonwealth statute; may be repealed or superseded"). Optional for post-1946 Acts.';

