# 🏢 Civilify Law Entry App - Agency Circular Entry Guide

## 🎯 Overview

This guide is specifically designed for creating **Agency Circular** entries in the Civilify Law Entry App. Agency circulars are administrative orders, memoranda, and guidelines issued by government agencies like LTO, PNP, DOH, and other regulatory bodies to implement laws and establish operational procedures.

## 🏗️ Agency Circular Entry Structure

### **📝 Base Fields (Required for All Entries)**

```javascript
entry_id: string          // Auto-generated stable ID (e.g., "CIRC-LTO-MC2023-001-Sec3-663202")
type: "agency_circular"   // Always "agency_circular"
title: string            // Human-readable label (e.g., "Driver's License Renewal Procedures")
jurisdiction: string     // Usually "PH" for national agency circulars
law_family: string       // "LTO Memorandum Circular No. 2023-001" or "PNP Administrative Order No. 2023-002"
section_id?: string      // Section/Article (e.g., "Sec. 3", "Art. 2")
canonical_citation: string // Formal cite (e.g., "LTO MC 2023-001, Sec. 3")
status: string           // "active" | "amended" | "repealed" | "draft" | "approved" | "published"
effective_date: string   // ISO date (e.g., "2023-03-15T00:00:00.000Z")
amendment_date?: string  // ISO date (only if status = "amended")
summary: string          // 1-3 sentence neutral synopsis
text: string            // Clean, normalized circular text
source_urls: string[]   // Official sources (at least 1 required)
tags: string[]          // Retrieval hints (e.g., ["license", "renewal", "procedures", "LTO"])
last_reviewed: string    // ISO date (auto-set to current date for new entries)
created_by: number       // Team member ID (e.g., 3 for Paden)
created_at: string       // ISO timestamp (auto-generated)
updated_at: string       // ISO timestamp (auto-generated)
embedding: string        // Vector embedding (auto-generated for imported entries)
```

### **🔒 Access Control**
```javascript
visibility: {
  gli: boolean,         // General Legal Information (usually true)
  cpa: boolean         // CPA mode (usually true for agency circulars)
}
```

### **🏢 Agency Circular-Specific Fields**
```javascript
circular_no: string            // Required: circular number (e.g., "MC 2023-001", "AO 2023-002")
section_no?: string           // Optional: section number if applicable
applicability: string[]       // Optional: who/what the circular applies to
legal_bases: object[]         // Optional: legal bases with full details (Step 4)
related_sections: object[]    // Optional: related circular sections with full details (Step 4)
```

### **📋 Citation Format for References (related_sections & legal_bases)**
```javascript
// External references (legal_bases)
{
  "type": "external",         // For external legal documents
  "citation": "string",       // Full citation text (e.g., "Republic Act No. 4136 (1964)")
  "url": "string",           // Complete URL
  "title": "string",         // Document title (e.g., "Land Transportation and Traffic Code")
  "note": "string"           // Short description
}

// Internal references (related_sections)
{
  "type": "internal",         // For related circular sections
  "entry_id": "string",       // Entry ID of related section
  "title": "string",         // Title of related section
  "url": "string",           // URL to circular text
  "note": "string"           // Description of relationship
}
```

---

## 📚 Agency Circular Examples

### **Example 1: LTO Memorandum Circular - Driver's License Renewal**

