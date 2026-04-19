import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
