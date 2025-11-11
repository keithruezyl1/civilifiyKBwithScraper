
# Civilify Law Entry App

Civilify Law Entry App streamlines creating, importing, validating, and managing legal knowledge base entries. See the main `README.md` in this folder for full setup. This local README highlights authoring docs.

## Table of Contents

1.  [Purpose](#purpose)
2.  [Available Documentation](#available-documentation)
3.  [Supported Entry Types](#supported-entry-types)
4.  [Quick Start](#quick-start)
    *   [JSON Entry Creation](#json-entry-creation)
    *   [Constitution Provisions](#constitution-provisions)
    *   [Testing Import](#testing-import)
5.  [Import Process](#import-process)
6.  [AI Generation Tips](#ai-generation-tips)
7.  [Support](#support)

## Purpose

The primary goal of Civilify Law Entry App is to simplify the process of creating and managing legal entries, ensuring accuracy, consistency, and ease of access. It supports various legal entry types, allowing for a comprehensive and well-organized database of legal information.

## Available Documentation

### 📖 JSON Entry Creation Guide

*   **File:** `docs/JSON_ENTRY_CREATION_GUIDE.md`
*   **Purpose:** A detailed guide for creating valid JSON entries for all supported entry types.
*   **Use Case:** Ideal for programmatic entry creation or when using AI tools.
*   **Includes:**
    *   Complete JSON structure for all entry types.
    *   Validation rules and requirements.
    *   Detailed examples for each entry type.
    *   AI generation tips and prompts.
    *   Troubleshooting guide.

### 📜 Constitution Provision Guide

*   **File:** `docs/CONSTITUTION_PROVISION_GUIDE.md`
*   **Purpose:** A specialized guide specifically for creating Constitution Provision entries related to the 1987 Philippine Constitution.
*   **Use Case:** Essential when creating entries for constitutional provisions.
*   **Includes:**
    *   Constitution-specific field requirements.
    *   Examples with real constitutional provisions.
    *   Guidance on common topics and jurisprudence.
    *   Writing guidelines for constitutional entries.
    *   Team assignment information (if applicable).

### 🧪 Test Entry File

*   **File:** `docs/test_entry.json`
*   **Purpose:** Sample JSON file with valid entries for testing the import functionality.
*   **Use Case:** Use to test the import feature or as a template for creating new entries.
*   **Includes:**
    *   Sample entries for `statute_section` and `rights_advisory`.
    *   All required fields properly formatted.
    *   Valid JSON structure.

## Supported Entry Types

The application supports the following entry types:

1.  `constitution_provision`: Philippine Constitution articles/sections
2.  `statute_section`: Republic Acts and Revised Penal Code sections
3.  `city_ordinance_section`: Local city ordinances
4.  `rule_of_court`: Rules of Court provisions
5.  `agency_circular`: Government agency circulars
6.  `doj_issuance`: Department of Justice issuances
7.  `executive_issuance`: Executive orders and presidential issuances
8.  `pnp_sop`: Philippine National Police standard operating procedures
9.  `incident_checklist`: Incident response checklists
10. `rights_advisory`: Rights and legal advice

## Quick Start

### JSON Entry Creation

1.  Refer to the `JSON_ENTRY_CREATION_GUIDE.md` for detailed instructions.
2.  Utilize the provided examples as templates.
3.  Adhere to the validation rules to ensure entry validity.
4.  Test your entries using the `test_entry.json` file.

### Constitution Provisions

1.  Consult the `CONSTITUTION_PROVISION_GUIDE.md` for specialized guidance.
2.  Use the constitutional examples as a reference.
3.  Follow the writing guidelines to maintain consistency.
4.  Include relevant jurisprudence to enhance the entry's value.

### Testing Import

1.  Employ the `test_entry.json` to validate the import functionality.
2.  Confirm that the import process executes correctly.
3.  Check for any validation errors that may arise.
4.  Create your own entries by following the provided guides.

## Import Process

Here's a visual guide to the import process:

1.  Create your JSON file, ensuring it adheres to the guidelines specified in the `JSON_ENTRY_CREATION_GUIDE.md`.
2.  Save the file with a `.json` extension (e.g., `my_entries.json`).
3.  Click the "Import Entries" button within the application.
4.  Select your JSON file for import.
5.  Verify the success message to confirm the number of imported entries.

## AI Generation Tips

When using GPT or other AI tools for entry creation:

1.  **Provide Comprehensive Context:** Always provide the complete `JSON_ENTRY_CREATION_GUIDE.md` as context to the AI.
2.  **Specify Entry Type:** Clearly specify the entry type you wish to create (e.g., `statute_section`, `constitution_provision`).
3.  **Include Legal Text:** Provide the specific legal text that the entry should be based on.
4.  **Request JSON Validation:** Ask the AI to validate the generated JSON structure to ensure it meets the required format.
5.  **Generate Multiple Entries:** Request the AI to generate multiple entries in an array format to streamline the process.
6.  **Iterate and Refine:** Review the AI-generated entries carefully and refine them as needed to ensure accuracy and completeness.

### Example Prompt:

> Using the `JSON_ENTRY_CREATION_GUIDE.md`, create a valid JSON entry for the following:
>
> Entry Type: `statute_section`
>
> Title: *[Your title]*
>
> Legal Text: *[Your legal text]*
>
> Jurisdiction: PH
>
> Law Family: *[Your law family]*
>
> Please ensure all required fields are included and the JSON is valid JSON.

> **Important:** Always validate the AI-generated JSON against the `JSON_ENTRY_CREATION_GUIDE.md` to ensure compliance with the required format and validation rules.

## Support

*   **Technical Issues:** Check the browser console for validation errors.
*   **Content Questions:** Refer to the specific guides for your entry type.
*   **Import Problems:** Use the test file to verify functionality.
*   **General Help:** Contact the development team.

---