```json
{
  "entry_id": "CIRC-LTO-MC2023-001-Sec3-663202",
  "type": "agency_circular",
  "title": "Driver's License Renewal Procedures",
  "canonical_citation": "LTO MC 2023-001, Sec. 3",
  "summary": "Establishes streamlined procedures for driver's license renewal, including online application options and required documents. Aims to reduce processing time and improve service delivery.",
  "text": "Section 3. Renewal Procedures. All driver's license renewals shall follow these procedures: (a) Complete the application form either online or in person; (b) Submit required documents including valid ID, medical certificate, and current license; (c) Pay applicable fees; (d) Undergo biometric capture and photo taking; (e) Receive temporary license valid for 30 days while permanent license is being processed.",
  "tags": [
    "license",
    "renewal",
    "procedures",
    "LTO",
    "driver",
    "application"
  ],
  "jurisdiction": "PH",
  "law_family": "LTO Memorandum Circular No. 2023-001",
  "created_by": 3,
  "created_at": "2025-01-10T16:49:01.692Z",
  "updated_at": "2025-01-10T16:49:01.696Z",
  "section_id": "Sec. 3",
  "status": "active",
  "effective_date": "2023-03-15T00:00:00.000Z",
  "amendment_date": null,
  "last_reviewed": "2025-01-10T00:00:00.000Z",
  "visibility": {
    "cpa": true,
    "gli": true
  },
  "source_urls": [
    "https://lto.gov.ph/memorandum-circulars/mc-2023-001",
    "https://lto.gov.ph/issuances/2023"
  ],
  "circular_no": "MC 2023-001",
  "section_no": "Sec. 3",
  "applicability": [
    "All licensed drivers seeking license renewal",
    "LTO licensing centers nationwide",
    "Authorized LTO-accredited medical clinics"
  ],
  "legal_bases": [
    {
      "url": "https://lawphil.net/statutes/repacts/ra1964/ra_4136_1964.html",
      "note": "Provides framework for driver licensing and regulation.",
      "type": "external",
      "title": "Land Transportation and Traffic Code",
      "citation": "Republic Act No. 4136 (1964)"
    },
    {
      "url": "https://lawphil.net/statutes/repacts/ra2000/ra_8792_2000.html",
      "note": "Authorizes electronic transactions and digital signatures for government services.",
      "type": "external",
      "title": "Electronic Commerce Act",
      "citation": "Republic Act No. 8792 (2000)"
    }
  ],
  "related_sections": [
    {
      "url": "https://lto.gov.ph/memorandum-circulars/mc-2023-001",
      "note": "Defines required documents and supporting papers for license renewal.",
      "type": "internal",
      "title": "Required Documents for License Renewal",
      "entry_id": "CIRC-LTO-MC2023-001-Sec2-123456"
    },
    {
      "url": "https://lto.gov.ph/memorandum-circulars/mc-2023-001",
      "note": "Establishes fees and payment procedures for license renewal.",
      "type": "internal",
      "title": "License Renewal Fees and Payment",
      "entry_id": "CIRC-LTO-MC2023-001-Sec4-789012"
    }
  ],
  "created_by_name": "Paden",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "CIRC-LTO-MC2023-001-Sec3-663202"
}
```

### **Example 2: PNP Administrative Order - Arrest Procedures**

```json
{
  "entry_id": "CIRC-PNP-AO2023-002-Sec5-774113",
  "type": "agency_circular",
  "title": "Standard Operating Procedures for Arrest Operations",
  "canonical_citation": "PNP AO 2023-002, Sec. 5",
  "summary": "Establishes standardized procedures for conducting arrest operations, including pre-arrest planning, execution protocols, and post-arrest documentation. Ensures compliance with legal requirements and human rights standards.",
  "text": "Section 5. Arrest Execution Procedures. All arrest operations shall follow these procedures: (a) Verify arrest warrant and suspect identity; (b) Announce presence and purpose clearly; (c) Use minimum necessary force; (d) Read Miranda rights immediately upon arrest; (e) Conduct body search and inventory of personal effects; (f) Transport to nearest police station without unnecessary delay; (g) Document arrest in official report within 24 hours.",
  "tags": [
    "arrest",
    "procedures",
    "PNP",
    "operations",
    "standard",
    "protocol"
  ],
  "jurisdiction": "PH",
  "law_family": "PNP Administrative Order No. 2023-002",
  "created_by": 3,
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
    "https://pnp.gov.ph/administrative-orders/ao-2023-002",
    "https://pnp.gov.ph/issuances/2023"
  ],
  "circular_no": "AO 2023-002",
  "section_no": "Sec. 5",
  "applicability": [
    "All PNP personnel conducting arrest operations",
    "Police stations and units nationwide",
    "Arrest operations with or without warrant"
  ],
  "legal_bases": [
    {
      "url": "https://lawphil.net/courts/rules/rc1997/rc_1997.html",
      "note": "Provides legal framework for arrest procedures and requirements.",
      "type": "external",
      "title": "Rules of Court, Rule 113",
      "citation": "Rule 113, Rules of Court"
    },
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Establishes constitutional rights of persons under arrest and investigation.",
      "type": "external",
      "title": "1987 Constitution, Article III, Section 12",
      "citation": "1987 Constitution, Article III, Section 12"
    }
  ],
  "related_sections": [
    {
      "url": "https://pnp.gov.ph/administrative-orders/ao-2023-002",
      "note": "Defines pre-arrest planning and intelligence gathering requirements.",
      "type": "internal",
      "title": "Pre-Arrest Planning Procedures",
      "entry_id": "CIRC-PNP-AO2023-002-Sec3-456789"
    },
    {
      "url": "https://pnp.gov.ph/administrative-orders/ao-2023-002",
      "note": "Establishes post-arrest documentation and reporting requirements.",
      "type": "internal",
      "title": "Post-Arrest Documentation",
      "entry_id": "CIRC-PNP-AO2023-002-Sec7-321654"
    }
  ],
  "created_by_name": "Paden",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "CIRC-PNP-AO2023-002-Sec5-774113"
}
```

