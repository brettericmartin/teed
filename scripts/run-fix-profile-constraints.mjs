#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL in .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔧 Fixing Profile Constraints...\n');
    await client.connect();

    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '030_fix_profile_constraints.sql'),
      'utf8'
    );

    const result = await client.query(migrationSQL);

    console.log('✅ Migration executed successfully!\n');

    // Show any notices from the migration
    if (result.length > 0) {
      const lastResult = result[result.length - 1];
      if (lastResult.rows && lastResult.rows.length > 0) {
        console.log('Migration Results:');
        lastResult.rows.forEach(row => {
          console.log(`  ${row.status}`);
          console.log(`  Constraints added: ${row.constraint_count}`);
        });
      }
    }

    console.log('\nFixed Issues:');
    console.log('  • Converted hyphens to underscores in test handles');
    console.log('  • Added handle_length constraint');
    console.log('  • Added handle_format constraint');
    console.log('  • Added display_name_length constraint');
    console.log('  • Added bio_length constraint');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
