#!/usr/bin/env node

/**
 * Migration runner for 065_bag_sections.sql
 * Creates bag_sections table and adds section_id to bag_items
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL or SUPABASE_DB_URL environment variable is required');
  process.exit(1);
}

async function runMigration() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '065_bag_sections.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration 065_bag_sections.sql...\n');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('Migration completed successfully!\n');

    // Verify the changes
    console.log('Verifying changes...\n');

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'bag_sections'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('  bag_sections table created');
    } else {
      console.log('  WARNING: bag_sections table not found');
    }

    // Check if column was added
    const columnCheck = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'bag_items' AND column_name = 'section_id';
    `);

    if (columnCheck.rows.length > 0) {
      console.log('  section_id column added to bag_items');
    } else {
      console.log('  WARNING: section_id column not found in bag_items');
    }

    // Get columns of bag_sections table
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bag_sections'
      ORDER BY ordinal_position;
    `);

    console.log('\nbag_sections table columns:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error('Migration failed:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

runMigration();