### **Example 3: DOH Department Order - Health Facility Licensing**

```json
{
  "entry_id": "CIRC-DOH-DO2023-003-Sec8-889001",
  "type": "agency_circular",
  "title": "Health Facility Licensing Requirements",
  "canonical_citation": "DOH DO 2023-003, Sec. 8",
  "summary": "Establishes comprehensive requirements for health facility licensing, including infrastructure standards, staffing requirements, and quality assurance protocols. Ensures compliance with national health standards.",
  "text": "Section 8. Infrastructure and Equipment Requirements. All health facilities seeking licensure must meet the following infrastructure standards: (a) Adequate floor area based on facility type and capacity; (b) Proper ventilation and lighting systems; (c) Emergency exits and fire safety equipment; (d) Medical equipment meeting minimum standards; (e) Waste management and disposal systems; (f) Accessibility features for persons with disabilities; (g) Regular maintenance and calibration of equipment.",
  "tags": [
    "health",
    "facility",
    "licensing",
    "requirements",
    "infrastructure",
    "DOH"
  ],
  "jurisdiction": "PH",
  "law_family": "DOH Department Order No. 2023-003",
  "created_by": 3,
  "created_at": "2025-01-10T16:49:01.692Z",
  "updated_at": "2025-01-10T16:49:01.696Z",
  "section_id": "Sec. 8",
  "status": "active",
  "effective_date": "2023-05-01T00:00:00.000Z",
  "amendment_date": null,
  "last_reviewed": "2025-01-10T00:00:00.000Z",
  "visibility": {
    "cpa": true,
    "gli": true
  },
  "source_urls": [
    "https://doh.gov.ph/department-orders/do-2023-003",
    "https://doh.gov.ph/issuances/2023"
  ],
  "circular_no": "DO 2023-003",
  "section_no": "Sec. 8",
  "applicability": [
    "All health facilities seeking initial licensure",
    "Existing health facilities applying for license renewal",
    "Health facilities undergoing expansion or modification"
  ],
  "legal_bases": [
    {
      "url": "https://lawphil.net/statutes/repacts/ra2009/ra_9711_2009.html",
      "note": "Provides framework for health facility regulation and licensing.",
      "type": "external",
      "title": "Food and Drug Administration Act",
      "citation": "Republic Act No. 9711 (2009)"
    },
    {
      "url": "https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html",
      "note": "Grants local government units authority to regulate health facilities within their jurisdiction.",
      "type": "external",
      "title": "Local Government Code",
      "citation": "Republic Act No. 7160 (1991)"
    }
  ],
  "related_sections": [
    {
      "url": "https://doh.gov.ph/department-orders/do-2023-003",
      "note": "Defines staffing requirements and qualifications for health facility personnel.",
      "type": "internal",
      "title": "Staffing Requirements for Health Facilities",
      "entry_id": "CIRC-DOH-DO2023-003-Sec6-147258"
    },
    {
      "url": "https://doh.gov.ph/department-orders/do-2023-003",
      "note": "Establishes quality assurance and monitoring protocols for licensed facilities.",
      "type": "internal",
      "title": "Quality Assurance and Monitoring",
      "entry_id": "CIRC-DOH-DO2023-003-Sec12-369852"
    }
  ],
  "created_by_name": "Paden",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "CIRC-DOH-DO2023-003-Sec8-889001"
}
```

