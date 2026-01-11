#!/usr/bin/env node
import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL in .env.local');
  process.exit(1);
}

console.log('Running Referral Notifications Migration');
console.log('='.repeat(50));

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    const sql = readFileSync(
      join(__dirname, 'migrations', '062_referral_notifications.sql'),
      'utf8'
    );

    console.log('Running 062_referral_notifications.sql...');
    await client.query(sql);
    console.log('Success!\n');

    // Verify table exists
    const { rows } = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_name = 'referral_notifications'
    `);
    console.log(`Verified: referral_notifications table exists`);

    console.log('='.repeat(50));
    console.log('Migration complete!');
    console.log('\nNew table: referral_notifications');
    console.log('New functions:');
    console.log('  - get_referral_notifications()');
    console.log('  - mark_notifications_read()');
    console.log('  - create_referral_notification()');
    console.log('New triggers:');
    console.log('  - trigger_notify_referrer_on_application');
    console.log('  - trigger_notify_on_tier_change');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
