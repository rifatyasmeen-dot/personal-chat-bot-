// Shared Postgres (Supabase) connection for personal-bot. Reads DATABASE_URL from the
// environment (.env locally, Vercel project env vars in production). Never hard-code the
// connection string here.
require("dotenv").config();
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env and fill it in.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = { pool };
