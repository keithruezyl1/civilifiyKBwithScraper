# 🏛️ Civilify Law Entry App - City Ordinance Section Entry Guide

## 🎯 Overview

This guide is specifically designed for creating **City Ordinance Section** entries in the Civilify Law Entry App. City ordinance sections are local laws enacted by city councils that regulate various aspects of city life, from traffic rules to business permits to public safety.

## 🏗️ City Ordinance Section Entry Structure

### **📝 Base Fields (Required for All Entries)**

```javascript
entry_id: string          // Auto-generated stable ID (e.g., "ORD-CebuCity-Ordinance1234-Sec5-663202")
type: "city_ordinance_section"  // Always "city_ordinance_section"
title: string            // Human-readable label (e.g., "Traffic Violation Penalties")
jurisdiction: string     // Usually "PH-CEBU-CITY" for Cebu City ordinances
law_family: string       // "Cebu City Ordinance No. XXXX" or "Cebu City Traffic Code"
section_id?: string      // Section/Article (e.g., "Sec. 5", "Art. 3")
canonical_citation: string // Formal cite (e.g., "Cebu City Ordinance No. 1234, Sec. 5")
status: string           // "active" | "amended" | "repealed" | "draft" | "approved" | "published"
effective_date: string   // ISO date (e.g., "2023-01-15T00:00:00.000Z")
amendment_date?: string  // ISO date (only if status = "amended")
summary: string          // 1-3 sentence neutral synopsis
text: string            // Clean, normalized ordinance text
source_urls: string[]   // Official sources (at least 1 required)
tags: string[]          // Retrieval hints (e.g., ["traffic", "penalty", "violation", "ordinance"])
last_reviewed: string    // ISO date (auto-set to current date for new entries)
created_by: number       // Team member ID (e.g., 1 for Arda)
created_at: string       // ISO timestamp (auto-generated)
updated_at: string       // ISO timestamp (auto-generated)
embedding: string        // Vector embedding (auto-generated for imported entries)
```

### **🔒 Access Control**
```javascript
visibility: {
  gli: boolean,         // General Legal Information (usually true)
  cpa: boolean         // CPA mode (usually true for ordinances)
}
```

### **🏛️ City Ordinance-Specific Fields**
```javascript
elements: string[]              // Required: elements/requirements of the ordinance
penalties: string[]             // Required: penalties or sanctions
related_sections: object[]      // Optional: related ordinance sections with full details (Step 4)
legal_bases: object[]           // Optional: legal bases with full details (Step 4)
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
  "type": "internal",         // For related ordinance sections
  "entry_id": "string",       // Entry ID of related section
  "title": "string",         // Title of related section
  "url": "string",           // URL to ordinance text
  "note": "string"           // Description of relationship
}
```

---

## 📚 City Ordinance Section Examples

### **Example 1: Traffic Ordinance - Parking Violations**

