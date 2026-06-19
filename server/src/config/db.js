/**
 * Neon PostgreSQL Connection Pool and Migrations
 */

const { Pool } = require('pg');

// Retrieve connection string from env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[Database] ERROR: DATABASE_URL is not set!');
  process.exit(1);
}

// Initialize PostgreSQL Pool
const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 300000, // Keep idle connections open for 5 minutes
  connectionTimeoutMillis: 10000, // Limit connection wait time to 10 seconds
  ssl: {
    rejectUnauthorized: false // Required for Neon connection
  }
});

/**
 * Run table migration/initialization scripts
 */
async function initDb() {
  console.log('[Database] Connecting to PostgreSQL database...');
  
  const client = await pool.connect();
  try {
    console.log('[Database] Running schemas migration...');

    // 1. Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        clerk_id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        language VARCHAR(10) NOT NULL,
        avatar VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create rooms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        code VARCHAR(6) PRIMARY KEY,
        host_id VARCHAR(255) REFERENCES users(clerk_id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        active BOOLEAN DEFAULT TRUE,
        max_users INT DEFAULT 4
      );
    `);

    // Run schema updates to support room type capacity constraints
    await client.query(`
      ALTER TABLE rooms ADD COLUMN IF NOT EXISTS max_users INT DEFAULT 4;
    `);

    // 3. Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_code VARCHAR(6) REFERENCES rooms(code) ON DELETE CASCADE,
        sender_id VARCHAR(255) REFERENCES users(clerk_id) ON DELETE CASCADE,
        original_text TEXT NOT NULL,
        translations JSONB NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        is_edited BOOLEAN DEFAULT FALSE,
        is_unsent BOOLEAN DEFAULT FALSE,
        message_type VARCHAR(20) DEFAULT 'text',
        file_name TEXT
      );
    `);

    // Run schema updates to support file sharing metadata
    await client.query(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text',
      ADD COLUMN IF NOT EXISTS file_name TEXT;
    `);

    // 4. Create performance indexes for message lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_room_code_timestamp ON messages (room_code, timestamp);
    `);

    console.log('[Database] Migration complete. All tables verified.');
  } catch (error) {
    console.error('[Database] Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDb
};
