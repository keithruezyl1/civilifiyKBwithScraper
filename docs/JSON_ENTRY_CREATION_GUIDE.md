# 📋 Civilify Law Entry App - JSON Entry Creation Guide

## 🎯 Overview

This guide provides everything you need to create valid JSON entries for the Civilify Law Entry App. You can use this information to generate JSON files with AI tools like GPT, or create them manually.

## 🏗️ Entry Structure

Every entry must follow this exact structure. The system validates all fields, so missing or incorrect data will cause import failures.

### 📝 Base Structure (All Entry Types)

```json
{
  "entry_id": "string (required)",
  "type": "string (required)",
  "title": "string (required)",
  "jurisdiction": "string (required)",
  "law_family": "string (required)",
  "section_id": "string (optional)",
  "canonical_citation": "string (required)",
  "status": "string (optional, default: 'active')",
  "effective_date": "string (required, ISO date)",
  "amendment_date": "string (optional, ISO date)",
  "summary": "string (required)",
  "text": "string (required)",
  "source_urls": ["array of valid URLs (required, min 1)"],
  "tags": ["array of strings (required, min 1)"],
  "last_reviewed": "string (required, ISO date)",
  "visibility": {
    "gli": "boolean (default: true)",
    "cpa": "boolean (default: false)"
  },
  "offline": {
    "pack_include": "boolean (default: false)",
    "pack_category": "string (optional: 'sop', 'checklist', 'traffic', 'rights', 'roc')",
    "pack_priority": "string (optional: '1', '2', '3')"
  }
}
```

## 📋 Entry Types & Required Fields

### 1. **constitution_provision**
```json
{
  "type": "constitution_provision",
  "topics": ["array of strings (optional)"],
  "related_sections": ["array of strings (optional)"],
  "jurisprudence": ["array of strings (optional)"]
}
```

### 2. **statute_section**
```json
{
  "type": "statute_section",
  "elements": ["array of strings (required, min 1)"],
  "penalties": ["array of strings (required, min 1)"],
  "defenses": ["array of strings (optional)"],
  "prescriptive_period": {
    "value": "number (positive)",
    "unit": "string ('days', 'months', 'years')"
  },
  "standard_of_proof": "string (optional)",
  "related_sections": ["array of strings (optional)"],
  "legal_bases": ["array of strings (optional)"]
}
```

### 3. **city_ordinance_section**
```json
{
  "type": "city_ordinance_section",
  "elements": ["array of strings (required, min 1)"],
  "penalties": ["array of strings (required, min 1)"],
  "defenses": ["array of strings (optional)"],
  "related_sections": ["array of strings (optional)"],
  "legal_bases": ["array of strings (optional)"]
}
```

### 4. **rule_of_court**
```json
{
  "type": "rule_of_court",
  "rule_no": "string (required)",
  "section_no": "string (required)",
  "triggers": ["array of strings (required, min 1)"],
  "time_limits": ["array of strings (optional)"],
  "required_forms": ["array of strings (optional)"],
  "related_sections": ["array of strings (optional)"]
}
```

### 5. **agency_circular**
```json
{
  "type": "agency_circular",
  "circular_no": "string (required)",
  "section_no": "string (optional)",
  "applicability": ["array of strings (required, min 1)"],
  "legal_bases": ["array of strings (optional)"],
  "supersedes": ["array of strings (optional)"]
}
```

### 6. **doj_issuance**
```json
{
  "type": "doj_issuance",
  "issuance_no": "string (required)",
  "applicability": ["array of strings (required, min 1)"],
  "legal_bases": ["array of strings (optional)"],
  "supersedes": ["array of strings (optional)"]
}
```

### 7. **executive_issuance**
```json
{
  "type": "executive_issuance",
  "instrument_no": "string (required)",
  "applicability": ["array of strings (required, min 1)"],
  "legal_bases": ["array of strings (optional)"],
  "supersedes": ["array of strings (optional)"]
}
```