```json
{
  "entry_id": "ORD-CebuCity-Ordinance1234-Sec5-663202",
  "type": "city_ordinance_section",
  "title": "Prohibited Parking Areas",
  "canonical_citation": "Cebu City Ordinance No. 1234, Sec. 5",
  "summary": "Prohibits parking in designated areas including fire lanes, loading zones, and areas marked with no-parking signs. Establishes penalties for violations.",
  "text": "Section 5. Prohibited Parking Areas. No person shall park or leave standing any vehicle in the following areas: (a) Fire lanes and emergency access routes; (b) Loading and unloading zones; (c) Areas marked with 'No Parking' signs; (d) Within 5 meters of intersections; (e) In front of driveways and entrances to buildings.",
  "tags": [
    "parking",
    "traffic",
    "violation",
    "prohibited",
    "areas",
    "ordinance"
  ],
  "jurisdiction": "PH-CEBU-CITY",
  "law_family": "Cebu City Ordinance No. 1234",
  "created_by": 1,
  "created_at": "2025-01-10T16:49:01.692Z",
  "updated_at": "2025-01-10T16:49:01.696Z",
  "section_id": "Sec. 5",
  "status": "active",
  "effective_date": "2023-01-15T00:00:00.000Z",
  "amendment_date": null,
  "last_reviewed": "2025-01-10T00:00:00.000Z",
  "visibility": {
    "cpa": true,
    "gli": true
  },
  "source_urls": [
    "https://www.cebucity.gov.ph/ordinances/ordinance-1234",
    "https://www.cebucity.gov.ph/city-council/ordinances"
  ],
  "elements": [
    "Vehicle is parked or left standing",
    "In a prohibited area as defined in the ordinance",
    "Person responsible for the vehicle"
  ],
  "penalties": [
    "First offense: Fine of ₱500",
    "Second offense: Fine of ₱1,000",
    "Third and subsequent offenses: Fine of ₱2,000 and/or impoundment of vehicle"
  ],
  "legal_bases": [
    {
      "url": "https://lawphil.net/statutes/repacts/ra1964/ra_4136_1964.html",
      "note": "Provides framework for local traffic regulation.",
      "type": "external",
      "title": "Land Transportation and Traffic Code",
      "citation": "Republic Act No. 4136 (1964)"
    },
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Grants local government units authority to enact ordinances.",
      "type": "external",
      "title": "1987 Constitution, Article X",
      "citation": "1987 Constitution, Article X, Section 5"
    }
  ],
  "related_sections": [
    {
      "url": "https://www.cebucity.gov.ph/ordinances/ordinance-1234",
      "note": "Defines traffic enforcement procedures and officer authority.",
      "type": "internal",
      "title": "Traffic Enforcement Authority",
      "entry_id": "ORD-CebuCity-Ordinance1234-Sec3-123456"
    },
    {
      "url": "https://www.cebucity.gov.ph/ordinances/ordinance-1234",
      "note": "Establishes appeal process for traffic violations.",
      "type": "internal",
      "title": "Appeal Process for Traffic Violations",
      "entry_id": "ORD-CebuCity-Ordinance1234-Sec8-789012"
    }
  ],
  "created_by_name": "Arda",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "ORD-CebuCity-Ordinance1234-Sec5-663202"
}
```

### **Example 2: Business Ordinance - Food Establishment Requirements**

```json
{
  "entry_id": "ORD-CebuCity-Ordinance5678-Sec12-774113",
  "type": "city_ordinance_section",
  "title": "Food Establishment Sanitation Requirements",
  "canonical_citation": "Cebu City Ordinance No. 5678, Sec. 12",
  "summary": "Establishes minimum sanitation and hygiene requirements for food establishments operating within Cebu City. Includes requirements for food handling, storage, and facility maintenance.",
  "text": "Section 12. Sanitation Requirements. All food establishments shall maintain the following sanitation standards: (a) Food handlers must have valid health certificates; (b) Food storage areas must be clean and pest-free; (c) Refrigeration units must maintain proper temperatures; (d) Waste disposal must comply with city regulations; (e) Regular inspection by city health officers is required.",
  "tags": [
    "food",
    "establishment",
    "sanitation",
    "health",
    "requirements",
    "business"
  ],
  "jurisdiction": "PH-CEBU-CITY",
  "law_family": "Cebu City Ordinance No. 5678",
  "created_by": 1,
  "created_at": "2025-01-10T16:49:01.692Z",
  "updated_at": "2025-01-10T16:49:01.696Z",
  "section_id": "Sec. 12",
  "status": "active",
  "effective_date": "2023-06-01T00:00:00.000Z",
  "amendment_date": null,
  "last_reviewed": "2025-01-10T00:00:00.000Z",
  "visibility": {
    "cpa": true,
    "gli": true
  },
  "source_urls": [
    "https://www.cebucity.gov.ph/ordinances/ordinance-5678",
    "https://www.cebucity.gov.ph/health-department/regulations"
  ],
  "elements": [
    "Food establishment operating within city limits",
    "Failure to maintain required sanitation standards",
    "Violation of specific health and safety requirements"
  ],
  "penalties": [
    "First violation: Warning and corrective action required",
    "Second violation: Fine of ₱2,000 and temporary closure until compliance",
    "Third violation: Fine of ₱5,000 and business permit suspension"
  ],
  "legal_bases": [
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Grants local government units authority to protect public health and welfare.",
      "type": "external",
      "title": "1987 Constitution, Article X",
      "citation": "1987 Constitution, Article X, Section 5"
    },
    {
      "url": "https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html",
      "note": "Provides framework for local government regulatory authority.",
      "type": "external",
      "title": "Local Government Code",
      "citation": "Republic Act No. 7160 (1991)"
    }
  ],
  "related_sections": [
    {
      "url": "https://www.cebucity.gov.ph/ordinances/ordinance-5678",
      "note": "Establishes business permit requirements and application process.",
      "type": "internal",
      "title": "Business Permit Requirements",
      "entry_id": "ORD-CebuCity-Ordinance5678-Sec5-456789"
    },
    {
      "url": "https://www.cebucity.gov.ph/ordinances/ordinance-5678",
      "note": "Defines inspection procedures and enforcement authority.",
      "type": "internal",
      "title": "Health Inspection Procedures",
      "entry_id": "ORD-CebuCity-Ordinance5678-Sec15-321654"
    }
  ],
  "created_by_name": "Arda",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "ORD-CebuCity-Ordinance5678-Sec12-774113"
}
```

