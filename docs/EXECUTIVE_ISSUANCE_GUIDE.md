# 🏛️ Civilify Law Entry App - Executive Issuance Entry Guide

## 🎯 Overview

This guide is specifically designed for creating **Executive Issuance** entries in the Civilify Law Entry App. Executive issuances are official documents issued by the President of the Philippines, including Executive Orders, Administrative Orders, Proclamations, and other presidential directives that have the force of law or establish government policies and procedures.

## 🏗️ Executive Issuance Entry Structure

### **📝 Base Fields (Required for All Entries)**

```javascript
entry_id: string          // Auto-generated stable ID (e.g., "EXEC-EO2023-001-Sec5-663202")
type: "executive_issuance" // Always "executive_issuance"
title: string            // Human-readable label (e.g., "National Security Policy Guidelines")
jurisdiction: string     // Usually "PH" for national executive issuances
law_family: string       // "Executive Order No. 2023-001" or "Administrative Order No. 2023-002"
section_id?: string      // Section/Article (e.g., "Sec. 5", "Art. 3")
canonical_citation: string // Formal cite (e.g., "Executive Order No. 2023-001, Sec. 5")
status: string           // "active" | "amended" | "repealed" | "draft" | "approved" | "published"
effective_date: string   // ISO date (e.g., "2023-03-15T00:00:00.000Z")
amendment_date?: string  // ISO date (only if status = "amended")
summary: string          // 1-3 sentence neutral synopsis
text: string            // Clean, normalized executive issuance text
source_urls: string[]   // Official sources (at least 1 required)
tags: string[]          // Retrieval hints (e.g., ["security", "policy", "guidelines", "executive"])
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
  cpa: boolean         // CPA mode (usually true for executive issuances)
}
```

### **🏛️ Executive Issuance-Specific Fields**
```javascript
instrument_no: string        // Required: instrument number (e.g., "EO No. 2023-001", "AO No. 2023-002")
applicability: string[]      // Optional: who/what the issuance applies to
supersedes: string[]         // Optional: previous issuances that are superseded
legal_bases: object[]        // Optional: legal bases with full details (Step 4)
related_sections: object[]   // Optional: related issuance sections with full details (Step 4)
```

