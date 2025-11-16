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

console.log('🚀 Starting Teed Schema Migrations');
console.log('═'.repeat(60));
console.log('📍 Connecting to database...\n');

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigrations() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the combined migrations file
    const sql = readFileSync(
      join(__dirname, 'migrations', 'ALL_MIGRATIONS.sql'),
      'utf8'
    );

    console.log('🔄 Executing all migrations...\n');

    // Execute the SQL
    const result = await client.query(sql);

    console.log('✅ All migrations completed successfully!\n');

    // If there's a result with the status message, show it
    if (result.rows && result.rows.length > 0) {
      console.log('📊 Result:', result.rows[0]);
    }

    return true;
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    return false;
  } finally {
    await client.end();
  }
}

runMigrations().then(success => {
  if (success) {
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 Schema is now ready!');
    console.log('═'.repeat(60));
    console.log('\nYou now have:');
    console.log('  ✅ links table (attach URLs to items/bags)');
    console.log('  ✅ bag codes (simple URLs like /c/camping-kit)');
    console.log('  ✅ share link tracking (max_uses, expires_at)');
    console.log('  ✅ updated_at timestamps on bags');
    process.exit(0);
  } else {
    process.exit(1);
  }
});
