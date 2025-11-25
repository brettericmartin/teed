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
    console.log('🚀 Running Profile Enhancement Migration...\n');
    await client.connect();

    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '028_enhance_profiles.sql'),
      'utf8'
    );

    await client.query(migrationSQL);

    console.log('✅ Migration executed successfully!\n');
    console.log('Added to profiles table:');
    console.log('  • banner_url - Cover/banner image');
    console.log('  • social_links - Instagram, Twitter, YouTube, etc.');
    console.log('  • total_views, total_bags, total_followers - Stats cache');
    console.log('  • is_verified, badges - Verification and badges');
    console.log('\nNew functions created:');
    console.log('  • update_profile_stats(user_id)');
    console.log('  • get_profile_with_stats(handle)');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
