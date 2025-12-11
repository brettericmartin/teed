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
    console.log('Running cover photo aspect ratio migration...');

    const migrationPath = join(__dirname, 'migrations/043_add_cover_aspect_ratio.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    await client.query(sql);

    console.log('Migration completed successfully!');

    // Verify column exists
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'bags'
      AND column_name = 'cover_photo_aspect'
    `);

    if (result.rows.length > 0) {
      console.log('New column added:');
      console.log(`  - ${result.rows[0].column_name}: ${result.rows[0].data_type} (default: ${result.rows[0].column_default})`);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