### **📋 Citation Format for References (related_sections & legal_bases)**
```javascript
// External references (legal_bases)
{
  "type": "external",         // For external legal documents
  "citation": "string",       // Full citation text (e.g., "1987 Constitution, Article VII")
  "url": "string",           // Complete URL
  "title": "string",         // Document title (e.g., "1987 Constitution")
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

## 📚 Executive Issuance Examples

### **Example 1: Executive Order - National Security Policy**

```json
{
  "entry_id": "EXEC-EO2023-001-Sec5-663202",
  "type": "executive_issuance",
  "title": "National Security Policy Implementation Guidelines",
  "canonical_citation": "Executive Order No. 2023-001, Sec. 5",
  "summary": "Establishes comprehensive guidelines for implementing national security policies, including coordination mechanisms, resource allocation, and inter-agency cooperation. Strengthens national security framework and response capabilities.",
  "text": "Section 5. Inter-Agency Coordination and Resource Allocation. All government agencies shall coordinate their security-related activities through the following mechanisms: (a) Regular inter-agency security meetings chaired by the National Security Adviser; (b) Joint planning and resource sharing for security operations; (c) Unified intelligence gathering and analysis protocols; (d) Coordinated response procedures for security threats; (e) Regular assessment and evaluation of security measures; (f) Capacity building and training programs for security personnel; (g) Public awareness and education campaigns on national security.",
  "tags": [
    "security",
    "policy",
    "guidelines",
    "executive",
    "coordination",
    "national"
  ],
  "jurisdiction": "PH",
  "law_family": "Executive Order No. 2023-001",
  "created_by": 5,
  "created_at": "2025-01-10T16:49:01.692Z",
  "updated_at": "2025-01-10T16:49:01.696Z",
  "section_id": "Sec. 5",
  "status": "active",
  "effective_date": "2023-03-15T00:00:00.000Z",
  "amendment_date": null,
  "last_reviewed": "2025-01-10T00:00:00.000Z",
  "visibility": {
    "cpa": true,
    "gli": true
  },
  "source_urls": [
    "https://www.officialgazette.gov.ph/executive-orders/executive-order-no-2023-001/",
    "https://www.officialgazette.gov.ph/issuances/2023"
  ],
  "instrument_no": "Executive Order No. 2023-001",
  "applicability": [
    "All government agencies and instrumentalities",
    "National Security Council and related bodies",
    "Local government units for security coordination"
  ],
  "supersedes": [
    "Executive Order No. 2019-005 (Previous national security guidelines)"
  ],
  "legal_bases": [
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Grants the President authority to implement national policies and coordinate government agencies.",
      "type": "external",
      "title": "1987 Constitution, Article VII",
      "citation": "1987 Constitution, Article VII, Section 17"
    },
    {
      "url": "https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html",
      "note": "Provides framework for coordination between national and local government units.",
      "type": "external",
      "title": "Local Government Code",
      "citation": "Republic Act No. 7160 (1991)"
    }
  ],
  "related_sections": [
    {
      "url": "https://www.officialgazette.gov.ph/executive-orders/executive-order-no-2023-001/",
      "note": "Defines the national security framework and policy objectives.",
      "type": "internal",
      "title": "National Security Framework",
      "entry_id": "EXEC-EO2023-001-Sec2-123456"
    },
    {
      "url": "https://www.officialgazette.gov.ph/executive-orders/executive-order-no-2023-001/",
      "note": "Establishes monitoring and evaluation mechanisms for security policies.",
      "type": "internal",
      "title": "Monitoring and Evaluation Framework",
      "entry_id": "EXEC-EO2023-001-Sec8-789012"
    }
  ],
  "created_by_name": "Tagarao",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "EXEC-EO2023-001-Sec5-663202"
}
```

### **Example 2: Administrative Order - Disaster Risk Reduction**

```json
{
  "entry_id": "EXEC-AO2023-002-Sec7-774113",
  "type": "executive_issuance",
  "title": "Disaster Risk Reduction and Management Procedures",
  "canonical_citation": "Administrative Order No. 2023-002, Sec. 7",
  "summary": "Establishes comprehensive procedures for disaster risk reduction and management, including early warning systems, evacuation protocols, and post-disaster recovery measures. Strengthens national disaster preparedness and response capabilities.",
  "text": "Section 7. Early Warning Systems and Evacuation Procedures. All disaster risk reduction and management councils shall implement the following early warning and evacuation procedures: (a) Establish multi-hazard early warning systems with real-time monitoring; (b) Develop community-based evacuation plans with designated safe zones; (c) Conduct regular evacuation drills and public awareness campaigns; (d) Coordinate with local government units for evacuation logistics; (e) Provide emergency communication systems and backup power; (f) Establish evacuation centers with adequate facilities and supplies; (g) Implement post-evacuation monitoring and support services; (h) Coordinate with international organizations for technical assistance.",
  "tags": [
    "disaster",
    "risk",
    "reduction",
    "management",
    "evacuation",
    "warning"
  ],
  "jurisdiction": "PH",
  "law_family": "Administrative Order No. 2023-002",
  "created_by": 5,
  "created_at": "2025-01-10T16:49:01.692Z",
  "updated_at": "2025-01-10T16:49:01.696Z",
  "section_id": "Sec. 7",
  "status": "active",
  "effective_date": "2023-04-01T00:00:00.000Z",
  "amendment_date": null,
  "last_reviewed": "2025-01-10T00:00:00.000Z",
  "visibility": {
    "cpa": true,
    "gli": true
  },
  "source_urls": [
    "https://www.officialgazette.gov.ph/administrative-orders/administrative-order-no-2023-002/",
    "https://www.officialgazette.gov.ph/issuances/2023"
  ],
  "instrument_no": "Administrative Order No. 2023-002",
  "applicability": [
    "All disaster risk reduction and management councils",
    "National and local government units",
    "Emergency response agencies and organizations"
  ],
  "supersedes": [
    "Administrative Order No. 2020-003 (Previous disaster management procedures)"
  ],
  "legal_bases": [
    {
      "url": "https://lawphil.net/statutes/repacts/ra2010/ra_10121_2010.html",
      "note": "Provides legal framework for disaster risk reduction and management.",
      "type": "external",
      "title": "Philippine Disaster Risk Reduction and Management Act",
      "citation": "Republic Act No. 10121 (2010)"
    },
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Grants the President authority to implement disaster management policies.",
      "type": "external",
      "title": "1987 Constitution, Article VII",
      "citation": "1987 Constitution, Article VII, Section 17"
    }
  ],
  "related_sections": [
    {
      "url": "https://www.officialgazette.gov.ph/administrative-orders/administrative-order-no-2023-002/",
      "note": "Defines the disaster risk reduction framework and policy objectives.",
      "type": "internal",
      "title": "Disaster Risk Reduction Framework",
      "entry_id": "EXEC-AO2023-002-Sec3-456789"
    },
    {
      "url": "https://www.officialgazette.gov.ph/administrative-orders/administrative-order-no-2023-002/",
      "note": "Establishes post-disaster recovery and rehabilitation procedures.",
      "type": "internal",
      "title": "Post-Disaster Recovery Procedures",
      "entry_id": "EXEC-AO2023-002-Sec10-321654"
    }
  ],
  "created_by_name": "Tagarao",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "EXEC-AO2023-002-Sec7-774113"
}
```

### **Example 3: Proclamation - National Health Emergency**

```json
{
  "entry_id": "EXEC-Proc2023-003-Sec4-889001",
  "type": "executive_issuance",
  "title": "National Health Emergency Response Measures",
  "canonical_citation": "Proclamation No. 2023-003, Sec. 4",
  "summary": "Declares a state of national health emergency and establishes comprehensive response measures, including health protocols, travel restrictions, and economic support programs. Mobilizes government resources for public health protection.",
  "text": "Section 4. Health Protocols and Travel Restrictions. During the state of national health emergency, the following health protocols and travel restrictions shall be implemented: (a) Mandatory health screening and testing at all ports of entry; (b) Quarantine and isolation procedures for affected individuals; (c) Travel restrictions and border control measures; (d) Public health education and awareness campaigns; (e) Contact tracing and monitoring systems; (f) Health facility capacity enhancement and resource allocation; (g) Coordination with international health organizations; (h) Regular assessment and adjustment of health measures based on scientific evidence.",
  "tags": [
    "health",
    "emergency",
    "response",
    "protocols",
    "travel",
    "restrictions"
  ],
  "jurisdiction": "PH",
  "law_family": "Proclamation No. 2023-003",
  "created_by": 5,
  "created_at": "2025-01-10T16:49:01.692Z",
  "updated_at": "2025-01-10T16:49:01.696Z",
  "section_id": "Sec. 4",
  "status": "active",
  "effective_date": "2023-05-01T00:00:00.000Z",
  "amendment_date": null,
  "last_reviewed": "2025-01-10T00:00:00.000Z",
  "visibility": {
    "cpa": true,
    "gli": true
  },
  "source_urls": [
    "https://www.officialgazette.gov.ph/proclamations/proclamation-no-2023-003/",
    "https://www.officialgazette.gov.ph/issuances/2023"
  ],
  "instrument_no": "Proclamation No. 2023-003",
  "applicability": [
    "All government agencies and instrumentalities",
    "Local government units nationwide",
    "Private sector entities and organizations"
  ],
  "supersedes": [
    "Proclamation No. 2022-001 (Previous health emergency measures)"
  ],
  "legal_bases": [
    {
      "url": "https://lawphil.net/statutes/repacts/ra2009/ra_9711_2009.html",
      "note": "Provides legal framework for public health emergency response and management.",
      "type": "external",
      "title": "Food and Drug Administration Act",
      "citation": "Republic Act No. 9711 (2009)"
    },
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Grants the President authority to declare national emergencies and implement emergency measures.",
      "type": "external",
      "title": "1987 Constitution, Article VII",
      "citation": "1987 Constitution, Article VII, Section 18"
    }
  ],
  "related_sections": [
    {
      "url": "https://www.officialgazette.gov.ph/proclamations/proclamation-no-2023-003/",
      "note": "Declares the state of national health emergency and defines its scope.",
      "type": "internal",
      "title": "Declaration of National Health Emergency",
      "entry_id": "EXEC-Proc2023-003-Sec1-147258"
    },
    {
      "url": "https://www.officialgazette.gov.ph/proclamations/proclamation-no-2023-003/",
      "note": "Establishes economic support and recovery measures during the health emergency.",
      "type": "internal",
      "title": "Economic Support and Recovery Measures",
      "entry_id": "EXEC-Proc2023-003-Sec8-369852"
    }
  ],
  "created_by_name": "Tagarao",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "EXEC-Proc2023-003-Sec4-889001"
}
```

---

## ⚠️ Critical Validation Requirements

### **Entry ID Generation**
- **Format:** `EXEC-{InstrumentType}{Year}-{Number}-{SectionID}-{6-digit-timestamp}`
- **Examples:** `EXEC-EO2023-001-Sec5-663202`
- **Auto-generated:** The system generates this automatically based on law_family, section_id and timestamp
- **Validation:** Must match pattern `/^EXEC-[A-Z]+\d+-\d+-[A-Za-z0-9]+-\d{6}$/`

#### **How Auto-Generation Works:**
The system automatically generates entry IDs using this process:

1. **Prefix:** Always starts with `EXEC-` for executive issuances
2. **Instrument Type:** Extracted from the `law_family` field:
   - `"Executive Order No. 2023-001"` → `"EO2023"`
   - `"Administrative Order No. 2023-002"` → `"AO2023"`
   - `"Proclamation No. 2023-003"` → `"Proc2023"`
3. **Number:** Extracted from the `instrument_no` field:
   - `"Executive Order No. 2023-001"` → `"001"`
   - `"Administrative Order No. 2023-002"` → `"002"`
4. **Section ID:** Extracted from the `section_id` field:
   - `"Sec. 5"` → `"Sec5"`
5. **Timestamp:** Last 6 digits of current timestamp (milliseconds since epoch)
   - Example: `1705123456789` → `"234567"`
6. **Final Format:** `EXEC-{InstrumentType}{Year}-{Number}-{SectionID}-{6-digit-timestamp}`

#### **Generation Examples:**
```javascript
// Input law_family: "Executive Order No. 2023-001"
// Input instrument_no: "Executive Order No. 2023-001"
// Input section_id: "Sec. 5"
// Generated entry_id: "EXEC-EO2023-001-Sec5-663202"

