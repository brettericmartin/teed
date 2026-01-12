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
  console.error('4. Run: DATABASE_URL="your_connection_string" node scripts/run-strategic-initiatives-migration.mjs');
  console.error('');
  console.error('Or run the migration manually:');
  console.error('1. Go to your Supabase dashboard');
  console.error('2. Navigate to SQL Editor');
  console.error('3. Copy and paste the contents of scripts/migrations/070_create_strategic_initiatives.sql');
  console.error('4. Run the SQL');
  process.exit(1);
}

console.log('🚀 Running Strategic Initiatives Migration');
console.log('═'.repeat(60));

const { Pool } = pg;
const pool = new Pool({ connectionString: databaseUrl });

async function runMigration() {
  const sql = readFileSync(
    join(__dirname, 'migrations', '070_create_strategic_initiatives.sql'),
    'utf8'
  );

  console.log('\n🔄 Executing migration...\n');

  try {
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npx tsx scripts/seed-strategic-initiatives.ts');
    console.log('2. Visit /admin/strategy and click on the Initiatives tab');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
