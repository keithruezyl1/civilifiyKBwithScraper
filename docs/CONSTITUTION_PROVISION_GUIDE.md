# 📜 Civilify Law Entry App - Constitution Provision Entry Guide

## 🎯 Overview

This guide is specifically designed for creating **Constitution Provision** entries in the Civilify Law Entry App. Constitution provisions are fundamental legal principles from the 1987 Philippine Constitution that form the bedrock of Philippine law.

## 🏗️ Constitution Provision Entry Structure

### **📝 Base Fields (Required for All Entries)**

```javascript
entry_id: string          // Auto-generated stable ID (e.g., "CONST-1987Constitution,BillofRights-Article 3, Section 14(2)-663202")
type: "constitution_provision"  // Always "constitution_provision"
title: string            // Human-readable label (e.g., "Right to a Speedy Trial")
jurisdiction: string     // Usually "PH" for national constitution
law_family: string       // "1987 Constitution, Bill of Rights" or "1987 Constitution"
section_id?: string      // Article/Section (e.g., "Article 3, Section 14(2)", "Article 3 Section 12")
canonical_citation: string // Formal cite (e.g., "1987 Constitution, Article 3, Section 14(2)")
status: string           // "active" | "amended" | "repealed" | "draft" | "approved" | "published"
effective_date: string   // ISO date (usually "1987-02-02T00:00:00.000Z" for 1987 Constitution)
amendment_date?: string  // ISO date (only if status = "amended")
summary: string          // 1-3 sentence neutral synopsis
text: string            // Clean, normalized constitutional text
source_urls: string[]   // Official sources (at least 1 required)
tags: string[]          // Retrieval hints (e.g., ["speedy", "trial", "due", "process", "presumption", "of", "innocence"])
last_reviewed: string    // ISO date (auto-set to current date for new entries)
created_by: number       // Team member ID (e.g., 5 for Tagarao)
created_at: string       // ISO timestamp (auto-generated)
updated_at: string       // ISO timestamp (auto-generated)
embedding: string        // Vector embedding (auto-generated for imported entries)
```

### **🔒 Access Control**
```javascript
visibility: {
  gli: boolean,         // General Legal Information (usually true)
  cpa: boolean         // CPA mode (usually true for constitution)
}
```


### **📜 Constitution-Specific Fields**
```javascript
topics: string[]              // Required: constitutional topics/themes (e.g., ["criminal justice", "due process", "judicial efficiency", "rights of the accused"])
jurisprudence: string[]       // Optional: key Supreme Court cases (array of strings with full case citations)
legal_bases: object[]         // Optional: legal bases with full details (Step 4)
related_sections: object[]    // Optional: related constitutional sections with full details (Step 4)
```

### **📋 Citation Format for References (related_sections & legal_bases)**
```javascript
// External references (legal_bases)
{
  "type": "external",         // For external legal documents
  "citation": "string",       // Full citation text (e.g., "Republic Act No. 8493 (1998)")
  "url": "string",           // Complete URL
  "title": "string",         // Document title (e.g., "Speedy Trial Act of 1998")
  "note": "string"           // Short description
}

// Internal references (related_sections)
{
  "type": "internal",         // For related constitution provisions
  "entry_id": "string",       // Entry ID of related provision
  "title": "string",         // Title of related provision
  "url": "string",           // URL to constitution text
  "note": "string"           // Description of relationship
}
```

---

## 📚 Constitution Provision Examples

### **Example 1: Bill of Rights - Right to a Speedy Trial**