// Input law_family: "Administrative Order No. 2023-002"
// Input instrument_no: "Administrative Order No. 2023-002"
// Input section_id: "Sec. 7"
// Generated entry_id: "EXEC-AO2023-002-Sec7-789012"
```

#### **Important Notes:**
- **Don't manually set entry_id** - Let the system generate it automatically
- **Unique per entry** - The timestamp ensures uniqueness even for same section
- **Validation required** - Must match the regex pattern for system acceptance
- **Case sensitive** - Section ID extraction preserves original casing

### **Required Fields (Validation Will Fail Without These)**
```javascript
// These fields are REQUIRED and will cause validation errors if missing:
entry_id: string          // Auto-generated, must follow EXEC-{InstrumentType}{Year}-{Number}-{SectionID}-{timestamp} format
type: "executive_issuance" // Must be exactly this string
title: string            // Must be at least 3 characters
jurisdiction: string     // Must be "PH" or valid jurisdiction name
law_family: string       // Must be at least 1 character (e.g., "Executive Order No. 2023-001")
canonical_citation: string // Must be at least 1 character
status: string           // Must be one of: "active", "amended", "repealed", "draft", "approved", "published"
effective_date: string   // Must be ISO date format (e.g., "2023-03-15T00:00:00.000Z")
summary: string          // Must be at least 1 character
text: string            // Must be at least 1 character
source_urls: string[]   // Must have at least 1 valid URL
tags: string[]          // Must have at least 1 tag
last_reviewed: string    // Must be ISO date format (e.g., "2025-01-10T00:00:00.000Z")
instrument_no: string   // Must be at least 1 character (executive_issuance specific)
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
  - Progress is tracked by entry type (e.g., `executive_issuance`)
  - Imported entries contribute to quota completion just like manually created entries
