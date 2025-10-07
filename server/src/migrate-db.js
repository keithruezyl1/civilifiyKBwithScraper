import 'dotenv/config';
import { readFileSync } from 'fs';
import { query } from './db.js';

async function runMigration() {
  try {
    console.log('Running database migration...');
    
    // Read and execute migration SQLs (idempotent)
    const files = [
      './sql/007_add_created_by_name.sql',
      './sql/008_add_verified.sql',
      './sql/009_fix_verification_schema.sql',
    ];
    const migrationSQL = files.map((f) => readFileSync(f, 'utf8')).join('\n');
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await query(statement);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
