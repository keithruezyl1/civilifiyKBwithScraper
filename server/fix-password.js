import { writeFileSync } from 'fs';

// Fix the .env file with the correct password from Render dashboard
const envContent = `JWT_SECRET=civilify-super-secret-jwt-key-2024
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://civilifynewkb_user:shTolPqR8ExN1Y4lv2H2ByPjbcRnTO6T@dpg-d3hh94pr0fns73cd32dg-a.oregon-postgres.render.com/civilifynewkb?sslmode=require
NODE_ENV=development
OPENAI_API_KEY=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
`;

console.log('🔧 Fixing .env file with correct password from Render dashboard...');
console.log('🔑 Using correct password: shTolPqR8ExN1Y4lv2H2ByPjbcRnTO6T');
writeFileSync('.env', envContent);
console.log('✅ .env file updated successfully!');
console.log('🔗 DATABASE_URL now has the correct password');
