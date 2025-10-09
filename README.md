
# Civilify Law Entry App

Civilify Law Entry App streamlines creating, importing, validating, and managing legal knowledge base entries. It includes a React frontend and a Node/Express backend (with PostgreSQL + pgvector) plus comprehensive authoring guides.

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
*   **Purpose:** Create valid JSON entries for all supported types.
*   **Includes:** complete schemas, validation rules, examples, AI prompts, troubleshooting.

### 📜 Constitution Provision Guide

*   **File:** `docs/CONSTITUTION_PROVISION_GUIDE.md`
*   **Purpose:** Specialized guidance for 1987 Philippine Constitution provisions.

### 🧪 Test Entry File

*   **File:** `docs/test_entry.json`
*   **Purpose:** Sample entries for validating the import workflow.

## Supported Entry Types

1.  `constitution_provision` – Constitution articles/sections (PH)
2.  `statute_section` – Republic Acts and Revised Penal Code sections
3.  `city_ordinance_section` – Local city ordinances
4.  `rule_of_court` – Rules of Court provisions
5.  `agency_circular` – Government agency circulars
6.  `doj_issuance` – Department of Justice issuances
7.  `executive_issuance` – Executive orders and presidential issuances
8.  `pnp_sop` – PNP standard operating procedures
9.  `incident_checklist` – Incident response checklists
10. `rights_advisory` – Rights and legal advice

See `docs/COMPREHENSIVE_SCHEMA_REFERENCE.md` for the full schema.

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL) or a PostgreSQL 14+ instance

### 1) Start PostgreSQL (recommended via Docker Compose)

From the repository root:

```bash
docker-compose up -d
```

This starts PostgreSQL with pgvector on port 5432. See the root `README.local.md` for details.

### 2) Start the backend API

```bash
cd server
npm install
```

Create `server/.env`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/law_entry_db
PGSSL=false
CORS_ORIGIN=http://localhost:3000
# Optional for embedding/re-index features
# OPENAI_API_KEY=your_key
```

Then run:

```bash
npm run start
```

This initializes the database (runs SQL in `server/sql/`) and serves the API on `http://localhost:4000`.

### 3) Start the frontend

```bash
cd ..
npm install
cd civilifiyKBwithScraper
npm install
```

Create `civilifiyKBwithScraper/.env.local`:

```
REACT_APP_API_BASE=http://localhost:4000
```

Run the app:

```bash
npm start
```

## Import Process

1. Create a JSON file following `docs/JSON_ENTRY_CREATION_GUIDE.md`.
2. Open the app and click "Import Entries".
3. Select your file (use `docs/test_entry.json` to try it out).
4. Review validation messages and confirm import.

Scraping automation tools are available via the "Scrape Entries" and "Scrape Batches" modals.

## AI Generation Tips

When using GPT or other AI tools for entry creation:

1.  **Provide Comprehensive Context:** Include `docs/JSON_ENTRY_CREATION_GUIDE.md`.
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

> **Important:** Always validate against `docs/JSON_ENTRY_CREATION_GUIDE.md`.

## Support

*   **Technical Issues:** Check browser console and server logs.
*   **Content Questions:** See the guides in `docs/`.
*   **Import Problems:** Try `docs/test_entry.json` to isolate issues.
*   **Database Issues:** Confirm PostgreSQL is running and `DATABASE_URL` is correct.

---

