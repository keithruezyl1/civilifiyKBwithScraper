-- Add comprehensive enrichment fields back to kb_entries
-- This migration adds all the fields needed for comprehensive GPT enrichment

-- Add summary field
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS summary TEXT;

-- Add tags field (array of strings)
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add jurisdiction field
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS jurisdiction TEXT;

-- Add law_family field
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS law_family TEXT;

-- Add comprehensive enrichment fields
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS key_concepts TEXT[];
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS applicability TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS penalties TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS defenses TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS time_limits TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS required_forms TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS elements TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS triggers TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS violation_code TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS violation_name TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS fine_schedule TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS license_action TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS apprehension_flow TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS incident TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS phases TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS forms TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS handoff TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS rights_callouts TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS rights_scope TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS advice_points TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS jurisprudence TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS legal_bases TEXT;
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS related_sections TEXT[];

-- Add section_id field for better filtering and deduplication
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS section_id TEXT;

-- Add status field for entry lifecycle management
ALTER TABLE kb_entries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unreleased';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kb_entries_jurisdiction ON kb_entries(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_kb_entries_law_family ON kb_entries(law_family);
CREATE INDEX IF NOT EXISTS idx_kb_entries_section_id ON kb_entries(section_id);
CREATE INDEX IF NOT EXISTS idx_kb_entries_status ON kb_entries(status);
CREATE INDEX IF NOT EXISTS idx_kb_entries_tags ON kb_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_kb_entries_key_concepts ON kb_entries USING GIN(key_concepts);
CREATE INDEX IF NOT EXISTS idx_kb_entries_related_sections ON kb_entries USING GIN(related_sections);

-- Composite indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_kb_entries_type_subtype_status ON kb_entries(type, entry_subtype, status);
CREATE INDEX IF NOT EXISTS idx_kb_entries_canonical_citation_text ON kb_entries USING GIN (to_tsvector('english', canonical_citation));

-- Update the FTS index to include summary
DROP INDEX IF EXISTS kb_entries_fts_gin;
CREATE INDEX kb_entries_fts_gin ON kb_entries USING GIN(
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(text, '') || ' ' || 
    COALESCE(summary, '') || ' ' ||
    COALESCE(canonical_citation, '')
  )
);

-- Add comments for documentation
COMMENT ON COLUMN kb_entries.summary IS 'Concise summary of the legal provision';
COMMENT ON COLUMN kb_entries.tags IS 'Array of specific tags for categorization';
COMMENT ON COLUMN kb_entries.jurisdiction IS 'Geographic jurisdiction (e.g., Philippines)';
COMMENT ON COLUMN kb_entries.law_family IS 'Type of law (constitution, statute, rule_of_court, etc.)';
COMMENT ON COLUMN kb_entries.key_concepts IS 'Array of key legal concepts';
COMMENT ON COLUMN kb_entries.applicability IS 'Who this provision applies to';
COMMENT ON COLUMN kb_entries.penalties IS 'Penalties or consequences mentioned';
COMMENT ON COLUMN kb_entries.defenses IS 'Defenses or exceptions mentioned';
COMMENT ON COLUMN kb_entries.time_limits IS 'Time limits or deadlines mentioned';
COMMENT ON COLUMN kb_entries.required_forms IS 'Forms or procedures required';
COMMENT ON COLUMN kb_entries.elements IS 'Key elements or components';
COMMENT ON COLUMN kb_entries.triggers IS 'What triggers this provision';
COMMENT ON COLUMN kb_entries.violation_code IS 'Violation codes or classifications';
COMMENT ON COLUMN kb_entries.violation_name IS 'Name of violations under this provision';
COMMENT ON COLUMN kb_entries.fine_schedule IS 'Fines or penalties specified';
COMMENT ON COLUMN kb_entries.license_action IS 'Licensing actions or requirements';
COMMENT ON COLUMN kb_entries.apprehension_flow IS 'Process for apprehension or enforcement';
COMMENT ON COLUMN kb_entries.incident IS 'What constitutes an incident';
COMMENT ON COLUMN kb_entries.phases IS 'Phases or stages in the process';
COMMENT ON COLUMN kb_entries.forms IS 'Required forms or documents';
COMMENT ON COLUMN kb_entries.handoff IS 'Handoff procedures or next steps';
COMMENT ON COLUMN kb_entries.rights_callouts IS 'Important rights or protections';
COMMENT ON COLUMN kb_entries.rights_scope IS 'Scope of rights or protections';
COMMENT ON COLUMN kb_entries.advice_points IS 'Key advice or guidance points';
COMMENT ON COLUMN kb_entries.jurisprudence IS 'Relevant case law or precedents';
COMMENT ON COLUMN kb_entries.legal_bases IS 'Legal foundations or authorities';
COMMENT ON COLUMN kb_entries.related_sections IS 'Array of related section references';
COMMENT ON COLUMN kb_entries.section_id IS 'Structured section identifier (e.g., ART18-SEC28)';
COMMENT ON COLUMN kb_entries.status IS 'Entry status (draft, published, etc.)';
