#!/usr/bin/env node
/**
 * Verify Discovery System Database Tables
 * Run: node scripts/verify-discovery-tables.mjs
 */

import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL environment variable');
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool({ connectionString: databaseUrl });

async function verifyTables() {
  console.log('🔍 Verifying Discovery System Database Tables\n');
  console.log('═'.repeat(60));

  const tables = [
    'discovery_sources',
    'discovered_products',
    'discovery_runs',
    'discovery_library_gaps',
  ];

  let allGood = true;

  for (const table of tables) {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )
      `, [table]);

      const exists = result.rows[0].exists;

      if (exists) {
        // Get row count
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        const count = countResult.rows[0].count;
        console.log(`✅ ${table} - exists (${count} rows)`);
      } else {
        console.log(`❌ ${table} - MISSING`);
        allGood = false;
      }
    } catch (error) {
      console.log(`❌ ${table} - ERROR: ${error.message}`);
      allGood = false;
    }
  }

  // Check for required functions
  console.log('\n📦 Checking Functions:\n');

  const functions = ['record_library_gap', 'get_discovery_stats'];

  for (const func of functions) {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_proc
          WHERE proname = $1
        )
      `, [func]);

      const exists = result.rows[0].exists;
      console.log(exists ? `✅ ${func}()` : `❌ ${func}() - MISSING`);
      if (!exists) allGood = false;
    } catch (error) {
      console.log(`❌ ${func}() - ERROR: ${error.message}`);
      allGood = false;
    }
  }

  // Check for bags table reference
  console.log('\n🔗 Checking Foreign Key References:\n');

  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'bags'
      )
    `);
    console.log(result.rows[0].exists ? '✅ bags table exists' : '❌ bags table MISSING');
    if (!result.rows[0].exists) allGood = false;
  } catch (error) {
    console.log(`❌ bags table check - ERROR: ${error.message}`);
    allGood = false;
  }

  // Check for profiles table (for @teed user)
  try {
    const result = await pool.query(`
      SELECT id, handle FROM profiles WHERE handle = 'teed' LIMIT 1
    `);
    if (result.rows.length > 0) {
      console.log(`✅ @teed user exists (id: ${result.rows[0].id.slice(0, 8)}...)`);
    } else {
      console.log('⚠️  @teed user NOT FOUND - bags cannot be created without this user');
      allGood = false;
    }
  } catch (error) {
    console.log(`❌ @teed user check - ERROR: ${error.message}`);
    allGood = false;
  }

  console.log('\n' + '═'.repeat(60));

  if (allGood) {
    console.log('✅ All database checks passed!\n');
  } else {
    console.log('❌ Some checks failed. Run the migration:\n');
    console.log('   node scripts/run-discovery-migration.mjs\n');
  }

  await pool.end();
  process.exit(allGood ? 0 : 1);
}

verifyTables().catch(console.error);
