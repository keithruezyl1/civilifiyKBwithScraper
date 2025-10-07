# 🛡️ Civilify Law Entry App - Rights Advisory Entry Guide

## 🎯 Overview

This guide is specifically designed for creating **Rights Advisory** entries in the Civilify Law Entry App. Rights advisories are practical, user-friendly guides that explain constitutional rights and legal protections in accessible language. They serve as "Bill of Rights cards" that help individuals understand their rights in specific situations like arrest, search, detention, or other legal encounters.

## 🏗️ Rights Advisory Entry Structure

### **📝 Base Fields (Required for All Entries)**

```javascript
entry_id: string          // Auto-generated stable ID (e.g., "RIGHTS-Arrest-001-663202")
type: "rights_advisory"   // Always "rights_advisory"
title: string            // Human-readable label (e.g., "Your Rights During Arrest")
jurisdiction: string     // Usually "PH" for national rights advisories
law_family: string       // "Bill of Rights" or "Constitutional Rights"
section_id?: string      // Section/Article (e.g., "Art. III, Sec. 12", "Art. III, Sec. 14")
canonical_citation: string // Formal cite (e.g., "1987 Constitution, Art. III, Sec. 12")
status: string           // "active" | "amended" | "repealed" | "draft" | "approved" | "published"
effective_date: string   // ISO date (e.g., "1987-02-02T00:00:00.000Z")
amendment_date?: string  // ISO date (only if status = "amended")
summary: string          // 1-3 sentence neutral synopsis
text: string            // Clean, user-friendly explanation of rights
source_urls: string[]   // Official sources (at least 1 required)
tags: string[]          // Retrieval hints (e.g., ["arrest", "rights", "counsel", "silence"])
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
  cpa: boolean         // CPA mode (usually true for rights advisories)
}
```

### **🛡️ Rights Advisory-Specific Fields**
```javascript
rights_scope: string           // Required: scope of rights (e.g., "arrest", "search", "detention", "counsel")
advice_points: string[]        // Required: practical advice points for the situation
legal_bases: object[]          // Required: legal bases with full details (Step 4)
related_sections: object[]     // Optional: related rights advisories with full details (Step 4)
```

### **📋 Citation Format for References (related_sections & legal_bases)**
```javascript
// External references (legal_bases)
{
  "type": "external",         // For external legal documents
  "citation": "string",       // Full citation text (e.g., "1987 Constitution, Art. III, Sec. 12")
  "url": "string",           // Complete URL
  "title": "string",         // Document title (e.g., "1987 Constitution")
  "note": "string"           // Short description
}

// Internal references (related_sections)
{
  "type": "internal",         // For related rights advisories
  "entry_id": "string",       // Entry ID of related advisory
  "title": "string",         // Title of related advisory
  "url": "string",           // URL to advisory text
  "note": "string"           // Description of relationship
}
```

---

## 📚 Rights Advisory Examples

### **Example 1: Arrest Rights Advisory**

