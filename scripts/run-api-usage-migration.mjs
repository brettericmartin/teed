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
    console.log('Running API usage tracking migration (036)...\n');

    // Connect to database
    await client.connect();
    console.log('Connected to database\n');

    // Read the migration file
    const migrationPath = join(__dirname, 'migrations', '036_create_api_usage.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('API usage migration completed successfully!\n');
    console.log('Created:');
    console.log('   - api_usage table for tracking all AI API calls');
    console.log('   - daily_usage_summaries table for dashboard performance');
    console.log('   - RLS policies for user/admin access');
    console.log('   - Helper functions: get_api_cost_summary(), get_top_api_users(), get_daily_api_trend()');

    // Verify the migration
    console.log('\nVerifying migration...\n');

    // Check api_usage table exists
    const { rows: apiTable } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_name = 'api_usage'
    `);

    if (apiTable.length > 0) {
      console.log('api_usage table exists');
    } else {
      console.log('api_usage table not found');
    }

    // Check daily_usage_summaries table
    const { rows: summaryTable } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_name = 'daily_usage_summaries'
    `);

    if (summaryTable.length > 0) {
      console.log('daily_usage_summaries table exists');
    } else {
      console.log('daily_usage_summaries table not found');
    }

    // Check functions exist
    const { rows: functions } = await client.query(`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_name IN ('get_api_cost_summary', 'get_top_api_users', 'get_daily_api_trend')
    `);

    console.log(`Helper functions created: ${functions.map(f => f.routine_name).join(', ')}`);

    console.log('\nDone!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
