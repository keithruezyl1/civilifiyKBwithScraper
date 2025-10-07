# ⚖️ Civilify Law Entry App - Rule of Court Entry Guide

## 🎯 Overview

This guide defines how to create valid `rule_of_court` entries for the Civilify Law Entry App. It mirrors the UI and backend Zod schemas, so entries created with this guide will validate in both the form and API. Use this as a companion to `CONSTITUTION_PROVISION_GUIDE.md` and as a structural reference to `STATUTE_SECTION_GUIDE.md`.

## 🏗️ Rule of Court Entry Structure

### **📝 Base Fields (Required for All Entries)**

```javascript
entry_id: string           // Stable ID (e.g., "ROC-Rule113-Sec5-774113")
type: "rule_of_court"     // Always "rule_of_court"
title: string              // Human-readable label
jurisdiction: string       // e.g., "PH" or a valid LGU name
law_family: string         // e.g., "Rules of Court"
section_id?: string        // e.g., "Rule 113 Sec. 5"
canonical_citation: string // e.g., "Rule 113 Sec. 5"
status: "active" | "amended" | "repealed" | "draft" | "approved" | "published"
effective_date: string     // ISO string (e.g., "2000-01-01T00:00:00.000Z")
amendment_date?: string    // ISO string, required if status === "amended"
summary: string            // 1–3 sentence synopsis
text: string               // Full normalized rule text
source_urls: string[]      // At least one valid URL
tags: string[]             // 3–8 retrieval hints
last_reviewed: string      // ISO date (auto-set in the app for new entries)
created_by: number         // Team member numeric ID
created_at: string         // ISO timestamp (auto-generated)
updated_at: string         // ISO timestamp (auto-generated)
```

### **🔢 Entry ID Generation**
Entry IDs are generated consistently in the app using `src/lib/kb/entryId.ts`. For the Rules of Court, the generator follows these rules:

```text
rule_of_court:
- Rules of Court: ROC-Rule{digits}-Sec{digits}-{last6OfTimestamp}
```

Notes:
- The timestamp suffix uses the last 6 digits of `Date.now()` for uniqueness.
- If `section_id` is unavailable, the generator falls back to placeholders of the form `Rule{n}` and `Sec{n}`.
- The validator accepts canonical patterns like `ROC-Rule\d+-Sec\d+-\d{6}`.

Examples:
```text
Rule 113, Sec. 5  → entry_id: ROC-Rule113-Sec5-774113
Rule 126, Sec. 2  → entry_id: ROC-Rule126-Sec2-889001
```

### **🔒 Access Control**
```javascript
visibility: {
  gli: boolean,  // General Legal Information
  cpa: boolean   // CPA mode
}
```

### **📜 Rule of Court — Type-Specific Fields**
These fields are supported by the Zod schema for `rule_of_court` and by the API payload:

```javascript
rule_no: string                  // e.g., "Rule 113"
section_no: string               // e.g., "Sec. 5"
triggers: string[]               // Events/conditions that activate/apply the rule
time_limits?: string[]           // Deadlines such as "within 12 hours", "10 days" (optional)
required_forms?: string[]        // Official forms demanded by the rule (optional)

related_sections: EntryRef[]     // Cross-references (optional)
```

Where:

```javascript
// EntryRef (discriminated by `type`)
{ type: "internal", entry_id: string, note?: string }
{ type: "external", citation: string, url?: string, note?: string }
```

### **📋 Citation Format Guidelines**
- **External (EntryRef)**: use `type: "external"` and include `citation`, optionally `url`, `title`, and `note`.
- **Internal (EntryRef)**: use `type: "internal"` and include `entry_id` of the referenced KB entry.

### **✅ Required vs Optional Fields**
```javascript
// REQUIRED (will block save/publish if missing)
entry_id,
type,            // must equal "rule_of_court"
title,
jurisdiction,
law_family,      // typically "Rules of Court"
canonical_citation,
status,          // one of allowed enum values
effective_date,  // ISO date string
summary,
text,
source_urls[0],  // at least one valid URL
tags[0],         // at least one tag
last_reviewed,

// Type-specific required
rule_no,         // string
section_no,      // string
triggers[0],     // at least one trigger string

// OPTIONAL (encouraged when applicable)
section_id,
amendment_date,  // required if status === "amended"
time_limits,     // string[]
required_forms,  // string[]
related_sections // EntryRef[]
```

