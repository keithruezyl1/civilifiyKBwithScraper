# ⚖️ Civilify Law Entry App - Statute Section Entry Guide

## 🎯 Overview

This guide defines how to create valid `statute_section` entries for the Civilify Law Entry App. It mirrors the UI and backend Zod schemas, so entries created with this guide will validate in both the form and API. Use this as a companion to `CONSTITUTION_PROVISION_GUIDE.md`.

## 🏗️ Statute Section Entry Structure

### **📝 Base Fields (Required for All Entries)**

```javascript
entry_id: string           // Stable ID (e.g., "RPC-Art. 331-611088")
type: "statute_section"    // Always "statute_section"
title: string              // Human-readable label
jurisdiction: string       // e.g., "PH" or a valid LGU name
law_family: string         // e.g., "Revised Penal Code", "Civil Code"
section_id?: string        // e.g., "Art. 331", "Sec. 5"
canonical_citation: string // e.g., "RPC Art. 331"
status: "active" | "amended" | "repealed" | "draft" | "approved" | "published"
effective_date: string     // ISO string (e.g., "1932-01-01T00:00:00.000Z")
amendment_date?: string    // ISO string, required if status === "amended"
summary: string            // 1–3 sentence synopsis
text: string               // Full normalized statutory text
source_urls: string[]      // At least one valid URL
tags: string[]             // 3–8 retrieval hints
last_reviewed: string      // ISO date (auto-set in the app for new entries)
created_by: number         // Team member numeric ID
created_at: string         // ISO timestamp (auto-generated)
updated_at: string         // ISO timestamp (auto-generated)
```

### **🔢 Entry ID Generation**
Entry IDs are generated consistently in the app using `src/lib/kb/entryId.ts`. For statutes, the generator follows these rules:

```text
statute_section:
- RPC (Revised Penal Code):        RPC-Art{digits}-{last6OfTimestamp}
- RA Law Family (e.g., RA 9165):   RA{number}-Sec{digits}-{last6OfTimestamp}
- Other codes (generic fallback):  {LawFamilyNoSpaces}-{SectionToken}-{last6OfTimestamp}
```

Notes:
- The timestamp suffix uses the last 6 digits of `Date.now()` for uniqueness.
- If `section_id` is unavailable, the generator falls back to `Art`/`Sec` placeholders.
- The validator accepts canonical patterns like `RPC-Art\d+-\d{6}` and `RA\d+-Sec\d+-\d{6}`.
- Historical data may contain punctuation (e.g., `"Art. 331"`). New IDs should follow the generator pattern above without punctuation inside the token.

Examples:
```text
RPC, Art. 331        → entry_id: RPC-Art331-663202
RA 9165, Sec. 5      → entry_id: RA9165-Sec5-774113
Traffic Code, Sec. 10 → entry_id: TrafficCode-Sec10-889001
```

### **🔒 Access Control**
```javascript
visibility: {
  gli: boolean,  // General Legal Information
  cpa: boolean   // CPA mode
}
```

### **📜 Statute-Specific Fields**
These fields are supported by the Zod schema for `statute_section` and by the API payload:

```javascript
elements: string[]                 // Elements of the offense / section
penalties: string[]                // Penalties or sanctions
defenses?: string[]                // Recognized defenses (optional)
prescriptive_period?: {            // Optional object
  value: number | "NA",           // Positive number or "NA"
  unit?: "days" | "months" | "years" | "NA"
}
standard_of_proof?: string         // e.g., "criminal:BRD", "civil:PoE"

related_sections: EntryRef[]       // Cross-references
legal_bases: LegalBasis[]          // Supporting authorities
```

Where:

```javascript
// EntryRef (discriminated by `type`)
{ type: "internal", entry_id: string, note?: string }
{ type: "external", citation: string, url?: string, note?: string }

// LegalBasis (discriminated by `type`)
{ type: "internal", entry_id: string, title?: string, note?: string }
{ type: "external", citation: string, url?: string, title?: string, note?: string }
```

