#!/usr/bin/env node

/**
 * Run migration: Create product_library table
 * Run: node scripts/run-product-library-migration.mjs
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

    console.log('\n🔄 Running migration: Create product_library table...');
    console.log('-'.repeat(80));

    // Create the table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_library (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          url TEXT NOT NULL,
          url_hash TEXT NOT NULL,
          domain TEXT NOT NULL,
          brand TEXT,
          product_name TEXT,
          full_name TEXT,
          category TEXT,
          description TEXT,
          price TEXT,
          image_url TEXT,
          specifications TEXT[],
          confidence REAL NOT NULL DEFAULT 0.0,
          source TEXT NOT NULL,
          scrape_successful BOOLEAN NOT NULL DEFAULT true,
          hit_count INTEGER NOT NULL DEFAULT 0,
          last_hit_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log('✅ Created product_library table');

    // Create unique index on url_hash
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_product_library_url_hash
          ON product_library(url_hash);
    `);
    console.log('✅ Created unique index on url_hash');

    // Create index on domain
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_product_library_domain
          ON product_library(domain);
    `);
    console.log('✅ Created index on domain');

    // Create index on confidence
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_product_library_confidence
          ON product_library(confidence DESC) WHERE confidence >= 0.7;
    `);
    console.log('✅ Created index on confidence');

    // Create index on created_at
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_product_library_created_at
          ON product_library(created_at DESC);
    `);
    console.log('✅ Created index on created_at');

    // Enable RLS
    await client.query(`
      ALTER TABLE product_library ENABLE ROW LEVEL SECURITY;
    `);
    console.log('✅ Enabled RLS');

    // Create policies (drop first if exist)
    await client.query(`
      DROP POLICY IF EXISTS "Allow authenticated read" ON product_library;
      CREATE POLICY "Allow authenticated read" ON product_library
          FOR SELECT TO authenticated USING (true);
    `);
    console.log('✅ Created read policy');

    await client.query(`
      DROP POLICY IF EXISTS "Service role can insert" ON product_library;
      CREATE POLICY "Service role can insert" ON product_library
          FOR INSERT TO service_role WITH CHECK (true);
    `);
    console.log('✅ Created insert policy');

    await client.query(`
      DROP POLICY IF EXISTS "Service role can update" ON product_library;
      CREATE POLICY "Service role can update" ON product_library
          FOR UPDATE TO service_role USING (true);
    `);
    console.log('✅ Created update policy');

    // Create updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_product_library_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = now();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Created trigger function');

    // Create trigger
    await client.query(`
      DROP TRIGGER IF EXISTS update_product_library_timestamp ON product_library;
      CREATE TRIGGER update_product_library_timestamp
          BEFORE UPDATE ON product_library
          FOR EACH ROW
          EXECUTE FUNCTION update_product_library_updated_at();
    `);
    console.log('✅ Created trigger');

    // Grant permissions
    await client.query(`
      GRANT SELECT ON product_library TO authenticated;
    `);
    console.log('✅ Granted SELECT to authenticated');

    await client.query(`
      GRANT ALL ON product_library TO service_role;
    `);
    console.log('✅ Granted ALL to service_role');

    console.log('\n📋 Migration completed successfully!');
    console.log('   - Created product_library table');
    console.log('   - Created indexes for fast lookup');
    console.log('   - Enabled RLS with appropriate policies\n');

    // Verify the table exists
    const { rows } = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'product_library'
      ORDER BY ordinal_position
    `);

    if (rows.length > 0) {
      console.log('✅ Verification: product_library table exists with columns:');
      rows.forEach(row => console.log(`   - ${row.column_name}: ${row.data_type}`));
    } else {
      console.log('⚠️  Warning: Could not verify product_library table\n');
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
