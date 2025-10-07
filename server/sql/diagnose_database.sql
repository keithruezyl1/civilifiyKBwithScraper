-- Diagnostic script to check database state
-- Run this first to see what's happening

-- 1. Check if the table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'kb_entries';

-- 2. Check current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'kb_entries'
ORDER BY ordinal_position;

-- 3. Check if we have permissions
SELECT has_table_privilege('kb_entries', 'ALTER') as can_alter_table;

-- 4. Check current user and schema
SELECT current_user, current_schema();

-- 5. Check if the table has any data
SELECT COUNT(*) as total_rows FROM kb_entries;
