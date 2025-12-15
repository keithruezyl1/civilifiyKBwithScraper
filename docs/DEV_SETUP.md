# Law Entry App – Dev Setup Cheat Sheet

Quick path for a new teammate to stand up the full stack locally (frontend, Node backend, PostgreSQL + pgvector in Docker).

## 1. Prerequisites
- Node.js 18+ and npm 9+
- Docker Desktop (or Docker Engine + Compose v2)
- Git + a terminal with access to Bash or PowerShell

## 2. Clone & Inspect the Repo
```bash
git clone git@github.com:your-org/law-entry-app.git
cd law-entry-app/civilifiyKBwithScraper
```
Key directories:
- `src/` React UI
- `server/` Express API + migrations in `server/sql/`
- `docs/` Authoring guides (this file lives here)

## 3. Bring Up PostgreSQL (with pgvector)
From the repo root (`law-entry-app/`), start the bundled Docker Compose stack:
```bash
docker-compose up -d
```
Details (see `README.local.md` for more):
- Database: `law_entry_db`
- User/password: `postgres` / `postgres`
- Port: `5432`
- Data volume: `postgres_data` (persists across restarts)

Useful commands:
- Stop: `docker-compose down`
- Reset data: `docker-compose down -v`
- PSQL shell: `docker exec -it law_entry_postgres psql -U postgres -d law_entry_db`

## 4. Configure the Backend API
```bash
cd civilifiyKBwithScraper/server
npm install
cp .env.example .env   # if the file exists, otherwise create manually
```
Minimum `.env` contents:
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/law_entry_db
PGSSL=false
CORS_ORIGIN=http://localhost:3000
# Optional for embeddings / enrichment:
# OPENAI_API_KEY=sk-...
```
Initialize and run:
```bash
npm run start   # runs setup-db (migrations + seed) then boots the API on :4000
```
Handy scripts:
- `npm run setup-db` – rerun schema creation/migrations only
- `npm run migrate` – execute pending SQL in `server/sql/`
- `npm run reindex` – rebuild embeddings (requires OpenAI key)

## 5. Start the React Frontend
```bash
cd ..
npm install
cat <<'EOF' > .env.local
REACT_APP_API_BASE=http://localhost:4000
EOF
npm start   # CRA dev server on http://localhost:3000
```

## 6. Verify the Environment
- Visit `http://localhost:3000`, log in with any test credentials already configured (see teammates for seeded admin user).
- Use the “Import Entries” modal with `docs/test_entry.json` to confirm the API + DB roundtrip.
- Watch backend logs for migrations (`server/sql/*.sql`) to ensure the schema is up to date.

## 7. Daily Workflow Tips
- Keep Docker running so the DB stays available; `docker ps` should show `law_entry_postgres`.
- When changing SQL, add a new file under `server/sql/` instead of editing older migrations.
- Run `npm test` (frontend) and any targeted server scripts before opening a PR.
- Refer to `docs/` for data-authoring rules and sample payloads.

That’s it—once Docker, the server, and CRA are all running you have a full local environment for iterating on importer features, scraping utilities, and UI work.



