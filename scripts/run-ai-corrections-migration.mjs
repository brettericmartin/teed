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
    console.log('Running ai_corrections migration...\n');

    // Connect to database
    await client.connect();
    console.log('Connected to database\n');

    // Read the migration file
    const migrationPath = join(__dirname, 'migrations', 'ai_corrections_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('AI corrections migration completed successfully!\n');
    console.log('Created:');
    console.log('   - ai_corrections table');
    console.log('   - Indexes for correction_type, created_at, brand, learned_at');

    // Verify the migration
    console.log('\nVerifying migration...\n');

    // Check table exists
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_name = 'ai_corrections'
    `);

    if (tables.length > 0) {
      console.log('✓ ai_corrections table exists');
    } else {
      console.log('✗ ai_corrections table NOT found!');
    }

    // Check columns
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'ai_corrections'
      ORDER BY ordinal_position
    `);

    console.log(`\nTable has ${columns.length} columns:`);
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    // Check indexes
    const { rows: indexes } = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'ai_corrections'
    `);

    console.log(`\nCreated ${indexes.length} indexes:`);
    indexes.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
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
