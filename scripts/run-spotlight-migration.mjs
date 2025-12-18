#!/usr/bin/env node

/**
 * Run migration: Add is_spotlight column to bags
 * Run: node scripts/run-spotlight-migration.mjs
 */

import dotenv from 'dotenv';
import pg from 'pg';
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

    console.log('\n🔄 Running migration: Add is_spotlight column to bags...');
    console.log('-'.repeat(80));

    // Add the column
    await client.query(`
      ALTER TABLE bags ADD COLUMN IF NOT EXISTS is_spotlight BOOLEAN DEFAULT false;
    `);
    console.log('✅ Added is_spotlight column');

    // Create index for efficient spotlight queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bags_spotlight ON bags(is_spotlight) WHERE is_spotlight = true;
    `);
    console.log('✅ Created index idx_bags_spotlight');

    // Create index for category + spotlight queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bags_category_spotlight ON bags(category, is_spotlight) WHERE is_spotlight = true;
    `);
    console.log('✅ Created index idx_bags_category_spotlight');

    console.log('\n📋 Migration completed successfully!');
    console.log('   - Added `is_spotlight` column to bags table');
    console.log('   - Type: boolean (default false)');
    console.log('   - Created indexes for efficient queries\n');

    // Verify the column exists
    const { rows } = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'bags' AND column_name = 'is_spotlight'
    `);

    if (rows.length > 0) {
      console.log('✅ Verification: is_spotlight column exists');
      console.log(`   Type: ${rows[0].data_type}, Default: ${rows[0].column_default}\n`);
    } else {
      console.log('⚠️  Warning: Could not verify is_spotlight column\n');
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
