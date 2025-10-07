import { writeFileSync } from 'fs';

// Copy the .env file from the parent directory to the server directory
const envContent = `JWT_SECRET=civilify-super-secret-jwt-key-2024
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://civilifynewkb_user:shTolPqR8ExN1Y41v2H2ByPjbcRnT06T@dpg-d3hh94pr0fns73cd32dg-a.oregon-postgres.render.com/civilifynewkb?sslmode=require
NODE_ENV=development
OPENAI_API_KEY=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
`;

console.log('📝 Creating .env file in server directory...');
writeFileSync('.env', envContent);
console.log('✅ .env file created successfully!');
console.log('🔑 Database URL:', 'postgresql://civilifynewkb_user:shTolPqR8ExN1Y41v2H2ByPjbcRnT06T@dpg-d3hh94pr0fns73cd32dg-a.oregon-postgres.render.com/civilifynewkb?sslmode=require');
console.log('🤖 OpenAI API Key:', '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');