```json
{
  "entry_id": "RIGHTS-Arrest-001-663202",
  "type": "rights_advisory",
  "title": "Your Rights During Arrest",
  "canonical_citation": "1987 Constitution, Art. III, Sec. 12",
  "summary": "Explains your constitutional rights when being arrested, including the right to remain silent, right to counsel, and protection against self-incrimination. Provides practical guidance on how to exercise these rights effectively.",
  "text": "When you are being arrested, you have important constitutional rights that protect you. You have the right to remain silent and not answer any questions that might incriminate you. You have the right to have a lawyer present during questioning, and if you cannot afford one, the government must provide you with a lawyer. You have the right to be informed of these rights before any questioning begins. You also have the right to know why you are being arrested and what charges are being brought against you. Remember: you do not have to answer questions without a lawyer present, and anything you say can be used against you in court.",
  "tags": [
    "arrest",
    "rights",
    "counsel",
    "silence",
    "constitutional",
    "protection"
  ],
  "jurisdiction": "PH",
  "law_family": "Bill of Rights",
  "created_by": 5,
  "created_at": "2025-01-10T16:49:01.692Z",
  "updated_at": "2025-01-10T16:49:01.696Z",
  "section_id": "Art. III, Sec. 12",
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
  "rights_scope": "arrest",
  "advice_points": [
    "Stay calm and do not resist arrest, even if you believe it is unlawful",
    "Immediately ask for a lawyer and do not answer questions without one present",
    "Clearly state that you are invoking your right to remain silent",
    "Ask to see the arrest warrant if one is claimed to exist",
    "Remember that you have the right to know the charges against you",
    "Do not sign any documents without consulting a lawyer first",
    "Request to contact family members or friends to inform them of your situation"
  ],
  "legal_bases": [
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Primary constitutional source for arrest rights and protections.",
      "type": "external",
      "title": "1987 Constitution, Article III, Section 12",
      "citation": "1987 Constitution, Art. III, Sec. 12"
    },
    {
      "url": "https://lawphil.net/courts/rules/rc1997/rc_1997.html",
      "note": "Provides procedural rules for arrest and detention procedures.",
      "type": "external",
      "title": "Rules of Court, Rule 113",
      "citation": "Rule 113, Rules of Court"
    }
  ],
  "related_sections": [
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Explains your rights during police questioning and investigation.",
      "type": "internal",
      "title": "Your Rights During Police Questioning",
      "entry_id": "RIGHTS-Custodial-002-123456"
    },
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Provides guidance on your right to bail and release procedures.",
      "type": "internal",
      "title": "Your Right to Bail",
      "entry_id": "RIGHTS-Bail-003-789012"
    }
  ],
  "created_by_name": "Tagarao",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "RIGHTS-Arrest-001-663202"
}
```

### **Example 2: Search and Seizure Rights Advisory**

```json
{
  "entry_id": "RIGHTS-Search-002-774113",
  "type": "rights_advisory",
  "title": "Your Rights During Search and Seizure",
  "canonical_citation": "1987 Constitution, Art. III, Sec. 2",
  "summary": "Explains your constitutional rights regarding search and seizure, including protection against unreasonable searches, warrant requirements, and what to do if your rights are violated. Provides practical steps to protect your privacy and property.",
  "text": "You have the right to be free from unreasonable searches and seizures. This means that police generally cannot search your person, home, car, or belongings without a valid search warrant or your consent. A search warrant must be issued by a judge and must specify what is being searched and what is being looked for. There are some exceptions, such as when you are arrested or when police have probable cause to believe evidence of a crime is in plain view. If police want to search your property, you have the right to ask to see the search warrant. You also have the right to refuse consent to a search, and you should clearly state that you do not consent.",
  "tags": [
    "search",
    "seizure",
    "warrant",
    "privacy",
    "constitutional",
    "protection"
  ],
  "jurisdiction": "PH",
  "law_family": "Bill of Rights",
  "created_by": 5,
  "created_at": "2025-01-10T16:49:01.692Z",
  "updated_at": "2025-01-10T16:49:01.696Z",
  "section_id": "Art. III, Sec. 2",
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
  "rights_scope": "search",
  "advice_points": [
    "Ask to see the search warrant before allowing any search of your property",
    "Clearly state that you do not consent to the search if no warrant is presented",
    "Do not interfere with the search, but observe and document what is happening",
    "Ask for a receipt or inventory of any items that are seized",
    "Take note of the names and badge numbers of the officers conducting the search",
    "Contact a lawyer immediately if you believe your rights have been violated",
    "Remember that you have the right to remain silent during the search"
  ],
  "legal_bases": [
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Primary constitutional source for search and seizure protections.",
      "type": "external",
      "title": "1987 Constitution, Article III, Section 2",
      "citation": "1987 Constitution, Art. III, Sec. 2"
    },
    {
      "url": "https://lawphil.net/courts/rules/rc1997/rc_1997.html",
      "note": "Provides procedural rules for search warrants and seizure procedures.",
      "type": "external",
      "title": "Rules of Court, Rule 126",
      "citation": "Rule 126, Rules of Court"
    }
  ],
  "related_sections": [
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Explains your rights when police want to search your vehicle during traffic stops.",
      "type": "internal",
      "title": "Your Rights During Traffic Stops",
      "entry_id": "RIGHTS-Traffic-004-456789"
    },
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Provides guidance on your right to privacy in digital communications.",
      "type": "internal",
      "title": "Your Right to Digital Privacy",
      "entry_id": "RIGHTS-Privacy-005-321654"
    }
  ],
  "created_by_name": "Tagarao",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "RIGHTS-Search-002-774113"
}
```

