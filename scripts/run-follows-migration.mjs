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

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL in .env.local');
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
    console.log('📚 Running follows table migration...\n');

    // Connect to database
    await client.connect();

    // Read the migration file
    const migrationPath = join(__dirname, 'migrations', '015_create_follows_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('✅ Follows table migration completed successfully!\n');
    console.log('📊 Created:');
    console.log('   • follows table');
    console.log('   • RLS policies for follows');
    console.log('   • Indexes for performance');
    console.log('   • Helper functions (get_follower_count, get_following_count, is_following)');
    console.log('\n💡 Next steps:');
    console.log('   1. Create API endpoints for follow/unfollow');
    console.log('   2. Add follow button to user profiles');
    console.log('   3. Create feed page for followed users\' bags');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
