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
    console.log('🏷️  Running Tags Migration...\n');
    await client.connect();

    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '031_add_tags_to_bags.sql'),
      'utf8'
    );

    await client.query(migrationSQL);

    console.log('✅ Migration executed successfully!\n');
    console.log('Added to bags table:');
    console.log('  • tags (jsonb array) - Tag keywords for search');
    console.log('  • GIN index for efficient tag searching');
    console.log('  • Index for category + public filtering');
    console.log('\nNew function created:');
    console.log('  • search_bags_by_tags(tag_array) - Find bags by tags');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