```json
{
  "entry_id": "CONST-1987Constitution,BillofRights-Article 3, Section 14(2)-663202",
  "type": "constitution_provision",
  "title": "Right to a Speedy Trial",
  "canonical_citation": "1987 Constitution, Article 3, Section 14(2)",
  "summary": "The accused in a criminal case is guaranteed the right to a speedy, impartial, and public trial. This safeguard prevents undue delay, protects the presumption of innocence, and upholds due process.",
  "text": "In all criminal prosecutions, the accused shall be presumed innocent until the contrary is proved, and shall enjoy the right to be heard by himself and counsel, to be informed of the nature and cause of the accusation against him, to have a speedy, impartial, and public trial, to meet the witnesses face to face, and to have compulsory process to secure the attendance of witnesses and the production of evidence in his behalf.",
  "tags": [
    "speedy",
    "trial",
    "due",
    "process",
    "presumption",
    "of",
    "innocence",
    "innocent",
    "rights",
    "the",
    "accused"
  ],
  "jurisdiction": "PH",
  "law_family": "1987 Constitution, Bill of Rights",
  "created_by": 5,
  "created_at": "2025-09-08T16:49:01.692Z",
  "updated_at": "2025-09-08T16:49:01.696Z",
  "section_id": "Article 3, Section 14(2)",
  "status": "active",
  "effective_date": "1987-02-02T00:00:00.000Z",
  "amendment_date": null,
  "last_reviewed": "2025-09-08T00:00:00.000Z",
  "visibility": {
    "cpa": true,
    "gli": true
  },
  "source_urls": [
    "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
    "https://lawphil.net/consti/cons1987.html"
  ],
  "topics": [
    "criminal justice",
    "due process",
    "judicial efficiency",
    "rights of the accused"
  ],
  "jurisprudence": [
    "Tatad v. Sandiganbayan, G.R. No. 72335, 1988 — Inordinate delay in preliminary investigation violates right to speedy trial.",
    "People v. Sandiganbayan (Third Division), G.R. No. 232197-98, 2018 — Right to speedy trial requires balancing test between state interests and rights of the accused.",
    "Perez v. People, G.R. No. 164763, 2009 — Dismissal warranted when delay in prosecution is unjustified."
  ],
  "legal_bases": [
    {
      "url": "https://lawphil.net/statutes/repacts/ra1998/ra_8493_1998.html",
      "note": "Implements specific timeframes for criminal proceedings.",
      "type": "external",
      "title": "Speedy Trial Act of 1998",
      "citation": "Republic Act No. 8493 (1998)"
    },
    {
      "url": "https://lawphil.net/courts/rules/rc_1989p1.html#RULE_119",
      "note": "Provides procedural rules on the conduct of criminal trials.",
      "type": "external",
      "title": "Rule 119 – Trial",
      "citation": "Rule 119, Rules of Court of the Philippines"
    },
    {
      "url": "https://lawphil.net/statutes/presdecs/pd1978/pd_1606_1978.html",
      "note": "Governs criminal trials for graft and corruption cases involving public officials.",
      "type": "external",
      "title": "Sandiganbayan Law",
      "citation": "Presidential Decree No. 1606 (1978), as amended"
    }
  ],
  "related_sections": [
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Protects individuals from deprivation of life, liberty, or property without due process of law and ensures equal protection under the laws.",
      "type": "internal",
      "title": "Right to Due Process of Law",
      "entry_id": "CONST-1987Constitution,BillofRights-Article III, Section 1-670979"
    },
    {
      "url": "https://lawphil.net/consti/cons1987.html",
      "note": "Provides for the rights of any person under investigation for the commission of an offense, including the right to remain silent, the right to counsel, and the inadmissibility of confessions obtained in violation of these rights.",
      "type": "internal",
      "title": "Rights of Persons Under Custodial Investigation",
      "entry_id": "CONST-1987PhilippineConstitution–BillofRights-Art. III, Sec. 12-617772"
    },
    {
      "url": "https://lawphil.net/consti/cons1987.html",
      "note": "All persons, except those charged with offenses punishable by reclusion perpetua when evidence of guilt is strong, shall be bailable before conviction by sufficient sureties, or released on recognizance as may be provided by law.",
      "type": "internal",
      "title": "Right to Bail",
      "entry_id": "CONST-1987PhilippineConstitution–BillofRights-Article III, Sec. 13-367017"
    }
  ],
  "created_by_name": "Tagarao",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "CONST-1987Constitution,BillofRights-Article 3, Section 14(2)-663202"
}
```

### **Example 2: Bill of Rights - Custodial Investigation**

