import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;

// Enable SSL when using Render or when sslmode=require is present
const ssl = connectionString &&
  (connectionString.includes('render.com') || connectionString.includes('sslmode=require'))
  ? { rejectUnauthorized: false }
  : undefined;

const pool = new Pool({
  connectionString,
  ssl,
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

export { pool };