### **Example 3: Environmental Ordinance - Waste Management**

```json
{
  "entry_id": "ORD-CebuCity-Ordinance9999-Sec7-889001",
  "type": "city_ordinance_section",
  "title": "Prohibition of Single-Use Plastics",
  "canonical_citation": "Cebu City Ordinance No. 9999, Sec. 7",
  "summary": "Prohibits the use, sale, and distribution of single-use plastic bags and containers in commercial establishments. Aims to reduce plastic waste and environmental pollution.",
  "text": "Section 7. Prohibition of Single-Use Plastics. It shall be unlawful for any commercial establishment to provide, sell, or distribute single-use plastic bags, straws, cups, or containers to customers. Establishments must provide eco-friendly alternatives or encourage customers to bring their own reusable containers.",
  "tags": [
    "plastic",
    "prohibition",
    "environment",
    "waste",
    "commercial",
    "establishment"
  ],
  "jurisdiction": "PH-CEBU-CITY",
  "law_family": "Cebu City Ordinance No. 9999",
  "created_by": 1,
  "created_at": "2025-01-10T16:49:01.692Z",
  "updated_at": "2025-01-10T16:49:01.696Z",
  "section_id": "Sec. 7",
  "status": "active",
  "effective_date": "2024-01-01T00:00:00.000Z",
  "amendment_date": null,
  "last_reviewed": "2025-01-10T00:00:00.000Z",
  "visibility": {
    "cpa": true,
    "gli": true
  },
  "source_urls": [
    "https://www.cebucity.gov.ph/ordinances/ordinance-9999",
    "https://www.cebucity.gov.ph/environmental-protection/plastic-ban"
  ],
  "elements": [
    "Commercial establishment provides, sells, or distributes single-use plastics",
    "Single-use plastic items include bags, straws, cups, or containers",
    "Violation occurs within city limits"
  ],
  "penalties": [
    "First offense: Warning and educational materials provided",
    "Second offense: Fine of ₱1,000",
    "Third offense: Fine of ₱3,000",
    "Fourth and subsequent offenses: Fine of ₱5,000 and business permit suspension"
  ],
  "legal_bases": [
    {
      "url": "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
      "note": "Grants local government units authority to protect the environment.",
      "type": "external",
      "title": "1987 Constitution, Article II, Section 16",
      "citation": "1987 Constitution, Article II, Section 16"
    },
    {
      "url": "https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html",
      "note": "Provides framework for local environmental regulation.",
      "type": "external",
      "title": "Local Government Code",
      "citation": "Republic Act No. 7160 (1991)"
    }
  ],
  "related_sections": [
    {
      "url": "https://www.cebucity.gov.ph/ordinances/ordinance-9999",
      "note": "Defines enforcement procedures and officer authority for environmental violations.",
      "type": "internal",
      "title": "Environmental Enforcement Authority",
      "entry_id": "ORD-CebuCity-Ordinance9999-Sec3-147258"
    },
    {
      "url": "https://www.cebucity.gov.ph/ordinances/ordinance-9999",
      "note": "Establishes waste segregation requirements for all establishments.",
      "type": "internal",
      "title": "Waste Segregation Requirements",
      "entry_id": "ORD-CebuCity-Ordinance9999-Sec10-369852"
    }
  ],
  "created_by_name": "Arda",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "ORD-CebuCity-Ordinance9999-Sec7-889001"
}
```

---

## ⚠️ Critical Validation Requirements

### **Entry ID Generation**
- **Format:** `ORD-{CityName}-{OrdinanceNumber}-{SectionID}-{6-digit-timestamp}`
- **Examples:** `ORD-CebuCity-Ordinance1234-Sec5-663202`
- **Auto-generated:** The system generates this automatically based on jurisdiction, law_family, section_id and timestamp
- **Validation:** Must match pattern `/^ORD-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-\d{6}$/`

