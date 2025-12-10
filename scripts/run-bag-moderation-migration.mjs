#!/usr/bin/env node

/**
 * Run bag moderation migration
 * Adds is_featured, is_flagged, flag_reason, is_hidden columns to bags
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL not found in environment');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!\n');

    // Read and execute migration
    const migrationPath = path.join(__dirname, 'migrations', '037_add_bag_moderation_columns.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration 037: Add bag moderation columns...\n');
    const result = await client.query(sql);

    // Find the status message
    const statusResult = result.find(r => r.rows && r.rows[0]?.status);
    if (statusResult) {
      console.log('\n' + statusResult.rows[0].status);
    }

    // Verify columns were added
    console.log('\nVerifying columns...');
    const verifyResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'bags'
      AND column_name IN ('is_featured', 'is_flagged', 'flag_reason', 'is_hidden', 'featured_at')
      ORDER BY column_name;
    `);

    console.log('\nNew columns in bags table:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'null'})`);
    });

    console.log('\nMigration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
