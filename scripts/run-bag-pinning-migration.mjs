#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL in .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🚀 Running Bag Pinning Migration...\n');
    await client.connect();

    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '029_add_bag_pinning.sql'),
      'utf8'
    );

    await client.query(migrationSQL);

    console.log('✅ Migration executed successfully!\n');
    console.log('Added to bags table:');
    console.log('  • is_pinned - Pin status for bags');
    console.log('  • pinned_at - Timestamp when pinned');
    console.log('\nNew function created:');
    console.log('  • toggle_bag_pin(bag_id, user_id) - Pin/unpin bags (max 3)');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