### **🔁 Cross-Field Validation Rules**
- If `status === "amended"`, an `amendment_date` (ISO date) is required.
- `triggers` must contain at least one non-empty string.
- External relations (`type: "external"`) must NOT include `entry_id` and MUST include `citation`.
- Internal relations (`type: "internal"`) MUST include a valid `entry_id` and do not include `citation`.
- All URLs in `source_urls` must be valid `http(s)://` links.

### **✅ Validation Highlights**
- If `status === "amended"`, `amendment_date` is required.
- `source_urls` must include at least one valid URL.
- `triggers` is required; `time_limits` and `required_forms` are optional.
- For external relations, omit `entry_id`; for internal relations, provide `entry_id`.

## 🧠 Import Behavior (JSON → Form)

When importing a JSON entry (any type, including `rule_of_court`):
- `created_by`, `created_by_name`, and `created_by_username` are auto-set from the logged-in user.
- `verified` is set to `false` (with `verified_at` and `verified_by` cleared).
- All draft/autosave keys are cleared and replaced by the imported entry as the new draft.
- You are redirected to the create flow with fields pre-filled; you then review and click "Create Entry".

### **🧮 Vector Embeddings & Progress Tracking**
- Vector embeddings are automatically generated on create (no need to provide `embedding` in JSON).
- Imported-created entries increment daily progress/quotas for the corresponding `type`.

## 🧪 Example: Rules of Court – Rule 113, Sec. 5

```json
{
  "entry_id": "ROC-Rule113-Sec5-774113",
  "type": "rule_of_court",
  "title": "Arrest Without Warrant",
  "canonical_citation": "Rule 113 Sec. 5",
  "summary": "Lists the circumstances when a peace officer or private person may arrest without a warrant.",
  "text": "Section 5. Arrest without warrant. — ...",
  "tags": ["arrest","criminal procedure","warrantless"],
  "jurisdiction": "PH",
  "law_family": "Rules of Court",
  "section_id": "Rule 113 Sec. 5",
  "status": "active",
  "effective_date": "2000-01-01T00:00:00.000Z",
  "last_reviewed": "2025-09-08T00:00:00.000Z",
  "visibility": { "cpa": true, "gli": true },
  "source_urls": [
    "https://lawphil.net/courts/rules/rc1997/rc_1997.html"
  ],
  "rule_no": "Rule 113",
  "section_no": "Sec. 5",
  "triggers": [
    "Officer witnesses the offense",
    "Offense has in fact just been committed and officer has probable cause",
    "Escaped prisoner"
  ],
  "time_limits": [
    "Deliver to nearest police station or jail without unnecessary delay"
  ],
  "required_forms": [
    "Arrest report form (if prescribed)"
  ],
  "related_sections": [
    { "type": "internal", "entry_id": "ROC-Rule112-Sec7-123456", "note": "Filing of complaint or information" }
  ],
  "created_by": 4,
  "created_by_name": "Sendrijas",
  "created_at": "2025-09-08T19:29:18.067Z",
  "updated_at": "2025-09-08T19:29:18.070Z"
}
```

## 🧩 GPT Template (Rule of Court)

