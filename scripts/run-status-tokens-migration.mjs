#!/usr/bin/env node
import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL in .env.local');
  process.exit(1);
}

console.log('Running Application Status Tokens Migration');
console.log('='.repeat(50));

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    const sql = readFileSync(
      join(__dirname, 'migrations', '063_application_status_tokens.sql'),
      'utf8'
    );

    console.log('Running 063_application_status_tokens.sql...');
    await client.query(sql);
    console.log('Success!\n');

    // Verify
    const { rows } = await client.query(`
      SELECT COUNT(*) as count FROM application_status_tokens
    `);
    console.log(`Tokens created: ${rows[0].count}`);

    console.log('='.repeat(50));
    console.log('Migration complete!');
    console.log('\nNew table: application_status_tokens');
    console.log('New functions:');
    console.log('  - get_or_create_status_token()');
    console.log('  - get_application_status_by_token()');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