### **Example 3: Detention Rights Advisory**

```json
{
  "entry_id": "RIGHTS-Detention-003-889001",
  "type": "rights_advisory",
  "title": "Your Rights During Detention",
  "canonical_citation": "1987 Constitution, Art. III, Sec. 13",
  "summary": "Explains your constitutional rights while in detention, including the right to bail, protection against excessive bail, and habeas corpus protections. Provides practical guidance on how to secure your release and protect your rights while detained.",
  "text": "If you are detained or arrested, you have important rights that protect you from unlawful detention. You have the right to bail for most offenses, except for capital offenses when evidence of guilt is strong. The bail amount must be reasonable and not excessive. You have the right to be brought before a judge promptly to determine if your detention is lawful. You also have the right to file a petition for habeas corpus if you believe you are being unlawfully detained. While in detention, you have the right to adequate food, water, and medical care. You also have the right to communicate with family members and your lawyer. Remember that you cannot be held indefinitely without charges being filed against you.",
  "tags": [
    "detention",
    "bail",
    "habeas",
    "corpus",
    "constitutional",
    "release"
  ],
  "jurisdiction": "PH",
  "law_family": "Bill of Rights",
  "created_by": 5,
  "created_at": "2025-01-10T16:49:01.692Z",
  "updated_at": "2025-01-10T16:49:01.696Z",
  "section_id": "Art. III, Sec. 13",
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
  "rights_scope": "detention",
  "advice_points": [
    "Ask about your right to bail and the amount required for your release",
    "Request to be brought before a judge promptly to review your detention",
    "Contact a lawyer immediately to help secure your release",
    "Ask family members to help arrange bail if you cannot afford it",
    "File a petition for habeas corpus if you believe you are unlawfully detained",
    "Request adequate food, water, and medical care while in detention",
    "Keep a record of your detention conditions and any mistreatment",
    "Do not sign any documents without consulting a lawyer first"
  ],
  "legal_bases": [
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Primary constitutional source for bail and detention rights.",
      "type": "external",
      "title": "1987 Constitution, Article III, Section 13",
      "citation": "1987 Constitution, Art. III, Sec. 13"
    },
    {
      "url": "https://lawphil.net/courts/rules/rc1997/rc_1997.html",
      "note": "Provides procedural rules for bail applications and habeas corpus petitions.",
      "type": "external",
      "title": "Rules of Court, Rule 114",
      "citation": "Rule 114, Rules of Court"
    }
  ],
  "related_sections": [
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Explains your rights during arrest and initial detention procedures.",
      "type": "internal",
      "title": "Your Rights During Arrest",
      "entry_id": "RIGHTS-Arrest-001-147258"
    },
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Provides guidance on your right to a speedy trial and due process.",
      "type": "internal",
      "title": "Your Right to a Speedy Trial",
      "entry_id": "RIGHTS-Trial-006-369852"
    }
  ],
  "created_by_name": "Tagarao",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "RIGHTS-Detention-003-889001"
}
```

---

## ⚠️ Critical Validation Requirements

### **Entry ID Generation**
- **Format:** `RIGHTS-{RightsScope}-{Number}-{6-digit-timestamp}`
- **Examples:** `RIGHTS-Arrest-001-663202`
- **Auto-generated:** The system generates this automatically based on rights_scope and timestamp
- **Validation:** Must match pattern `/^RIGHTS-[A-Za-z]+-\d+-\d{6}$/`

#### **How Auto-Generation Works:**
The system automatically generates entry IDs using this process:

1. **Prefix:** Always starts with `RIGHTS-` for rights advisories
2. **Rights Scope:** Extracted from the `rights_scope` field:
   - `"arrest"` → `"Arrest"`
   - `"search"` → `"Search"`
   - `"detention"` → `"Detention"`
3. **Number:** Sequential number for the rights scope (001, 002, 003, etc.)
4. **Timestamp:** Last 6 digits of current timestamp (milliseconds since epoch)
   - Example: `1705123456789` → `"234567"`
5. **Final Format:** `RIGHTS-{RightsScope}-{Number}-{6-digit-timestamp}`

#### **Generation Examples:**
```javascript
// Input rights_scope: "arrest"
// Generated entry_id: "RIGHTS-Arrest-001-663202"

// Input rights_scope: "search"
// Generated entry_id: "RIGHTS-Search-002-774113"

// Input rights_scope: "detention"
// Generated entry_id: "RIGHTS-Detention-003-889001"
```

