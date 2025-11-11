import dotenv from 'dotenv';
dotenv.config();
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabase() {
  console.log('setupDatabase function called');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('PGSSL:', process.env.PGSSL);
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Attempting to connect to database...');
    await client.connect();
    console.log('Connected to database');

    // Read and execute SQL files
    const sqlFiles = [
      join(__dirname, '../sql/000_base_schema.sql'),
      join(__dirname, '../sql/001_init.sql'),
      // Ensure pgvector extension, embedding column and index are present
      join(__dirname, '../sql/028_enable_pgvector.sql'),
      // Normalize types if coming from older schema
      join(__dirname, '../sql/029_convert_tags_textarray.sql'),
      join(__dirname, '../sql/002_match_fn.sql'),
      // Archived: 003, 004, 005 (no longer needed for baseline setup)
      // IMPORTANT: Skip legacy 006 extension (causes excessive columns). Newer migrations add only required fields.
      join(__dirname, '../sql/012_trgm_lexical.sql'),
    ];

    // By default, DO NOT run rebuild migration (protects existing data).
    // To allow a controlled rebuild, set ALLOW_REBUILD=true in environment.
    if (process.env.ALLOW_REBUILD === 'true') {
      console.log('ALLOW_REBUILD=true detected: including 025_rebuild_kb_entries.sql (may drop and recreate kb_entries)');
      sqlFiles.push(join(__dirname, '../sql/025_rebuild_kb_entries.sql'));
    } else {
      console.log('Skipping 025_rebuild_kb_entries.sql to protect existing data. Set ALLOW_REBUILD=true to enable.');
    }

    // Continue with idempotent, non-destructive migrations
    sqlFiles.push(
      join(__dirname, '../sql/026_ensure_enrichment_columns.sql'),
      // Scraping automation tables and supportive data (runs AFTER rebuild)
      join(__dirname, '../sql/017_scraping_automation.sql'),
      join(__dirname, '../sql/018_populate_subtypes.sql'),
      // IMPORTANT: Skip 019_slim_kb_entries to avoid dropping enrichment columns after rebuild
      join(__dirname, '../sql/020_comprehensive_enrichment.sql'),
      join(__dirname, '../sql/021_scrape_batches.sql'),
      join(__dirname, '../sql/022_add_dates.sql'),
      join(__dirname, '../sql/023_restore_subtype_fields.sql'),
      join(__dirname, '../sql/027_related_laws.sql'),
      // Skip 024_fix_array_fields: array types are created correctly by 025 rebuild
      // Idempotent post-initial migrations (archived 007/008)
      join(__dirname, '../sql/011_notifications.sql'),
    );

    console.log('SQL files to execute (in order):');
    sqlFiles.forEach(f => console.log(' -', f));

    for (const sqlFile of sqlFiles) {
      try {
        if (!existsSync(sqlFile)) {
          console.log(`Skipping (not found): ${sqlFile}`);
          continue;
        }
        console.log(`Reading file: ${sqlFile}`);
        const sql = readFileSync(sqlFile, 'utf8');
        if (!sql.trim()) {
          console.log(`Skipping (empty file): ${sqlFile}`);
          continue;
        }
        console.log(`Executing: ${sqlFile}`);
        try {
          await client.query(sql);
        } catch (err) {
          const emsg = err?.message || '';
          if (/maintenance_work_mem|work_mem|memory required/i.test(emsg)) {
            console.warn(`Low work_mem for ${sqlFile}. Retrying with higher temp settings...`);
            await client.query("SET maintenance_work_mem = '256MB'; SET work_mem = '256MB';");
            await client.query(sql);
          } else {
            throw err;
          }
        }
        console.log(`Executed ${sqlFile}`);
      } catch (error) {
        // Ignore errors for existing objects
        const msg = error?.message || '';
        if (msg.includes('already exists') || msg.includes('duplicate key value') || msg.includes('does not exist, skipping')) {
          console.log(`Skipped ${sqlFile} - ${msg}`);
        } else {
          console.error(`Error executing ${sqlFile}:`, msg);
          // Keep going to apply as many migrations as possible
        }
      }
    }

    console.log('Database setup completed');
  } catch (error) {
    console.error('Database setup failed:', error.message);
    // Don't exit process, just log the error
    console.log('Continuing with server startup...');
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore connection close errors
    }
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export default setupDatabase;

