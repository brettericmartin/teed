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
    console.log('Running team_generations migration (039)...\n');

    // Connect to database
    await client.connect();
    console.log('Connected to database\n');

    // Read the migration file
    const migrationPath = join(__dirname, 'migrations', '039_create_team_generations.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('Team generations migration completed successfully!\n');
    console.log('Created:');
    console.log('   - team_generations table');
    console.log('   - Indexes for content_idea_id and status');
    console.log('   - team_* columns on content_ideas table');
    console.log('   - RLS policies for admin access');

    // Verify the migration
    console.log('\nVerifying migration...\n');

    // Check team_generations table exists
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_name = 'team_generations'
    `);

    if (tables.length > 0) {
      console.log('✓ team_generations table exists');
    } else {
      console.log('✗ team_generations table not found');
    }

    // Check new columns on content_ideas
    const { rows: columns } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'content_ideas' AND column_name LIKE 'team_%'
    `);

    console.log(`✓ ${columns.length} team_* columns added to content_ideas`);

    console.log('\nDone!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
