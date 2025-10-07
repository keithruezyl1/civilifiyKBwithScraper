import { Client } from 'pg';

// Test different username variations
const usernameVariations = [
  'civilifynewkb_user',     // No space
  'civilify newkb_user',    // With space
  'civilifynewkb_user',     // Alternative
  'civilifynewkb_user'      // Another variation
];

const password = 'shTolPqR8ExN1Y41v2H2ByPjbcRnT06T';
const host = 'dpg-d3hh94pr0fns73cd32dg-a.oregon-postgres.render.com';
const database = 'civilifynewkb';

async function testUsernameVariations() {
  console.log('🔍 Testing different username variations...');
  console.log('🔑 Using password:', password);
  console.log('🌐 Host:', host);
  console.log('📊 Database:', database);
  console.log('');

  for (let i = 0; i < usernameVariations.length; i++) {
    const username = usernameVariations[i];
    const connectionString = `postgresql://${username}:${password}@${host}:5432/${database}?sslmode=require`;
    
    console.log(`🧪 Test ${i + 1}: Testing username "${username}"`);
    
    const client = new Client({ connectionString });
    
    try {
      await client.connect();
      console.log(`✅ SUCCESS! Username "${username}" works!`);
      
      // Test a simple query
      const result = await client.query('SELECT NOW() as current_time');
      console.log(`⏰ Database time: ${result.rows[0].current_time}`);
      
      await client.end();
      console.log('🎉 Found the correct username!');
      return username;
      
    } catch (error) {
      console.log(`❌ Failed with username "${username}": ${error.message}`);
      console.log('');
    }
  }
  
  console.log('❌ None of the username variations worked.');
  console.log('💡 Please check your Render dashboard for the exact username.');
}

testUsernameVariations();
