# LawPhil Scraping -> Custom GPT -> KB Auto-Ingestion

Owner: Keith (Operator) | Dev: Automation | Status: Draft v1 | Last updated: 2025-10-05

Link
- Planning reference: https://lawphil.net/

---

## 0) Executive Summary

Automate end-to-end ingestion of legal materials from LawPhil:
- Crawl documents in deterministic order aligned with LawPhil.
- Parse and normalize text + metadata into structured nodes.
- Send content to a Custom GPT to infer entry type/subtype and fill fields.
- Validate results against subtype schemas; reject on violations/low confidence.
- Create KB entries programmatically (no "possible matches").
- Publish via incremental batch releases per entry type/subtype (e.g., 1987 Constitution first, then all Constitutions, ROCs, Acts: RA/CA/MBP).
- Operator control with On/Off toggle, resume, progress, retries.

---

## 1) Requirements

- Fresh DB; deprecate team-progress.
- Deterministic sequence based on LawPhil ordering.
- Entry sub-types per type (e.g., statute_section/act, statute_section/commonwealth_act, constitution_provision/constitution_1987, rule_of_court_provision/roc).
- Full automation path: scrape -> parse -> GPT JSON -> validate -> ingest -> batch release.
- Admin controls: global toggle, start/pause/resume/cancel, progress, error views, publish.
- Compliance: robots.txt/ToS, polite rate limits, user-agent, caching, retries, kill switch.
- Observability: logs, metrics, alerts, provenance (URL + content hash), idempotency and resume.

Non-goals (v1):
- No possible-matches step; no crowd review workflow (only optional low-confidence review queue).

---

## 2) Architecture Overview

Components
- Admin UI (web): start/stop sessions, monitor, publish batches.
- Admin API: session lifecycle, status, batch releases.
- Scraper Worker:
  - Orchestrator: sessions, queueing, resume, backoff.
  - Fetcher: HTTP with politeness and caching.
  - Parsers: per category (constitution, ROC, acts) producing structured nodes.
  - Normalizer: strip chrome, preserve legal structure.
- Custom GPT Client: type/subtype inference and field completion.
- Ingestion Pipeline: schema-validate; create entries.
- Release Manager: drafts -> verify -> publish.

Storage
- PostgreSQL for sessions, documents, inferences, entries, releases.
- Optional disk/object cache for fetched HTML.

---

## 3) Data Model

- entry_subtypes
  - id pk
  - type text (constitution_provision | statute_section | rule_of_court_provision)
  - subtype text (constitution_1987 | act | commonwealth_act | mbp | roc)
  - field_schema jsonb (JSONSchema-like definition)
  - created_at, updated_at
  - unique (type, subtype)

- scraping_sessions
  - id pk
  - source text default 'lawphil'
  - category text (constitution_1987 | constitution_all | roc | acts)
  - root_url text
  - status enum: pending | running | paused | completed | failed | canceled
  - started_at, finished_at
  - current_cursor text (resume token: url or logical index)
  - operator text
  - notes text

- scraped_documents
  - id pk
  - session_id fk
  - canonical_url text
  - source_hash text (sha256 of canonicalized content)
  - raw_html text
  - extracted_text text
  - metadata jsonb (title, numbers, headings, citations)
  - parse_status enum: parsed | needs_review | failed
  - sequence_index int
  - created_at
  - unique (canonical_url, source_hash)

- gpt_inferences
  - id pk
  - scraped_document_id fk
  - request_payload jsonb
  - response_payload jsonb
  - inferred_type text
  - inferred_subtype text
  - fields jsonb
  - confidence float
  - status enum: ok | low_confidence | failed | needs_review
  - created_at
  - index (inferred_type, inferred_subtype)

- kb_entries (extend)
  - add column entry_subtype text not null (ref by convention to entry_subtypes)
  - add column subtype_fields jsonb not null
  - add column batch_release_id fk nullable
  - add column published_at timestamptz nullable
  - provenance: session_id, scraped_document_id, gpt_inference_id, canonical_url, source_hash

- batch_releases
  - id pk
  - category text
  - status enum: draft | verifying | published | failed | canceled
  - created_at, published_at, published_by
  - notes text

Indexes
- scraped_documents (session_id, sequence_index)
- scraped_documents (canonical_url)
- gpt_inferences (scraped_document_id)
- kb_entries (batch_release_id, published_at)
- batch_releases (category, status)

---

## 4) Sub-Types and Field Schemas (Initial)

- constitution_provision / constitution_1987
  - required: articleNumber int, sectionNumber int, title text, body text
  - optional: citations[] text, notes text

- rule_of_court_provision / roc
  - required: ruleNumber int, sectionNumber int, title text, body text
  - optional: partNumber int, citations[] text

- statute_section / act
  - required: actNumber int, sectionNumber int, title text, body text
  - optional: dateEnacted text, publisher text, citations[] text

- statute_section / commonwealth_act
  - same as act with commonwealthActNumber

- statute_section / mbp
  - same as act with mbpNumber

Schemas stored in entry_subtypes.field_schema and enforced at ingestion.

---

## 5) Sequencing

- constitution_1987: Preamble -> Articles I..XVIII -> each Article's Sections in numeric order.
- constitution_all: all constitutions with their internal order.
- roc: Part -> Rule -> Section order as listed on LawPhil.
- acts: LawPhil listing order for RA/CA/MBP; within each act, section order.

sequence_index assigned during parse is authoritative for ingestion and release.

---

## 6) Fetching and Politeness

