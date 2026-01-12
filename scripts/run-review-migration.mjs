#!/usr/bin/env node
/**
 * Run the review status migration
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    console.log('Running migration 075_discovery_review_status.sql...\n');

    const sql = readFileSync(
      join(__dirname, 'migrations', '075_discovery_review_status.sql'),
      'utf-8'
    );

    await pool.query(sql);

    console.log('✅ Migration completed successfully!\n');

    // Verify the columns exist
    const { rows } = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'discovered_products'
      AND column_name IN ('review_status', 'reviewed_at', 'reviewed_by', 'specs', 'price_range')
      ORDER BY column_name
    `);

    console.log('Verified columns:');
    for (const row of rows) {
      console.log(`  - ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'none'})`);
    }

    // Count products by review status
    const { rows: counts } = await pool.query(`
      SELECT review_status, COUNT(*) as count
      FROM discovered_products
      GROUP BY review_status
      ORDER BY review_status
    `);

    console.log('\nProducts by review status:');
    for (const row of counts) {
      console.log(`  - ${row.review_status}: ${row.count}`);
    }

  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
