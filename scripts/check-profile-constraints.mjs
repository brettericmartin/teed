#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';
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

async function checkConstraints() {
  try {
    await client.connect();
    console.log('🔍 Checking Profile Table Constraints\n');

    // Get all constraints
    const constraintQuery = `
      SELECT
        conname as name,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'profiles'::regclass
      ORDER BY conname;
    `;

    const { rows: constraints } = await client.query(constraintQuery);

    console.log('Current Constraints:');
    console.log('='.repeat(80));
    constraints.forEach(c => {
      console.log(`\n${c.name}:`);
      console.log(`  ${c.definition}`);
    });

    // Check for invalid handles
    console.log('\n\nInvalid Handles Check:');
    console.log('='.repeat(80));

    const { rows: invalidHandles } = await client.query(`
      SELECT id, handle
      FROM profiles
      WHERE handle !~ '^[a-z0-9_]+$' OR length(handle) < 3 OR length(handle) > 30
    `);

    if (invalidHandles.length > 0) {
      console.log(`❌ Found ${invalidHandles.length} invalid handles:`);
      invalidHandles.forEach(p => {
        console.log(`  - ${p.handle} (${p.id})`);
      });

      console.log('\n💡 These handles need to be fixed before constraints can be enforced.');
    } else {
      console.log('✅ All handles are valid');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkConstraints();