- Respect robots.txt and ToS.
- Config:
  - SCRAPER_ON (bool), SCRAPER_MAX_RPS (e.g., 1-3), SCRAPER_CONCURRENCY (1-3), SCRAPER_USER_AGENT
  - CUSTOM_GPT_API_URL, CUSTOM_GPT_API_KEY, CUSTOM_GPT_TIMEOUT_MS
- Exponential backoff with jitter; obey Retry-After.
- Local cache by canonical_url to avoid repeated downloads.
- Descriptive User-Agent with contact email.

---

## 7) Parsers

Contract
- Input: { canonicalUrl, html }
- Output:
  - extracted_text
  - metadata: { title, articleNumber?, sectionNumber?, ruleNumber?, actNumber?, dates?, headings[], citations[] }
  - sequence_index
  - children[] (optional) for hierarchical pages

Parsers v1
- Constitution1987Parser
  - Detect Preamble, Article headings, Section headings.
  - Extract clean body per section; keep normalized numbering.
  - Assign sequence_index incrementally during traversal.
- ConstitutionParser (general)
  - Similar heuristics for other constitutions; allow selector tweaks.
- ROCsParser
  - Parse Rule/Section structure; keep titles and subparts.
- ActsParser
  - Crawl listing pages for RA/CA/MBP; follow to individual act pages; parse sections.

Normalization
- Remove nav/footers and site chrome.
- Preserve legal formatting: headings, numbered lists, block quotes.
- Canonical URL generation with anchors for sections (root plus stable fragment).

---

## 8) Orchestrator and Job Flow

States: pending -> running -> paused/resumed -> completed | failed | canceled

Loop
1) Load session with SCRAPER_ON=true.
2) Get next work item (URL or DOM node pointer).
3) Fetch page (with cache, throttle).
4) Parse into one or more scraped_documents with sequence_index.
5) For each document: enqueue GPT inference.
6) On inference ok: enqueue ingestion.
7) Update current_cursor for resume.
8) On error: mark failed with error code; retry with capped attempts.

Idempotency
- Skip if (canonical_url, source_hash) already exists.
- If upstream content changes (new hash), treat as new revision or mark for update.

---

## 9) Custom GPT Integration

Request (example)
```json
{
  "source": "lawphil",
  "category": "constitution_1987",
  "canonicalUrl": "https://lawphil.net/consti/cons1987.html#article-III-section-1",
  "text": "Section 1. ...",
  "metadata": {
    "articleNumber": 3,
    "sectionNumber": 1,
    "title": "Bill of Rights - Section 1"
  },
  "candidates": ["constitution_provision","statute_section","rule_of_court_provision"],
  "requireSubtype": true,
  "schema": {
    "type": "constitution_provision/constitution_1987",
    "required": ["articleNumber","sectionNumber","title","body"]
  }
}
```

Response (example)
```json
{
  "inferredType": "constitution_provision",
  "inferredSubtype": "constitution_1987",
  "fields": {
    "articleNumber": 3,
    "sectionNumber": 1,
    "title": "Bill of Rights - Section 1",
    "body": "Section 1. ...",
    "citations": []
  },
  "confidence": 0.93
}
```

Rules
- Strict JSON only; validate against schema.
- Confidence threshold (e.g., >= 0.85) to accept automatically.
- On low confidence or schema violation: retry once; then mark needs_review.
- Log request/response in gpt_inferences.

Cost control
- Keep prompts concise; choose efficient model.
- Batch/backoff; cap TPS to API.

---

## 10) Ingestion Pipeline

- Validate inferredType/subtype and fields against entry_subtypes.field_schema.
- Create kb_entries in sequence order with status draft (not published).
- Store provenance: session_id, scraped_document_id, gpt_inference_id, canonical_url, source_hash.
- No possible matches.
- Idempotent: skip duplicates based on URL/hash; update strategy if content changes.

---

## 11) Batch Release (Incremental KB)

- Create batch_releases row when a category/subtype set is fully ingested.
- Auto-verification:
  - Completeness (expected Preamble/Articles/Sections for 1987 Constitution).
  - No empty bodies/titles; unique numbering within scope.
- On success: set status published, stamp published_at, link entries via batch_release_id.
- UI surfaces newly available content by release.

---

## 12) Admin UI and APIs

UI (admin-only)
- Global toggle On/Off.
- Start session (select category, paste root URL).
- Progress: queued/succeeded/failed counts, last error, current cursor.
- Controls: Pause/Resume/Cancel, Retry failed.
- Batch releases: review summary, publish.

APIs
- POST /admin/scrape/sessions { category, rootUrl }
- POST /admin/scrape/sessions/:id/pause
- POST /admin/scrape/sessions/:id/resume
- POST /admin/scrape/sessions/:id/cancel
- GET  /admin/scrape/sessions/:id
- POST /admin/releases { category }
- POST /admin/releases/:id/publish
- GET  /admin/releases/:id

Config Flag
- SCRAPER_ON must be true to start/resume sessions.

---

## 13) Observability, Errors, and Alerts

- Structured logs with correlation IDs: sessionId, docId, inferenceId.
- Metrics:
  - Fetch/parse success and failure counts; GPT ok/low/fail; ingestion ok/fail.
  - Latency and throughput per stage.
  - Queue backlog size and age.
- Alerts:
  - High failure rate in any stage.
  - No progress in N minutes.
  - GPT rate-limit spikes.