```json
{
  "entry_id": "CONST-Art3Sec12-123456",
  "type": "constitution_provision",
  "title": "Rights of Persons Under Custodial Investigation",
  "jurisdiction": "PH Philippines (PH)",
  "law_family": "1987 Constitution",
  "section_id": "Article 3 Section 12",
  "canonical_citation": "1987 Constitution, Article 3 Section 12",
  "status": "active",
  "effective_date": "1987-02-02",
  "summary": "Constitutional rights that apply when a person is under investigation for the commission of an offense, including the right to remain silent and to counsel.",
  "text": "Any person under investigation for the commission of an offense shall have the right to be informed of his right to remain silent and to have competent and independent counsel preferably of his own choice. If the person cannot afford the services of counsel, he must be provided with one. These rights cannot be waived except in writing and in the presence of counsel.",
  "source_urls": [
    "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
    "https://www.lawphil.net/consti/cons1987.html"
  ],
  "tags": ["custodial", "investigation", "rights", "counsel", "silence", "miranda"],
  "last_reviewed": "2024-01-15",
  "visibility": {
    "gli": true,
    "cpa": true
  },
  "topics": ["custodial", "investigation", "counsel", "silence", "waiver"],
  "jurisprudence": [
    "People v. Galit, GR 51770, 1982",
    "People v. Andan, GR 116437, 1997",
    "People v. Rapeza, GR 169431, 2006"
  ],
  "legal_bases": [
    {
      "type": "external",
      "citation": "1987 Constitution, Article 3 Section 12",
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "title": "Rights of Persons Under Custodial Investigation",
      "note": "Primary constitutional basis for custodial investigation rights"
    }
  ],
  "related_sections": [
    {
      "type": "external",
      "citation": "1987 Constitution, Article 3 Section 13",
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "title": "Right to Bail",
      "note": "Constitutional right to bail for most offenses"
    },
    {
      "type": "external",
      "citation": "1987 Constitution, Article 3 Section 14",
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "title": "Right to Due Process",
      "note": "Fundamental due process protections in legal proceedings"
    },
    {
      "type": "external",
      "citation": "1987 Constitution, Article 3 Section 2",
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "title": "Protection Against Unreasonable Searches and Seizures",
      "note": "Constitutional protection during searches and arrests"
    }
  ]
}
```

### **Example 3: Bill of Rights - Right to Bail**

```json
{
  "entry_id": "CONST-Art3Sec13-123456",
  "type": "constitution_provision",
  "title": "Right to Bail",
  "jurisdiction": "PH",
  "law_family": "1987 Constitution",
  "section_id": "Article 3 Section 13",
  "canonical_citation": "1987 Constitution, Article 3 Section 13",
  "status": "active",
  "effective_date": "1987-02-02",
  "summary": "Constitutional right to bail for all persons except those charged with capital offenses when evidence of guilt is strong.",
  "text": "All persons, except those charged with offenses punishable by reclusion perpetua when evidence of guilt is strong, shall, before conviction, be bailable by sufficient sureties, or be released on recognizance as may be provided by law. The right to bail shall not be impaired even when the privilege of the writ of habeas corpus is suspended. Excessive bail shall not be required.",
  "source_urls": [
    "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
    "https://www.lawphil.net/consti/cons1987.html"
  ],
  "tags": ["bail", "release", "recognizance", "capital_offense", "habeas_corpus"],
  "last_reviewed": "2024-01-15",
  "visibility": {
    "gli": true,
    "cpa": true
  },
  "topics": ["bail", "release", "capital_offense", "recognizance", "excessive_bail"],
  "jurisprudence": [
    "People v. Honrada, GR 119123, 1996",
    "People v. Cabral, GR 188329, 2010",
    "People v. Temporada, GR 173473, 2008"
  ],
  "legal_bases": [
    {
      "type": "external",
      "citation": "1987 Constitution, Article 3 Section 13",
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "title": "Right to Bail",
      "note": "Primary constitutional basis for bail rights"
    }
  ],
  "related_sections": [
    {
      "type": "external",
      "citation": "1987 Constitution, Article 3 Section 12",
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "title": "Rights of Persons Under Custodial Investigation",
      "note": "Constitutional rights during police investigation and arrest"
    },
    {
      "type": "external",
      "citation": "1987 Constitution, Article 3 Section 15",
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "title": "Writ of Habeas Corpus",
      "note": "Constitutional protection against unlawful detention"
    },
    {
      "type": "external",
      "citation": "1987 Constitution, Article 3 Section 14",
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "title": "Right to Due Process",
      "note": "Fundamental due process protections in legal proceedings"
    }
  ]
}
```