- **No manual input required:** These fields are automatically populated during import

### **Jurisdiction Validation**
- Must be "PH" for national executive issuances
- If other jurisdiction, must be title-cased (e.g., "Quezon City", "Cavite")
- Must match pattern: `/^[A-Za-zÀ-ÿ]+(?:[-' ]+[A-Za-zÀ-ÿ]+)*(?: City| Province)?$/`

---

## 🏷️ Common Topics for Executive Issuances

### **National Security and Defense:**
- `security` - National security policies and procedures
- `defense` - Defense and military coordination
- `intelligence` - Intelligence gathering and analysis
- `counterterrorism` - Counterterrorism measures
- `border` - Border security and control

### **Disaster and Emergency Management:**
- `disaster` - Disaster risk reduction and management
- `emergency` - Emergency response and preparedness
- `evacuation` - Evacuation procedures and protocols
- `warning` - Early warning systems
- `recovery` - Post-disaster recovery and rehabilitation

### **Health and Public Safety:**
- `health` - Public health policies and procedures
- `pandemic` - Pandemic response and management
- `quarantine` - Quarantine and isolation procedures
- `vaccination` - Vaccination programs and policies
- `safety` - Public safety measures

### **Economic and Social Policies:**
- `economic` - Economic policies and programs
- `social` - Social welfare and development
- `employment` - Employment and labor policies
- `education` - Education policies and programs
- `infrastructure` - Infrastructure development