Retry Policy
- Network/5xx: exponential backoff with jitter, max N attempts.
- 429: respect Retry-After.
- Parser failures: log selector path and HTML snippet for debugging.

---

## 14) Security & Compliance

- Honor robots.txt/ToS; conservative RPS and caching.
- Identify via User-Agent with contact email.
- Auth for admin endpoints; server-side storage of GPT API key.
- Sanitize/validate external HTML inputs.

---

## 15) Costs

- Custom GPT: pay-per-token (prompt+response per document/section). Expect single- to low double-digit USD per large batch on efficient models; higher with larger models.
- Hosting: worker + web + DB (roughly $30-$100/mo depending on tiers).
- Storage: DB plus optional HTML snapshots (low cost).

---

## 16) Testing

- Unit
  - Parsers (golden fixtures)
  - Normalizer
  - Schema validators
  - GPT client contracts (mocked)
- Integration
  - End-to-end slice (e.g., Article III sections 1-5)
  - Idempotency and resume
- E2E
  - Admin starts constitution_1987 session -> completes -> publishes batch -> entries visible
- QA checklist for 1987 Constitution
  - All Articles present; section counts match; spot check fidelity vs LawPhil

---

## 17) Deployment

- Env vars
  - SCRAPER_ON=false
  - SCRAPER_MAX_RPS=1
  - SCRAPER_CONCURRENCY=1
  - SCRAPER_USER_AGENT="LawEntryBot/1.0 (contact@example.com)"
  - CUSTOM_GPT_API_URL, CUSTOM_GPT_API_KEY, CUSTOM_GPT_TIMEOUT_MS
- Infra
  - Web service for admin APIs/UI
  - Background worker for scraping jobs
- Rollout
  - Deploy with OFF; dry-run small slice; turn ON and monitor

---

## 18) Operational Runbook

Start a batch
1) Set SCRAPER_ON=true
2) Create session (e.g., constitution_1987, root URL)
3) Monitor progress; inspect failures; retry if needed
4) When complete, create batch release; verify; publish
5) Optionally set SCRAPER_ON=false afterward

Pause/Resume
- Pause drains running tasks and saves cursor
- Resume continues from current_cursor

Rollback
- Mark release failed and unpublish (clear published_at); fix; re-release

---

## 19) Roadmap

- M1: 1987 Constitution end-to-end
  - Migrations, subtype schemas, parser + GPT + ingestion, admin basics, metrics, publish
- M2: All Constitutions
- M3: ROCs
- M4: Acts (RA/CA/MBP)

---

## 20) Prompting Guidelines (Appendix)

- System prompt minimal and strict:
  - Return JSON only; no prose
  - Choose exactly one type and one subtype from provided candidates
  - Fill only allowed fields; set others null
  - Preserve exact numbers and titles; do not invent
- Validate response against schema; reject on any deviation

---

Citations
- Planning reference: https://lawphil.net/consti/cons1987.html

---

## 21) Entry Types, Subtypes, and Field Schemas

This section defines a fixed set of entry types, their subtypes (aligned to LawPhil navigation), and the type-specific fields enforced during GPT validation and ingestion.

### 21.1 Base Schema (applies to all)

```json
{
  "entry_id": "string",
  "type": "string",
  "entry_subtype": "string",
  "title": "string",
  "jurisdiction": "string",
  "law_family": "string",
  "section_id": { "type": "string", "nullable": true },
  "canonical_citation": "string",
  "status": { "enum": ["active","amended","repealed","draft","approved","published"] },
  "effective_date": "string",
  "amendment_date": { "type": "string", "nullable": true },
  "summary": "string",
  "text": "string",
  "source_urls": { "type": "array", "items": "string", "minItems": 1 },
  "tags": { "type": "array", "items": "string", "minItems": 1 },
  "last_reviewed": "string",
  "visibility": { "type": "object", "properties": { "gli": "boolean", "cpa": "boolean" } },
  "provenance": {
    "type": "object",
    "properties": {
      "session_id": { "type": ["string","null"] },
      "canonical_url": { "type": ["string","null"] },
      "source_hash": { "type": ["string","null"] },
      "gpt_inference_id": { "type": ["string","null"] }
    }
  }
}
```

Shared definitions used below:

```json
{
  "$defs": {
    "EntryRefArray": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type"],
        "properties": {
          "type": { "enum": ["internal","external"] },
          "entry_id": { "type": ["string","null"] },
          "citation": { "type": ["string","null"] },
          "url": { "type": ["string","null"] },
          "title": { "type": ["string","null"] },
          "note": { "type": ["string","null"] }
        },
        "allOf": [
          { "if": { "properties": { "type": { "const": "internal" } } }, "then": { "required": ["entry_id"] } },
          { "if": { "properties": { "type": { "const": "external" } } }, "then": { "required": ["citation"] } }
        ]
      }
    },
    "LegalBasisArray": { "$ref": "#/$defs/EntryRefArray" },
    "RelationArray": { "$ref": "#/$defs/EntryRefArray" }
  }
}
```

### 21.2 constitution_provision

Subtypes: `constitution_1987`, `constitution_1986`, `constitution_1973`, `constitution_1943`, `constitution_1935`, `constitution_malolos`

