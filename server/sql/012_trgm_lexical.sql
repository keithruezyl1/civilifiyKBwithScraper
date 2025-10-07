-- Enable trigram search for better lexical fallback in RAG
create extension if not exists pg_trgm;

-- Trigram GIN indexes to accelerate similarity() and % operators
create index if not exists kb_entries_title_trgm on kb_entries using gin (title gin_trgm_ops);
create index if not exists kb_entries_cite_trgm  on kb_entries using gin (canonical_citation gin_trgm_ops);
create index if not exists kb_entries_text_trgm  on kb_entries using gin (text gin_trgm_ops);