---

## ⚠️ Critical Validation Requirements

### **Entry ID Generation**
- **Format:** `CONST-{LawFamily}-{SectionID}-{6-digit-timestamp}`
- **Examples:** `CONST-1987Constitution,BillofRights-Article 3, Section 14(2)-663202`
- **Auto-generated:** The system generates this automatically based on law_family, section_id and timestamp
- **Validation:** Must match pattern `/^CONST-[A-Za-z0-9,() ]+-\d{6}$/`

#### **How Auto-Generation Works:**
The system automatically generates entry IDs using this process:

1. **Prefix:** Always starts with `CONST-` for constitution provisions
2. **Law Family:** Extracted from the `law_family` field:
   - `"1987 Constitution, Bill of Rights"` → `"1987Constitution,BillofRights"`
3. **Section ID:** Extracted from the `section_id` field:
   - `"Article 3, Section 14(2)"` → `"Article 3, Section 14(2)"`
4. **Timestamp:** Last 6 digits of current timestamp (milliseconds since epoch)
   - Example: `1705123456789` → `"234567"`
5. **Final Format:** `CONST-{LawFamily}-{SectionID}-{6-digit-timestamp}`

#### **Generation Examples:**
```javascript
// Input law_family: "1987 Constitution, Bill of Rights"
// Input section_id: "Article 3, Section 14(2)"
// Generated entry_id: "CONST-1987Constitution,BillofRights-Article 3, Section 14(2)-663202"

// Input law_family: "1987 Constitution"
// Input section_id: "Article 3 Section 12"
// Generated entry_id: "CONST-1987Constitution-Article 3 Section 12-789012"
```

#### **Important Notes:**
- **Don't manually set entry_id** - Let the system generate it automatically
- **Unique per entry** - The timestamp ensures uniqueness even for same section
- **Validation required** - Must match the regex pattern for system acceptance
- **Case sensitive** - Section ID extraction preserves original casing

### **Required Fields (Validation Will Fail Without These)**
```javascript
// These fields are REQUIRED and will cause validation errors if missing:
entry_id: string          // Auto-generated, must follow CONST-{LawFamily}-{SectionID}-{timestamp} format
type: "constitution_provision"  // Must be exactly this string
title: string            // Must be at least 3 characters
jurisdiction: string     // Must be "PH" or valid jurisdiction name
law_family: string       // Must be at least 1 character (e.g., "1987 Constitution, Bill of Rights")
canonical_citation: string // Must be at least 1 character
status: string           // Must be one of: "active", "amended", "repealed", "draft", "approved", "published"
effective_date: string   // Must be ISO date format (e.g., "1987-02-02T00:00:00.000Z")
summary: string          // Must be at least 1 character
text: string            // Must be at least 1 character
source_urls: string[]   // Must have at least 1 valid URL
tags: string[]          // Must have at least 1 tag
last_reviewed: string    // Must be ISO date format (e.g., "2025-09-08T00:00:00.000Z")
topics: string[]        // Must have at least 1 topic (constitution_provision specific)
created_by: number      // Team member ID (e.g., 5 for Tagarao)
created_at: string      // ISO timestamp (auto-generated)
updated_at: string      // ISO timestamp (auto-generated)
```