#### **Important Notes:**
- **Don't manually set entry_id** - Let the system generate it automatically
- **Unique per entry** - The timestamp ensures uniqueness even for same scope
- **Validation required** - Must match the regex pattern for system acceptance
- **Case sensitive** - Rights scope extraction preserves original casing

### **Required Fields (Validation Will Fail Without These)**
```javascript
// These fields are REQUIRED and will cause validation errors if missing:
entry_id: string          // Auto-generated, must follow RIGHTS-{RightsScope}-{Number}-{timestamp} format
type: "rights_advisory"   // Must be exactly this string
title: string            // Must be at least 3 characters
jurisdiction: string     // Must be "PH" or valid jurisdiction name
law_family: string       // Must be at least 1 character (e.g., "Bill of Rights")
canonical_citation: string // Must be at least 1 character
status: string           // Must be one of: "active", "amended", "repealed", "draft", "approved", "published"
effective_date: string   // Must be ISO date format (e.g., "1987-02-02T00:00:00.000Z")
summary: string          // Must be at least 1 character
text: string            // Must be at least 1 character
source_urls: string[]   // Must have at least 1 valid URL
tags: string[]          // Must have at least 1 tag
last_reviewed: string    // Must be ISO date format (e.g., "2025-01-10T00:00:00.000Z")
rights_scope: string    // Must be one of the predefined options (rights_advisory specific)
advice_points: string[] // Must have at least 1 advice point (rights_advisory specific)
legal_bases: object[]   // Must have at least 1 legal basis (rights_advisory specific)
created_by: number      // Team member ID (e.g., 5 for Tagarao)
created_at: string      // ISO timestamp (auto-generated)
updated_at: string      // ISO timestamp (auto-generated)
```

