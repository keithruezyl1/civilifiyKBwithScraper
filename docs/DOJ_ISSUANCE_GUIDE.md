# ⚖️ Civilify Law Entry App - DOJ Issuance Entry Guide

## 🎯 Overview

This guide is specifically designed for creating **DOJ Issuance** entries in the Civilify Law Entry App. DOJ issuances are circulars, opinions, guidelines, and administrative orders issued by the Department of Justice to provide legal guidance, implement laws, and establish procedures for prosecutors, law enforcement, and other justice sector agencies.

## 🏗️ DOJ Issuance Entry Structure

### **📝 Base Fields (Required for All Entries)**

```javascript
entry_id: string          // Auto-generated stable ID (e.g., "DOJ-Circular2023-001-Sec5-663202")
type: "doj_issuance"      // Always "doj_issuance"
title: string            // Human-readable label (e.g., "Prosecution Guidelines for Drug Cases")
jurisdiction: string     // Usually "PH" for national DOJ issuances
law_family: string       // "DOJ Circular No. 2023-001" or "DOJ Administrative Order No. 2023-002"
section_id?: string      // Section/Article (e.g., "Sec. 5", "Art. 3")
canonical_citation: string // Formal cite (e.g., "DOJ Circular No. 2023-001, Sec. 5")
status: string           // "active" | "amended" | "repealed" | "draft" | "approved" | "published"
effective_date: string   // ISO date (e.g., "2023-04-01T00:00:00.000Z")
amendment_date?: string  // ISO date (only if status = "amended")
summary: string          // 1-3 sentence neutral synopsis
text: string            // Clean, normalized DOJ issuance text
source_urls: string[]   // Official sources (at least 1 required)
tags: string[]          // Retrieval hints (e.g., ["prosecution", "drug", "cases", "guidelines"])
last_reviewed: string    // ISO date (auto-set to current date for new entries)
created_by: number       // Team member ID (e.g., 2 for Delos Cientos)
created_at: string       // ISO timestamp (auto-generated)
updated_at: string       // ISO timestamp (auto-generated)
embedding: string        // Vector embedding (auto-generated for imported entries)
```

### **🔒 Access Control**
```javascript
visibility: {
  gli: boolean,         // General Legal Information (usually true)
  cpa: boolean         // CPA mode (usually true for DOJ issuances)
}
```

### **⚖️ DOJ Issuance-Specific Fields**
```javascript
issuance_no: string           // Required: issuance number (e.g., "Circular No. 2023-001", "AO No. 2023-002")
applicability: string[]       // Optional: who/what the issuance applies to
supersedes: string[]          // Optional: previous issuances that are superseded
legal_bases: object[]         // Optional: legal bases with full details (Step 4)
related_sections: object[]    // Optional: related issuance sections with full details (Step 4)
```

### **📋 Citation Format for References (related_sections & legal_bases)**
```javascript
// External references (legal_bases)
{
  "type": "external",         // For external legal documents
  "citation": "string",       // Full citation text (e.g., "Republic Act No. 9165 (2002)")
  "url": "string",           // Complete URL
  "title": "string",         // Document title (e.g., "Comprehensive Dangerous Drugs Act")
  "note": "string"           // Short description
}

// Internal references (related_sections)
{
  "type": "internal",         // For related issuance sections
  "entry_id": "string",       // Entry ID of related section
  "title": "string",         // Title of related section
  "url": "string",           // URL to issuance text
  "note": "string"           // Description of relationship
}
```

---

## 📚 DOJ Issuance Examples

### **Example 1: DOJ Circular - Prosecution Guidelines for Drug Cases**

