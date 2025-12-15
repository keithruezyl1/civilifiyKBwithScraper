# Complete Knowledge Base Schema Documentation

This document provides a comprehensive reference for all tables, fields, indexes, and relationships in the Civilify Knowledge Base system. This is essential for migrating the KB to a deployed environment.

## Table of Contents

1. [Core Tables](#core-tables)
   - [kb_entries](#kb_entries)
   - [entry_subtypes](#entry_subtypes)
   - [scraping_sessions](#scraping_sessions)
   - [scraped_documents](#scraped_documents)
   - [gpt_inferences](#gpt_inferences)
   - [batch_releases](#batch_releases)
   - [kb_notifications](#kb_notifications)
   - [users](#users)
2. [Database Schema](#database-schema)
3. [Indexes](#indexes)
4. [Foreign Key Relationships](#foreign-key-relationships)
5. [Data Types and Constraints](#data-types-and-constraints)
6. [Entry Types and Subtypes](#entry-types-and-subtypes)
7. [Field Descriptions](#field-descriptions)

---

## Core Tables

### kb_entries

The main table storing all knowledge base entries. This is the central table for legal provisions, statutes, rules, and other legal documents.

#### Complete Column List

**Primary Key:**
- `entry_id` (TEXT, PRIMARY KEY) - Unique identifier for the entry (e.g., "CONST-1987-ART18-SEC28")

**Core Identification Fields:**
- `type` (TEXT, NOT NULL) - Primary entry type (e.g., "constitution_provision", "statute_section", "rule_of_court_provision")
- `entry_subtype` (TEXT) - Specific subtype (e.g., "constitution_1987", "republic_act", "roc_criminal_proc_1985")
- `title` (TEXT, NOT NULL) - Human-readable title
- `canonical_citation` (TEXT) - Standard legal citation (e.g., "1987 Const., Art. XVIII, Sec. 28")
- `section_id` (TEXT) - Structured section identifier (e.g., "ART18-SEC28")

**Content Fields:**
- `text` (TEXT) - Full text content of the legal provision
- `tags` (TEXT[]) - Array of descriptive tags for categorization
- `key_concepts` (TEXT[]) - Array of key legal concepts (added in migration 026)
- `historical_context` (TEXT) - One-line note about historical applicability for pre-1946 Acts (added in migration 030)

**Metadata Fields:**
- `jurisdiction` (TEXT) - Geographic jurisdiction (typically "Philippines")
- `law_family` (TEXT) - Legal family classification (e.g., "constitution", "statute", "rule")
- `status` (TEXT, DEFAULT 'unreleased') - Entry status: "unreleased", "draft", "released", "published"

**Enrichment Fields (GPT-Generated):**
- `applicability` (TEXT) - Who this provision applies to
- `penalties` (TEXT) - Penalties and consequences
- `defenses` (TEXT) - Available defenses
- `time_limits` (TEXT) - Time limits and deadlines
- `required_forms` (TEXT) - Required forms and procedures
- `elements` (TEXT) - Key legal elements
- `triggers` (TEXT) - What triggers this provision
- `violation_code` (TEXT) - Violation classification code
- `violation_name` (TEXT) - Name of violations
- `fine_schedule` (TEXT) - Fine schedule
- `license_action` (TEXT) - License actions
- `apprehension_flow` (TEXT) - Apprehension process
- `incident` (TEXT) - Incident definition
- `phases` (TEXT) - Process phases
- `forms` (TEXT) - Required forms
- `handoff` (TEXT) - Handoff procedures

**Rights and Protections Fields:**
- `rights_callouts` (TEXT[]) - Array of important rights or protections
- `rights_scope` (TEXT) - Scope of rights
- `advice_points` (TEXT[]) - Array of key advice points

**Legal Context Fields:**
- `jurisprudence` (TEXT[]) - Array of related case law or precedents
- `legal_bases` (TEXT[]) - Array of legal foundations or authorities
- `related_laws` (TEXT[]) - Array of related section/law references (renamed from `related_sections` in migration 027)

**Source and Provenance:**
- `source_urls` (JSONB, DEFAULT '[]'::jsonb) - Array of source URLs (stored as JSONB array)
- `provenance` (JSONB) - Source and processing metadata (e.g., `{ source: 'lawphil_scraping', session_id, scraped_at, content_hash }`)

**Release Management:**
- `batch_release_id` (UUID, NULL) - Foreign key to `batch_releases.id`
- `published_at` (TIMESTAMPTZ, NULL) - Publication timestamp

**Dates:**
- `effective_date` (DATE) - Date when the legal provision became effective
- `amendment_date` (DATE) - Date when the legal provision was last amended

**Verification:**
- `verified` (BOOLEAN, NULL) - Whether entry has been verified
- `verified_by` (TEXT, NULL) - Who verified the entry
- `verified_at` (TIMESTAMPTZ, NULL) - When entry was verified

**Subtype-Specific Fields:**
- `subtype_fields` (JSONB) - JSONB object containing subtype-specific fields (e.g., article_number, section_number, ra_number)

**Search and Embeddings:**
- `embedding` (VECTOR(1536), NULL) - Vector embedding for semantic search (requires pgvector extension)
  - Model: `text-embedding-3-small`
  - Dimension: 1536
  - Similarity function: Cosine similarity

**Audit Fields:**
- `created_by` (INTEGER, NULL) - Foreign key to `users.id`
- `created_by_name` (TEXT) - Name of creator (denormalized for convenience)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now()) - Entry creation timestamp
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now()) - Last update timestamp

#### Full-Text Search

The table includes a generated full-text search column (created via migration 013):
- `fts` (TSVECTOR, GENERATED ALWAYS AS ... STORED) - Full-text search vector
  - Weighted fields: title (A), canonical_citation (A), text (C)
  - Note: Some migrations reference `summary` in FTS, but `summary` column may not exist in current schema

---

### entry_subtypes

Defines the schema for each entry type/subtype combination. Used for validation and field definitions.

**Columns:**
- `id` (SERIAL, PRIMARY KEY) - Auto-incrementing ID
- `type` (TEXT, NOT NULL) - Entry type (e.g., "constitution_provision")
- `subtype` (TEXT, NOT NULL) - Entry subtype (e.g., "constitution_1987")
- `field_schema` (JSONB, NOT NULL) - JSONSchema-like definition of required/optional fields for this subtype
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- **UNIQUE CONSTRAINT:** `(type, subtype)`

**Indexes:**
- Primary key on `id`
- Unique constraint on `(type, subtype)`

---

### scraping_sessions

Tracks scraping sessions/batches for automated law scraping.

**Columns:**
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid()) - Session identifier
- `source` (TEXT, DEFAULT 'lawphil') - Source system (typically "lawphil")
- `category` (TEXT, NOT NULL) - Category of documents being scraped (e.g., "constitution_1987", "roc", "acts")
- `root_url` (TEXT, NOT NULL) - Root URL for scraping session
- `status` (TEXT, NOT NULL, DEFAULT 'pending') - Status: "pending", "running", "paused", "completed", "failed", "canceled"
  - **CHECK CONSTRAINT:** `status IN ('pending', 'running', 'paused', 'completed', 'failed', 'canceled')`
- `started_at` (TIMESTAMPTZ) - When scraping started
- `finished_at` (TIMESTAMPTZ) - When scraping finished
- `current_cursor` (TEXT) - Resume token for resuming interrupted sessions
- `operator` (TEXT) - Operator/user who initiated the session
- `description` (TEXT) - Human-readable description when saved as batch (added in migration 021)
- `is_saved` (BOOLEAN, DEFAULT FALSE) - Flag marking session as a saved batch (added in migration 021)
- `notes` (TEXT) - Additional notes
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

**Indexes:**
- Primary key on `id`
- `idx_scraping_sessions_saved` on `(is_saved, created_at DESC)` - For listing saved batches

---

### scraped_documents

Stores raw scraped document data from scraping sessions.

**Columns:**
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid()) - Document identifier
- `session_id` (UUID, NOT NULL) - Foreign key to `scraping_sessions.id` (ON DELETE CASCADE)
- `canonical_url` (TEXT, NOT NULL) - Canonical URL of the scraped document
- `source_hash` (TEXT, NOT NULL) - SHA256 hash of canonicalized content
- `raw_html` (TEXT) - Raw HTML content
- `extracted_text` (TEXT) - Extracted text content
- `metadata` (JSONB) - Extracted metadata (title, numbers, headings, citations)
- `parse_status` (TEXT, NOT NULL, DEFAULT 'parsed') - Status: "parsed", "needs_review", "failed"
  - **CHECK CONSTRAINT:** `parse_status IN ('parsed', 'needs_review', 'failed')`
- `sequence_index` (INTEGER) - Order/index within the scraping session
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- **UNIQUE CONSTRAINT:** `(canonical_url, source_hash)`

**Indexes:**
- Primary key on `id`
- `idx_scraped_documents_session` on `(session_id, sequence_index)` - For session queries
- `idx_scraped_documents_url` on `(canonical_url)` - For URL lookups
- Unique constraint on `(canonical_url, source_hash)`

---

### gpt_inferences

Stores GPT processing results for scraped documents.

**Columns:**
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid()) - Inference identifier
- `scraped_document_id` (UUID, NOT NULL) - Foreign key to `scraped_documents.id` (ON DELETE CASCADE)
- `request_payload` (JSONB, NOT NULL) - GPT request payload
- `response_payload` (JSONB, NOT NULL) - GPT response payload
- `inferred_type` (TEXT) - Inferred entry type
- `inferred_subtype` (TEXT) - Inferred entry subtype
- `fields` (JSONB) - Extracted fields from GPT response
- `confidence` (FLOAT) - Confidence score (0.0 to 1.0)
- `status` (TEXT, NOT NULL, DEFAULT 'ok') - Status: "ok", "low_confidence", "failed", "needs_review"
  - **CHECK CONSTRAINT:** `status IN ('ok', 'low_confidence', 'failed', 'needs_review')`
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

**Indexes:**
- Primary key on `id`
- `idx_gpt_inferences_document` on `(scraped_document_id)` - For document lookups
- `idx_gpt_inferences_type` on `(inferred_type, inferred_subtype)` - For type filtering

---

### batch_releases

Manages batch releases of KB entries.

**Columns:**
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid()) - Release identifier
- `category` (TEXT, NOT NULL) - Category of entries in this release
- `status` (TEXT, NOT NULL, DEFAULT 'draft') - Status: "draft", "verifying", "published", "failed", "canceled"
  - **CHECK CONSTRAINT:** `status IN ('draft', 'verifying', 'published', 'failed', 'canceled')`
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `published_at` (TIMESTAMPTZ) - When batch was published
- `published_by` (TEXT) - Who published the batch
- `notes` (TEXT) - Additional notes

**Indexes:**
- Primary key on `id`
- `idx_batch_releases_category` on `(category, status)` - For category filtering
- `idx_kb_entries_batch` on `kb_entries(batch_release_id, published_at)` - For batch queries

---

### kb_notifications

Stores notifications for external-to-internal entry suggestions.

**Columns:**
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid()) - Notification identifier
- `user_id` (TEXT, NOT NULL) - User identifier
- `entry_id` (TEXT, NOT NULL) - Entry identifier (references `kb_entries.entry_id`)
- `citation_snapshot` (JSONB, NOT NULL) - Snapshot of citation data
- `matched_entry_ids` (TEXT[], NOT NULL) - Array of matched entry IDs
- `status` (TEXT, NOT NULL, DEFAULT 'pending') - Status: "pending", "resolved", "dismissed"
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `resolved_at` (TIMESTAMPTZ) - When notification was resolved

**Indexes:**
- Primary key on `id`
- `idx_kb_notifications_user` on `(user_id)` - For user queries
- `idx_kb_notifications_status` on `(status)` - For status filtering
- `idx_kb_notifications_entry` on `(entry_id)` - For entry lookups

---

### users

User authentication and management table.

**Columns:**
- `id` (SERIAL, PRIMARY KEY) - Auto-incrementing user ID
- `username` (VARCHAR(50), UNIQUE, NOT NULL) - Unique username
- `password_hash` (VARCHAR(255), NOT NULL) - Hashed password
- `name` (VARCHAR(100), NOT NULL) - User's full name
- `person_id` (VARCHAR(10), NOT NULL) - Person identifier (P1, P2, P3, P4, P5)
- `role` (VARCHAR(20), DEFAULT 'user') - User role
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

**Indexes:**
- Primary key on `id`
- Unique constraint on `username`

**Default Users:**
The table is pre-populated with default team members:
- arda (P1)
- deloscientos (P2)
- paden (P3)
- sendrijas (P4)
- tagarao (P5)

---

## Database Schema

### PostgreSQL Extensions Required

1. **pgcrypto** - For `gen_random_uuid()`
2. **vector** (pgvector) - For vector embeddings (optional, but recommended)
3. **unaccent** - For text normalization in search (optional)
4. **pg_trgm** - For trigram matching in search (optional)

### Complete CREATE TABLE Statements

#### kb_entries (Current Schema)

```sql
CREATE TABLE kb_entries (
  entry_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  canonical_citation TEXT,
  text TEXT,
  entry_subtype TEXT,
  tags TEXT[],
  jurisdiction TEXT,
  law_family TEXT,
  applicability TEXT,
  penalties TEXT,
  defenses TEXT,
  time_limits TEXT,
  required_forms TEXT,
  elements TEXT,
  triggers TEXT,
  violation_code TEXT,
  violation_name TEXT,
  fine_schedule TEXT,
  license_action TEXT,
  apprehension_flow TEXT,
  incident TEXT,
  phases TEXT,
  forms TEXT,
  handoff TEXT,
  rights_callouts TEXT[],
  rights_scope TEXT,
  advice_points TEXT[],
  jurisprudence TEXT[],
  legal_bases TEXT[],
  related_laws TEXT[],  -- Note: renamed from related_sections in migration 027
  section_id TEXT,
  status TEXT DEFAULT 'unreleased',
  source_urls JSONB DEFAULT '[]'::jsonb,
  embedding vector(1536),  -- Requires pgvector extension
  batch_release_id UUID NULL,
  published_at TIMESTAMPTZ NULL,
  provenance JSONB,
  created_by INTEGER,
  created_by_name TEXT,
  effective_date DATE,
  amendment_date DATE,
  verified BOOLEAN NULL,
  verified_by TEXT NULL,
  verified_at TIMESTAMPTZ NULL,
  subtype_fields JSONB,
  key_concepts TEXT[],  -- Added in migration 026
  historical_context TEXT,  -- Added in migration 030
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Note on `summary` field:** 
- Migration 020 added `summary TEXT`
- Migration 019 dropped it
- Migration 026 comment says "summary removed per user request" but doesn't drop it
- Migration 025 rebuild doesn't include it
- **Current status:** May or may not exist depending on migration order. Check your database.

---

## Indexes

### kb_entries Indexes

**Primary Key:**
- `entry_id` (PRIMARY KEY)

**Single Column Indexes:**
- `kb_entries_created_by_idx` on `(created_by)`
- `kb_entries_created_at_idx` on `(created_at)`
- `idx_kb_entries_jurisdiction` on `(jurisdiction)`
- `idx_kb_entries_law_family` on `(law_family)`
- `idx_kb_entries_section_id` on `(section_id)`
- `idx_kb_entries_status` on `(status)`
- `idx_kb_entries_effective_date` on `(effective_date)`
- `idx_kb_entries_amendment_date` on `(amendment_date)`

**GIN Indexes (Array/JSONB):**
- `kb_entries_tags_gin` on `tags` (GIN)
- `kb_entries_related_sections_gin` on `related_laws` (GIN) - Note: index name may still reference old column name
- `kb_entries_key_concepts_gin` on `key_concepts` (GIN) - Conditional, only if column exists

**Full-Text Search Indexes:**
- `kb_entries_fts_gin` on `fts` (GIN) - Full-text search vector index
  - Generated column: `to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(text, '') || ' ' || COALESCE(canonical_citation, ''))`

**Vector Similarity Index:**
- `kb_entries_embedding_ivff` on `embedding` (IVFFlat) - For KNN search (only if pgvector available)
  - Using `vector_cosine_ops`
  - Lists: 100

**Composite Indexes:**
- `idx_kb_entries_type_subtype_status` on `(type, entry_subtype, status)`
- `idx_kb_entries_batch` on `(batch_release_id, published_at)`

---

## Foreign Key Relationships

1. **kb_entries.created_by** → `users.id` (INTEGER)
2. **kb_entries.batch_release_id** → `batch_releases.id` (UUID)
3. **scraped_documents.session_id** → `scraping_sessions.id` (UUID, ON DELETE CASCADE)
4. **gpt_inferences.scraped_document_id** → `scraped_documents.id` (UUID, ON DELETE CASCADE)

---

## Data Types and Constraints

### Text Fields
- Most text fields are `TEXT` (unlimited length)
- Some fields use `VARCHAR` with length limits (e.g., `users.username` VARCHAR(50))

### Array Fields
- Array fields use PostgreSQL array syntax: `TEXT[]`
- Examples: `tags`, `rights_callouts`, `advice_points`, `jurisprudence`, `legal_bases`, `related_laws`, `key_concepts`

### JSONB Fields
- `source_urls` - JSONB array (default: `'[]'::jsonb`)
- `provenance` - JSONB object
- `subtype_fields` - JSONB object
- `metadata` (in scraped_documents) - JSONB object
- `request_payload`, `response_payload`, `fields` (in gpt_inferences) - JSONB

### Date/Time Fields
- `DATE` - For `effective_date`, `amendment_date`
- `TIMESTAMPTZ` - For all timestamp fields (timezone-aware)

### UUID Fields
- Used for: `scraping_sessions.id`, `scraped_documents.id`, `gpt_inferences.id`, `batch_releases.id`, `kb_notifications.id`
- Generated via `gen_random_uuid()`

### Vector Fields
- `embedding` - `vector(1536)` (requires pgvector extension)
- Dimension: 1536 (for `text-embedding-3-small` model)

### Check Constraints
- `scraping_sessions.status` IN ('pending', 'running', 'paused', 'completed', 'failed', 'canceled')
- `scraped_documents.parse_status` IN ('parsed', 'needs_review', 'failed')
- `gpt_inferences.status` IN ('ok', 'low_confidence', 'failed', 'needs_review')
- `batch_releases.status` IN ('draft', 'verifying', 'published', 'failed', 'canceled')

### Default Values
- `kb_entries.status` DEFAULT 'unreleased'
- `kb_entries.source_urls` DEFAULT '[]'::jsonb
- `scraping_sessions.source` DEFAULT 'lawphil'
- `scraping_sessions.status` DEFAULT 'pending'
- `scraping_sessions.is_saved` DEFAULT FALSE
- `scraped_documents.parse_status` DEFAULT 'parsed'
- `gpt_inferences.status` DEFAULT 'ok'
- `batch_releases.status` DEFAULT 'draft'
- `kb_notifications.status` DEFAULT 'pending'
- `users.role` DEFAULT 'user'
- All `created_at` and `updated_at` fields DEFAULT `now()`

---

## Entry Types and Subtypes

### Entry Types

1. **constitution_provision** - Constitutional provisions
2. **statute_section** - Statute sections
3. **rule_of_court_provision** - Rules of Court provisions
4. **executive_issuance** - Executive issuances
5. **judicial_issuance** - Judicial issuances
6. **agency_issuance** - Agency issuances
7. **jurisprudence_decision** - Jurisprudence decisions
8. **city_ordinance_section** - City ordinance sections
9. **rights_advisory** - Rights advisories
10. **pnp_sop** - PNP standard operating procedures
11. **incident_checklist** - Incident checklists

### Subtypes (Defined in entry_subtypes table)

#### Constitution Provisions
- `constitution_1987` - 1987 Constitution
- `constitution_1986` - 1986 Freedom Constitution
- `constitution_1973` - 1973 Constitution
- `constitution_1935` - 1935 Constitution
- `constitution_malolos` - Malolos Constitution

#### Statute Sections
- `republic_act` - Republic Acts
- `commonwealth_act` - Commonwealth Acts
- `mga_batas_pambansa` - Batas Pambansa laws
- `act` - Acts of Congress

#### Rules of Court
- `roc_criminal_proc_1985` - 1985 Rules of Criminal Procedure
- `roc_civil_proc` - Rules of Civil Procedure
- `roc_evidence_2019` - Rules of Evidence (2019)
- `roc_special_proceedings` - Rules of Special Proceedings
- `roc_other` - Other Rules of Court

### Subtype Field Schemas

Each subtype has a `field_schema` JSONB column in `entry_subtypes` that defines:
- Required fields
- Optional fields
- Field types and constraints
- References to other entries

Example schema structure:
```json
{
  "required": ["article_number", "section_number", "title", "body"],
  "properties": {
    "article_number": {"type": "integer", "minimum": 0},
    "section_number": {"type": "integer", "minimum": 0},
    "body": {"type": "string"},
    "topics": {"type": "array", "items": {"type": "string"}}
  }
}
```

---

## Field Descriptions

### Core Identification Fields

**entry_id**
- **Type:** TEXT, PRIMARY KEY
- **Description:** Unique identifier for the entry
- **Format:** Typically follows pattern like "CONST-1987-ART18-SEC28" or "RA-1234-SEC5"
- **Required:** Yes

**type**
- **Type:** TEXT, NOT NULL
- **Description:** Primary entry type
- **Values:** See [Entry Types](#entry-types) section
- **Required:** Yes

**entry_subtype**
- **Type:** TEXT
- **Description:** Specific subtype within the type
- **Values:** See [Subtypes](#subtypes-defined-in-entry_subtypes-table) section
- **Required:** No (but recommended)

**title**
- **Type:** TEXT, NOT NULL
- **Description:** Human-readable title of the entry
- **Example:** "Article XVIII – Transitory Provisions, Section 28"
- **Required:** Yes

**canonical_citation**
- **Type:** TEXT
- **Description:** Standard legal citation
- **Example:** "1987 Const., Art. XVIII, Sec. 28"
- **Required:** No

**section_id**
- **Type:** TEXT
- **Description:** Structured section identifier for filtering and deduplication
- **Example:** "ART18-SEC28"
- **Required:** No

### Content Fields

**text**
- **Type:** TEXT
- **Description:** Full text content of the legal provision (normalized header + body)
- **Required:** No

**tags**
- **Type:** TEXT[]
- **Description:** Array of descriptive tags for categorization
- **Required:** No

**key_concepts**
- **Type:** TEXT[]
- **Description:** Array of key legal concepts extracted from the provision
- **Added:** Migration 026
- **Required:** No

**historical_context**
- **Type:** TEXT
- **Description:** One-line note about historical applicability for pre-1946 Acts
- **Example:** "Pre-Commonwealth statute; may be repealed or superseded"
- **Added:** Migration 030
- **Required:** No

### Metadata Fields

**jurisdiction**
- **Type:** TEXT
- **Description:** Geographic jurisdiction
- **Typical Value:** "Philippines"
- **Required:** No

**law_family**
- **Type:** TEXT
- **Description:** Legal family classification
- **Values:** "constitution", "statute", "rule", "exec_issuance", "judicial_issuance", "jurisprudence", "ordinance", "agency_issuance"
- **Required:** No

**status**
- **Type:** TEXT, DEFAULT 'unreleased'
- **Description:** Entry lifecycle status
- **Values:** "unreleased", "draft", "released", "published"
- **Default:** 'unreleased'
- **Required:** No (but has default)

### Enrichment Fields

All enrichment fields are GPT-generated and contain textual analysis:

- **applicability** - Who this provision applies to
- **penalties** - Penalties and consequences
- **defenses** - Available defenses
- **time_limits** - Time limits and deadlines
- **required_forms** - Required forms and procedures
- **elements** - Key legal elements
- **triggers** - What triggers this provision
- **violation_code** - Violation classification code
- **violation_name** - Name of violations
- **fine_schedule** - Fine schedule
- **license_action** - License actions
- **apprehension_flow** - Apprehension process
- **incident** - Incident definition
- **phases** - Process phases
- **forms** - Required forms
- **handoff** - Handoff procedures

### Rights and Protections Fields

**rights_callouts**
- **Type:** TEXT[]
- **Description:** Array of important rights or protections mentioned
- **Required:** No

**rights_scope**
- **Type:** TEXT
- **Description:** Scope of rights or protections
- **Required:** No

**advice_points**
- **Type:** TEXT[]
- **Description:** Array of key advice or guidance points
- **Required:** No

### Legal Context Fields

**jurisprudence**
- **Type:** TEXT[]
- **Description:** Array of relevant case law or precedents
- **Required:** No

**legal_bases**
- **Type:** TEXT[]
- **Description:** Array of legal foundations or authorities
- **Required:** No

**related_laws**
- **Type:** TEXT[]
- **Description:** Array of related section/law references
- **Note:** Renamed from `related_sections` in migration 027
- **Required:** No

### Source and Provenance

**source_urls**
- **Type:** JSONB, DEFAULT '[]'::jsonb
- **Description:** Array of source URLs (stored as JSONB array)
- **Format:** `["https://example.com/law1", "https://example.com/law2"]`
- **Default:** Empty array
- **Required:** No

**provenance**
- **Type:** JSONB
- **Description:** Source and processing metadata
- **Format:** `{ "source": "lawphil_scraping", "session_id": "uuid", "scraped_at": "timestamp", "content_hash": "sha256" }`
- **Required:** No

### Release Management

**batch_release_id**
- **Type:** UUID, NULL
- **Description:** Foreign key to batch_releases.id
- **Required:** No

**published_at**
- **Type:** TIMESTAMPTZ, NULL
- **Description:** Publication timestamp
- **Required:** No

### Dates

**effective_date**
- **Type:** DATE
- **Description:** Date when the legal provision became effective
- **Format:** YYYY-MM-DD
- **Required:** No

**amendment_date**
- **Type:** DATE
- **Description:** Date when the legal provision was last amended
- **Format:** YYYY-MM-DD
- **Required:** No

### Verification

**verified**
- **Type:** BOOLEAN, NULL
- **Description:** Whether entry has been verified
- **Required:** No

**verified_by**
- **Type:** TEXT, NULL
- **Description:** Who verified the entry
- **Required:** No

**verified_at**
- **Type:** TIMESTAMPTZ, NULL
- **Description:** When entry was verified
- **Required:** No

### Subtype-Specific Fields

**subtype_fields**
- **Type:** JSONB
- **Description:** JSONB object containing subtype-specific fields
- **Example:** `{ "article_number": 18, "section_number": 28, "chapter_number": null }`
- **Required:** No

### Search and Embeddings

**embedding**
- **Type:** VECTOR(1536), NULL
- **Description:** Vector embedding for semantic search
- **Model:** text-embedding-3-small
- **Dimension:** 1536
- **Similarity Function:** Cosine similarity
- **Required:** No (requires pgvector extension)

**fts**
- **Type:** TSVECTOR (generated column)
- **Description:** Full-text search vector (generated automatically)
- **Weighted Fields:** title (A), canonical_citation (A), text (C)
- **Required:** No (generated)

### Audit Fields

**created_by**
- **Type:** INTEGER, NULL
- **Description:** Foreign key to users.id
- **Required:** No

**created_by_name**
- **Type:** TEXT
- **Description:** Name of creator (denormalized)
- **Required:** No

**created_at**
- **Type:** TIMESTAMPTZ, NOT NULL, DEFAULT now()
- **Description:** Entry creation timestamp
- **Required:** Yes (has default)

**updated_at**
- **Type:** TIMESTAMPTZ, NOT NULL, DEFAULT now()
- **Description:** Last update timestamp
- **Required:** Yes (has default)

---

## Migration History

The schema has evolved through multiple migrations. Key migrations:

1. **001_init.sql** - Initial table creation
2. **013_fulltext.sql** - Full-text search support
3. **017_scraping_automation.sql** - Scraping automation tables
4. **018_populate_subtypes.sql** - Subtype definitions
5. **019_slim_kb_entries.sql** - Removed some fields (later restored)
6. **020_comprehensive_enrichment.sql** - Added enrichment fields
7. **021_scrape_batches.sql** - Batch management
8. **022_add_dates.sql** - Date fields
9. **023_restore_subtype_fields.sql** - Restored subtype_fields
10. **024_fix_array_fields.sql** - Fixed array field types
11. **025_rebuild_kb_entries.sql** - Rebuild with comprehensive schema
12. **026_ensure_enrichment_columns.sql** - Ensured all enrichment columns exist
13. **027_related_laws.sql** - Renamed related_sections to related_laws
14. **028_enable_pgvector.sql** - pgvector extension
15. **029_convert_tags_textarray.sql** - Converted tags to TEXT[]
16. **030_add_historical_context.sql** - Added historical_context field

---

## Important Notes for Migration

1. **Column Name Changes:**
   - `related_sections` was renamed to `related_laws` in migration 027
   - Index names may still reference old column names

2. **Optional Fields:**
   - `summary` field may or may not exist depending on migration order
   - `embedding` column only exists if pgvector extension is available

3. **Array Fields:**
   - All array fields use PostgreSQL `TEXT[]` syntax
   - GIN indexes are created on array fields for efficient querying

4. **JSONB Fields:**
   - `source_urls` is stored as JSONB but represents an array
   - `provenance` and `subtype_fields` are JSONB objects

5. **Vector Embeddings:**
   - Requires pgvector extension
   - Dimension is 1536 (for text-embedding-3-small model)
   - IVFFlat index is created for KNN search

6. **Full-Text Search:**
   - Generated column `fts` is created automatically
   - GIN index on `fts` for efficient full-text queries

7. **Foreign Keys:**
   - `kb_entries.created_by` references `users.id` (may be NULL)
   - `kb_entries.batch_release_id` references `batch_releases.id` (may be NULL)
   - Cascading deletes on scraping-related tables

8. **Check Constraints:**
   - Status fields have CHECK constraints limiting valid values
   - Ensure these constraints are preserved during migration

---

## Sample Queries

### Get all entries with embeddings
```sql
SELECT entry_id, title, embedding
FROM kb_entries
WHERE embedding IS NOT NULL;
```

### Search by tags
```sql
SELECT entry_id, title, tags
FROM kb_entries
WHERE 'constitutional-rights' = ANY(tags);
```

### Full-text search
```sql
SELECT entry_id, title, ts_rank_cd(fts, query) AS rank
FROM kb_entries, to_tsquery('english', 'constitution & rights') query
WHERE fts @@ query
ORDER BY rank DESC;
```

### Vector similarity search
```sql
SELECT entry_id, title, 1 - (embedding <=> query_embedding) AS similarity
FROM kb_entries
WHERE embedding IS NOT NULL
ORDER BY embedding <=> query_embedding
LIMIT 10;
```

### Get entries by batch release
```sql
SELECT e.entry_id, e.title, b.status, b.published_at
FROM kb_entries e
JOIN batch_releases b ON e.batch_release_id = b.id
WHERE b.status = 'published';
```

---

## Conclusion

This document provides a complete reference for the Knowledge Base schema. When migrating to a deployed environment:

1. Ensure all PostgreSQL extensions are installed
2. Run migrations in order (001 through 030)
3. Verify all indexes are created
4. Check foreign key relationships
5. Validate data types match expectations
6. Test full-text and vector search functionality

For questions or clarifications, refer to the individual migration files in `server/sql/`.