#### **How Auto-Generation Works:**
The system automatically generates entry IDs using this process:

1. **Prefix:** Always starts with `ORD-` for city ordinance sections
2. **City Name:** Extracted from the `jurisdiction` field:
   - `"PH-CEBU-CITY"` → `"CebuCity"`
3. **Ordinance Number:** Extracted from the `law_family` field:
   - `"Cebu City Ordinance No. 1234"` → `"Ordinance1234"`
4. **Section ID:** Extracted from the `section_id` field:
   - `"Sec. 5"` → `"Sec5"`
5. **Timestamp:** Last 6 digits of current timestamp (milliseconds since epoch)
   - Example: `1705123456789` → `"234567"`
6. **Final Format:** `ORD-{CityName}-{OrdinanceNumber}-{SectionID}-{6-digit-timestamp}`

#### **Generation Examples:**
```javascript
// Input jurisdiction: "PH-CEBU-CITY"
// Input law_family: "Cebu City Ordinance No. 1234"
// Input section_id: "Sec. 5"
// Generated entry_id: "ORD-CebuCity-Ordinance1234-Sec5-663202"

// Input jurisdiction: "PH-CEBU-CITY"
// Input law_family: "Cebu City Traffic Code"
// Input section_id: "Art. 3"
// Generated entry_id: "ORD-CebuCity-TrafficCode-Art3-789012"
```

#### **Important Notes:**
- **Don't manually set entry_id** - Let the system generate it automatically
- **Unique per entry** - The timestamp ensures uniqueness even for same section
- **Validation required** - Must match the regex pattern for system acceptance
- **Case sensitive** - Section ID extraction preserves original casing

### **Required Fields (Validation Will Fail Without These)**
```javascript
// These fields are REQUIRED and will cause validation errors if missing:
entry_id: string          // Auto-generated, must follow ORD-{CityName}-{OrdinanceNumber}-{SectionID}-{timestamp} format
type: "city_ordinance_section"  // Must be exactly this string
title: string            // Must be at least 3 characters
jurisdiction: string     // Must be valid jurisdiction (e.g., "PH-CEBU-CITY")
law_family: string       // Must be at least 1 character (e.g., "Cebu City Ordinance No. 1234")
canonical_citation: string // Must be at least 1 character
status: string           // Must be one of: "active", "amended", "repealed", "draft", "approved", "published"
effective_date: string   // Must be ISO date format (e.g., "2023-01-15T00:00:00.000Z")
summary: string          // Must be at least 1 character
text: string            // Must be at least 1 character
source_urls: string[]   // Must have at least 1 valid URL
tags: string[]          // Must have at least 1 tag
last_reviewed: string    // Must be ISO date format (e.g., "2025-01-10T00:00:00.000Z")
elements: string[]      // Must have at least 1 element (city_ordinance_section specific)
penalties: string[]     // Must have at least 1 penalty (city_ordinance_section specific)
created_by: number      // Team member ID (e.g., 1 for Arda)
created_at: string      // ISO timestamp (auto-generated)
updated_at: string      // ISO timestamp (auto-generated)
```