```json
{
  "entry_id": "DOJ-Circular2023-001-Sec5-663202",
  "type": "doj_issuance",
  "title": "Prosecution Guidelines for Dangerous Drugs Cases",
  "canonical_citation": "DOJ Circular No. 2023-001, Sec. 5",
  "summary": "Establishes comprehensive guidelines for prosecutors handling dangerous drugs cases, including evidence handling, chain of custody requirements, and case preparation procedures. Ensures consistent application of drug laws and protection of constitutional rights.",
  "text": "Section 5. Evidence Handling and Chain of Custody. All prosecutors handling dangerous drugs cases must ensure strict compliance with chain of custody requirements: (a) Verify proper documentation of seizure and handling; (b) Confirm presence of required witnesses during inventory; (c) Ensure immediate submission to forensic laboratory; (d) Maintain complete records of all transfers; (e) Document any deviations from standard procedures; (f) Prepare for potential challenges to evidence admissibility.",
  "tags": [
    "prosecution",
    "drug",
    "cases",
    "guidelines",
    "evidence",
    "chain",
    "custody"
  ],
  "jurisdiction": "PH",
  "law_family": "DOJ Circular No. 2023-001",
  "created_by": 2,
  "created_at": "2025-01-10T16:49:01.692Z",
  "updated_at": "2025-01-10T16:49:01.696Z",
  "section_id": "Sec. 5",
  "status": "active",
  "effective_date": "2023-04-01T00:00:00.000Z",
  "amendment_date": null,
  "last_reviewed": "2025-01-10T00:00:00.000Z",
  "visibility": {
    "cpa": true,
    "gli": true
  },
  "source_urls": [
    "https://www.doj.gov.ph/issuances/circulars/circular-2023-001",
    "https://www.doj.gov.ph/issuances/2023"
  ],
  "issuance_no": "Circular No. 2023-001",
  "applicability": [
    "All prosecutors handling dangerous drugs cases",
    "National Prosecution Service offices nationwide",
    "Special prosecutors assigned to drug cases"
  ],
  "supersedes": [
    "DOJ Circular No. 2019-005 (Previous drug prosecution guidelines)"
  ],
  "legal_bases": [
    {
      "url": "https://lawphil.net/statutes/repacts/ra2002/ra_9165_2002.html",
      "note": "Provides legal framework for dangerous drugs prosecution and penalties.",
      "type": "external",
      "title": "Comprehensive Dangerous Drugs Act",
      "citation": "Republic Act No. 9165 (2002)"
    },
    {
      "url": "https://lawphil.net/courts/rules/rc1997/rc_1997.html",
      "note": "Establishes rules of evidence and chain of custody requirements.",
      "type": "external",
      "title": "Rules of Court, Rule 130",
      "citation": "Rule 130, Rules of Court"
    }
  ],
  "related_sections": [
    {
      "url": "https://www.doj.gov.ph/issuances/circulars/circular-2023-001",
      "note": "Defines case preparation and filing requirements for drug cases.",
      "type": "internal",
      "title": "Case Preparation and Filing Requirements",
      "entry_id": "DOJ-Circular2023-001-Sec3-123456"
    },
    {
      "url": "https://www.doj.gov.ph/issuances/circulars/circular-2023-001",
      "note": "Establishes plea bargaining guidelines for drug cases.",
      "type": "internal",
      "title": "Plea Bargaining Guidelines",
      "entry_id": "DOJ-Circular2023-001-Sec8-789012"
    }
  ],
  "created_by_name": "Delos Cientos",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "DOJ-Circular2023-001-Sec5-663202"
}
```

### **Example 2: DOJ Administrative Order - Witness Protection Program**