```json
{
  "required": ["articleNumber","sectionNumber","title","body","topics"],
  "properties": {
    "articleNumber": { "type": "integer", "minimum": 1 },
    "sectionNumber": { "type": "integer", "minimum": 0 },
    "chapterNumber": { "type": ["integer","null"] },
    "preamble": { "type": "boolean", "default": false },
    "body": { "type": "string" },
    "topics": { "type": "array", "items": { "type": "string" }, "minItems": 1 },
    "jurisprudence": { "type": "array", "items": { "type": "string" } },
    "legal_bases": { "$ref": "#/$defs/LegalBasisArray" },
    "related_sections": { "$ref": "#/$defs/EntryRefArray" }
  }
}
```

### 21.3 statute_section

Subtypes: `act`, `commonwealth_act`, `mga_batas_pambansa`, `republic_act`

Identifiers per subtype:
- `act`: `actNumber` (int)
- `commonwealth_act`: `commonwealthActNumber` (int)
- `mga_batas_pambansa`: `mbpNumber` (int)
- `republic_act`: `raNumber` (int)

Common fields: `sectionNumber` (string|int), `elements` (string[]), `penalties` (string[]), `defenses` (string[]), `prescriptive_period` ({ value:number|"NA", unit:"days"|"months"|"years"|"NA" }), `standard_of_proof` (string), `legal_bases` (LegalBasis[]), `related_sections` (EntryRef[])

```json
{
  "oneOf": [
    { "properties": { "actNumber": { "type": "integer" } }, "required": ["actNumber"] },
    { "properties": { "commonwealthActNumber": { "type": "integer" } }, "required": ["commonwealthActNumber"] },
    { "properties": { "mbpNumber": { "type": "integer" } }, "required": ["mbpNumber"] },
    { "properties": { "raNumber": { "type": "integer" } }, "required": ["raNumber"] }
  ],
  "properties": {
    "sectionNumber": { "type": ["string","integer"] },
    "elements": { "type": "array", "items": { "type": "string" } },
    "penalties": { "type": "array", "items": { "type": "string" } },
    "defenses": { "type": "array", "items": { "type": "string" } },
    "prescriptive_period": {
      "type": "object",
      "properties": {
        "value": { "type": ["number","string"], "pattern": "^(NA|\\d+(\\.\\d+)?)$" },
        "unit": { "type": ["string","null"], "enum": ["days","months","years","NA",null] }
      }
    },
    "standard_of_proof": { "type": "string" },
    "legal_bases": { "$ref": "#/$defs/LegalBasisArray" },
    "related_sections": { "$ref": "#/$defs/EntryRefArray" }
  }
}
```

### 21.4 rule_of_court_provision

Subtypes: `roc_1985_criminal_proc`, `roc_civil_proc`, `roc_evidence`, `roc_special_proceedings`, `roc_other`

```json
{
  "required": ["ruleNumber","sectionNumber","title","body"],
  "properties": {
    "partNumber": { "type": ["integer","null"] },
    "ruleNumber": { "type": "integer", "minimum": 1 },
    "sectionNumber": { "type": ["integer","string"] },
    "body": { "type": "string" },
    "triggers": { "type": "array", "items": { "type": "string" } },
    "time_limits": { "type": "array", "items": { "type": "string" } },
    "legal_bases": { "$ref": "#/$defs/LegalBasisArray" },
    "related_sections": { "$ref": "#/$defs/EntryRefArray" }
  }
}
```

### 21.5 executive_issuance

Subtypes: `presidential_decree`, `executive_order`, `administrative_order`, `memorandum_order`, `memorandum_circular`, `proclamation`, `general_order`, `special_order`

```json
{
  "required": ["instrumentNumber","title","body"],
  "properties": {
    "instrumentNumber": { "type": "string" },
    "subject": { "type": ["string","null"] },
    "signing_authority": { "type": ["string","null"] },
    "signing_date": { "type": ["string","null"] },
    "body": { "type": "string" },
    "revokes": { "$ref": "#/$defs/RelationArray" },
    "amends": { "$ref": "#/$defs/RelationArray" },
    "legal_bases": { "$ref": "#/$defs/LegalBasisArray" }
  }
}
```

### 21.6 judicial_issuance

Subtypes: `supreme_court`, `court_of_appeals`, `court_of_tax_appeals`, `sandiganbayan`, `regional_trial_court`, `metropolitan_trial_court`, `municipal_trial_court`, `municipal_circuit_trial_court`

```json
{
  "required": ["issuing_court","document_number","title","body"],
  "properties": {
    "issuing_court": { "type": "string" },
    "document_number": { "type": "string" },
    "date": { "type": ["string","null"] },
    "body": { "type": "string" },
    "subjects": { "type": "array", "items": { "type": "string" } },
    "related_rules": { "$ref": "#/$defs/EntryRefArray" },
    "legal_bases": { "$ref": "#/$defs/LegalBasisArray" }
  }
}
```

### 21.7 agency_issuance

Subtypes: `comelec`, `civil_service_commission`, `commission_on_audit`, `muslim_mindanao_autonomy_act`, `lto`, `pnp`, `doj_guideline`, `other_agency`

```json
{
  "required": ["agency","issuance_number","title","body"],
  "properties": {
    "agency": { "type": "string" },
    "issuance_number": { "type": "string" },
    "issuance_date": { "type": ["string","null"] },
    "subject": { "type": ["string","null"] },
    "body": { "type": "string" },
    "applicability": { "type": "array", "items": { "type": "string" } },
    "supersedes": { "$ref": "#/$defs/RelationArray" },
    "legal_bases": { "$ref": "#/$defs/LegalBasisArray" }
  }
}
```

### 21.8 jurisprudence_decision

Subtypes: `sc_en_banc`, `sc_division`, `ca`, `cta`, `sandiganbayan`