### **📋 Citation Format Guidelines**
- **External (LegalBasis/EntryRef)**: use `type: "external"` and include `citation`, optionally `url`, `title`, and `note`.
- **Internal (LegalBasis/EntryRef)**: use `type: "internal"` and include `entry_id` of the referenced KB entry.

### **✅ Required vs Optional Fields**
```javascript
// REQUIRED (will block save/publish if missing)
entry_id,
type,           // must equal "statute_section"
title,
jurisdiction,
law_family,
canonical_citation,
status,         // one of allowed enum values
effective_date, // ISO date string
summary,
text,
source_urls[0], // at least one valid URL
tags[0],        // at least one tag
last_reviewed,

// OPTIONAL (encouraged when applicable)
section_id,
amendment_date,           // required if status === "amended"
elements,
penalties,
defenses,
prescriptive_period,      // { value: number | "NA", unit?: "days"|"months"|"years"|"NA" }
standard_of_proof,
related_sections,
legal_bases
```

### **🔁 Cross-Field Validation Rules**
- If `status === "amended"`, an `amendment_date` (ISO date) is required.
- `prescriptive_period.value` must be a positive number or exactly the string `"NA"`.
- External relations (`type: "external"`) must NOT include `entry_id` and MUST include `citation`.
- Internal relations (`type: "internal"`) MUST include a valid `entry_id` and do not include `citation`.
- All URLs in `source_urls` must be valid `http(s)://` links.

### **✅ Validation Highlights**
- If `status === "amended"`, `amendment_date` is required.
- `source_urls` must include at least one valid URL.
- `elements` and `penalties` default to empty arrays; include when applicable.
- For external relations, omit `entry_id`; for internal relations, provide `entry_id`.

## 🧠 Import Behavior (JSON → Form)

When importing a JSON entry (any type, including `statute_section`):
- `created_by`, `created_by_name`, and `created_by_username` are auto-set from the logged-in user.
- `verified` is set to `false` (with `verified_at` and `verified_by` cleared).
- All draft/autosave keys are cleared and replaced by the imported entry as the new draft.
- You are redirected to the create flow with fields pre-filled; you then review and click "Create Entry".

### **🧮 Vector Embeddings & Progress Tracking**
- Vector embeddings are automatically generated on create (no need to provide `embedding` in JSON).
- Imported-created entries increment daily progress/quotas for the corresponding `type`.

## 🧪 Example: Revised Penal Code – Art. 331

```json
{
  "entry_id": "RPC-Art. 331-611088",
  "type": "statute_section",
  "title": "Destroying or Damaging Statues, Public Monuments, or Paintings",
  "canonical_citation": "RPC Art. 331",
  "summary": "Article 331 penalizes any person who destroys or damages statues, public monuments, or public paintings. Penalties vary depending on the object involved.",
  "text": "Article 331. Destroying or damaging statues or any other useful or ornamental public monument ...",
  "tags": ["malicious mischief","crimes against property","public monuments"],
  "jurisdiction": "PH",
  "law_family": "Revised Penal Code",
  "section_id": "Art. 331",
  "status": "active",
  "effective_date": "1932-01-01T00:00:00.000Z",
  "last_reviewed": "2025-09-08T00:00:00.000Z",
  "visibility": { "cpa": true, "gli": true },
  "source_urls": [
    "https://lawphil.net/statutes/acts/act1930/act_3815_1930.html"
  ],
  "elements": [
    "The offender destroys or damages a statue or public monument.",
    "The act is deliberate and unlawful.",
    "The item is of public character (monument, statue, or public painting)."
  ],
  "penalties": [
    "Statues/Monuments → arresto mayor (medium) to prision correccional (minimum).",
    "Public paintings → arresto menor or fine up to ₱200, or both."
  ],
  "defenses": [
    "Lack of intent",
    "Accident or force majeure",
    "Authorized removal/restoration"
  ],
  "prescriptive_period": { "value": 10, "unit": "years" },
  "standard_of_proof": "criminal:BRD (Beyond Reasonable Doubt)",
  "legal_bases": [
    { "type": "external", "citation": "Act No. 3815 (Revised Penal Code)", "url": "https://lawphil.net/statutes/acts/act1930/act_3815_1930.html", "title": "Revised Penal Code" }
  ],
  "related_sections": [
    { "type": "internal", "entry_id": "RPC-Art. 327-123456", "note": "General malicious mischief provision" }
  ],
  "created_by": 4,
  "created_by_name": "Sendrijas",
  "created_at": "2025-09-08T19:29:18.067Z",
  "updated_at": "2025-09-08T19:29:18.070Z"
}
```