### **Cross-Field Validation Rules**
- If `status` is "amended", then `amendment_date` is required
- All URLs in `source_urls` must be valid URLs (start with http:// or https://)
- `rights_scope` must be one of the predefined options
- `advice_points` and `legal_bases` arrays must have at least one item each

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
  - Progress is tracked by entry type (e.g., `rights_advisory`)
  - Imported entries contribute to quota completion just like manually created entries
- **No manual input required:** These fields are automatically populated during import

### **Jurisdiction Validation**
- Must be "PH" for national rights advisories
- If other jurisdiction, must be title-cased (e.g., "Quezon City", "Cavite")
- Must match pattern: `/^[A-Za-zÀ-ÿ]+(?:[-' ]+[A-Za-zÀ-ÿ]+)*(?: City| Province)?$/`

---

## 🏷️ Common Rights Scopes for Rights Advisories

### **Criminal Justice Rights:**
- `arrest` - Rights during arrest procedures
- `search` - Rights during search and seizure
- `detention` - Rights while in detention
- `counsel` - Right to legal counsel
- `silence` - Right to remain silent
- `bail` - Right to bail and release
- `trial` - Right to fair trial

### **Privacy and Personal Rights:**
- `privacy` - Right to privacy and personal data protection
- `expression` - Freedom of expression and speech
- `assembly` - Right to peaceful assembly
- `association` - Right to form associations
- `religion` - Freedom of religion and belief
- `travel` - Right to travel and movement

### **Specialized Rights:**
- `GBV` - Gender-based violence protection rights
- `minors` - Rights of minors and children
- `traffic_stop` - Rights during traffic stops
- `protective_orders` - Rights regarding protective orders
- `legal_aid` - Right to legal aid and assistance
- `complaint_filing` - Right to file complaints
- `labor` - Labor and employment rights
- `consumer` - Consumer rights and protection
- `housing` - Housing and land rights
- `health_education` - Health and education rights

---

## 📅 Important Dates

### **Common Rights Advisory Effective Dates:**
- **Constitutional Rights:** Usually effective from the date of the 1987 Constitution (1987-02-02)
- **Statutory Rights:** Effective from the date the law was passed
- **Updated Advisories:** May have more recent effective dates for updated guidance

### **Historical Context:**
- Rights advisories are based on constitutional and statutory rights
- Effective dates typically correspond to the underlying legal source
- Updates may reflect new case law or legislative changes

---

## 🔗 Essential Source URLs

### **Primary Sources:**
- `https://www.officialgazette.gov.ph/constitutions/1987-constitution/` - Official Gazette - 1987 Constitution
- `https://lawphil.net/consti/cons1987.html` - LawPhil.net - 1987 Constitution Text
- `https://www.supremecourt.gov.ph/` - Supreme Court - Constitutional case law

### **Additional Resources:**
- `https://www.chanrobles.com/` - Chan Robles Virtual Law Library
- `https://www.lawphil.net/` - LawPhil.net - Philippine Legal Resources
- Commission on Human Rights website for rights education materials

---

## 📝 Writing Guidelines

### **Title Format:**
- Use clear, user-friendly titles
- Focus on the specific situation or right
- Examples:
  - ✅ "Your Rights During Arrest"
  - ✅ "Your Rights During Search and Seizure"
  - ✅ "Your Rights During Detention"
  - ❌ "Art. III, Sec. 12"
  - ❌ "Constitutional Rights"

### **Summary Guidelines:**
- 1-3 sentences maximum
- User-friendly, accessible language
- Focus on the practical value
- Examples:
  - ✅ "Explains your constitutional rights when being arrested, including the right to remain silent, right to counsel, and protection against self-incrimination."
  - ✅ "Explains your constitutional rights regarding search and seizure, including protection against unreasonable searches, warrant requirements, and what to do if your rights are violated."

### **Text Guidelines:**
- Use clear, accessible language
- Avoid legal jargon when possible
- Focus on practical guidance
- Include specific steps individuals can take
- Do not paraphrase constitutional text - explain it in user-friendly terms

### **Tags Guidelines:**
- Use 3-8 relevant tags
- Include both specific and general terms
- Examples: `["arrest", "rights", "counsel", "silence", "constitutional"]`

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
  - ✅ `"https://www.officialgazette.gov.ph/constitutions/1987-constitution/"`
  - ❌ `"officialgazette.gov.ph"` or `"Official Gazette"`

---

## 🎯 Team Assignment

### **Primary Assignee:** Tagarao (P5)
- **Daily Quota:** 4 rights_advisory entries per day
- **Focus Areas:** Rights + Constitution + Policy
- **Backup:** Delos Cientos (P2) for additional rights advisories

---

## 🚀 Quick Start Checklist

### **Before Creating:**
- [ ] Identify the specific rights scope and situation
- [ ] Gather the relevant constitutional and statutory sources
- [ ] Find official source URLs
- [ ] Identify practical advice points
- [ ] Determine related rights advisories

### **During Creation:**
- [ ] Use clear, user-friendly title
- [ ] Write accessible, practical text
- [ ] Write user-friendly 1-3 sentence summary
- [ ] Add 3-8 relevant tags
- [ ] Include official source URLs
- [ ] Add rights scope and advice points
- [ ] Include related sections
- [ ] Add legal bases

### **Before Publishing:**
- [ ] Verify all required fields are complete
- [ ] Check spelling and grammar
- [ ] Ensure source URLs are valid
- [ ] Confirm text is accessible and practical
- [ ] Review tags for relevance
- [ ] Validate entry_id format

---

## 💡 Best Practices

### **Content Quality:**
- Always use clear, accessible language
- Include practical, actionable advice
- Add related rights advisories
- Use official government sources
- Maintain user-friendly, helpful tone

### **Technical Quality:**
- Follow the exact JSON structure
- Use proper date formats (YYYY-MM-DD)
- Ensure all URLs are valid
- Use consistent naming conventions
- Include all required fields

### **User Experience:**
- Write clear, descriptive titles
- Provide practical, actionable summaries
- Use relevant, searchable tags
- Include multiple source URLs
- Add helpful related sections

---

## 🔧 Troubleshooting

### **Common Issues:**
1. **Missing required fields** - Ensure all base fields are included (see Critical Validation Requirements above)
2. **Invalid dates** - Use ISO format (e.g., "1987-02-02T00:00:00.000Z")
3. **Invalid URLs** - Ensure URLs start with http:// or https://
4. **Empty arrays** - Required arrays (source_urls, tags, advice_points, legal_bases) cannot be empty
5. **Incorrect entry_id** - Follow the RIGHTS-{RightsScope}-{Number}-{6-digit-timestamp} format
6. **Invalid rights_scope** - Must be one of the predefined options
7. **Missing advice_points** - Rights advisories must have practical advice points
8. **Missing legal_bases** - Rights advisories must have legal bases
9. **Related sections format** - Use type: "internal" with entry_id for rights advisories
10. **Legal bases format** - Use type: "external" with citation, url, title, note for external documents
11. **Auto-populated fields** - Do not include these fields; system populates automatically on import:
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
- Confirm rights_scope is one of the predefined options
- Verify advice_points and legal_bases arrays have at least one item each
- Verify related_sections use type: "internal" with entry_id for rights advisories
- Verify legal_bases use type: "external" with citation, url, title, note for external documents
- Do not include auto-populated fields - they're set automatically on import

---

## 🤖 GPT Usage Instructions

### **For AI/GPT Generation:**
When generating rights advisory entries with GPT or similar AI tools, use this exact template:

```json
{
  "entry_id": "RIGHTS-{RightsScope}-{Number}-{6-digit-timestamp}",
  "type": "rights_advisory",
  "title": "Your Rights During [Situation]",
  "canonical_citation": "1987 Constitution, Art. III, Sec. X",
  "summary": "1-3 sentence user-friendly summary of the rights advisory",
  "text": "Clear, accessible explanation of rights and practical guidance",
  "tags": ["relevant", "tags", "for", "search"],
  "jurisdiction": "PH",
  "law_family": "Bill of Rights",
  "created_by": 5,
  "section_id": "Art. III, Sec. X",
  "status": "active",
  "effective_date": "1987-02-02T00:00:00.000Z",
  "amendment_date": null,
  "last_reviewed": "2025-01-10T00:00:00.000Z",
  "visibility": {
    "cpa": true,
    "gli": true
  },
  "source_urls": [
    "https://www.officialgazette.gov.ph/constitutions/1987-constitution/"
  ],
  "rights_scope": "arrest",
  "advice_points": [
    "Practical advice point 1",
    "Practical advice point 2",
    "Practical advice point 3"
  ],
  "legal_bases": [
    {
      "type": "external",
      "citation": "1987 Constitution, Art. III, Sec. X",
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "title": "1987 Constitution",
      "note": "Brief description of legal basis"
    }
  ],
  "related_sections": [
    {
      "type": "internal",
      "entry_id": "RIGHTS-RelatedScope-Number-123456",
      "title": "Related Rights Advisory Title",
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Brief description of relationship"
    }
  ],
  "created_by_name": "Tagarao",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "RIGHTS-{RightsScope}-{Number}-{6-digit-timestamp}"
}
```

### **Critical GPT Instructions:**
1. **Always include ALL required fields** - Missing any will cause validation failure
2. **Use clear, accessible language** - Avoid legal jargon, focus on practical guidance
3. **Rights scope must be valid** - Must be one of the predefined options
4. **Advice points are REQUIRED** - Must have at least one practical advice point
5. **Legal bases are REQUIRED** - Must have at least one legal basis
6. **Related sections use type: "internal"** - For rights advisories, use internal references with entry_id
7. **Legal bases use type: "external"** - For external legal documents, use external references
8. **Entry ID format** - RIGHTS-{RightsScope}-{Number}-{6-digit-timestamp} (auto-generated by system)
9. **Dates must be ISO format** - Use "1987-02-02T00:00:00.000Z" format for dates
10. **URLs must be complete** - Start with http:// or https://
11. **Status must be valid enum** - "active", "amended", "repealed", "draft", "approved", "published"
12. **Auto-populated fields** - Do not include these fields; system populates automatically on import:
    - `embedding` - Vector embedding for semantic search
    - `created_by` - Logged-in user's ID
    - `created_by_name` - Logged-in user's name
    - `verified` - Set to false for all imports
    - `verified_at` - Set to null for all imports
    - `verified_by` - Set to null for all imports
    - **Progress tracking** - Imported entries automatically count towards daily quotas and progress

---

## 📞 Support

For questions or issues with rights advisory entries:
- Contact Tagarao (P5) for content questions
- Refer to the main ENTRY_CREATION_GUIDE.md for general guidance
- Check the browser console for validation errors
- Contact the development team for technical issues

---

*This guide is specifically designed for Rights Advisory entries and is maintained by the Civilify development team.*