```json
{
  "required": ["court","title","promulgation_date","case_text"],
  "properties": {
    "court": { "type": "string" },
    "docket": { "type": ["string","null"] },
    "gr_number": { "type": ["string","null"] },
    "promulgation_date": { "type": "string" },
    "ponente": { "type": ["string","null"] },
    "syllabus": { "type": "array", "items": { "type": "string" } },
    "doctrines": { "type": "array", "items": { "type": "string" } },
    "dispositive": { "type": ["string","null"] },
    "case_text": { "type": "string" },
    "citations": { "type": "array", "items": { "type": "string" } },
    "related_provisions": { "$ref": "#/$defs/EntryRefArray" }
  }
}
```

### 21.9 city_ordinance_section (LGU)

Subtypes: `city`, `municipality`

```json
{
  "required": ["ordinance_number","title","body"],
  "properties": {
    "ordinance_number": { "type": "string" },
    "series_year": { "type": ["integer","null"] },
    "sectionNumber": { "type": ["string","integer"] },
    "elements": { "type": "array", "items": { "type": "string" } },
    "penalties": { "type": "array", "items": { "type": "string" } },
    "legal_bases": { "$ref": "#/$defs/LegalBasisArray" },
    "related_sections": { "$ref": "#/$defs/EntryRefArray" }
  }
}
```

### 21.10 rights_advisory / pnp_sop / incident_checklist

Subtypes: `national` (for each). Use existing app schemas. Not scraped from LawPhil but remain part of KB.

---

## 22) Consolidated Mapping (Entry Type → Subtypes)

- constitution_provision: constitution_1987, constitution_1986, constitution_1973, constitution_1943, constitution_1935, constitution_malolos
- statute_section: act, commonwealth_act, mga_batas_pambansa, republic_act
- rule_of_court_provision: roc_1985_criminal_proc, roc_civil_proc, roc_evidence, roc_special_proceedings, roc_other
- executive_issuance: presidential_decree, executive_order, administrative_order, memorandum_order, memorandum_circular, proclamation, general_order, special_order
- judicial_issuance: supreme_court, court_of_appeals, court_of_tax_appeals, sandiganbayan, regional_trial_court, metropolitan_trial_court, municipal_trial_court, municipal_circuit_trial_court
- agency_issuance: comelec, civil_service_commission, commission_on_audit, muslim_mindanao_autonomy_act, lto, pnp, doj_guideline, other_agency
- jurisprudence_decision: sc_en_banc, sc_division, ca, cta, sandiganbayan
- city_ordinance_section: city, municipality
- rights_advisory: national
- pnp_sop: national
- incident_checklist: national

---

## 23) Schema Normalization and Disambiguation (Final Rules)

- Naming and fields
  - Use snake_case everywhere: `entry_subtype`, `section_number`, `article_number`, `instrument_number`, etc.
  - Single content field across all types: `body` (drop `text` from any schema/contracts).
  - Identifiers are first-class and required per subtype (e.g., `article_number` for constitutions; `ra_number|act_number|mbp_number|commonwealth_act_number` or unified `instrument_number` for statutes; `instrument_number` for executive issuances; court identifiers for jurisprudence).
  - Enforce uniqueness via logical keys per type (examples below) and surface them in DB unique indexes.
- Dates and formats
  - All dates ISO‑8601; use JSON Schema `format: "date"` or `format: "date-time"` as appropriate.
  - `effective_date` is conditionally required/validated based on `status`.
- URLs and strings
  - All URLs use `format: "uri"`.
  - All required strings include `minLength: 1`.
- Additional properties
  - Set `additionalProperties: false` on all object schemas (base and type-specific) to keep payloads tight and predictable.
- Arrays
  - Use `$defs.nonEmptyStringArray` to enforce non-empty lists where business rules require (e.g., `source_urls`, sometimes `topics`).
- Visibility defaults
  - `visibility.gli` default `false`; `visibility.cpa` default `false`.
- Jurisdiction and law_family enums
  - `jurisdiction` enum (scoped now): `["PH"]` (extensible later).
  - `law_family` enum: `["constitution","statute","rule","exec_issuance","jurisprudence","ordinance","agency_issuance"]`.
- Canonical citation
  - Option A (simple): string with `minLength:1` and a pattern per type (recommended initially).
  - Option B (structured for jurisprudence later): `{ reporter, volume, page, year }` (defer until needed).

Logical uniqueness keys (examples for DB unique indexes)
- constitution_provision: `(type, entry_subtype, article_number, section_number)` plus `preamble` as discriminator when true.
- statute_section: `(type, entry_subtype, <number_field>, section_number)` where `<number_field>` is one of `ra_number|act_number|mbp_number|commonwealth_act_number`.
- rule_of_court_provision: `(type, entry_subtype, rule_number, section_number)`.
- executive_issuance: `(type, entry_subtype, instrument_number)`.
- judicial_issuance: `(type, entry_subtype, document_number)`.
- jurisprudence_decision: `(type, entry_subtype, case_name_normalized, promulgation_date)`.
- city_ordinance_section: `(type, entry_subtype, lgu_level, lgu_name, ordinance_number, section_number)`.
- agency_issuance: `(type, entry_subtype, agency, issuance_number)`.

---

## 24) Master JSON Schema (Discriminator + Strict Mechanics)

