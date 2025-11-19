#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
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

async function runMigration() {
  console.log('🔄 Running migration 010: Add featured items support...\n');

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the migration file
    const migrationPath = join(__dirname, 'migrations', '010_add_featured_items.sql');
    const migration = readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    await client.query(migration);

    console.log('✅ Migration 010 completed successfully!');
    console.log('\nAdded to bag_items table:');
    console.log('  - is_featured (boolean, default false)');
    console.log('  - featured_position (integer, 1-8)');
    console.log('  - Index: idx_bag_items_featured');
    console.log('  - Constraint: chk_featured_position');

    // Verify the migration
    const { rows } = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'bag_items'
      AND column_name IN ('is_featured', 'featured_position')
      ORDER BY column_name;
    `);

    console.log('\n📋 Verification:');
    rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.column_default || 'no default'})`);
    });

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
