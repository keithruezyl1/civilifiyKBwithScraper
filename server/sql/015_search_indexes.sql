-- Migration 015: Indexes for search artifacts
-- Purpose: Create GIN indexes for tsvector and trigram ops.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index on tsvector
CREATE INDEX IF NOT EXISTS law_entries_search_vec_gin
  ON law_entries USING gin (search_vec);

-- Trigram indexes for lex + fallback matching
CREATE INDEX IF NOT EXISTS law_entries_title_trgm
  ON law_entries USING gin (lower(unaccent(title)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS law_entries_citation_trgm
  ON law_entries USING gin (lower(unaccent(canonical_citation)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS law_entries_compact_cit_trgm
  ON law_entries USING gin (compact_citation gin_trgm_ops);

-- Support exact numeric citation lookups
CREATE INDEX IF NOT EXISTS law_entries_ra_bp_gr
  ON law_entries (ra_number, bp_number, gr_number);

-- Common filter combo to speed tie-breakers/filters
CREATE INDEX IF NOT EXISTS law_entries_status_verified_date
  ON law_entries (status, verified, effective_date);

CREATE INDEX IF NOT EXISTS law_entries_jurisdiction_type
  ON law_entries (jurisdiction, type);