We will host a master schema (split per type at build-time for performance). The master exposes a top-level discriminator on `type` then a nested discriminator on `entry_subtype`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://civilify.app/schemas/kb-entry.schema.json",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "type": { "type": "string", "enum": [
      "constitution_provision","statute_section","rule_of_court_provision",
      "executive_issuance","judicial_issuance","jurisprudence_decision",
      "city_ordinance_section","agency_issuance","rights_advisory","pnp_sop","incident_checklist"
    ] },
    "entry_subtype": { "type": "string", "minLength": 1 },
    "entry_id": { "type": "string", "minLength": 1 },
    "title": { "type": "string", "minLength": 1 },
    "jurisdiction": { "type": "string", "enum": ["PH"] },
    "law_family": { "type": "string", "enum": [
      "constitution","statute","rule","exec_issuance","jurisprudence","ordinance","agency_issuance"
    ] },
    "section_id": { "type": ["string","null"] },
    "canonical_citation": { "type": "string", "minLength": 1 },
    "status": { "type": "string", "enum": ["active","amended","repealed","draft","approved","published"] },
    "effective_date": { "type": ["string","null"], "format": "date" },
    "amendment_date": { "type": ["string","null"], "format": "date" },
    "summary": { "type": "string", "minLength": 1 },
    "body": { "type": "string", "minLength": 1 },
    "source_urls": { "$ref": "#/$defs/nonEmptyStringArray" },
    "tags": { "$ref": "#/$defs/nonEmptyStringArray" },
    "last_reviewed": { "type": "string", "format": "date" },
    "visibility": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "gli": { "type": "boolean", "default": false },
        "cpa": { "type": "boolean", "default": false }
      },
      "required": ["gli","cpa"]
    },
    "provenance": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "source_system": { "type": "string", "enum": ["lawphil","official_gazette","sc_elibrary","lgu_portal"] },
        "session_id": { "type": ["string","null"] },
        "canonical_url": { "type": ["string","null"], "format": "uri" },
        "source_hash": { "type": ["string","null"] },
        "gpt_inference_id": { "type": ["string","null"] },
        "retrieved_at": { "type": ["string","null"], "format": "date-time" }
      }
    }
  },
  "required": ["type","entry_subtype","entry_id","title","jurisdiction","law_family","canonical_citation","status","summary","body","source_urls","tags","last_reviewed","visibility"],

  "allOf": [
    { "$ref": "#/oneOfByType" },
    { "$ref": "#/conditionalStatusRules" }
  ],

  "$defs": {
    "nonEmptyStringArray": {
      "type": "array",
      "minItems": 1,
      "items": { "type": "string", "minLength": 1 }
    },
    "entryRef": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "type": { "enum": ["internal","external"] },
        "role": { "type": ["string","null"], "enum": ["amends","repeals","amended_by","repealed_by","cites","implements","supersedes","superseded_by",null] },
        "entry_id": { "type": ["string","null"] },
        "citation": { "type": ["string","null"], "minLength": 1 },
        "url": { "type": ["string","null"], "format": "uri" },
        "title": { "type": ["string","null"] },
        "note": { "type": ["string","null"] }
      },
      "required": ["type"],
      "allOf": [
        { "if": { "properties": { "type": { "const": "internal" } } }, "then": { "required": ["entry_id"] } },
        { "if": { "properties": { "type": { "const": "external" } } }, "then": { "required": ["citation"], "anyOf": [
          { "required": ["url"] }, { "required": ["title"] }
        ] } }
      ]
    },
    "relationArray": { "type": "array", "items": { "$ref": "#/$defs/entryRef" } },

    "constitution": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "article_number": { "type": "integer", "minimum": 0 },
        "section_number": { "type": "integer", "minimum": 0 },
        "article_title": { "type": ["string","null"] },
        "section_title": { "type": ["string","null"] },
        "chapter_number": { "type": ["integer","null"] },
        "preamble": { "type": "boolean", "default": false },
        "topics": { "$ref": "#/$defs/nonEmptyStringArray" },
        "jurisprudence": { "type": "array", "items": { "type": "string" } },
        "legal_bases": { "type": "array", "items": { "$ref": "#/$defs/entryRef" } },
        "related_sections": { "type": "array", "items": { "$ref": "#/$defs/entryRef" } }
      },
      "required": ["article_number","section_number","topics"]
    },

    "statute": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "section_number": { "type": "string", "minLength": 1 },
        "elements": { "type": "array", "items": { "type": "string" } },
        "penalties": { "type": "array", "items": { "type": "string" } },
        "defenses": { "type": "array", "items": { "type": "string" } },
        "prescriptive_period": { "type": ["object","null"], "additionalProperties": false, "properties": {
          "value": { "type": ["string","number"], "pattern": "^(NA|\\d+(\\.\\d+)?)$" },
          "unit": { "type": ["string","null"], "enum": ["days","months","years","NA",null] }
        }},
        "standard_of_proof": { "type": ["string","null"] },
        "amends": { "$ref": "#/$defs/relationArray" },
        "repeals": { "$ref": "#/$defs/relationArray" },
        "implementing_rules": { "$ref": "#/$defs/relationArray" },
        "legal_bases": { "$ref": "#/$defs/relationArray" },
        "related_sections": { "$ref": "#/$defs/relationArray" }
      },
      "required": ["section_number"]
    },

    "roc": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "am_number": { "type": ["string","null"], "minLength": 1 },
        "rule_number": { "type": "integer", "minimum": 1 },
        "section_number": { "type": "string", "minLength": 1 },
        "effectivity_date": { "type": ["string","null"], "format": "date" },
        "cross_refs": { "$ref": "#/$defs/relationArray" },
        "triggers": { "type": "array", "items": { "type": "string" } },
        "time_limits": { "type": "array", "items": { "type": "string" } },
        "legal_bases": { "$ref": "#/$defs/relationArray" },
        "related_sections": { "$ref": "#/$defs/relationArray" }
      },
      "required": ["rule_number","section_number"]
    },

    "exec": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "instrument_number": { "type": "string", "minLength": 1 },
        "series_year": { "type": ["integer","null"] },
        "publishing_office": { "type": ["string","null"] },
        "signing_authority": { "type": ["string","null"] },
        "signing_date": { "type": ["string","null"], "format": "date" },
        "revokes": { "$ref": "#/$defs/relationArray" },
        "amends": { "$ref": "#/$defs/relationArray" },
        "superseded_by": { "$ref": "#/$defs/relationArray" },
        "legal_bases": { "$ref": "#/$defs/relationArray" }
      },
      "required": ["instrument_number"]
    },

    "judicial_admin": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "issuing_court": { "type": "string", "minLength": 1 },
        "document_number": { "type": "string", "minLength": 1 },
        "date": { "type": ["string","null"], "format": "date" },
        "subjects": { "type": "array", "items": { "type": "string" } },
        "related_rules": { "$ref": "#/$defs/relationArray" },
        "legal_bases": { "$ref": "#/$defs/relationArray" }
      },
      "required": ["issuing_court","document_number"]
    },

    "juris": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "court": { "type": "string", "minLength": 1 },
        "division": { "type": ["string","null"], "enum": [null,"en_banc","first","second","third"] },
        "case_name_normalized": { "type": "string", "minLength": 1 },
        "vote_line": { "type": ["string","null"] },
        "separate_opinions": { "type": "array", "items": { "type": "object", "additionalProperties": false, "properties": {
          "author": { "type": "string", "minLength": 1 },
          "type": { "type": "string", "enum": ["concurring","dissenting","concurring_and_dissenting"] },
          "text": { "type": "string", "minLength": 1 }
        }, "required": ["author","type","text"] } },
        "reporter_citation": { "type": "array", "items": { "type": "string" } },
        "promulgation_date": { "type": "string", "format": "date" },
        "ponente": { "type": ["string","null"] },
        "dispositive": { "type": ["string","null"] },
        "citations": { "type": "array", "items": { "type": "string" } },
        "related_provisions": { "$ref": "#/$defs/relationArray" }
      },
      "required": ["court","case_name_normalized","promulgation_date"]
    },

    "agency": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "agency": { "type": "string", "minLength": 1 },
        "jurisdiction_scope": { "type": ["string","null"], "enum": [null,"national","armm_barmm","regional"] },
        "issuance_number": { "type": "string", "minLength": 1 },
        "issuance_date": { "type": ["string","null"], "format": "date" },
        "publication_date": { "type": ["string","null"], "format": "date" },
        "subject": { "type": ["string","null"] },
        "applicability": { "type": "array", "items": { "type": "string" } },
        "legal_bases": { "$ref": "#/$defs/relationArray" },
        "supersedes": { "$ref": "#/$defs/relationArray" }
      },
      "required": ["agency","issuance_number"]
    },

    "ordinance": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "lgu_level": { "type": "string", "enum": ["city","municipality"], "minLength": 1 },
        "lgu_name": { "type": "string", "minLength": 1 },
        "ordinance_number": { "type": "string", "minLength": 1 },
        "section_number": { "type": "string", "minLength": 1 },
        "enactment_date": { "type": ["string","null"], "format": "date" },
        "publication_date": { "type": ["string","null"], "format": "date" },
        "implementing_rules": { "$ref": "#/$defs/relationArray" },
        "elements": { "type": "array", "items": { "type": "string" } },
        "penalties": { "type": "array", "items": { "type": "string" } },
        "legal_bases": { "$ref": "#/$defs/relationArray" },
        "related_sections": { "$ref": "#/$defs/relationArray" }
      },
      "required": ["lgu_level","lgu_name","ordinance_number","section_number"]
    }
  },

  "oneOfByType": {
    "oneOf": [
      { "if": { "properties": { "type": { "const": "constitution_provision" } } }, "then": {
        "allOf": [
          { "if": { "properties": { "entry_subtype": { "enum": ["constitution_1987","constitution_1986","constitution_1973","constitution_1943","constitution_1935","constitution_malolos"] } } }, "then": { "$ref": "#/$defs/constitution" } }
        ]
      }},
      { "if": { "properties": { "type": { "const": "statute_section" } } }, "then": {
        "allOf": [ { "$ref": "#/$defs/statute" } ]
      }},
      { "if": { "properties": { "type": { "const": "rule_of_court_provision" } } }, "then": {
        "allOf": [ { "$ref": "#/$defs/roc" } ]
      }},
      { "if": { "properties": { "type": { "const": "executive_issuance" } } }, "then": {
        "allOf": [ { "$ref": "#/$defs/exec" } ]
      }},
      { "if": { "properties": { "type": { "const": "judicial_issuance" } } }, "then": {
        "allOf": [ { "$ref": "#/$defs/judicial_admin" } ]
      }},
      { "if": { "properties": { "type": { "const": "jurisprudence_decision" } } }, "then": {
        "allOf": [ { "$ref": "#/$defs/juris" } ]
      }},
      { "if": { "properties": { "type": { "const": "city_ordinance_section" } } }, "then": {
        "allOf": [ { "$ref": "#/$defs/ordinance" } ]
      }},
      { "if": { "properties": { "type": { "const": "agency_issuance" } } }, "then": {
        "allOf": [ { "$ref": "#/$defs/agency" } ]
      }}
    ]
  },

  "conditionalStatusRules": {
    "allOf": [
      { "if": { "properties": { "status": { "const": "active" } } }, "then": { "required": ["effective_date"] } },
      { "if": { "properties": { "status": { "const": "approved" } } }, "then": { "required": ["effective_date"] } },
      { "if": { "properties": { "status": { "const": "amended" } } }, "then": { "required": ["effective_date","amendment_date"], "properties": { "legal_bases": { "minItems": 1 } } } },
      { "if": { "properties": { "status": { "const": "repealed" } } }, "then": { "required": ["effective_date","amendment_date"], "properties": { "legal_bases": { "minItems": 1 } } } }
    ]
  }
}
```

Additional constitution rule (enforced by ingestion or a schema `allOf`): if `preamble == true` then `article_number == 0` and `section_number == 0`. Also, allow `chapter_number` only for `constitution_malolos` and other historical texts (conditional subtype check in validator).

Statute period rule: when `prescriptive_period.value` is numeric, `unit` must be one of `days|months|years`; when value is `"NA"`, `unit` must be `"NA"` or null.

---

## 25) Type-Specific Updates Requested

- Statutes
  - Keep per-subtype numeric identifiers but compute a normalized `instrument_key` during ingestion (e.g., `RA-9165`, `CA-123`, `MBP-12`, `ACT-3815`).
  - `section_number` is `string` to support tokens like `"5-A"`.
  - Add optional `amends`, `repeals`, `implementing_rules` as `relationArray`.
- Rules of Court
  - Add `am_number` and `effectivity_date`; `section_number` is `string` to allow `"3(a)"`.
  - Add `cross_refs` using `relationArray`.
  - Rename subtype examples to permit versioning, e.g., `roc_criminal_proc_1985`, `roc_evidence_2019`.
- Executive issuances
  - Subtype-specific patterns for `instrument_number` (e.g., `EO-###`, `PD-###`, validated in code per subtype if needed).
  - Add optional `series_year` and `publishing_office`.
  - Add `superseded_by` relation.