```json
{
  "entry_id": "DOJ-AO2023-002-Sec7-774113",
  "type": "doj_issuance",
  "title": "Witness Protection Program Procedures",
  "canonical_citation": "DOJ Administrative Order No. 2023-002, Sec. 7",
  "summary": "Establishes comprehensive procedures for the Witness Protection Program, including application requirements, security measures, and support services. Ensures effective protection of witnesses in criminal cases.",
  "text": "Section 7. Security Measures and Support Services. The Witness Protection Program shall provide the following security measures and support services: (a) 24/7 security detail for high-risk witnesses; (b) Safe house accommodation with necessary amenities; (c) Medical and psychological support services; (d) Legal assistance and representation; (e) Financial support for basic needs; (f) Relocation assistance when necessary; (g) Regular risk assessment and security updates; (h) Coordination with law enforcement agencies.",
  "tags": [
    "witness",
    "protection",
    "program",
    "security",
    "support",
    "services"
  ],
  "jurisdiction": "PH",
  "law_family": "DOJ Administrative Order No. 2023-002",
  "created_by": 2,
  "created_at": "2025-01-10T16:49:01.692Z",
  "updated_at": "2025-01-10T16:49:01.696Z",
  "section_id": "Sec. 7",
  "status": "active",
  "effective_date": "2023-05-01T00:00:00.000Z",
  "amendment_date": null,
  "last_reviewed": "2025-01-10T00:00:00.000Z",
  "visibility": {
    "cpa": true,
    "gli": true
  },
  "source_urls": [
    "https://www.doj.gov.ph/issuances/administrative-orders/ao-2023-002",
    "https://www.doj.gov.ph/issuances/2023"
  ],
  "issuance_no": "Administrative Order No. 2023-002",
  "applicability": [
    "All witnesses in criminal cases requiring protection",
    "Witness Protection Program personnel",
    "Law enforcement agencies coordinating with the program"
  ],
  "supersedes": [
    "DOJ Administrative Order No. 2020-003 (Previous witness protection procedures)"
  ],
  "legal_bases": [
    {
      "url": "https://lawphil.net/statutes/repacts/ra1991/ra_6981_1991.html",
      "note": "Provides legal framework for witness protection and security measures.",
      "type": "external",
      "title": "Witness Protection, Security and Benefit Act",
      "citation": "Republic Act No. 6981 (1991)"
    },
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Establishes constitutional right to due process and protection of witnesses.",
      "type": "external",
      "title": "1987 Constitution, Article III, Section 14",
      "citation": "1987 Constitution, Article III, Section 14"
    }
  ],
  "related_sections": [
    {
      "url": "https://www.doj.gov.ph/issuances/administrative-orders/ao-2023-002",
      "note": "Defines application requirements and eligibility criteria for witness protection.",
      "type": "internal",
      "title": "Application Requirements and Eligibility",
      "entry_id": "DOJ-AO2023-002-Sec3-456789"
    },
    {
      "url": "https://www.doj.gov.ph/issuances/administrative-orders/ao-2023-002",
      "note": "Establishes procedures for witness testimony and court appearances.",
      "type": "internal",
      "title": "Witness Testimony Procedures",
      "entry_id": "DOJ-AO2023-002-Sec10-321654"
    }
  ],
  "created_by_name": "Delos Cientos",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "DOJ-AO2023-002-Sec7-774113"
}
```

### **Example 3: DOJ Circular - Cybercrime Investigation Guidelines**