### **Environmental and Climate:**
- `environment` - Environmental protection and conservation
- `climate` - Climate change adaptation and mitigation
- `sustainability` - Sustainable development policies
- `conservation` - Natural resource conservation
- `pollution` - Pollution control and prevention

---

## 📅 Important Dates

### **Common Executive Issuance Effective Dates:**
- **Executive Orders:** Usually effective immediately or within 30 days
- **Administrative Orders:** Often effective immediately or within 15 days
- **Proclamations:** Typically effective upon issuance
- **Other Issuances:** Varies by type and complexity

### **Historical Context:**
- Executive issuances are issued by the President of the Philippines
- Effective dates are usually specified in the issuance text
- Amendments may have different effective dates than original issuances

---

## 🔗 Essential Source URLs

### **Primary Sources:**
- `https://www.officialgazette.gov.ph/` - Official Gazette of the Philippines - Executive Issuances
- `https://www.officialgazette.gov.ph/executive-orders/` - Executive Orders
- `https://www.officialgazette.gov.ph/administrative-orders/` - Administrative Orders
- `https://www.officialgazette.gov.ph/proclamations/` - Proclamations

### **Additional Resources:**
- `https://lawphil.net/` - LawPhil.net - Philippine Legal Resources
- `https://www.supremecourt.gov.ph/` - Supreme Court of the Philippines
- Presidential Communications Office for recent issuances

---

## 📝 Writing Guidelines

### **Title Format:**
- Use clear, descriptive titles
- Focus on the specific policy or procedure
- Examples:
  - ✅ "National Security Policy Implementation Guidelines"
  - ✅ "Disaster Risk Reduction and Management Procedures"
  - ✅ "National Health Emergency Response Measures"
  - ❌ "Sec. 5"
  - ❌ "Executive Order"

### **Summary Guidelines:**
- 1-3 sentences maximum
- Neutral, objective tone
- Focus on the core policy or procedure
- Examples:
  - ✅ "Establishes comprehensive guidelines for implementing national security policies, including coordination mechanisms, resource allocation, and inter-agency cooperation."
  - ✅ "Establishes comprehensive procedures for disaster risk reduction and management, including early warning systems, evacuation protocols, and post-disaster recovery measures."

### **Text Guidelines:**
- Use the exact executive issuance text
- Maintain original formatting and punctuation
- Include the complete section
- Do not paraphrase or summarize

