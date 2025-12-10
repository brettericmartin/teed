#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL in .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('Running content_ideas stages migration (040)...\n');

    // Connect to database
    await client.connect();
    console.log('Connected to database\n');

    // Read the migration file
    const migrationPath = join(__dirname, 'migrations', '040_add_content_ideas_stages.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('Content ideas stages migration completed successfully!\n');
    console.log('Added:');
    console.log('   - New status values: discovered, screening, selected, skipped, generating, generated');
    console.log('   - New columns: discovered_at, screened_at, generated_at, screened_by_admin_id, screening_notes, extracted_products');
    console.log('   - New indexes for staged queries');

    // Verify the migration
    console.log('\nVerifying migration...\n');

    // Check columns
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'content_ideas'
      AND column_name IN ('discovered_at', 'screened_at', 'generated_at', 'screened_by_admin_id', 'screening_notes', 'extracted_products')
      ORDER BY column_name
    `);

    console.log(`New columns added: ${columns.length}`);
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    console.log('\nDone!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