## 🧪 Example: Republic Act (RA) Section

```json
{
  "entry_id": "RA9165-Sec5-712304",
  "type": "statute_section",
  "title": "Sale, Trading, Administration, Dispensation, Delivery, Distribution and Transportation of Dangerous Drugs",
  "canonical_citation": "RA 9165 Sec. 5",
  "summary": "Prohibits the sale and related acts involving dangerous drugs, prescribing penalties based on quantity and role.",
  "text": "Section 5. Sale, Trading, Administration, Dispensation, Delivery, Distribution and Transportation of Dangerous Drugs...",
  "tags": ["RA 9165","dangerous drugs","sale","distribution"],
  "jurisdiction": "PH",
  "law_family": "RA 9165 (Comprehensive Dangerous Drugs Act)",
  "section_id": "Sec. 5",
  "status": "active",
  "effective_date": "2002-06-07T00:00:00.000Z",
  "last_reviewed": "2025-09-08T00:00:00.000Z",
  "visibility": { "cpa": true, "gli": true },
  "source_urls": ["https://lawphil.net/statutes/repacts/ra2002/ra_9165_2002.html"],
  "elements": ["Act of sale or related act","Involves dangerous drugs"],
  "penalties": ["Imprisonment and fines as provided in Sec. 5, varying by quantity"],
  "legal_bases": [
    { "type": "external", "citation": "RA 9165 (2002)", "url": "https://lawphil.net/statutes/repacts/ra2002/ra_9165_2002.html", "title": "Comprehensive Dangerous Drugs Act" }
  ],
  "related_sections": [
    { "type": "internal", "entry_id": "RA9165-Sec11-665501", "note": "Possession of dangerous drugs" }
  ]
}
```

## 🧩 GPT Template (Statute Section)

```json
{
  "entry_id": "{CODE}-{Section}-{6-digit-timestamp}",
  "type": "statute_section",
  "title": "Descriptive Section Title",
  "canonical_citation": "{Code} {Article/Section}",
  "summary": "1–3 sentence neutral summary of the section.",
  "text": "Exact statutory text without paraphrasing.",
  "tags": ["relevant","retrieval","keywords"],
  "jurisdiction": "PH",
  "law_family": "Revised Penal Code",
  "section_id": "Art. ###",
  "status": "active",
  "effective_date": "YYYY-MM-DDTHH:mm:ss.sssZ",
  "amendment_date": null,
  "last_reviewed": "YYYY-MM-DDTHH:mm:ss.sssZ",
  "visibility": { "cpa": true, "gli": true },
  "source_urls": ["https://..."],
  "elements": ["..."],
  "penalties": ["..."],
  "defenses": ["..."],
  "prescriptive_period": { "value": 10, "unit": "years" },
  "standard_of_proof": "criminal:BRD",
  "legal_bases": [
    { "type": "external", "citation": "...", "url": "https://...", "title": "...", "note": "..." }
  ],
  "related_sections": [
    { "type": "internal", "entry_id": "...", "note": "..." }
  ],
  "created_by": 5,
  "created_by_name": "{UserName}",
  "verified": false,
  "verified_at": null,
  "verified_by": null
}
```

## ⚠️ Common Validation Errors & Fixes
- Missing `source_urls` → add at least one valid URL.
- External relation with `entry_id` or internal relation without `entry_id` → correct the discriminated union per type.
- `prescriptive_period.value` must be a positive number or exactly `"NA"`.
- `status === "amended"` but no `amendment_date` → add ISO date.
- `entry_id` format mismatch → use the generator patterns (see Entry ID Generation) and avoid punctuation inside tokens (e.g., prefer `Art331` over `Art. 331`).

