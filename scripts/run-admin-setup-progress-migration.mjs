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
    console.log('Running admin_setup_progress migration (045)...\n');

    // Connect to database
    await client.connect();
    console.log('Connected to database\n');

    // Read the migration file
    const migrationPath = join(__dirname, 'migrations', '045_create_admin_setup_progress.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('Admin setup progress migration completed successfully!\n');
    console.log('Created:');
    console.log('   - admin_setup_progress table');
    console.log('   - Index on guide_type');
    console.log('   - RLS policy for service role access');
    console.log('   - Trigger for updated_at timestamp');

    // Verify the migration
    console.log('\nVerifying migration...\n');

    // Check table exists
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_name = 'admin_setup_progress'
    `);

    if (tables.length > 0) {
      console.log('admin_setup_progress table exists');
    } else {
      console.log('admin_setup_progress table not found');
    }

    // Check columns
    const { rows: columns } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'admin_setup_progress'
      ORDER BY ordinal_position
    `);

    console.log(`Table columns: ${columns.map(c => c.column_name).join(', ')}`);

    console.log('\nDone!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
