#!/usr/bin/env node
import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL in .env.local');
  process.exit(1);
}

console.log('Running Referral Leaderboard Migration');
console.log('='.repeat(50));

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    const sql = readFileSync(
      join(__dirname, 'migrations', '061_referral_leaderboard.sql'),
      'utf8'
    );

    console.log('Running 061_referral_leaderboard.sql...');
    await client.query(sql);
    console.log('Success!\n');

    // Test the functions
    console.log('Testing get_referral_leaderboard()...');
    const leaderboard = await client.query('SELECT * FROM get_referral_leaderboard(5)');
    console.log(`  Found ${leaderboard.rows.length} users with referrals\n`);

    console.log('='.repeat(50));
    console.log('Migration complete!');
    console.log('\nNew functions created:');
    console.log('  - get_referral_leaderboard(limit_count)');
    console.log('  - get_leaderboard_position(app_id)');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
