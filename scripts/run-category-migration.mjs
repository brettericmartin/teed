#!/usr/bin/env node

/**
 * Run Category Migration
 * Adds category field to bags table
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const { Client } = pg;

async function runMigration() {
  console.log('📦 Running bag category migration...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration SQL
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations/005_add_bag_category.sql'),
      'utf-8'
    );

    console.log('\n📝 Executing migration SQL...');
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Verifying schema...');

    // Verify the column was added
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'bags' AND column_name = 'category';
    `);

    if (result.rows.length > 0) {
      console.log('✅ Category column added:');
      console.log(`   - Column: ${result.rows[0].column_name}`);
      console.log(`   - Type: ${result.rows[0].data_type}`);
    } else {
      console.log('⚠️  Warning: Category column not found');
    }

    // Check index
    const indexResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'bags' AND indexname = 'idx_bags_category';
    `);

    if (indexResult.rows.length > 0) {
      console.log('✅ Category index created: idx_bags_category');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

runMigration();
