import { Client } from 'pg';

// Test database connection with correct password
const client = new Client({
  connectionString: 'postgresql://civilifynewkb_user:shTolPqR8ExN1Y41v2H2ByPjbcRnT06T@dpg-d3hh94pr0fns73cd32dg-a.oregon-postgres.render.com/civilifynewkb?sslmode=require'
});

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    await client.connect();
    console.log('✅ Connected to database successfully!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Current database time:', result.rows[0].current_time);
    
    // Check if our tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    await client.end();
    console.log('🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
