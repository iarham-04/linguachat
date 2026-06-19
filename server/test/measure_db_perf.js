/**
 * Measure Database Query Latencies
 */
require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required. Set it in your .env file.');
  process.exit(1);
}

async function testPerf() {
  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  const startConnect = Date.now();
  const client = await pool.connect();
  console.log(`Connected to client in: ${Date.now() - startConnect}ms`);

  try {
    // 1. Sync User / Insert mock user
    const mockId = `perf_user_${Math.random().toString(36).substring(2, 8)}`;
    const startUser = Date.now();
    const userRes = await client.query(
      `INSERT INTO users (clerk_id, username, email, language, avatar) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (clerk_id) 
       DO UPDATE SET username = $2, language = $4 
       RETURNING *`,
      [mockId, 'PerfUser', `${mockId}@example.com`, 'en', '🐱']
    );
    console.log(`User Insert/Sync took: ${Date.now() - startUser}ms`);

    // 2. Room code insert (generate & insert)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const startRoom = Date.now();
    await client.query(
      'INSERT INTO rooms (code, host_id) VALUES ($1, $2)',
      [code, mockId]
    );
    console.log(`Room insertion took: ${Date.now() - startRoom}ms`);

    // Clean up
    await client.query('DELETE FROM rooms WHERE code = $1', [code]);
    await client.query('DELETE FROM users WHERE clerk_id = $1', [mockId]);
    console.log('Cleanup completed successfully.');

  } catch (err) {
    console.error('Test query failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

testPerf();