### **Tags Guidelines:**
- Use 3-8 relevant tags
- Include both specific and general terms
- Examples: `["security", "policy", "guidelines", "executive", "coordination"]`

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
  - ✅ `"https://www.officialgazette.gov.ph/executive-orders/executive-order-no-2023-001/"`
  - ❌ `"officialgazette.gov.ph"` or `"Official Gazette"`

---

## 🎯 Team Assignment

### **Primary Assignee:** Tagarao (P5)
- **Daily Quota:** 1 executive_issuance entry per day
- **Focus Areas:** Rights + Constitution + Policy
- **Backup:** Delos Cientos (P2) for additional executive issuances

---

## 🚀 Quick Start Checklist

### **Before Creating:**
- [ ] Identify the specific executive issuance and section
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
- [ ] Add instrument number and section number
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
- Always use the exact executive issuance text
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
2. **Invalid dates** - Use ISO format (e.g., "2023-03-15T00:00:00.000Z")
3. **Invalid URLs** - Ensure URLs start with http:// or https://
4. **Empty arrays** - Required arrays (source_urls, tags) cannot be empty
5. **Incorrect entry_id** - Follow the EXEC-{InstrumentType}{Year}-{Number}-{SectionID}-{6-digit-timestamp} format
6. **Missing instrument_no** - Executive issuances must have an instrument number
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
- Check date formats (ISO format: "2023-03-15T00:00:00.000Z")
- Verify related_sections use type: "internal" with entry_id for issuance sections
- Verify legal_bases use type: "external" with citation, url, title, note for external documents
- Do not include auto-populated fields - they're set automatically on import

---

## 🤖 GPT Usage Instructions

### **For AI/GPT Generation:**
When generating executive issuance entries with GPT or similar AI tools, use this exact template:

```json
{
  "entry_id": "EXEC-{InstrumentType}{Year}-{Number}-{SectionID}-{6-digit-timestamp}",
  "type": "executive_issuance",
  "title": "Descriptive Title of the Executive Issuance Section",
  "canonical_citation": "Executive Issuance No. XXXX, Sec. Y",
  "summary": "1-3 sentence neutral summary of the executive issuance section",
  "text": "Exact executive issuance text without modification",
  "tags": ["relevant", "tags", "for", "search"],
  "jurisdiction": "PH",
  "law_family": "Executive Issuance No. XXXX",
  "created_by": 5,
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
    "https://www.officialgazette.gov.ph/issuances/issuance-XXXX"
  ],
  "instrument_no": "Executive Issuance No. XXXX",
  "applicability": ["Who or what the issuance applies to"],
  "supersedes": ["Previous issuances that are superseded"],
  "legal_bases": [
    {
      "type": "external",
      "citation": "1987 Constitution, Article VII",
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "title": "1987 Constitution",
      "note": "Brief description of legal basis"
    }
  ],
  "related_sections": [
    {
      "type": "internal",
      "entry_id": "EXEC-IssuanceXXXX-SecY-123456",
      "title": "Related Executive Issuance Section Title",
      "url": "https://www.officialgazette.gov.ph/issuances/issuance-XXXX",
      "note": "Brief description of relationship"
    }
  ],
  "created_by_name": "Tagarao",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "EXEC-{InstrumentType}{Year}-{Number}-{SectionID}-{6-digit-timestamp}"
}
```

### **Critical GPT Instructions:**
1. **Always include ALL required fields** - Missing any will cause validation failure
2. **Use exact executive issuance text** - Do not paraphrase or summarize
3. **Instrument number is REQUIRED** - Must have a valid instrument number
4. **Related sections use type: "internal"** - For issuance sections, use internal references with entry_id
5. **Legal bases use type: "external"** - For external legal documents, use external references
6. **Entry ID format** - EXEC-{InstrumentType}{Year}-{Number}-{SectionID}-{6-digit-timestamp} (auto-generated by system)
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

For questions or issues with executive issuance entries:
- Contact Tagarao (P5) for content questions
- Refer to the main ENTRY_CREATION_GUIDE.md for general guidance
- Check the browser console for validation errors
- Contact the development team for technical issues

---

*This guide is specifically designed for Executive Issuance entries and is maintained by the Civilify development team.*
