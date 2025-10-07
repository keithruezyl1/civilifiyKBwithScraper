const { query } = require('./db');

/**
 * Script to check for potential duplicate entry IDs and data integrity issues
 * Run this to diagnose the entry loss problem
 */
async function checkDuplicateEntries() {
  try {
    console.log('🔍 Checking for duplicate entry IDs and data integrity issues...\n');

    // 1. Check for duplicate entry_ids
    const duplicateIds = await query(`
      SELECT entry_id, COUNT(*) as count 
      FROM kb_entries 
      GROUP BY entry_id 
      HAVING COUNT(*) > 1
    `);

    if (duplicateIds.rows.length > 0) {
      console.log('❌ Found duplicate entry IDs:');
      duplicateIds.rows.forEach(row => {
        console.log(`   - ${row.entry_id}: ${row.count} entries`);
      });
    } else {
      console.log('✅ No duplicate entry IDs found');
    }

    // 2. Check total entry count
    const totalCount = await query('SELECT COUNT(*) as count FROM kb_entries');
    console.log(`\n📊 Total entries in database: ${totalCount.rows[0].count}`);

    // 3. Check entries by creation date
    const recentEntries = await query(`
      SELECT entry_id, title, type, created_at, updated_at 
      FROM kb_entries 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    console.log('\n📅 Most recent 10 entries:');
    recentEntries.rows.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.entry_id} - ${entry.title} (${entry.type})`);
      console.log(`      Created: ${entry.created_at}, Updated: ${entry.updated_at}`);
    });

    // 4. Check for entries with same type and law_family (potential duplicates)
    const potentialDuplicates = await query(`
      SELECT type, law_family, COUNT(*) as count 
      FROM kb_entries 
      WHERE law_family IS NOT NULL 
      GROUP BY type, law_family 
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);

    if (potentialDuplicates.rows.length > 0) {
      console.log('\n⚠️  Potential duplicate content (same type + law_family):');
      potentialDuplicates.rows.forEach(row => {
        console.log(`   - ${row.type}: ${row.law_family} (${row.count} entries)`);
      });
    } else {
      console.log('\n✅ No potential duplicate content found');
    }

    // 5. Check entry ID patterns
    const idPatterns = await query(`
      SELECT 
        CASE 
          WHEN entry_id LIKE 'RA%' THEN 'RA (Statute)'
          WHEN entry_id LIKE 'RPC%' THEN 'RPC (Penal Code)'
          WHEN entry_id LIKE 'ROC%' THEN 'ROC (Rules of Court)'
          WHEN entry_id LIKE 'CEBU%' THEN 'CEBU (City Ordinance)'
          WHEN entry_id LIKE 'PNP%' THEN 'PNP (SOP)'
          WHEN entry_id LIKE 'INC%' THEN 'INC (Incident)'
          WHEN entry_id LIKE 'CONST%' THEN 'CONST (Constitution)'
          ELSE 'Other'
        END as pattern,
        COUNT(*) as count
      FROM kb_entries 
      GROUP BY pattern 
      ORDER BY count DESC
    `);

    console.log('\n🏷️  Entry ID patterns:');
    idPatterns.rows.forEach(row => {
      console.log(`   - ${row.pattern}: ${row.count} entries`);
    });

    console.log('\n✅ Database integrity check completed!');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

// Run the check if this script is executed directly
if (require.main === module) {
  checkDuplicateEntries().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { checkDuplicateEntries };
