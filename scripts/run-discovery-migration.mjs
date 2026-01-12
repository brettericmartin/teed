#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL environment variable');
  console.error('');
  console.error('To run this migration:');
  console.error('1. Go to your Supabase dashboard');
  console.error('2. Navigate to Project Settings > Database');
  console.error('3. Copy the connection string (URI)');
  console.error('4. Run: DATABASE_URL="your_connection_string" node scripts/run-discovery-migration.mjs');
  console.error('');
  console.error('Or run the migration manually:');
  console.error('1. Go to your Supabase dashboard');
  console.error('2. Navigate to SQL Editor');
  console.error('3. Copy and paste the contents of scripts/migrations/074_discovery_system.sql');
  console.error('4. Run the SQL');
  process.exit(1);
}

console.log('🚀 Running Discovery System Migration');
console.log('═'.repeat(60));

const { Pool } = pg;
const pool = new Pool({ connectionString: databaseUrl });

async function runMigration() {
  const sql = readFileSync(
    join(__dirname, 'migrations', '074_discovery_system.sql'),
    'utf8'
  );

  console.log('\n🔄 Executing migration...\n');

  try {
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('The Discovery System is now ready to use!');
    console.log('Visit /admin/discovery to start discovering content.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