```json
{
  "entry_id": "DOJ-Circular2023-003-Sec4-889001",
  "type": "doj_issuance",
  "title": "Cybercrime Investigation and Prosecution Guidelines",
  "canonical_citation": "DOJ Circular No. 2023-003, Sec. 4",
  "summary": "Establishes comprehensive guidelines for investigating and prosecuting cybercrime cases, including digital evidence handling, international cooperation, and specialized training requirements. Addresses the unique challenges of cybercrime prosecution.",
  "text": "Section 4. Digital Evidence Handling and Preservation. All cybercrime investigations must follow strict digital evidence handling protocols: (a) Immediate isolation and preservation of digital devices; (b) Creation of forensic images using approved tools; (c) Documentation of all digital evidence with timestamps; (d) Secure storage and chain of custody maintenance; (e) Regular integrity checks and hash verification; (f) Expert witness preparation for technical testimony; (g) Coordination with international law enforcement when necessary; (h) Compliance with data privacy regulations.",
  "tags": [
    "cybercrime",
    "investigation",
    "digital",
    "evidence",
    "forensics",
    "prosecution"
  ],
  "jurisdiction": "PH",
  "law_family": "DOJ Circular No. 2023-003",
  "created_by": 2,
  "created_at": "2025-01-10T16:49:01.692Z",
  "updated_at": "2025-01-10T16:49:01.696Z",
  "section_id": "Sec. 4",
  "status": "active",
  "effective_date": "2023-06-01T00:00:00.000Z",
  "amendment_date": null,
  "last_reviewed": "2025-01-10T00:00:00.000Z",
  "visibility": {
    "cpa": true,
    "gli": true
  },
  "source_urls": [
    "https://www.doj.gov.ph/issuances/circulars/circular-2023-003",
    "https://www.doj.gov.ph/issuances/2023"
  ],
  "issuance_no": "Circular No. 2023-003",
  "applicability": [
    "All prosecutors handling cybercrime cases",
    "Cybercrime investigation units",
    "Digital forensics specialists"
  ],
  "supersedes": [
    "DOJ Circular No. 2021-008 (Previous cybercrime guidelines)"
  ],
  "legal_bases": [
    {
      "url": "https://lawphil.net/statutes/repacts/ra2012/ra_10175_2012.html",
      "note": "Provides legal framework for cybercrime prevention, investigation, and prosecution.",
      "type": "external",
      "title": "Cybercrime Prevention Act",
      "citation": "Republic Act No. 10175 (2012)"
    },
    {
      "url": "https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html",
      "note": "Establishes data privacy and protection requirements for digital evidence handling.",
      "type": "external",
      "title": "Data Privacy Act",
      "citation": "Republic Act No. 10173 (2012)"
    }
  ],
  "related_sections": [
    {
      "url": "https://www.doj.gov.ph/issuances/circulars/circular-2023-003",
      "note": "Defines international cooperation procedures for cross-border cybercrime cases.",
      "type": "internal",
      "title": "International Cooperation Procedures",
      "entry_id": "DOJ-Circular2023-003-Sec6-147258"
    },
    {
      "url": "https://www.doj.gov.ph/issuances/circulars/circular-2023-003",
      "note": "Establishes training requirements for cybercrime prosecutors and investigators.",
      "type": "internal",
      "title": "Training and Capacity Building",
      "entry_id": "DOJ-Circular2023-003-Sec9-369852"
    }
  ],
  "created_by_name": "Delos Cientos",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "DOJ-Circular2023-003-Sec4-889001"
}
```

---

## ⚠️ Critical Validation Requirements

### **Entry ID Generation**
- **Format:** `DOJ-{IssuanceType}{Year}-{Number}-{SectionID}-{6-digit-timestamp}`
- **Examples:** `DOJ-Circular2023-001-Sec5-663202`
- **Auto-generated:** The system generates this automatically based on law_family, section_id and timestamp
- **Validation:** Must match pattern `/^DOJ-[A-Za-z]+\d+-\d+-[A-Za-z0-9]+-\d{6}$/`

#### **How Auto-Generation Works:**
The system automatically generates entry IDs using this process:

1. **Prefix:** Always starts with `DOJ-` for DOJ issuances
2. **Issuance Type:** Extracted from the `law_family` field:
   - `"DOJ Circular No. 2023-001"` → `"Circular2023"`
   - `"DOJ Administrative Order No. 2023-002"` → `"AO2023"`
3. **Number:** Extracted from the `issuance_no` field:
   - `"Circular No. 2023-001"` → `"001"`
   - `"Administrative Order No. 2023-002"` → `"002"`
4. **Section ID:** Extracted from the `section_id` field:
   - `"Sec. 5"` → `"Sec5"`
5. **Timestamp:** Last 6 digits of current timestamp (milliseconds since epoch)
   - Example: `1705123456789` → `"234567"`
6. **Final Format:** `DOJ-{IssuanceType}{Year}-{Number}-{SectionID}-{6-digit-timestamp}`

#### **Generation Examples:**
```javascript
// Input law_family: "DOJ Circular No. 2023-001"
// Input issuance_no: "Circular No. 2023-001"
// Input section_id: "Sec. 5"
// Generated entry_id: "DOJ-Circular2023-001-Sec5-663202"

// Input law_family: "DOJ Administrative Order No. 2023-002"
// Input issuance_no: "Administrative Order No. 2023-002"
// Input section_id: "Sec. 7"
// Generated entry_id: "DOJ-AO2023-002-Sec7-789012"
```

#### **Important Notes:**
- **Don't manually set entry_id** - Let the system generate it automatically
- **Unique per entry** - The timestamp ensures uniqueness even for same section
- **Validation required** - Must match the regex pattern for system acceptance
- **Case sensitive** - Section ID extraction preserves original casing

