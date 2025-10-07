import { writeFileSync } from 'fs';

// Please copy the EXACT password from your Render dashboard
// and replace the password below with the correct one

const correctPassword = 'shTolPqR8ExN1Y41v2H2ByPjbcRnT06T'; // UPDATE THIS WITH YOUR ACTUAL PASSWORD

const envContent = `JWT_SECRET=civilify-super-secret-jwt-key-2024
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://civilifynewkb_user:${correctPassword}@dpg-d3hh94pr0fns73cd32dg-a.oregon-postgres.render.com/civilifynewkb?sslmode=require
OPENAI_API_KEY=your-actual-openai-api-key-here
`;

console.log('📝 Updating .env file with correct password...');
console.log('🔑 Using password:', correctPassword);

writeFileSync('.env', envContent);

console.log('✅ .env file updated successfully!');
console.log('📋 New .env content:');
console.log(envContent);