---

## ⚠️ Critical Validation Requirements

### **Entry ID Generation**
- **Format:** `CIRC-{Agency}-{CircularNumber}-{SectionID}-{6-digit-timestamp}`
- **Examples:** `CIRC-LTO-MC2023-001-Sec3-663202`
- **Auto-generated:** The system generates this automatically based on law_family, section_id and timestamp
- **Validation:** Must match pattern `/^CIRC-[A-Z]+-[A-Z0-9]+-[A-Za-z0-9]+-\d{6}$/`

#### **How Auto-Generation Works:**
The system automatically generates entry IDs using this process:

1. **Prefix:** Always starts with `CIRC-` for agency circulars
2. **Agency:** Extracted from the `law_family` field:
   - `"LTO Memorandum Circular No. 2023-001"` → `"LTO"`
   - `"PNP Administrative Order No. 2023-002"` → `"PNP"`
3. **Circular Number:** Extracted from the `circular_no` field:
   - `"MC 2023-001"` → `"MC2023-001"`
   - `"AO 2023-002"` → `"AO2023-002"`
4. **Section ID:** Extracted from the `section_id` field:
   - `"Sec. 3"` → `"Sec3"`
5. **Timestamp:** Last 6 digits of current timestamp (milliseconds since epoch)
   - Example: `1705123456789` → `"234567"`
6. **Final Format:** `CIRC-{Agency}-{CircularNumber}-{SectionID}-{6-digit-timestamp}`

#### **Generation Examples:**
```javascript
// Input law_family: "LTO Memorandum Circular No. 2023-001"
// Input circular_no: "MC 2023-001"
// Input section_id: "Sec. 3"
// Generated entry_id: "CIRC-LTO-MC2023-001-Sec3-663202"

// Input law_family: "PNP Administrative Order No. 2023-002"
// Input circular_no: "AO 2023-002"
// Input section_id: "Sec. 5"
// Generated entry_id: "CIRC-PNP-AO2023-002-Sec5-789012"
```

#### **Important Notes:**
- **Don't manually set entry_id** - Let the system generate it automatically
- **Unique per entry** - The timestamp ensures uniqueness even for same section
- **Validation required** - Must match the regex pattern for system acceptance
- **Case sensitive** - Section ID extraction preserves original casing