## 🧭 Tips
- Keep `elements` concise and behavior-focused.
- Use official sources (`lawphil`, `officialgazette`) in `source_urls`.
- Prefer internal `related_sections` when referencing KB entries.
- Use external `legal_bases` for statutes, rules, circulars, jurisprudence, etc.

---

For general guidance, also see `docs/CONSTITUTION_PROVISION_GUIDE.md` and `docs/JSON_ENTRY_CREATION_GUIDE.md`.

---

## 📅 Important Dates

- Effective dates vary per statute. Use the effectivity date provided in the law (e.g., law approval date or a specific effectivity clause). Always encode as an ISO datetime string: `YYYY-MM-DDTHH:mm:ss.sssZ`.

### **Historical Context**
- Provide context in the summary sparingly and only when it helps users understand the section’s purpose (e.g., “part of the Comprehensive Dangerous Drugs Act of 2002”).

---

## 🔗 Essential Source URLs

### **Primary Sources:**
- `https://lawphil.net/` – Lawphil statutory texts (preferred official host)
- Official Gazette pages for specific RAs and codes when available

### **Additional Resources:**
- Agency websites publishing circulars and implementing rules
- Supreme Court decisions when cited as legal bases

---

## 📝 Writing Guidelines

### **Title Format:**
- Use clear, descriptive titles that reflect the statutory action/subject.
- Examples:
  - ✅ “Destroying or Damaging Statues, Public Monuments, or Paintings”
  - ✅ “Possession of Dangerous Drugs”
  - ❌ “Sec. 5”

### **Summary Guidelines:**
- 1–3 sentences, neutral, explain the core conduct regulated/punished.

### **Text Guidelines:**
- Use the exact statutory text and preserve structure where possible.

### **Tags Guidelines:**
- 3–8 terms aiding retrieval (e.g., offense names, law names, domains).

### **Citation Guidelines:**
- Prefer official/full URLs; avoid abbreviated links.

---

## 🚀 Quick Start Checklist

### **Before Creating:**
- [ ] Identify statute and specific article/section
- [ ] Copy exact statutory text
- [ ] Gather official source URL(s)
- [ ] Identify elements, penalties, defenses (if any)
- [ ] Determine related sections and legal bases

### **During Creation:**
- [ ] Descriptive title and neutral summary
- [ ] Exact statutory text
- [ ] Add tags and source URLs
- [ ] Fill type-specific fields (elements, penalties, etc.)
- [ ] Add legal_bases then related_sections (in that order)

### **Before Publishing:**
- [ ] Validate required fields
- [ ] Check URL validity and date formats
- [ ] Ensure relation objects follow internal/external formats
- [ ] Confirm entry_id pattern matches generator

---

## 🔧 Troubleshooting

### **Common Issues:**
1. Missing required base fields (see Required vs Optional)
2. `prescriptive_period.value` not a positive number or "NA"
3. External relation contains `entry_id` (should use `citation` instead)
4. Internal relation missing `entry_id`
5. Invalid URLs (must start with http:// or https://)

### **Validation Errors:**
- Check the browser console for detailed messages from Zod.
- Ensure `status === "amended"` includes `amendment_date`.
- Confirm `source_urls[0]` exists and is a valid URL.
- Make sure `entry_id` conforms to the generator patterns.

---

## 🤖 GPT Usage Instructions

When generating statute section entries with GPT or similar tools, follow the template in this guide and these rules:

1. **Always include ALL required base fields.**
2. **Use exact statutory text** – no paraphrasing in `text`.
3. **Prefer official source URLs** (Lawphil, Official Gazette).
4. **Relations**: `legal_bases` first, then `related_sections`.
5. **Relations format**: External → `citation` (and optional `url`, `title`, `note`); Internal → `entry_id` (and optional `note`).
6. **Dates**: ISO strings.
7. **Entry ID**: follow generator rules (RPC/RA/generic patterns).
8. **Do not include auto-populated fields** (`embedding`, `verified`, etc.).
9. **Progress**: Imported-then-created entries count toward daily quotas automatically.

---

## 📞 Support

For questions or issues with statute section entries:
- Consult this guide and `JSON_ENTRY_CREATION_GUIDE.md`
- Check the browser console for validation errors
- Contact the development team for technical issues


