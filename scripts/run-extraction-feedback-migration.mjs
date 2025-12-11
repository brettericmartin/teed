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

console.log('Starting Extraction Feedback Migration');
console.log('='.repeat(60));
console.log('Connecting to database...\n');

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Read the migration file
    const sql = readFileSync(
      join(__dirname, 'migrations', '042_create_extraction_feedback.sql'),
      'utf8'
    );

    console.log('Executing migration...\n');

    // Execute the SQL
    await client.query(sql);

    console.log('Migration completed successfully!\n');
    return true;
  } catch (error) {
    console.error('Migration failed:');
    console.error(error.message);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    return false;
  } finally {
    await client.end();
  }
}

runMigration().then(success => {
  if (success) {
    console.log('='.repeat(60));
    console.log('Extraction Feedback table created!');
    console.log('='.repeat(60));
    console.log('\nNew features:');
    console.log('  - extraction_feedback table for learning loop');
    console.log('  - extraction_metadata column on content_ideas');
    console.log('  - validated_products column on content_ideas');
    console.log('  - validation_status tracking columns');
    process.exit(0);
  } else {
    process.exit(1);
  }
});
