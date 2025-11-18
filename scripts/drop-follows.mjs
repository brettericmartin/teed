#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL in .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function dropFollows() {
  try {
    console.log('🗑️  Dropping follows table and related objects...\n');

    await client.connect();

    // Drop everything in reverse order
    const dropSQL = `
      DROP FUNCTION IF EXISTS is_following(uuid, uuid) CASCADE;
      DROP FUNCTION IF EXISTS get_following_count(uuid) CASCADE;
      DROP FUNCTION IF EXISTS get_follower_count(uuid) CASCADE;
      DROP TABLE IF EXISTS follows CASCADE;
    `;

    await client.query(dropSQL);

    console.log('✅ Successfully dropped follows table and related objects!');

  } catch (error) {
    console.error('❌ Drop failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

dropFollows();