### **Required Fields (Validation Will Fail Without These)**
```javascript
// These fields are REQUIRED and will cause validation errors if missing:
entry_id: string          // Auto-generated, must follow DOJ-{IssuanceType}{Year}-{Number}-{SectionID}-{timestamp} format
type: "doj_issuance"      // Must be exactly this string
title: string            // Must be at least 3 characters
jurisdiction: string     // Must be "PH" or valid jurisdiction name
law_family: string       // Must be at least 1 character (e.g., "DOJ Circular No. 2023-001")
canonical_citation: string // Must be at least 1 character
status: string           // Must be one of: "active", "amended", "repealed", "draft", "approved", "published"
effective_date: string   // Must be ISO date format (e.g., "2023-04-01T00:00:00.000Z")
summary: string          // Must be at least 1 character
text: string            // Must be at least 1 character
source_urls: string[]   // Must have at least 1 valid URL
tags: string[]          // Must have at least 1 tag
last_reviewed: string    // Must be ISO date format (e.g., "2025-01-10T00:00:00.000Z")
issuance_no: string     // Must be at least 1 character (doj_issuance specific)
created_by: number      // Team member ID (e.g., 2 for Delos Cientos)
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
  - `created_by`: Uses the logged-in user's ID (e.g., 2 for Delos Cientos)
  - `created_by_name`: Uses the logged-in user's name (e.g., "Delos Cientos")
- **Verification Status:** All imported entries are automatically marked as unverified
  - `verified`: Set to `false`
  - `verified_at`: Set to `null`
  - `verified_by`: Set to `null`
- **Progress Tracking:** Imported entries count towards daily quotas and progress
  - Each imported entry increments the user's daily progress for that entry type
  - Progress is tracked by entry type (e.g., `doj_issuance`)
  - Imported entries contribute to quota completion just like manually created entries
- **No manual input required:** These fields are automatically populated during import

### **Jurisdiction Validation**
- Must be "PH" for national DOJ issuances
- If other jurisdiction, must be title-cased (e.g., "Quezon City", "Cavite")
- Must match pattern: `/^[A-Za-zÀ-ÿ]+(?:[-' ]+[A-Za-zÀ-ÿ]+)*(?: City| Province)?$/`

---

## 🏷️ Common Topics for DOJ Issuances

### **Prosecution and Legal Practice:**
- `prosecution` - Prosecution procedures and guidelines
- `evidence` - Evidence handling and presentation
- `case` - Case preparation and management
- `trial` - Trial procedures and strategies
- `appeal` - Appeal procedures and requirements

### **Criminal Law and Procedure:**
- `criminal` - Criminal law procedures
- `investigation` - Investigation procedures
- `arrest` - Arrest and detention procedures
- `bail` - Bail procedures and requirements
- `sentencing` - Sentencing guidelines

### **Specialized Areas:**
- `drug` - Dangerous drugs cases
- `cybercrime` - Cybercrime investigation and prosecution
- `corruption` - Anti-corruption cases
- `human_trafficking` - Human trafficking cases
- `terrorism` - Terrorism-related cases

### **Witness and Victim Protection:**
- `witness` - Witness protection and support
- `victim` - Victim rights and support
- `protection` - Protection programs and services
- `security` - Security measures and protocols
- `relocation` - Relocation assistance

### **International Cooperation:**
- `extradition` - Extradition procedures
- `mutual_assistance` - Mutual legal assistance
- `international` - International cooperation
- `treaty` - Treaty implementation
- `cooperation` - Cross-border cooperation

---

## 📅 Important Dates

### **Common DOJ Issuance Effective Dates:**
- **Circulars:** Usually effective 30-60 days after issuance
- **Administrative Orders:** Often effective immediately or within 15 days
- **Opinions:** Typically effective upon issuance
- **Guidelines:** Usually effective 30-90 days after issuance

### **Historical Context:**
- DOJ issuances are issued by the Secretary of Justice or authorized officials
- Effective dates are usually specified in the issuance text
- Amendments may have different effective dates than original issuances

---

## 🔗 Essential Source URLs

### **Primary Sources:**
- `https://www.doj.gov.ph/` - Department of Justice - Official Website
- `https://www.doj.gov.ph/issuances/` - DOJ Issuances Database
- `https://www.doj.gov.ph/issuances/circulars/` - DOJ Circulars
- `https://www.doj.gov.ph/issuances/administrative-orders/` - DOJ Administrative Orders

### **Additional Resources:**
- `https://www.officialgazette.gov.ph/` - Official Gazette of the Philippines
- `https://lawphil.net/` - LawPhil.net - Philippine Legal Resources
- `https://www.supremecourt.gov.ph/` - Supreme Court of the Philippines

---

## 📝 Writing Guidelines

### **Title Format:**
- Use clear, descriptive titles
- Focus on the specific procedure or guideline
- Examples:
  - ✅ "Prosecution Guidelines for Dangerous Drugs Cases"
  - ✅ "Witness Protection Program Procedures"
  - ✅ "Cybercrime Investigation and Prosecution Guidelines"
  - ❌ "Sec. 5"
  - ❌ "DOJ Circular"

### **Summary Guidelines:**
- 1-3 sentences maximum
- Neutral, objective tone
- Focus on the core procedure or guideline
- Examples:
  - ✅ "Establishes comprehensive guidelines for prosecutors handling dangerous drugs cases, including evidence handling, chain of custody requirements, and case preparation procedures."
  - ✅ "Establishes comprehensive procedures for the Witness Protection Program, including application requirements, security measures, and support services."

### **Text Guidelines:**
- Use the exact DOJ issuance text
- Maintain original formatting and punctuation
- Include the complete section
- Do not paraphrase or summarize

### **Tags Guidelines:**
- Use 3-8 relevant tags
- Include both specific and general terms
- Examples: `["prosecution", "drug", "cases", "guidelines", "evidence"]`

### **Citation Guidelines:**
- All citations must be external references
- Provide at least 2 citations for both related_sections and legal_bases
- Each citation must include:
  - **citation**: Full citation text
  - **url**: Complete URL (no shortcuts)
  - **title**: Document title
  - **note**: Short description (1-2 sentences)
- Use full text for all URLs - no abbreviated links
- Examples:
  - ✅ `"https://www.doj.gov.ph/issuances/circulars/circular-2023-001"`
  - ❌ `"doj.gov.ph"` or `"DOJ Website"`

---

## 🎯 Team Assignment

### **Primary Assignee:** Delos Cientos (P2)
- **Daily Quota:** 2 doj_issuance entries per day
- **Focus Areas:** Rules of Court + DOJ (procedure-heavy)
- **Backup:** Tagarao (P5) for additional DOJ issuances

---

## 🚀 Quick Start Checklist

### **Before Creating:**
- [ ] Identify the specific DOJ issuance and section
- [ ] Gather the exact issuance text
- [ ] Find official source URLs
- [ ] Identify applicability and legal bases
- [ ] Determine related issuance sections

### **During Creation:**
- [ ] Use clear, descriptive title
- [ ] Copy exact issuance text
- [ ] Write neutral 1-3 sentence summary
- [ ] Add 3-8 relevant tags
- [ ] Include official source URLs
- [ ] Add issuance number and section number
- [ ] Include applicability information
- [ ] Add related sections
- [ ] Add legal bases

### **Before Publishing:**
- [ ] Verify all required fields are complete
- [ ] Check spelling and grammar
- [ ] Ensure source URLs are valid
- [ ] Confirm issuance text is accurate
- [ ] Review tags for relevance
- [ ] Validate entry_id format

---

## 💡 Best Practices

### **Content Quality:**
- Always use the exact DOJ issuance text
- Include comprehensive applicability information
- Add related issuance sections
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
2. **Invalid dates** - Use ISO format (e.g., "2023-04-01T00:00:00.000Z")
3. **Invalid URLs** - Ensure URLs start with http:// or https://
4. **Empty arrays** - Required arrays (source_urls, tags) cannot be empty
5. **Incorrect entry_id** - Follow the DOJ-{IssuanceType}{Year}-{Number}-{SectionID}-{6-digit-timestamp} format
6. **Missing issuance_no** - DOJ issuances must have an issuance number
7. **Related sections format** - Use type: "internal" with entry_id for issuance sections
8. **Legal bases format** - Use type: "external" with citation, url, title, note for external documents
9. **Auto-populated fields** - Do not include these fields; system populates automatically on import:
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
- Check date formats (ISO format: "2023-04-01T00:00:00.000Z")
- Verify related_sections use type: "internal" with entry_id for issuance sections
- Verify legal_bases use type: "external" with citation, url, title, note for external documents
- Do not include auto-populated fields - they're set automatically on import

---

## 🤖 GPT Usage Instructions

### **For AI/GPT Generation:**
When generating DOJ issuance entries with GPT or similar AI tools, use this exact template:

```json
{
  "entry_id": "DOJ-{IssuanceType}{Year}-{Number}-{SectionID}-{6-digit-timestamp}",
  "type": "doj_issuance",
  "title": "Descriptive Title of the DOJ Issuance Section",
  "canonical_citation": "DOJ Issuance No. XXXX, Sec. Y",
  "summary": "1-3 sentence neutral summary of the DOJ issuance section",
  "text": "Exact DOJ issuance text without modification",
  "tags": ["relevant", "tags", "for", "search"],
  "jurisdiction": "PH",
  "law_family": "DOJ Issuance No. XXXX",
  "created_by": 2,
  "section_id": "Sec. Y",
  "status": "active",
  "effective_date": "YYYY-MM-DDTHH:mm:ss.sssZ",
  "amendment_date": null,
  "last_reviewed": "2025-01-10T00:00:00.000Z",
  "visibility": {
    "cpa": true,
    "gli": true
  },
  "source_urls": [
    "https://www.doj.gov.ph/issuances/issuance-XXXX"
  ],
  "issuance_no": "Issuance No. XXXX",
  "applicability": ["Who or what the issuance applies to"],
  "supersedes": ["Previous issuances that are superseded"],
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
      "entry_id": "DOJ-IssuanceXXXX-SecY-123456",
      "title": "Related DOJ Issuance Section Title",
      "url": "https://www.doj.gov.ph/issuances/issuance-XXXX",
      "note": "Brief description of relationship"
    }
  ],
  "created_by_name": "Delos Cientos",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "DOJ-{IssuanceType}{Year}-{Number}-{SectionID}-{6-digit-timestamp}"
}
```

### **Critical GPT Instructions:**
1. **Always include ALL required fields** - Missing any will cause validation failure
2. **Use exact DOJ issuance text** - Do not paraphrase or summarize
3. **Issuance number is REQUIRED** - Must have a valid issuance number
4. **Related sections use type: "internal"** - For issuance sections, use internal references with entry_id
5. **Legal bases use type: "external"** - For external legal documents, use external references
6. **Entry ID format** - DOJ-{IssuanceType}{Year}-{Number}-{SectionID}-{6-digit-timestamp} (auto-generated by system)
7. **Dates must be ISO format** - Use "2023-04-01T00:00:00.000Z" format for dates
8. **URLs must be complete** - Start with http:// or https://
9. **Status must be valid enum** - "active", "amended", "repealed", "draft", "approved", "published"
10. **Auto-populated fields** - Do not include these fields; system populates automatically on import:
    - `embedding` - Vector embedding for semantic search
    - `created_by` - Logged-in user's ID
    - `created_by_name` - Logged-in user's name
    - `verified` - Set to false for all imports
    - `verified_at` - Set to null for all imports
    - `verified_by` - Set to null for all imports
    - **Progress tracking** - Imported entries automatically count towards daily quotas and progress

---

## 📞 Support

For questions or issues with DOJ issuance entries:
- Contact Delos Cientos (P2) for content questions
- Refer to the main ENTRY_CREATION_GUIDE.md for general guidance
- Check the browser console for validation errors
- Contact the development team for technical issues

---

*This guide is specifically designed for DOJ Issuance entries and is maintained by the Civilify development team.*





