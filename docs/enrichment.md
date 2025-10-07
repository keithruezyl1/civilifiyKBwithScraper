Here’s a pragmatic “middle ground” that keeps just enough structure for quality retrieval and sane UI, without the heavy subtype schema.

Keep these in kb_entries (all are already present in your table)

Must‑have core
- entry_id (text): stable key (e.g., CONST-1987-ART18-SEC28)
- type (text): high‑level (e.g., constitution_provision, statute_section)
- entry_subtype (text): finer grain (e.g., constitution_1987)
- canonical_citation (text): human citation (e.g., “1987 Const., Art. XVIII, Sec. 28”)
- title (text): human title/label (e.g., “Article XVIII – Transitory Provisions, Section 28”) or the normalized header
- text (text): normalized full text (header + body as we’re now writing)
- source_urls (jsonb): array with at least the scraped URL; keep as array for future mirror links
- provenance (jsonb): keep minimal: { source: 'lawphil_scraping', session_id, scraped_at, content_hash }

Useful, low‑cost extras (keep)
- created_by (int4): attribution; you’re using 1 for system, fine
- created_at / updated_at (timestamptz): auditing
- batch_release_id (uuid) / published_at (timestamptz): release flow
- embedding (public.vector) & fts (tsvector): search (if you’ll compute offline later)

Nice to keep if you already populate cheaply
- section_id (text): store “ART18-SEC28”; it helps filters and dedupe
- status (text): e.g., draft | published (you already imply with published_at, but a status is handy)

Drop (or stop populating for now)
- summary, tags, jurisdiction, law_family, subtype_fields, and the long tail (elements, penalties, defenses, triggers, time_limits, required_forms, etc.) — too costly to keep current; reintroduce later via enrichment jobs.
- visibility, phases, forms, rights_callouts, jurisprudence, legal_bases, related_sections — same reason.

Why this set
- Keeps retrieval quality high (citation, title, normalized text, subtype, section_id).
- Keeps release/search working (published_at, batch_release_id, embedding, fts).
- Avoids GPT fill and complex subtype JSONs.
- Leaves a clean upgrade path: you can enrich into subtype_fields later without schema churn.

Write-path changes (what your scraper should populate now)
- entry_id, type, entry_subtype
- canonical_citation, title (compose from article/section)
- text: normalized “Title newline Body”
- source_urls: [canonical_url]
- provenance: current minimal object
- section_id: “ART<article>-SEC<section>”
- created_by, created_at, updated_at
- batch_release_id: NULL on draft; set on release
- published_at: NULL on draft

Search impacts
- FTS: index title + text (already OK)
- Embeddings: you can defer; when available, embed title + text and store in embedding.

UI impacts
- You can show citation/title and normalized text confidently.
- Filters: cheap filters on type/entry_subtype, and later on section_id prefix (“ART18”).

If you want, I can adjust the scraper now to ensure those fields are filled consistently (canonical_citation/title/section_id/source_urls) and stop touching the deep subtype fields.