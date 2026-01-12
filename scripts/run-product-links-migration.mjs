#!/usr/bin/env node
/**
 * Run the product links migration
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
    console.log('Running migration 076_product_links.sql...\n');

    const sql = readFileSync(
      join(__dirname, 'migrations', '076_product_links.sql'),
      'utf-8'
    );

    await pool.query(sql);

    console.log('✅ Migration completed successfully!\n');

    // Verify the columns exist
    const { rows } = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'discovered_products'
      AND column_name IN ('product_links', 'buy_url', 'source_link')
      ORDER BY column_name
    `);

    console.log('Verified columns:');
    for (const row of rows) {
      console.log(`  - ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'none'})`);
    }

    // Show sample products with links
    const { rows: samples } = await pool.query(`
      SELECT product_name, brand, buy_url, product_links
      FROM discovered_products
      WHERE buy_url IS NOT NULL OR product_links != '[]'::jsonb
      LIMIT 5
    `);

    if (samples.length > 0) {
      console.log('\nSample products with links:');
      for (const row of samples) {
        console.log(`  - ${row.product_name} (${row.brand})`);
        if (row.buy_url) console.log(`    Buy URL: ${row.buy_url}`);
        if (row.product_links && row.product_links.length > 0) {
          console.log(`    Product Links: ${row.product_links.length} links`);
        }
      }
    } else {
      console.log('\nNo products with links yet (run discovery to populate)');
    }

  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