### **Cross-Field Validation Rules**
- If `status` is "amended", then `amendment_date` is required
- All URLs in `source_urls` must be valid URLs (start with http:// or https://)

### **Vector Embeddings for Imported Entries**
- **Auto-generated:** When entries are imported via JSON, the system automatically generates vector embeddings
- **Purpose:** Enables semantic search and AI-powered retrieval functionality
- **Format:** Large array of floating-point numbers (e.g., `[0.018105285,0.03040041,0.0018285423,...]`)
- **No manual input required:** The embedding field is populated automatically during import
- **Search enhancement:** Embeddings allow the system to find related entries based on semantic meaning, not just exact text matches

### **Import-Specific Field Handling**
- **Created By:** Automatically set to the logged-in user's information
  - `created_by`: Uses the logged-in user's ID (e.g., 5 for Tagarao)
  - `created_by_name`: Uses the logged-in user's name (e.g., "Tagarao")
- **Verification Status:** All imported entries are automatically marked as unverified
  - `verified`: Set to `false`
  - `verified_at`: Set to `null`
  - `verified_by`: Set to `null`
- **Progress Tracking:** Imported entries count towards daily quotas and progress
  - Each imported entry increments the user's daily progress for that entry type
  - Progress is tracked by entry type (e.g., `constitution_provision`, `statute_section`)
  - Imported entries contribute to quota completion just like manually created entries
- **No manual input required:** These fields are automatically populated during import

### **Jurisdiction Validation**
- Must be "PH" for national constitution
- If other jurisdiction, must be title-cased (e.g., "Quezon City", "Cavite")
- Must match pattern: `/^[A-Za-zÀ-ÿ]+(?:[-' ]+[A-Za-zÀ-ÿ]+)*(?: City| Province)?$/`

---

## 🏷️ Common Topics for Constitution Provisions

### **Bill of Rights Topics:**
- `arrest` - Arrest procedures and rights
- `search` - Search and seizure
- `seizure` - Property seizure
- `privacy` - Privacy rights
- `warrant` - Search/arrest warrants
- `probable_cause` - Probable cause requirement
- `custodial` - Custodial investigation
- `counsel` - Right to counsel
- `silence` - Right to remain silent
- `bail` - Right to bail
- `due_process` - Due process rights
- `equal_protection` - Equal protection clause
- `free_speech` - Freedom of speech
- `free_press` - Freedom of the press
- `assembly` - Right to assembly
- `religion` - Freedom of religion
- `travel` - Right to travel
- `association` - Right to association

### **Other Constitutional Topics:**
- `separation_powers` - Separation of powers
- `judicial_review` - Judicial review
- `executive_power` - Executive powers
- `legislative_power` - Legislative powers
- `local_government` - Local government autonomy
- `social_justice` - Social justice provisions
- `education` - Right to education
- `health` - Right to health
- `labor` - Labor rights
- `environment` - Environmental protection

---

## 📅 Important Dates

### **1987 Constitution:**
- **Effective Date:** `1987-02-02`
- **Ratification:** February 2, 1987
- **Proclamation:** February 11, 1987

### **Historical Context:**
- Replaced the 1973 Constitution
- Drafted by the 1986 Constitutional Commission
- Approved by plebiscite on February 2, 1987

---

## 🔗 Essential Source URLs

### **Primary Sources:**
- `https://www.officialgazette.gov.ph/constitutions/1987-constitution/` - Official Gazette of the Philippines - 1987 Constitution
- `https://www.lawphil.net/consti/cons1987.html` - LawPhil.net - 1987 Constitution Text

### **Additional Resources:**
- `https://www.supremecourt.gov.ph/` - Supreme Court of the Philippines - Court decisions and jurisprudence
- `https://www.chanrobles.com/` - Chan Robles Virtual Law Library - Comprehensive legal database
- `https://www.lawphil.net/` - LawPhil.net - Philippine legal resources and case law

---

## 📝 Writing Guidelines

### **Title Format:**
- Use clear, descriptive titles
- Focus on the specific right or principle
- Examples:
  - ✅ "Protection Against Unreasonable Searches and Seizures"
  - ✅ "Rights of Persons Under Custodial Investigation"
  - ✅ "Right to Bail"
  - ❌ "Article 3 Section 2"
  - ❌ "Constitutional Provision"

### **Summary Guidelines:**
- 1-3 sentences maximum
- Neutral, objective tone
- Focus on the core principle
- Examples:
  - ✅ "Constitutional protection against unreasonable searches and seizures, requiring probable cause and judicial warrant."
  - ✅ "Constitutional rights that apply when a person is under investigation for the commission of an offense, including the right to remain silent and to counsel."

### **Text Guidelines:**
- Use the exact constitutional text
- Maintain original formatting and punctuation
- Include the complete provision
- Do not paraphrase or summarize

### **Tags Guidelines:**
- Use 3-8 relevant tags
- Include both specific and general terms
- Examples: `["search", "seizure", "warrant", "privacy", "probable_cause"]`

### **Citation Guidelines:**
- All citations must be external references
- Provide at least 3 citations for both related_sections and jurisprudence
- Each citation must include:
  - **citation**: Full citation text
  - **url**: Complete URL (no shortcuts)
  - **title**: Document title
  - **note**: Short description (1-2 sentences)
- Use full text for all URLs - no abbreviated links
- Examples:
  - ✅ `"https://www.officialgazette.gov.ph/constitutions/1987-constitution/"`
  - ❌ `"www.officialgazette.gov.ph"` or `"Official Gazette"`

---

## 🎯 Team Assignment

### **Primary Assignee:** Tagarao (P5)
- **Daily Quota:** 3 constitution_provision entries per day
- **Focus Areas:** Rights + Constitution + Policy
- **Backup:** Delos Cientos (P2) for rights-related provisions

---

## 🚀 Quick Start Checklist

### **Before Creating:**
- [ ] Identify the specific constitutional provision
- [ ] Gather the exact constitutional text
- [ ] Find official source URLs
- [ ] Research relevant jurisprudence
- [ ] Identify related constitutional sections

### **During Creation:**
- [ ] Use clear, descriptive title
- [ ] Copy exact constitutional text
- [ ] Write neutral 1-3 sentence summary
- [ ] Add 3-8 relevant tags
- [ ] Include official source URLs
- [ ] Add relevant topics
- [ ] Include related sections
- [ ] Add key jurisprudence

### **Before Publishing:**
- [ ] Verify all required fields are complete
- [ ] Check spelling and grammar
- [ ] Ensure source URLs are valid
- [ ] Confirm constitutional text is accurate
- [ ] Review tags for relevance
- [ ] Validate entry_id format

---

## 💡 Best Practices

### **Content Quality:**
- Always use the exact constitutional text
- Include comprehensive jurisprudence
- Add related constitutional sections
- Use official government sources
- Maintain neutral, objective tone

### **Technical Quality:**
- Follow the exact JSON structure
- Use proper date formats (YYYY-MM-DD)
- Ensure all URLs are valid
- Use consistent naming conventions
- Include all required fields

### **User Experience:**
- Write clear, descriptive titles
- Provide comprehensive summaries
- Use relevant, searchable tags
- Include multiple source URLs
- Add helpful related sections

---

## 🔧 Troubleshooting

### **Common Issues:**
1. **Missing required fields** - Ensure all base fields are included (see Critical Validation Requirements above)
2. **Invalid dates** - Use ISO format (e.g., "1987-02-02T00:00:00.000Z")
3. **Invalid URLs** - Ensure URLs start with http:// or https://
4. **Empty arrays** - Required arrays (source_urls, tags, topics) cannot be empty
5. **Incorrect entry_id** - Follow the CONST-{LawFamily}-{SectionID}-{6-digit-timestamp} format
6. **Roman numerals** - Use "Article 3, Section 14(2)" instead of "Art. III, Sec. 14(2)"
7. **Jurisprudence format** - Use array of strings with full case citations and descriptions
8. **Related sections format** - Use type: "internal" with entry_id for constitution provisions
9. **Legal bases format** - Use type: "external" with citation, url, title, note for external documents
10. **Auto-populated fields** - Do not include these fields; system populates automatically on import:
    - `embedding` - Vector embedding for semantic search
    - `created_by` - Logged-in user's ID
    - `created_by_name` - Logged-in user's name
    - `verified` - Set to false for all imports
    - `verified_at` - Set to null for all imports
    - `verified_by` - Set to null for all imports

### **Validation Errors:**
- Check browser console for specific error messages
- Verify JSON syntax is correct
- Ensure all required fields are present (see Critical Validation Requirements)
- Confirm all URLs are valid and complete
- Check date formats (ISO format: "1987-02-02T00:00:00.000Z")
- Confirm topics array has at least one item
- Check that jurisprudence is array of strings with full case citations
- Verify related_sections use type: "internal" with entry_id for constitution provisions
- Verify legal_bases use type: "external" with citation, url, title, note for external documents
- Do not include auto-populated fields - they're set automatically on import

---

## 🤖 GPT Usage Instructions

### **For AI/GPT Generation:**
When generating constitution provision entries with GPT or similar AI tools, use this exact template:

```json
{
  "entry_id": "CONST-{LawFamily}-{SectionID}-{6-digit-timestamp}",
  "type": "constitution_provision",
  "title": "Descriptive Title of the Constitutional Right",
  "canonical_citation": "1987 Constitution, Article X, Section Y",
  "summary": "1-3 sentence neutral summary of the constitutional provision",
  "text": "Exact constitutional text without modification",
  "tags": ["relevant", "tags", "for", "search"],
  "jurisdiction": "PH",
  "law_family": "1987 Constitution, Bill of Rights",
  "created_by": 5,
  "section_id": "Article X, Section Y",
  "status": "active",
  "effective_date": "1987-02-02T00:00:00.000Z",
  "amendment_date": null,
  "last_reviewed": "2025-01-10T00:00:00.000Z",
  "visibility": {
    "cpa": true,
    "gli": true
  },
  "source_urls": [
    "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
    "https://lawphil.net/consti/cons1987.html"
  ],
  "topics": ["required", "topics", "array"],
  "jurisprudence": [
    "Case Name, G.R. No. XXXXX, Year — Brief description of case relevance."
  ],
  "legal_bases": [
    {
      "type": "external",
      "citation": "Republic Act No. XXXX (Year)",
      "url": "https://lawphil.net/statutes/...",
      "title": "Document Title",
      "note": "Brief description of legal basis"
    }
  ],
  "related_sections": [
    {
      "type": "internal",
      "entry_id": "CONST-1987Constitution,BillofRights-Article X, Section Y-123456",
      "title": "Related Constitutional Provision Title",
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Brief description of relationship"
    }
  ],
  "created_by_name": "Tagarao",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "CONST-{LawFamily}-{SectionID}-{6-digit-timestamp}"
}
```

### **Critical GPT Instructions:**
1. **Always include ALL required fields** - Missing any will cause validation failure
2. **Use exact constitutional text** - Do not paraphrase or summarize
3. **Topics array is REQUIRED** - Must have at least one topic
4. **Jurisprudence is array of strings** - Include full case citations with brief descriptions
5. **Related sections use type: "internal"** - For constitution provisions, use internal references with entry_id
6. **Legal bases use type: "external"** - For external legal documents, use external references
7. **Entry ID format** - CONST-{LawFamily}-{SectionID}-{6-digit-timestamp} (auto-generated by system)
8. **Dates must be ISO format** - Use "1987-02-02T00:00:00.000Z" format for dates
9. **URLs must be complete** - Start with http:// or https://
10. **Status must be valid enum** - "active", "amended", "repealed", "draft", "approved", "published"
11. **Auto-populated fields** - Do not include these fields; system populates automatically on import:
    - `embedding` - Vector embedding for semantic search
    - `created_by` - Logged-in user's ID
    - `created_by_name` - Logged-in user's name
    - `verified` - Set to false for all imports
    - `verified_at` - Set to null for all imports
    - `verified_by` - Set to null for all imports
    - **Progress tracking** - Imported entries automatically count towards daily quotas and progress

---

## 📞 Support

For questions or issues with constitution provision entries:
- Contact Tagarao (P5) for content questions
- Refer to the main ENTRY_CREATION_GUIDE.md for general guidance
- Check the browser console for validation errors
- Contact the development team for technical issues

---

*This guide is specifically designed for Constitution Provision entries and is maintained by the Civilify development team.*
