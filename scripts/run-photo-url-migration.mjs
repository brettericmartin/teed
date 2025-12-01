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
    console.log('📸 Running Photo URL Migration...\n');
    await client.connect();

    // First, check if column exists
    const checkResult = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'bag_items' AND column_name = 'photo_url'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ photo_url column already exists on bag_items');
    } else {
      console.log('Adding photo_url column to bag_items...');
      await client.query('ALTER TABLE bag_items ADD COLUMN photo_url TEXT');
      console.log('✅ photo_url column added successfully!');
    }

    // Show current column structure
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'bag_items'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 bag_items columns:');
    columnsResult.rows.forEach(row => {
      console.log(`  • ${row.column_name} (${row.data_type})`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
