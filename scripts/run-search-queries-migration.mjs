#!/usr/bin/env node
/**
 * Run the search queries migration
 */

import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env.local');
if (existsSync(envPath)) {
  config({ path: envPath });
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL environment variable');
  process.exit(1);
}

async function runMigration() {
  console.log('Running search queries migration...\n');

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to database\n');

  const migrationPath = join(__dirname, 'migrations', '041_create_search_queries.sql');
  const sql = readFileSync(migrationPath, 'utf8');

  try {
    // Run the entire migration as a single transaction
    await client.query(sql);
    console.log('✓ Migration SQL executed successfully');

    // Verify
    const result = await client.query(
      'SELECT id, query, vertical, query_type FROM content_search_queries LIMIT 5'
    );

    console.log(`\n✓ Found ${result.rows.length} seed queries in database`);

    if (result.rows.length > 0) {
      console.log('\nSample queries:');
      result.rows.forEach(q => {
        console.log(`  - [${q.vertical}] ${q.query} (${q.query_type})`);
      });
    }
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
