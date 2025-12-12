#!/usr/bin/env node
import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL in .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database');
    console.log('Running unrecognized domains migration...');

    const migrationPath = join(__dirname, 'migrations/044_create_unrecognized_domains.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    await client.query(sql);

    console.log('Migration completed successfully!');

    // Verify table exists
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'unrecognized_domains'
    `);

    if (result.rows.length > 0) {
      console.log('Table created: unrecognized_domains');
    }

    // Show column info
    const columns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'unrecognized_domains'
      ORDER BY ordinal_position
    `);

    console.log('\nColumns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
