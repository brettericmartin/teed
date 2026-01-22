/**
 * Run SQL migration against Supabase using pg
 * Usage: npx tsx scripts/run-migration.ts <migration-file>
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

async function runMigration(migrationFile: string) {
  if (!DATABASE_URL) {
    console.error('Missing DATABASE_URL in .env.local');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const filePath = path.resolve(migrationFile);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(filePath, 'utf-8');
  console.log(`Running migration: ${path.basename(filePath)}`);
  console.log(`SQL length: ${sql.length} characters`);

  try {
    const client = await pool.connect();
    console.log('Connected to database');

    await client.query(sql);
    console.log('Migration completed successfully!');

    client.release();
    await pool.end();
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.log('Usage: npx tsx scripts/run-migration.ts <migration-file>');
  console.log('Example: npx tsx scripts/run-migration.ts scripts/migrations/077_discovery_progress_tracking.sql');
  process.exit(1);
}

runMigration(migrationFile);