### 8. **pnp_sop**
```json
{
  "type": "pnp_sop",
  "steps_brief": ["array of strings (required, min 1)"],
  "forms_required": ["array of strings (optional)"],
  "failure_states": ["array of strings (optional)"],
  "legal_bases": ["array of strings (required, min 1)"]
}
```

### 9. **incident_checklist**
```json
{
  "type": "incident_checklist",
  "incident": "string (required)",
  "phases": [
    {
      "name": "string (required)",
      "steps": [
        {
          "text": "string (required)",
          "condition": "string (optional)",
          "deadline": "string (optional)",
          "evidence_required": ["array of strings (optional)"],
          "legal_bases": [
            {
              "type": "string ('internal' or 'external')",
              "entry_id": "string (optional)",
              "citation": "string (optional)",
              "url": "string (optional, must be valid URL)"
            }
          ],
          "failure_state": "string (optional)"
        }
      ]
    }
  ],
  "forms": ["array of strings (optional)"],
  "handoff": ["array of strings (optional)"],
  "rights_callouts": ["array of strings (optional)"]
}
```

### 10. **rights_advisory**
```json
{
  "type": "rights_advisory",
  "rights_scope": "string (required, one of: 'arrest', 'search', 'detention', 'minors', 'GBV', 'counsel', 'privacy')",
  "advice_points": ["array of strings (required, min 1)"],
  "legal_bases": ["array of strings (required, min 1)"],
  "related_sections": ["array of strings (optional)"]
}
```

## 🌍 Valid Values

### **Jurisdictions**
```json
[
  "PH", "PH-CEBU-CITY", "PH-CEBU-PROVINCE", "PH-MANILA", "PH-QUEZON-CITY",
  "PH-MAKATI", "PH-PASIG", "PH-MANDALUYONG", "PH-MARIKINA", "PH-PARANAQUE",
  "PH-LAS-PINAS", "PH-MUNTINLUPA", "PH-TAGUIG", "PH-PATEROS", "PH-VALENZUELA",
  "PH-CALOOCAN", "PH-MALABON", "PH-NAVOTAS", "PH-SAN-JUAN"
]
```

### **Status Values**
```json
["active", "amended", "repealed"]
```

### **Rights Scope Values** (for rights_advisory)
```json
["arrest", "search", "detention", "minors", "GBV", "counsel", "privacy"]
```

### **Pack Categories** (for offline)
```json
["sop", "checklist", "traffic", "rights", "roc"]
```

### **Pack Priorities** (for offline)
```json
["1", "2", "3"]
```

## 📅 Date Formats

All dates must be in ISO format: `YYYY-MM-DD`

Examples:
- `"2024-01-15"`
- `"2023-12-31"`
- `"2024-06-01"`

## 🔗 URL Validation

All URLs in `source_urls` must be valid URLs starting with `http://` or `https://`

Examples:
- `"https://www.officialgazette.gov.ph/"`
- `"http://www.lawphil.net/"`
- `"https://www.chanrobles.com/"`

## 📝 Complete Example: Statute Section

