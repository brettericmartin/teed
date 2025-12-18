import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://postgres.jvljmfdroozexzodqupg:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Creating oauth_sessions table...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS oauth_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        session_token TEXT NOT NULL UNIQUE,
        supabase_access_token TEXT NOT NULL,
        supabase_refresh_token TEXT NOT NULL,
        client_id TEXT NOT NULL,
        scope TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        last_used_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_oauth_sessions_session_token ON oauth_sessions(session_token)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_oauth_sessions_user_id ON oauth_sessions(user_id)
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