```json
{
  "entry_id": "ROC-Rule{Number}-Sec{Number}-{6-digit-timestamp}",
  "type": "rule_of_court",
  "title": "Descriptive Section Title",
  "canonical_citation": "Rule {Number} Sec. {Number}",
  "summary": "1–3 sentence neutral summary of the rule section.",
  "text": "Exact rule text without paraphrasing.",
  "tags": ["relevant","retrieval","keywords"],
  "jurisdiction": "PH",
  "law_family": "Rules of Court",
  "section_id": "Rule {Number} Sec. {Number}",
  "status": "active",
  "effective_date": "YYYY-MM-DDTHH:mm:ss.sssZ",
  "amendment_date": null,
  "last_reviewed": "YYYY-MM-DDTHH:mm:ss.sssZ",
  "visibility": { "cpa": true, "gli": true },
  "source_urls": ["https://..."],
  "rule_no": "Rule {Number}",
  "section_no": "Sec. {Number}",
  "triggers": ["..."],
  "time_limits": ["..."],
  "required_forms": ["..."],
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
- `triggers` empty → add at least one trigger string.
- External relation with `entry_id` or internal relation without `entry_id` → correct the discriminated union per type.
- `status === "amended"` but no `amendment_date` → add ISO date.
- `entry_id` format mismatch → use the generator patterns (see Entry ID Generation) and avoid punctuation inside tokens.

## 🧭 Tips
- Keep `triggers` concise and behavior-focused.
- Use official sources (`lawphil`, `officialgazette`) in `source_urls`.
- Prefer internal `related_sections` when referencing KB entries.

---

For general guidance, also see `docs/CONSTITUTION_PROVISION_GUIDE.md` and `docs/JSON_ENTRY_CREATION_GUIDE.md`.

---

## 📅 Important Dates

- Effective dates vary across amendments to the Rules of Court. Use the effectivity date provided in the rule/revision. Always encode as an ISO datetime string: `YYYY-MM-DDTHH:mm:ss.sssZ`.

### **Historical Context**
- Provide context in the summary sparingly and only when it helps users understand the rule’s purpose.

---

## 🔗 Essential Source URLs

### **Primary Sources:**
- `https://lawphil.net/` – Lawphil rules texts (preferred official host)
- Supreme Court and Judiciary websites publishing Rules of Court revisions

### **Additional Resources:**
- Agency websites or circulars when they directly reference Rules of Court provisions

---

## 📝 Writing Guidelines

### **Title Format:**
- Use clear, descriptive titles that reflect the procedural action/subject.
- Examples:
  - ✅ “Arrest Without Warrant”
  - ✅ “Search Warrant; Personal Property to be Seized”
  - ❌ “Sec. 5”

### **Summary Guidelines:**
- 1–3 sentences, neutral, explain the core procedure/authorization.

### **Text Guidelines:**
- Use the exact rule text and preserve structure where possible.

### **Tags Guidelines:**
- 3–8 terms aiding retrieval (e.g., procedure names, domains, actors).

### **Citation Guidelines:**
- Prefer official/full URLs; avoid abbreviated links.

---

## 🚀 Quick Start Checklist

### **Before Creating:**
- [ ] Identify the Rule number and specific section
- [ ] Copy exact rule text
- [ ] Gather official source URL(s)
- [ ] Identify triggers; capture deadlines/forms if applicable
- [ ] Determine related sections

### **During Creation:**
- [ ] Descriptive title and neutral summary
- [ ] Exact rule text
- [ ] Add tags and source URLs
- [ ] Fill type-specific fields (rule_no, section_no, triggers, etc.)
- [ ] Add related_sections as needed

### **Before Publishing:**
- [ ] Validate required fields
- [ ] Check URL validity and date formats
- [ ] Ensure relation objects follow internal/external formats
- [ ] Confirm entry_id pattern matches generator

---

## 🔧 Troubleshooting

### **Common Issues:**
1. Missing required base fields (see Required vs Optional)
2. `triggers` is empty
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

When generating rule of court entries with GPT or similar tools, follow the template in this guide and these rules:

1. **Always include ALL required base fields.**
2. **Use exact rule text** – no paraphrasing in `text`.
3. **Prefer official source URLs** (Lawphil, Judiciary websites).
4. **Relations**: prefer internal `related_sections` when referencing KB entries; use external when citing outside sources.
5. **Relations format**: External → `citation` (and optional `url`, `title`, `note`); Internal → `entry_id` (and optional `note`).
6. **Dates**: ISO strings.
7. **Entry ID**: follow generator rules (ROC-Rule{n}-Sec{n}-{last6}).
8. **Do not include auto-populated fields** (`embedding`, `verified`, etc.).
9. **Progress**: Imported-then-created entries count toward daily quotas automatically.

---

## 📞 Support

For questions or issues with rule of court entries:
- Consult this guide and `JSON_ENTRY_CREATION_GUIDE.md`
- Check the browser console for validation errors
- Contact the development team for technical issues