- Judicial issuances vs jurisprudence decisions
  - Keep `jurisprudence_decision` for case law (with `division`, `vote_line`, `separate_opinions[]`, `reporter_citation[]`, `case_name_normalized`).
  - Keep `judicial_issuance` for administrative circulars/orders (`document_number` or `administrative_matter` style fields via `document_number`).
- Agency issuances
  - Add `jurisdiction_scope` (national, armm_barmm, regional).
  - For MMAA, include `issuance_number` like `MMAA-###` and include the LG/region name in `subject` or extended metadata; BARMM successor can use similar pattern.
  - Add `effectivity_date`, `publication_date` to support promulgation timelines.
- LGU ordinances
  - Add `lgu_level` enum and `lgu_name`, plus `enactment_date`, `publication_date`, `implementing_rules`.
- Cross-reference model
  - External refs require `citation` and at least one of `url` or `title`.
  - Add `role` enum on relations to disambiguate (`amends|repeals|amended_by|repealed_by|cites|implements|supersedes|superseded_by`).
- Status logic
  - `status="amended"` ⇒ require at least one relation with role `amends` or `amended_by`.
  - `status="repealed"` ⇒ require at least one relation with role `repealed_by` and ensure `effective_date <= amendment_date`.
- Provenance
  - Add `source_system` enum and `retrieved_at` `date-time`.