### **Required Fields (Validation Will Fail Without These)**
```javascript
// These fields are REQUIRED and will cause validation errors if missing:
entry_id: string          // Auto-generated, must follow CIRC-{Agency}-{CircularNumber}-{SectionID}-{timestamp} format
type: "agency_circular"   // Must be exactly this string
title: string            // Must be at least 3 characters
jurisdiction: string     // Must be "PH" or valid jurisdiction name
law_family: string       // Must be at least 1 character (e.g., "LTO Memorandum Circular No. 2023-001")
canonical_citation: string // Must be at least 1 character
status: string           // Must be one of: "active", "amended", "repealed", "draft", "approved", "published"
effective_date: string   // Must be ISO date format (e.g., "2023-03-15T00:00:00.000Z")
summary: string          // Must be at least 1 character
text: string            // Must be at least 1 character
source_urls: string[]   // Must have at least 1 valid URL
tags: string[]          // Must have at least 1 tag
last_reviewed: string    // Must be ISO date format (e.g., "2025-01-10T00:00:00.000Z")
circular_no: string     // Must be at least 1 character (agency_circular specific)
created_by: number      // Team member ID (e.g., 3 for Paden)
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
  - `created_by`: Uses the logged-in user's ID (e.g., 3 for Paden)
  - `created_by_name`: Uses the logged-in user's name (e.g., "Paden")
- **Verification Status:** All imported entries are automatically marked as unverified
  - `verified`: Set to `false`
  - `verified_at`: Set to `null`
  - `verified_by`: Set to `null`
- **Progress Tracking:** Imported entries count towards daily quotas and progress
  - Each imported entry increments the user's daily progress for that entry type
  - Progress is tracked by entry type (e.g., `agency_circular`)
  - Imported entries contribute to quota completion just like manually created entries
- **No manual input required:** These fields are automatically populated during import

### **Jurisdiction Validation**
- Must be "PH" for national agency circulars
- If other jurisdiction, must be title-cased (e.g., "Quezon City", "Cavite")
- Must match pattern: `/^[A-Za-zÀ-ÿ]+(?:[-' ]+[A-Za-zÀ-ÿ]+)*(?: City| Province)?$/`

---

## 🏷️ Common Topics for Agency Circulars

### **Transportation and Licensing:**
- `license` - Driver's license procedures
- `vehicle` - Vehicle registration and operation
- `renewal` - License and registration renewal
- `application` - Application procedures
- `fees` - Fee structures and payment

### **Law Enforcement:**
- `arrest` - Arrest procedures and protocols
- `investigation` - Investigation procedures
- `evidence` - Evidence handling and preservation
- `reporting` - Report writing and documentation
- `training` - Training requirements and procedures

### **Health and Safety:**
- `health` - Health facility requirements
- `safety` - Safety standards and protocols
- `licensing` - Health facility licensing
- `inspection` - Inspection procedures
- `quality` - Quality assurance standards

### **Administrative:**
- `procedures` - Administrative procedures
- `documentation` - Documentation requirements
- `compliance` - Compliance requirements
- `monitoring` - Monitoring and evaluation
- `enforcement` - Enforcement procedures

### **Technology and Digital:**
- `digital` - Digital services and procedures
- `online` - Online application systems
- `biometric` - Biometric data collection
- `electronic` - Electronic transactions
- `automation` - Process automation

---

## 📅 Important Dates

### **Common Circular Effective Dates:**
- **LTO Circulars:** Usually effective 30-60 days after issuance
- **PNP Orders:** Often effective immediately or within 15 days
- **DOH Orders:** Typically effective 30-90 days after issuance
- **Other Agencies:** Varies by agency and complexity of changes

### **Historical Context:**
- Agency circulars are issued by department heads or agency administrators
- Effective dates are usually specified in the circular text
- Amendments may have different effective dates than original circulars

---

## 🔗 Essential Source URLs

### **Primary Sources:**
- `https://lto.gov.ph/` - Land Transportation Office - Memorandum Circulars and Issuances
- `https://pnp.gov.ph/` - Philippine National Police - Administrative Orders and Circulars
- `https://doh.gov.ph/` - Department of Health - Department Orders and Circulars
- `https://www.officialgazette.gov.ph/` - Official Gazette of the Philippines - Government Issuances

### **Additional Resources:**
- `https://lawphil.net/` - LawPhil.net - Philippine Legal Resources
- Individual agency websites for specific circulars and orders

---

## 📝 Writing Guidelines

### **Title Format:**
- Use clear, descriptive titles
- Focus on the specific procedure or requirement
- Examples:
  - ✅ "Driver's License Renewal Procedures"
  - ✅ "Standard Operating Procedures for Arrest Operations"
  - ✅ "Health Facility Licensing Requirements"
  - ❌ "Sec. 3"
  - ❌ "Memorandum Circular"

### **Summary Guidelines:**
- 1-3 sentences maximum
- Neutral, objective tone
- Focus on the core procedure or requirement
- Examples:
  - ✅ "Establishes streamlined procedures for driver's license renewal, including online application options and required documents."
  - ✅ "Establishes standardized procedures for conducting arrest operations, including pre-arrest planning, execution protocols, and post-arrest documentation."

### **Text Guidelines:**
- Use the exact circular text
- Maintain original formatting and punctuation
- Include the complete section
- Do not paraphrase or summarize

### **Tags Guidelines:**
- Use 3-8 relevant tags
- Include both specific and general terms
- Examples: `["license", "renewal", "procedures", "LTO", "driver"]`

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
  - ✅ `"https://lto.gov.ph/memorandum-circulars/mc-2023-001"`
  - ❌ `"lto.gov.ph"` or `"LTO Website"`

---

## 🎯 Team Assignment

### **Primary Assignee:** Paden (P3)
- **Daily Quota:** 2 agency_circular entries per day
- **Focus Areas:** PNP SOPs + Incident Checklists + Agency Circulars
- **Backup:** Sendrijas (P4) for additional agency circulars

---

## 🚀 Quick Start Checklist

### **Before Creating:**
- [ ] Identify the specific agency circular and section
- [ ] Gather the exact circular text
- [ ] Find official source URLs
- [ ] Identify applicability and legal bases
- [ ] Determine related circular sections

### **During Creation:**
- [ ] Use clear, descriptive title
- [ ] Copy exact circular text
- [ ] Write neutral 1-3 sentence summary
- [ ] Add 3-8 relevant tags
- [ ] Include official source URLs
- [ ] Add circular number and section number
- [ ] Include applicability information
- [ ] Add related sections
- [ ] Add legal bases

### **Before Publishing:**
- [ ] Verify all required fields are complete
- [ ] Check spelling and grammar
- [ ] Ensure source URLs are valid
- [ ] Confirm circular text is accurate
- [ ] Review tags for relevance
- [ ] Validate entry_id format

---

## 💡 Best Practices

### **Content Quality:**
- Always use the exact circular text
- Include comprehensive applicability information
- Add related circular sections
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
2. **Invalid dates** - Use ISO format (e.g., "2023-03-15T00:00:00.000Z")
3. **Invalid URLs** - Ensure URLs start with http:// or https://
4. **Empty arrays** - Required arrays (source_urls, tags) cannot be empty
5. **Incorrect entry_id** - Follow the CIRC-{Agency}-{CircularNumber}-{SectionID}-{6-digit-timestamp} format
6. **Missing circular_no** - Agency circulars must have a circular number
7. **Related sections format** - Use type: "internal" with entry_id for circular sections
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
- Check date formats (ISO format: "2023-03-15T00:00:00.000Z")
- Verify related_sections use type: "internal" with entry_id for circular sections
- Verify legal_bases use type: "external" with citation, url, title, note for external documents
- Do not include auto-populated fields - they're set automatically on import

---

## 🤖 GPT Usage Instructions

### **For AI/GPT Generation:**
When generating agency circular entries with GPT or similar AI tools, use this exact template:

```json
{
  "entry_id": "CIRC-{Agency}-{CircularNumber}-{SectionID}-{6-digit-timestamp}",
  "type": "agency_circular",
  "title": "Descriptive Title of the Circular Section",
  "canonical_citation": "Agency Circular No. XXXX, Sec. Y",
  "summary": "1-3 sentence neutral summary of the circular section",
  "text": "Exact circular text without modification",
  "tags": ["relevant", "tags", "for", "search"],
  "jurisdiction": "PH",
  "law_family": "Agency Circular No. XXXX",
  "created_by": 3,
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
    "https://agency.gov.ph/circulars/circular-XXXX"
  ],
  "circular_no": "Circular No. XXXX",
  "section_no": "Sec. Y",
  "applicability": ["Who or what the circular applies to"],
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
      "entry_id": "CIRC-Agency-CircularXXXX-SecY-123456",
      "title": "Related Circular Section Title",
      "url": "https://agency.gov.ph/circulars/circular-XXXX",
      "note": "Brief description of relationship"
    }
  ],
  "created_by_name": "Paden",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "CIRC-{Agency}-{CircularNumber}-{SectionID}-{6-digit-timestamp}"
}
```

### **Critical GPT Instructions:**
1. **Always include ALL required fields** - Missing any will cause validation failure
2. **Use exact circular text** - Do not paraphrase or summarize
3. **Circular number is REQUIRED** - Must have a valid circular number
4. **Related sections use type: "internal"** - For circular sections, use internal references with entry_id
5. **Legal bases use type: "external"** - For external legal documents, use external references
6. **Entry ID format** - CIRC-{Agency}-{CircularNumber}-{SectionID}-{6-digit-timestamp} (auto-generated by system)
7. **Dates must be ISO format** - Use "2023-03-15T00:00:00.000Z" format for dates
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

For questions or issues with agency circular entries:
- Contact Paden (P3) for content questions
- Refer to the main ENTRY_CREATION_GUIDE.md for general guidance
- Check the browser console for validation errors
- Contact the development team for technical issues

---

*This guide is specifically designed for Agency Circular entries and is maintained by the Civilify development team.*
