#!/usr/bin/env node

/**
 * Run migration 007: Add brand column to bag_items
 * Run: node scripts/run-brand-migration.mjs
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration file
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '007_add_brand.sql'),
      'utf8'
    );

    console.log('\n🔄 Running migration 007: Add brand column...');
    console.log('-'.repeat(80));

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration 007 completed successfully!');
    console.log('\n📋 Changes applied:');
    console.log('   - Added `brand` column to bag_items table');
    console.log('   - Type: text (nullable)');
    console.log('   - Comment added for documentation\n');

    // Verify the column exists
    const { rows } = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bag_items' AND column_name = 'brand'
    `);

    if (rows.length > 0) {
      console.log('✅ Verification: brand column exists');
      console.log(`   Type: ${rows[0].data_type}, Nullable: ${rows[0].is_nullable}\n`);
    } else {
      console.log('⚠️  Warning: Could not verify brand column\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