```json
{
  "entry_id": "RA4136-Sec7-20240115",
  "type": "statute_section",
  "title": "Driving Under the Influence of Alcohol",
  "jurisdiction": "PH",
  "law_family": "RA 4136",
  "section_id": "Sec. 7",
  "canonical_citation": "RA 4136, Sec. 7",
  "status": "active",
  "effective_date": "1964-06-20",
  "summary": "Prohibits driving any motor vehicle while under the influence of alcohol or drugs that impair driving ability.",
  "text": "No person shall drive a motor vehicle while under the influence of alcohol or any drug that impairs driving ability. Violation of this provision shall be punishable by imprisonment and fine.",
  "source_urls": [
    "https://www.officialgazette.gov.ph/1964/06/20/republic-act-no-4136/",
    "https://www.lawphil.net/statutes/repacts/ra1964/ra_4136_1964.html"
  ],
  "tags": ["traffic", "alcohol", "driving", "criminal", "penalty"],
  "last_reviewed": "2024-01-15",
  "visibility": {
    "gli": true,
    "cpa": false
  },
  "offline": {
    "pack_include": true,
    "pack_category": "traffic",
    "pack_priority": "1"
  },
  "elements": [
    "Person drives a motor vehicle",
    "While under the influence of alcohol or drugs",
    "That impairs driving ability"
  ],
  "penalties": [
    "Imprisonment of not less than 3 months and not more than 1 year",
    "Fine of not less than P1,000 and not more than P5,000",
    "Suspension of driver's license for 1 year"
  ],
  "defenses": [
    "No alcohol or drugs consumed",
    "Alcohol level below legal limit",
    "Medical necessity for drug use"
  ],
  "prescriptive_period": {
    "value": 1,
    "unit": "years"
  },
  "standard_of_proof": "Beyond reasonable doubt",
  "related_sections": ["RA 4136, Sec. 8", "RA 4136, Sec. 9"],
  "legal_bases": ["RA 4136", "Revised Penal Code, Art. 365"]
}
```

## 📝 Complete Example: Rights Advisory

```json
{
  "entry_id": "RIGHTS-ARREST-001",
  "type": "rights_advisory",
  "title": "Rights During Arrest",
  "jurisdiction": "PH",
  "law_family": "1987 Constitution",
  "canonical_citation": "1987 Constitution, Art. III, Sec. 12",
  "status": "active",
  "effective_date": "1987-02-02",
  "summary": "Constitutional rights that apply when a person is under custodial investigation or arrest.",
  "text": "Any person under investigation for the commission of an offense shall have the right to be informed of his right to remain silent and to have competent and independent counsel preferably of his own choice. If the person cannot afford the services of counsel, he must be provided with one. These rights cannot be waived except in writing and in the presence of counsel.",
  "source_urls": [
    "https://www.officialgazette.gov.ph/constitutions/1987-constitution/",
    "https://www.lawphil.net/consti/cons1987.html"
  ],
  "tags": ["rights", "arrest", "custodial", "counsel", "silence"],
  "last_reviewed": "2024-01-15",
  "visibility": {
    "gli": true,
    "cpa": true
  },
  "offline": {
    "pack_include": true,
    "pack_category": "rights",
    "pack_priority": "1"
  },
  "rights_scope": "arrest",
  "advice_points": [
    "You have the right to remain silent",
    "You have the right to competent and independent counsel",
    "You have the right to be informed of these rights",
    "These rights cannot be waived except in writing and in the presence of counsel"
  ],
  "legal_bases": [
    "1987 Constitution, Art. III, Sec. 12",
    "RA 7438 (Rights of Persons Under Custodial Investigation)"
  ],
  "related_sections": [
    "1987 Constitution, Art. III, Sec. 13 (Right to Bail)",
    "1987 Constitution, Art. III, Sec. 14 (Right to Due Process)"
  ]
}
```

## 📝 Complete Example: Incident Checklist