- Text caps (storage safety)
  - Enforce conservative `maxLength` in validators for huge fields (`body`/`case_text`), and consider chunked storage if needed.

---

## 26) Updated Consolidated Mapping (Entry Type → Subtypes)

- constitution_provision: `constitution_1987`, `constitution_1986`, `constitution_1973`, `constitution_1943`, `constitution_1935`, `constitution_malolos`
- statute_section: `act`, `commonwealth_act`, `mga_batas_pambansa`, `republic_act`
- rule_of_court_provision: `roc_criminal_proc_1985`, `roc_civil_proc`, `roc_evidence_2019`, `roc_special_proceedings`, `roc_other`
- executive_issuance: `presidential_decree`, `executive_order`, `administrative_order`, `memorandum_order`, `memorandum_circular`, `proclamation`, `general_order`, `special_order`
- judicial_issuance: `supreme_court`, `court_of_appeals`, `court_of_tax_appeals`, `sandiganbayan`, `regional_trial_court`, `metropolitan_trial_court`, `municipal_trial_court`, `municipal_circuit_trial_court`
- agency_issuance: `comelec`, `civil_service_commission`, `commission_on_audit`, `muslim_mindanao_autonomy_act`, `lto`, `pnp`, `doj_guideline`, `other_agency`
- jurisprudence_decision: `sc_en_banc`, `sc_division`, `ca`, `cta`, `sandiganbayan`
- city_ordinance_section: `city`, `municipality`
- rights_advisory: `national`
- pnp_sop: `national`
- incident_checklist: `national`

---

## 27) Validation Performance

- Split the master schema into per-type JSON files during build; precompile Ajv validators.
- Cache validators per subtype; reuse across ingestion jobs.
- Apply `maxLength` caps for large string fields (body/case_text) to prevent pathological payloads; consider streaming/attachment storage if exceptionally large.
- Reject payloads exceeding configured sizes at the API boundary with explicit error messages.
