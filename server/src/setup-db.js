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
      join(__dirname, '../sql/002_match_fn.sql'),
      join(__dirname, '../sql/003_migrate_add_created_by.sql'),
      join(__dirname, '../sql/004_shared_plans.sql'),
      join(__dirname, '../sql/005_simple_passwords.sql'),
      join(__dirname, '../sql/006_kb_entries_extend.sql'),
      join(__dirname, '../sql/012_trgm_lexical.sql'),
      join(__dirname, '../sql/013_fulltext.sql'),
      // Scraping automation tables and supportive data
      join(__dirname, '../sql/017_scraping_automation.sql'),
      join(__dirname, '../sql/018_populate_subtypes.sql'),
      join(__dirname, '../sql/019_slim_kb_entries.sql'),
      // Idempotent post-initial migrations
      join(__dirname, '../sql/007_add_created_by_name.sql'),
      join(__dirname, '../sql/008_add_verified.sql'),
      join(__dirname, '../sql/011_notifications.sql'),
    ];

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
        await client.query(sql);
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

