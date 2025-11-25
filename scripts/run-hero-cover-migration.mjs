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
    console.log('Running hero and cover photo migration...');

    const migrationPath = join(__dirname, 'migrations/032_add_hero_and_cover.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    await client.query(sql);

    console.log('Migration completed successfully!');

    // Verify columns exist
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'bags'
      AND column_name IN ('hero_item_id', 'cover_photo_id')
      ORDER BY column_name;
    `);

    console.log('New columns added:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
