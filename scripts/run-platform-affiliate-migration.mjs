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
    console.log('📚 Running platform affiliate settings migration...\n');
    await client.connect();

    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '017_create_platform_affiliate_settings.sql'),
      'utf8'
    );

    await client.query(migrationSQL);

    console.log('✅ Platform affiliate settings migration completed!\n');
    console.log('📊 Created platform_affiliate_settings table with default networks:');
    console.log('   • Amazon Associates');
    console.log('   • Impact.com');
    console.log('   • CJ Affiliate');
    console.log('   • Rakuten Advertising');
    console.log('   • ShareASale');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
