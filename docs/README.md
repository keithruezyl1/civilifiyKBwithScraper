# 📚 Civilify Law Entry App - Documentation

This folder contains comprehensive documentation for creating and importing legal entries into the Civilify Law Entry App.

## 📋 Available Documentation

### **📖 JSON Entry Creation Guide**
- **File:** `JSON_ENTRY_CREATION_GUIDE.md`
- **Purpose:** Complete guide for creating valid JSON entries for all entry types
- **Use Case:** When you need to create entries programmatically or with AI tools like GPT
- **Includes:** 
  - Complete JSON structure for all 10 entry types
  - Validation rules and requirements
  - Complete examples for different entry types
  - AI generation tips and prompts
  - Troubleshooting guide

### **📜 Constitution Provision Guide**
- **File:** `CONSTITUTION_PROVISION_GUIDE.md`
- **Purpose:** Specialized guide specifically for Constitution Provision entries
- **Use Case:** When creating entries for the 1987 Philippine Constitution
- **Includes:**
  - Constitution-specific field requirements
  - Complete examples with real constitutional provisions
  - Common topics and jurisprudence
  - Writing guidelines for constitutional entries
  - Team assignment information

### **🧪 Test Entry File**
- **File:** `test_entry.json`
- **Purpose:** Sample JSON file with valid entries for testing import functionality
- **Use Case:** Testing the import feature or as a template for creating new entries
- **Includes:**
  - 2 sample entries (statute_section and rights_advisory)
  - All required fields properly formatted
  - Valid JSON structure

## 🚀 Quick Start

### **For JSON Entry Creation:**
1. Read `JSON_ENTRY_CREATION_GUIDE.md` for complete instructions
2. Use the examples as templates
3. Follow the validation rules
4. Test with `test_entry.json` first

### **For Constitution Provisions:**
1. Read `CONSTITUTION_PROVISION_GUIDE.md` for specialized guidance
2. Use the constitutional examples provided
3. Follow the writing guidelines
4. Include relevant jurisprudence

### **For Testing Import:**
1. Use `test_entry.json` to test the import functionality
2. Verify the import works correctly
3. Check for any validation errors
4. Create your own entries following the guides

## 📝 Entry Types Supported

The documentation covers all 10 supported entry types:

1. **constitution_provision** - Philippine Constitution articles/sections
2. **statute_section** - Republic Acts and Revised Penal Code sections
3. **city_ordinance_section** - Local city ordinances
4. **rule_of_court** - Rules of Court provisions
5. **agency_circular** - Government agency circulars
6. **doj_issuance** - Department of Justice issuances
7. **executive_issuance** - Executive orders and presidential issuances
8. **pnp_sop** - Philippine National Police standard operating procedures
9. **incident_checklist** - Incident response checklists
10. **rights_advisory** - Rights and legal advice

## 🔧 Import Process

1. **Create your JSON file** following the guides
2. **Save as .json file** (e.g., `my_entries.json`)
3. **Click "Import Entries"** button in the app
4. **Select your JSON file**
5. **Check the success message** for number of imported entries

## 💡 Tips for AI Generation

When using GPT or other AI tools:

1. **Provide the complete guide** as context
2. **Specify the entry type** you want
3. **Include the legal text** you want to use
4. **Ask for validation** of the JSON structure
5. **Request multiple entries** in an array format

### Example Prompt:
```
Using the JSON_ENTRY_CREATION_GUIDE.md, create a valid JSON entry for:

Entry Type: statute_section
Title: [Your title]
Legal Text: [Your legal text]
Jurisdiction: PH
Law Family: [Your law family]

Please ensure all required fields are included and the JSON is valid.
```

## 🆘 Support

- **Technical Issues:** Check the browser console for validation errors
- **Content Questions:** Refer to the specific guides for your entry type
- **Import Problems:** Use the test file to verify functionality
- **General Help:** Contact the development team

---

*This documentation is maintained by the Civilify development team and updated as the system evolves.*





