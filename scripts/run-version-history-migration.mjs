#!/usr/bin/env node
/**
 * Run the version history migration
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL or SUPABASE_DB_URL environment variable is required');
  process.exit(1);
}

async function runMigration() {
  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '066_version_history.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running version history migration...');
    await client.query(migrationSQL);

    console.log('Migration completed successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('bag_version_history', 'item_version_history')
      ORDER BY table_name
    `);

    console.log('\nTables created:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // Verify new columns on bags table
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'bags'
      AND column_name IN ('last_major_update', 'update_count', 'version_number')
      ORDER BY column_name
    `);

    console.log('\nNew columns on bags table:');
    columnsResult.rows.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));

    // Verify new columns on bag_items table
    const itemColumnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'bag_items'
      AND column_name IN ('replaced_item_id', 'replacement_reason', 'added_at')
      ORDER BY column_name
    `);

    console.log('\nNew columns on bag_items table:');
    itemColumnsResult.rows.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));

  } catch (error) {
    console.error('Migration failed:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

runMigration();