### **Cross-Field Validation Rules**
- If `status` is "amended", then `amendment_date` is required
- All URLs in `source_urls` must be valid URLs (start with http:// or https://)
- `elements` and `penalties` arrays must have at least one item each

### **Vector Embeddings for Imported Entries**
- **Auto-generated:** When entries are imported via JSON, the system automatically generates vector embeddings
- **Purpose:** Enables semantic search and AI-powered retrieval functionality
- **Format:** Large array of floating-point numbers (e.g., `[0.018105285,0.03040041,0.0018285423,...]`)
- **No manual input required:** The embedding field is populated automatically during import
- **Search enhancement:** Embeddings allow the system to find related entries based on semantic meaning, not just exact text matches

### **Import-Specific Field Handling**
- **Created By:** Automatically set to the logged-in user's information
  - `created_by`: Uses the logged-in user's ID (e.g., 1 for Arda)
  - `created_by_name`: Uses the logged-in user's name (e.g., "Arda")
- **Verification Status:** All imported entries are automatically marked as unverified
  - `verified`: Set to `false`
  - `verified_at`: Set to `null`
  - `verified_by`: Set to `null`
- **Progress Tracking:** Imported entries count towards daily quotas and progress
  - Each imported entry increments the user's daily progress for that entry type
  - Progress is tracked by entry type (e.g., `city_ordinance_section`)
  - Imported entries contribute to quota completion just like manually created entries
- **No manual input required:** These fields are automatically populated during import

### **Jurisdiction Validation**
- Must be valid jurisdiction format (e.g., "PH-CEBU-CITY", "PH-MANILA", "PH-QUEZON-CITY")
- Must match pattern: `/^PH-[A-Z]+(-[A-Z]+)*$/`

---

## 🏷️ Common Topics for City Ordinance Sections

### **Traffic and Transportation:**
- `traffic` - Traffic rules and regulations
- `parking` - Parking restrictions and requirements
- `vehicle` - Vehicle registration and operation
- `violation` - Traffic violations and penalties
- `enforcement` - Traffic law enforcement

### **Business and Commerce:**
- `business` - Business permits and regulations
- `commercial` - Commercial establishment requirements
- `permit` - Business permit requirements
- `license` - Licensing requirements
- `inspection` - Business inspection procedures

### **Environment and Health:**
- `environment` - Environmental protection measures
- `waste` - Waste management and disposal
- `sanitation` - Sanitation and hygiene requirements
- `health` - Public health regulations
- `pollution` - Pollution control measures

### **Public Safety:**
- `safety` - Public safety regulations
- `fire` - Fire safety requirements
- `emergency` - Emergency response procedures
- `security` - Security requirements
- `noise` - Noise control regulations

### **Urban Planning:**
- `zoning` - Zoning regulations
- `construction` - Building and construction requirements
- `development` - Urban development regulations
- `land_use` - Land use restrictions
- `infrastructure` - Infrastructure requirements

---

## 📅 Important Dates

### **Common Ordinance Effective Dates:**
- **Traffic Ordinances:** Usually effective immediately or within 30 days
- **Business Ordinances:** Often effective 60-90 days after passage
- **Environmental Ordinances:** May have phased implementation over months/years

### **Historical Context:**
- City ordinances are typically passed by city councils
- Effective dates are usually specified in the ordinance text
- Amendments may have different effective dates than original ordinances

---

## 🔗 Essential Source URLs

### **Primary Sources:**
- `https://www.cebucity.gov.ph/` - Cebu City Official Website - Ordinances and Regulations
- `https://www.cebucity.gov.ph/city-council/ordinances` - Cebu City Council - Ordinance Database

### **Additional Resources:**
- `https://www.officialgazette.gov.ph/` - Official Gazette of the Philippines - National Laws
- `https://lawphil.net/` - LawPhil.net - Philippine Legal Resources
- Local government unit websites for specific city ordinances

---

## 📝 Writing Guidelines

### **Title Format:**
- Use clear, descriptive titles
- Focus on the specific regulation or requirement
- Examples:
  - ✅ "Prohibited Parking Areas"
  - ✅ "Food Establishment Sanitation Requirements"
  - ✅ "Prohibition of Single-Use Plastics"
  - ❌ "Sec. 5"
  - ❌ "Ordinance Section"

### **Summary Guidelines:**
- 1-3 sentences maximum
- Neutral, objective tone
- Focus on the core regulation
- Examples:
  - ✅ "Prohibits parking in designated areas including fire lanes, loading zones, and areas marked with no-parking signs. Establishes penalties for violations."
  - ✅ "Establishes minimum sanitation and hygiene requirements for food establishments operating within Cebu City."

### **Text Guidelines:**
- Use the exact ordinance text
- Maintain original formatting and punctuation
- Include the complete section
- Do not paraphrase or summarize

### **Tags Guidelines:**
- Use 3-8 relevant tags
- Include both specific and general terms
- Examples: `["parking", "traffic", "violation", "prohibited", "areas"]`

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
  - ✅ `"https://www.cebucity.gov.ph/ordinances/ordinance-1234"`
  - ❌ `"www.cebucity.gov.ph"` or `"Cebu City Website"`

---

## 🎯 Team Assignment

### **Primary Assignee:** Arda (P1)
- **Daily Quota:** 3 city_ordinance_section entries per day
- **Focus Areas:** RPC + Cebu Ordinances
- **Backup:** Sendrijas (P4) for statute sections

---

## 🚀 Quick Start Checklist

### **Before Creating:**
- [ ] Identify the specific ordinance and section
- [ ] Gather the exact ordinance text
- [ ] Find official source URLs
- [ ] Identify elements and penalties
- [ ] Determine related ordinance sections

### **During Creation:**
- [ ] Use clear, descriptive title
- [ ] Copy exact ordinance text
- [ ] Write neutral 1-3 sentence summary
- [ ] Add 3-8 relevant tags
- [ ] Include official source URLs
- [ ] Add elements and penalties
- [ ] Include related sections
- [ ] Add legal bases

### **Before Publishing:**
- [ ] Verify all required fields are complete
- [ ] Check spelling and grammar
- [ ] Ensure source URLs are valid
- [ ] Confirm ordinance text is accurate
- [ ] Review tags for relevance
- [ ] Validate entry_id format

---

## 💡 Best Practices

### **Content Quality:**
- Always use the exact ordinance text
- Include comprehensive elements and penalties
- Add related ordinance sections
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
2. **Invalid dates** - Use ISO format (e.g., "2023-01-15T00:00:00.000Z")
3. **Invalid URLs** - Ensure URLs start with http:// or https://
4. **Empty arrays** - Required arrays (source_urls, tags, elements, penalties) cannot be empty
5. **Incorrect entry_id** - Follow the ORD-{CityName}-{OrdinanceNumber}-{SectionID}-{6-digit-timestamp} format
6. **Missing elements/penalties** - City ordinance sections must have at least one element and one penalty
7. **Related sections format** - Use type: "internal" with entry_id for ordinance sections
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
- Check date formats (ISO format: "2023-01-15T00:00:00.000Z")
- Confirm elements and penalties arrays have at least one item each
- Verify related_sections use type: "internal" with entry_id for ordinance sections
- Verify legal_bases use type: "external" with citation, url, title, note for external documents
- Do not include auto-populated fields - they're set automatically on import

---

## 🤖 GPT Usage Instructions

### **For AI/GPT Generation:**
When generating city ordinance section entries with GPT or similar AI tools, use this exact template:

```json
{
  "entry_id": "ORD-{CityName}-{OrdinanceNumber}-{SectionID}-{6-digit-timestamp}",
  "type": "city_ordinance_section",
  "title": "Descriptive Title of the Ordinance Section",
  "canonical_citation": "City Ordinance No. XXXX, Sec. Y",
  "summary": "1-3 sentence neutral summary of the ordinance section",
  "text": "Exact ordinance text without modification",
  "tags": ["relevant", "tags", "for", "search"],
  "jurisdiction": "PH-CEBU-CITY",
  "law_family": "City Ordinance No. XXXX",
  "created_by": 1,
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
    "https://www.cebucity.gov.ph/ordinances/ordinance-XXXX"
  ],
  "elements": ["Required elements of the ordinance"],
  "penalties": ["Penalties for violations"],
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
      "entry_id": "ORD-CebuCity-OrdinanceXXXX-SecY-123456",
      "title": "Related Ordinance Section Title",
      "url": "https://www.cebucity.gov.ph/ordinances/ordinance-XXXX",
      "note": "Brief description of relationship"
    }
  ],
  "created_by_name": "Arda",
  "verified_at": null,
  "verified": null,
  "verified_by": null,
  "id": "ORD-{CityName}-{OrdinanceNumber}-{SectionID}-{6-digit-timestamp}"
}
```

### **Critical GPT Instructions:**
1. **Always include ALL required fields** - Missing any will cause validation failure
2. **Use exact ordinance text** - Do not paraphrase or summarize
3. **Elements and penalties arrays are REQUIRED** - Must have at least one item each
4. **Related sections use type: "internal"** - For ordinance sections, use internal references with entry_id
5. **Legal bases use type: "external"** - For external legal documents, use external references
6. **Entry ID format** - ORD-{CityName}-{OrdinanceNumber}-{SectionID}-{6-digit-timestamp} (auto-generated by system)
7. **Dates must be ISO format** - Use "2023-01-15T00:00:00.000Z" format for dates
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

For questions or issues with city ordinance section entries:
- Contact Arda (P1) for content questions
- Refer to the main ENTRY_CREATION_GUIDE.md for general guidance
- Check the browser console for validation errors
- Contact the development team for technical issues

---

*This guide is specifically designed for City Ordinance Section entries and is maintained by the Civilify development team.*
