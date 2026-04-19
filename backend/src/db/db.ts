import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL is missing from environment variables!");
}

const pool = new Pool({
  connectionString,
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('Error executing query', { text, err });
    throw err;
  }
};

export const getClient = async () => {
    const client = await pool.connect();
    return client;
}
