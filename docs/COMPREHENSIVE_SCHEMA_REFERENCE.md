# Comprehensive Schema Reference: Entry Types, Subtypes, and Fields

This document provides a complete reference for all entry types, their subtypes, and field definitions in the Civilify Law Entry Knowledge Base system.

## Table of Contents
1. [Base Schema (Common to All Entries)](#base-schema-common-to-all-entries)
2. [Entry Types and Subtypes](#entry-types-and-subtypes)
3. [Comprehensive Enrichment Fields](#comprehensive-enrichment-fields)
4. [Type-Specific Field Schemas](#type-specific-field-schemas)
5. [Subtype-Specific Field Schemas](#subtype-specific-field-schemas)
6. [Field Validation Rules](#field-validation-rules)
7. [Database Schema Mapping](#database-schema-mapping)

---

## Base Schema (Common to All Entries)

All entries share these core fields, organized by functional groups:

### Core Identification Fields
- **`entry_id`** (string, required): Unique identifier for the entry
- **`type`** (string, required): Primary entry type (e.g., "constitution_provision")
- **`entry_subtype`** (string, required): Specific subtype (e.g., "constitution_1987")
- **`title`** (string, required): Human-readable title
- **`canonical_citation`** (string, required): Standard legal citation
- **`section_id`** (string, nullable): Structured section identifier

### Metadata Fields
- **`jurisdiction`** (string, required): Always "Philippines" for current implementation
- **`law_family`** (string, required): Legal family classification
- **`status`** (enum, required): Entry status - "draft", "released", "published"
- **`effective_date`** (date, nullable): When the law becomes effective
- **`amendment_date`** (date, nullable): When the law was last amended

### Content Fields
- **`summary`** (string, required): Auto-generated summary (GPT-enriched)
- **`text`** (string, required): Full text content (body_text)
- **`source_urls`** (array, required): Array of source URLs
- **`tags`** (array, required): Array of descriptive tags
- **`key_concepts`** (array, required): Array of key legal concepts

### Contextual Fields (GPT-Enriched)
- **`topics`** (array): Legal topics and themes
- **`jurisprudence`** (string): Related case law
- **`legal_bases`** (string): Legal foundations
- **`related_sections`** (array): Related section references

### Procedural Fields (GPT-Enriched)
- **`applicability`** (string): Who this provision applies to
- **`time_limits`** (string): Time limits and deadlines
- **`required_forms`** (string): Required forms and procedures
- **`phases`** (string): Process phases
- **`forms`** (string): Required forms
- **`handoff`** (string): Handoff procedures

### Enforcement Fields (GPT-Enriched)
- **`penalties`** (string): Penalties and consequences
- **`defenses`** (string): Available defenses
- **`elements`** (string): Key legal elements
- **`triggers`** (string): What triggers this provision
- **`violation_code`** (string, nullable): Violation classification code
- **`violation_name`** (string, nullable): Name of violations
- **`fine_schedule`** (string, nullable): Fine schedule
- **`license_action`** (string, nullable): License actions
- **`apprehension_flow`** (string, nullable): Apprehension process

### Rights and Protections Fields (GPT-Enriched)
- **`rights_callouts`** (string, nullable): Important rights
- **`rights_scope`** (string, nullable): Scope of rights
- **`advice_points`** (string, nullable): Key advice points

### System Fields
- **`created_at`** (datetime, required): Entry creation timestamp
- **`updated_at`** (datetime, required): Last update timestamp
- **`published_at`** (datetime, nullable): Publication timestamp
- **`provenance`** (object, required): Source and processing metadata
- **`embedding`** (vector, required): Vector embedding for semantic search

---

## Entry Types and Subtypes

### 1. Constitution Provision (`constitution_provision`)

**Subtypes:**
- `constitution_1987` - 1987 Constitution of the Philippines
- `constitution_1986` - 1986 Freedom Constitution
- `constitution_1973` - 1973 Constitution
- `constitution_1943` - 1943 Constitution
- `constitution_1935` - 1935 Constitution
- `constitution_malolos` - Malolos Constitution

**Type-Specific Fields:**
- **`article_number`** (integer): Article number (1-18 for 1987 Constitution)
- **`section_number`** (integer): Section number within article
- **`chapter_number`** (integer, nullable): Chapter number (for historical constitutions)
- **`preamble`** (boolean): Whether this is a preamble entry
- **`topics`** (array): Constitutional topics and themes
- **`jurisprudence`** (array): Related case law and precedents

### 2. Statute Section (`statute_section`)

**Subtypes:**
- `act` - Acts of Congress
- `commonwealth_act` - Commonwealth Acts
- `mga_batas_pambansa` - Batas Pambansa laws
- `republic_act` - Republic Acts

**Type-Specific Fields:**
- **`section_number`** (string/integer): Section number within the statute
- **`elements`** (string): Legal elements of the provision
- **`penalties`** (string): Penalties and consequences
- **`defenses`** (string): Available defenses
- **`triggers`** (string): What triggers this provision
- **`time_limits`** (string): Time limits and deadlines
- **`required_forms`** (string): Required forms and procedures
- **`prescriptive_period`** (object): Prescriptive period with value and unit

**Subtype-Specific Fields:**
- **`act_number`** (integer): For `act` subtype
- **`commonwealth_act_number`** (integer): For `commonwealth_act` subtype
- **`mbp_number`** (integer): For `mga_batas_pambansa` subtype
- **`ra_number`** (integer): For `republic_act` subtype

### 3. Rule of Court Provision (`rule_of_court_provision`)

**Subtypes:**
- `roc_criminal_proc_1985` - 1985 Rules of Criminal Procedure
- `roc_civil_proc` - Rules of Civil Procedure
- `roc_evidence` - Rules of Evidence
- `roc_special_proceedings` - Rules of Special Proceedings
- `roc_other` - Other Rules of Court

**Type-Specific Fields:**
- **`rule_number`** (integer): Rule number
- **`section_number`** (string): Section number within rule
- **`triggers`** (string): What triggers this rule
- **`time_limits`** (string): Time limits and deadlines
- **`required_forms`** (string): Required forms and procedures

### 4. Executive Issuance (`executive_issuance`)

**Subtypes:**
- `presidential_decree` - Presidential Decrees
- `executive_order` - Executive Orders
- `administrative_order` - Administrative Orders
- `memorandum_order` - Memorandum Orders
- `memorandum_circular` - Memorandum Circulars
- `proclamation` - Proclamations
- `general_order` - General Orders
- `special_order` - Special Orders

**Type-Specific Fields:**
- **`instrument_number`** (string): Official instrument number
- **`subject`** (string, nullable): Subject matter
- **`signing_authority`** (string, nullable): Who signed the issuance
- **`signing_date`** (date, nullable): When it was signed
- **`applicability`** (string): Who this applies to
- **`supersedes`** (array): What this supersedes

### 5. Judicial Issuance (`judicial_issuance`)

**Subtypes:**
- `supreme_court` - Supreme Court issuances
- `court_of_appeals` - Court of Appeals issuances
- `court_of_tax_appeals` - Court of Tax Appeals issuances
- `sandiganbayan` - Sandiganbayan issuances
- `regional_trial_court` - Regional Trial Court issuances
- `metropolitan_trial_court` - Metropolitan Trial Court issuances
- `municipal_trial_court` - Municipal Trial Court issuances
- `municipal_circuit_trial_court` - Municipal Circuit Trial Court issuances

**Type-Specific Fields:**
- **`issuing_court`** (string): Name of the issuing court
- **`document_number`** (string): Court document number
- **`date`** (date, nullable): Issuance date
- **`subjects`** (array): Subject matter tags
- **`related_rules`** (array): Related court rules

### 6. Agency Issuance (`agency_issuance`)

**Subtypes:**
- `comelec` - Commission on Elections
- `civil_service_commission` - Civil Service Commission
- `commission_on_audit` - Commission on Audit
- `muslim_mindanao_autonomy_act` - Muslim Mindanao Autonomy Act
- `lto` - Land Transportation Office
- `pnp` - Philippine National Police
- `doj_guideline` - Department of Justice Guidelines
- `other_agency` - Other government agencies

**Type-Specific Fields:**
- **`agency`** (string): Issuing agency name
- **`issuance_number`** (string): Agency issuance number
- **`issuance_date`** (date, nullable): Issuance date
- **`subject`** (string, nullable): Subject matter
- **`applicability`** (string): Who this applies to
- **`supersedes`** (array): What this supersedes

### 7. Jurisprudence Decision (`jurisprudence_decision`)

**Subtypes:**
- `sc_en_banc` - Supreme Court En Banc decisions
- `sc_division` - Supreme Court Division decisions
- `ca` - Court of Appeals decisions
- `cta` - Court of Tax Appeals decisions
- `sandiganbayan` - Sandiganbayan decisions

**Type-Specific Fields:**
- **`court`** (string): Court that decided the case
- **`docket`** (string, nullable): Docket number
- **`gr_number`** (string, nullable): G.R. number
- **`promulgation_date`** (date): Decision date
- **`ponente`** (string, nullable): Justice who wrote the decision
- **`syllabus`** (array): Case syllabus points
- **`doctrines`** (array): Legal doctrines established
- **`dispositive`** (string, nullable): Dispositive portion
- **`case_text`** (string): Full case text
- **`citations`** (array): Legal citations
- **`related_provisions`** (array): Related legal provisions

### 8. City Ordinance Section (`city_ordinance_section`)

**Subtypes:**
- `city` - City ordinances
- `municipality` - Municipal ordinances

**Type-Specific Fields:**
- **`ordinance_number`** (string): Ordinance number
- **`series_year`** (integer, nullable): Series year
- **`section_number`** (string/integer): Section number
- **`elements`** (string): Legal elements
- **`penalties`** (string): Penalties and consequences
- **`lgu_level`** (string): Local government unit level
- **`lgu_name`** (string): Local government unit name

### 9. Rights Advisory (`rights_advisory`)

**Subtypes:**
- `national` - National rights advisories

**Type-Specific Fields:**
- **`rights_scope`** (string): Scope of rights covered
- **`advice_points`** (string): Key advice points
- **`rights_callouts`** (string): Important rights callouts

### 10. PNP SOP (`pnp_sop`)

**Subtypes:**
- `national` - National PNP standard operating procedures

**Type-Specific Fields:**
- **`steps_brief`** (array): Brief steps overview
- **`forms_required`** (array): Required forms
- **`failure_states`** (array): Failure state descriptions

### 11. Incident Checklist (`incident_checklist`)

**Subtypes:**
- `national` - National incident checklists

**Type-Specific Fields:**
- **`incident`** (string): Type of incident
- **`phases`** (string): Process phases
- **`forms`** (string): Required forms
- **`handoff`** (string): Handoff procedures
- **`rights_callouts`** (string): Rights callouts

---

## Comprehensive Enrichment Fields

All entries are enriched with these comprehensive fields through GPT processing:

### Legal Analysis Fields
- **`applicability`** (string): Who this provision applies to
- **`penalties`** (string): Penalties and consequences
- **`defenses`** (string): Available defenses
- **`time_limits`** (string): Time limits and deadlines
- **`required_forms`** (string): Required forms and procedures

### Legal Elements Fields
- **`elements`** (string): Key legal elements
- **`triggers`** (string): What triggers this provision
- **`violation_code`** (string, nullable): Violation classification code
- **`violation_name`** (string, nullable): Name of violations
- **`fine_schedule`** (string, nullable): Fine schedule
- **`license_action`** (string, nullable): License actions

### Enforcement Process Fields
- **`apprehension_flow`** (string, nullable): Apprehension process
- **`incident`** (string, nullable): Incident definition
- **`phases`** (string, nullable): Process phases
- **`forms`** (string, nullable): Required forms
- **`handoff`** (string, nullable): Handoff procedures

### Rights and Protections Fields
- **`rights_callouts`** (string, nullable): Important rights
- **`rights_scope`** (string, nullable): Scope of rights
- **`advice_points`** (string, nullable): Key advice points

### Legal Context Fields
- **`jurisprudence`** (string, nullable): Related case law
- **`legal_bases`** (string, nullable): Legal foundations
- **`related_sections`** (array, nullable): Related section references

---

## Field Validation Rules

### Required Fields (All Entries)
- `entry_id`, `type`, `entry_subtype`, `title`, `canonical_citation`
- `jurisdiction`, `law_family`, `status`, `summary`, `text`
- `source_urls`, `tags`, `key_concepts`, `provenance`

### Conditional Requirements
- **Constitution Provision**: `article_number`, `section_number`
- **Statute Section**: One of `act_number`, `commonwealth_act_number`, `mbp_number`, `ra_number`
- **Rule of Court**: `rule_number`, `section_number`
- **Executive Issuance**: `instrument_number`
- **Judicial Issuance**: `issuing_court`, `document_number`
- **Agency Issuance**: `agency`, `issuance_number`
- **Jurisprudence**: `court`, `promulgation_date`, `case_text`
- **City Ordinance**: `ordinance_number`, `lgu_level`, `lgu_name`

### Data Types and Formats
- **Dates**: ISO-8601 format (YYYY-MM-DD)
- **DateTimes**: ISO-8601 format (YYYY-MM-DDTHH:mm:ssZ)
- **URLs**: Valid URI format
- **Arrays**: Non-empty arrays where required
- **Strings**: Minimum length of 1 for required fields
- **Numeric Identifiers**: 
  - `article_number`: Always integer (1-18 for 1987 Constitution)
  - `section_number`: String for flexibility (handles "1", "1-A", "1(a)")
  - `rule_number`: Always integer
  - `act_number`, `ra_number`, etc.: Always integer

### Enum Values
- **Status**: "draft", "released", "published"
- **Jurisdiction**: "Philippines"
- **Law Family**: "constitution", "statute", "rule", "exec_issuance", "judicial_issuance", "jurisprudence", "ordinance", "agency_issuance"

---

## Database Schema Mapping

### Core Tables
- **`kb_entries`**: Main entries table with all fields
- **`entry_subtypes`**: Subtype definitions and schemas
- **`scraping_sessions`**: Scraping session metadata
- **`scraped_documents`**: Raw scraped document data
- **`gpt_inferences`**: GPT processing results
- **`batch_releases`**: Batch release management

### Indexes
- **Primary**: `entry_id` (unique)
- **Search**: `fts` (full-text search), `embedding` (vector similarity)
- **Filtering**: `type`, `entry_subtype`, `status`, `jurisdiction`, `law_family`
- **Relations**: `related_sections`, `legal_bases` (JSONB GIN indexes)

### Vector Search
- **Embedding Model**: `text-embedding-3-small`
- **Vector Dimension**: 1536
- **Similarity Function**: Cosine similarity
- **Search Integration**: Full-text search combined with vector similarity

---

## Implementation Notes

### GPT Enrichment Process
1. **Input**: Raw scraped text and metadata
2. **Processing**: GPT-4o analyzes content and fills enrichment fields
3. **Validation**: Schema validation against type-specific requirements
4. **Storage**: All fields stored in `kb_entries` table
5. **Vector Generation**: Embedding created from enriched content

### Entry Creation Workflow
1. **Scraping**: Extract content from LawPhil.net
2. **Parsing**: Identify structure (articles, sections, etc.)
3. **GPT Processing**: Enrich with comprehensive legal analysis
4. **Validation**: Ensure all required fields are present
5. **Storage**: Create entry with full enrichment data
6. **Vector Generation**: Create semantic search embedding

### Quality Assurance
- **Completeness**: All required fields must be populated
- **Accuracy**: GPT enrichment validated against legal standards
- **Consistency**: Standardized formatting and terminology
- **Traceability**: Full provenance tracking from source to entry

This comprehensive schema ensures consistent, rich, and searchable legal knowledge base entries with full traceability and professional-grade legal analysis.
