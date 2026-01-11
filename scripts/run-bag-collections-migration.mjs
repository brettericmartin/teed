#!/usr/bin/env node
/**
 * Run the bag collections migration
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
    const migrationPath = path.join(__dirname, 'migrations', '067_bag_collections.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running bag collections migration...');
    await client.query(migrationSQL);

    console.log('Migration completed successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('bag_collections', 'bag_collection_items', 'related_bags')
      ORDER BY table_name
    `);

    console.log('\nTables created:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));

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
