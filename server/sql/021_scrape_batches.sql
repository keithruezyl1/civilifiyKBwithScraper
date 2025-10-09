-- Migration 021: Scrape Batches
-- Purpose: Treat scraping_sessions as batches by adding description and a saved flag

-- Add description column to scraping_sessions for human-readable batch note
ALTER TABLE scraping_sessions
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Optional: explicit saved flag to mark sessions that were saved as batches
ALTER TABLE scraping_sessions
  ADD COLUMN IF NOT EXISTS is_saved BOOLEAN DEFAULT FALSE;

-- Helpful index for listing recently saved batches
CREATE INDEX IF NOT EXISTS idx_scraping_sessions_saved ON scraping_sessions(is_saved, created_at DESC);


