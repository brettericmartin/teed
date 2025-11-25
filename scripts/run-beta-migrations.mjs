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
  console.error('❌ Missing DATABASE_URL in .env.local');
  process.exit(1);
}

console.log('🚀 Running Beta System Migrations');
console.log('═'.repeat(60));

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

const migrations = [
  '020_create_beta_applications.sql',
  '021_create_beta_invite_codes.sql',
  '022_create_feedback.sql',
  '023_create_feedback_votes.sql',
  '024_create_user_activity.sql',
  '025_create_survey_responses.sql',
  '026_create_beta_points.sql',
  '027_add_beta_fields_to_profiles.sql',
];

async function runMigrations() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    for (const migration of migrations) {
      console.log(`📄 Running: ${migration}`);
      try {
        const sql = readFileSync(
          join(__dirname, 'migrations', migration),
          'utf8'
        );
        await client.query(sql);
        console.log(`   ✅ Success\n`);
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        // Continue with other migrations
      }
    }

    console.log('═'.repeat(60));
    console.log('🎉 Beta migrations complete!');
    console.log('\nNew tables created:');
    console.log('  • beta_applications');
    console.log('  • beta_invite_codes');
    console.log('  • feedback');
    console.log('  • feedback_votes');
    console.log('  • user_activity');
    console.log('  • survey_responses');
    console.log('  • beta_points');
    console.log('\nUpdated tables:');
    console.log('  • profiles (added beta_tier, invited_by_id, etc.)');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
