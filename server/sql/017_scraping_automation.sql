-- Migration 017: Scraping Automation System
-- Purpose: Create tables for automated law scraping and KB ingestion

-- Entry subtypes table
CREATE TABLE IF NOT EXISTS entry_subtypes (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  subtype TEXT NOT NULL,
  field_schema JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(type, subtype)
);

-- Scraping sessions table
CREATE TABLE IF NOT EXISTS scraping_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT DEFAULT 'lawphil',
  category TEXT NOT NULL,
  root_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'canceled')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  current_cursor TEXT,
  operator TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scraped documents table
CREATE TABLE IF NOT EXISTS scraped_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES scraping_sessions(id) ON DELETE CASCADE,
  canonical_url TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  raw_html TEXT,
  extracted_text TEXT,
  metadata JSONB,
  parse_status TEXT NOT NULL DEFAULT 'parsed' CHECK (parse_status IN ('parsed', 'needs_review', 'failed')),
  sequence_index INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(canonical_url, source_hash)
);

-- GPT inferences table
CREATE TABLE IF NOT EXISTS gpt_inferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scraped_document_id UUID REFERENCES scraped_documents(id) ON DELETE CASCADE,
  request_payload JSONB NOT NULL,
  response_payload JSONB NOT NULL,
  inferred_type TEXT,
  inferred_subtype TEXT,
  fields JSONB,
  confidence FLOAT,
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'low_confidence', 'failed', 'needs_review')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Batch releases table
CREATE TABLE IF NOT EXISTS batch_releases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'verifying', 'published', 'failed', 'canceled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  published_by TEXT,
  notes TEXT
);

-- Extend kb_entries table
ALTER TABLE kb_entries 
ADD COLUMN IF NOT EXISTS entry_subtype TEXT,
ADD COLUMN IF NOT EXISTS subtype_fields JSONB,
ADD COLUMN IF NOT EXISTS batch_release_id UUID REFERENCES batch_releases(id),
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS provenance JSONB;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scraped_documents_session ON scraped_documents(session_id, sequence_index);
CREATE INDEX IF NOT EXISTS idx_scraped_documents_url ON scraped_documents(canonical_url);
CREATE INDEX IF NOT EXISTS idx_gpt_inferences_document ON gpt_inferences(scraped_document_id);
CREATE INDEX IF NOT EXISTS idx_gpt_inferences_type ON gpt_inferences(inferred_type, inferred_subtype);
CREATE INDEX IF NOT EXISTS idx_kb_entries_batch ON kb_entries(batch_release_id, published_at);
CREATE INDEX IF NOT EXISTS idx_batch_releases_category ON batch_releases(category, status);