```json
{
  "entry_id": "CHECKLIST-TRAFFIC-001",
  "type": "incident_checklist",
  "title": "Traffic Accident Response Checklist",
  "jurisdiction": "PH",
  "law_family": "PNP Manual",
  "canonical_citation": "PNP Manual, Chapter 5, Sec. 3",
  "status": "active",
  "effective_date": "2020-01-01",
  "summary": "Step-by-step checklist for police officers responding to traffic accidents.",
  "text": "This checklist provides a systematic approach for police officers when responding to traffic accidents, ensuring all necessary steps are taken for proper investigation and documentation.",
  "source_urls": [
    "https://www.pnp.gov.ph/manuals/",
    "https://www.officialgazette.gov.ph/2020/01/01/pnp-manual-update/"
  ],
  "tags": ["traffic", "accident", "checklist", "investigation", "pnp"],
  "last_reviewed": "2024-01-15",
  "visibility": {
    "gli": true,
    "cpa": true
  },
  "offline": {
    "pack_include": true,
    "pack_category": "checklist",
    "pack_priority": "1"
  },
  "incident": "Traffic Accident",
  "phases": [
    {
      "name": "Initial Response",
      "steps": [
        {
          "text": "Secure the scene and ensure safety",
          "condition": "Upon arrival at accident site",
          "deadline": "Immediately",
          "evidence_required": ["Scene photos", "Witness statements"],
          "legal_bases": [
            {
              "type": "internal",
              "citation": "PNP Manual, Chapter 5, Sec. 3.1"
            }
          ]
        },
        {
          "text": "Call for medical assistance if needed",
          "condition": "If injuries are present",
          "deadline": "Within 5 minutes",
          "evidence_required": ["Medical report"],
          "legal_bases": [
            {
              "type": "external",
              "citation": "RA 4136, Sec. 55",
              "url": "https://www.lawphil.net/statutes/repacts/ra1964/ra_4136_1964.html"
            }
          ]
        }
      ]
    },
    {
      "name": "Investigation",
      "steps": [
        {
          "text": "Interview witnesses and parties involved",
          "condition": "After scene is secured",
          "deadline": "Within 30 minutes",
          "evidence_required": ["Witness statements", "Driver statements"],
          "legal_bases": [
            {
              "type": "internal",
              "citation": "PNP Manual, Chapter 5, Sec. 3.2"
            }
          ]
        }
      ]
    }
  ],
  "forms": [
    "Traffic Accident Report Form",
    "Witness Statement Form",
    "Driver Statement Form"
  ],
  "handoff": [
    "Traffic Investigation Unit",
    "Traffic Court"
  ],
  "rights_callouts": [
    "Right to remain silent",
    "Right to counsel",
    "Right to medical attention"
  ]
}
```

## 🚨 Common Validation Errors

1. **Missing required fields**: All required fields must be present
2. **Invalid entry_id format**: Must be unique and follow naming convention
3. **Invalid URLs**: All source_urls must be valid HTTP/HTTPS URLs
4. **Invalid dates**: All dates must be in YYYY-MM-DD format
5. **Empty arrays**: Required arrays cannot be empty
6. **Invalid enum values**: Use only the specified values for enums
7. **Missing type-specific fields**: Each entry type has specific required fields

## 💡 Tips for AI Generation

When asking GPT or other AI tools to generate entries:

1. **Be specific about the entry type** you want
2. **Provide the legal text** you want to include
3. **Specify the jurisdiction** (usually "PH" for Philippines)
4. **Ask for realistic examples** with proper citations
5. **Request multiple entries** in an array format
6. **Ask for validation** of the JSON structure

### Example Prompt for GPT:

```
Create a valid JSON entry for the Civilify Law Entry App with the following requirements:

Entry Type: statute_section
Title: [Your desired title]
Legal Text: [The actual legal text]
Jurisdiction: PH
Law Family: [e.g., "RA 4136", "Revised Penal Code"]

Please ensure:
- All required fields are included
- Dates are in YYYY-MM-DD format
- URLs are valid and start with http:// or https://
- Arrays are properly formatted
- The entry_id follows the pattern: [LAW]-[SECTION]-[DATE]
- Tags are relevant and descriptive

Return only the JSON object, no additional text.
```

## 📁 Import Process

1. **Generate your JSON** following this guide (using GPT or manually)
2. **Click "Import Entries"** button in the app
3. **Paste your JSON text** into the text box
4. **Click "Import Entry"** to process
5. **Check the success message** for confirmation

**New Feature**: No need to save files! Just paste your JSON directly from GPT or any other source.

The system will automatically:
- Validate all entries
- Skip duplicates (entries with existing entry_ids)
- Show success/error messages
- Refresh the entry list

## 🔧 Troubleshooting

- **Import fails**: Check JSON syntax and required fields
- **Some entries skipped**: Likely duplicates or validation errors
- **Empty import**: Check if entry_ids already exist
- **Partial import**: Some entries may have validation errors

---

**Need help?** Check the validation errors in the browser console or contact the development team.
