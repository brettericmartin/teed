#!/usr/bin/env node

/**
 * Run migration: Create profile_blocks and profile_themes tables
 * Run: node scripts/run-profile-blocks-migration.mjs
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    console.log('\n🚀 Running Profile Blocks System Migrations');
    console.log('═'.repeat(60));

    // Migration 1: Create profile_blocks table
    console.log('\n🔄 Migration 047: Creating profile_blocks table...');
    console.log('-'.repeat(60));

    const blocksSQL = readFileSync(
      join(__dirname, 'migrations', '047_create_profile_blocks.sql'),
      'utf8'
    );
    await client.query(blocksSQL);
    console.log('✅ Created profile_blocks table with RLS policies');

    // Migration 2: Create profile_themes table
    console.log('\n🔄 Migration 048: Creating profile_themes table...');
    console.log('-'.repeat(60));

    const themesSQL = readFileSync(
      join(__dirname, 'migrations', '048_create_profile_themes.sql'),
      'utf8'
    );
    await client.query(themesSQL);
    console.log('✅ Created profile_themes table with RLS policies');

    // Migration 3: Add blocks_enabled to profiles
    console.log('\n🔄 Migration 049: Adding blocks_enabled column...');
    console.log('-'.repeat(60));

    const blocksEnabledSQL = readFileSync(
      join(__dirname, 'migrations', '049_add_blocks_enabled_to_profiles.sql'),
      'utf8'
    );
    await client.query(blocksEnabledSQL);
    console.log('✅ Added blocks_enabled column to profiles');

    // Verification
    console.log('\n📋 Verification');
    console.log('-'.repeat(60));

    // Check profile_blocks
    const { rows: blocksCheck } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'profile_blocks'
      ) AS exists
    `);
    console.log(`✅ profile_blocks table: ${blocksCheck[0].exists ? 'EXISTS' : 'MISSING'}`);

    // Check profile_themes
    const { rows: themesCheck } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'profile_themes'
      ) AS exists
    `);
    console.log(`✅ profile_themes table: ${themesCheck[0].exists ? 'EXISTS' : 'MISSING'}`);

    // Check blocks_enabled column
    const { rows: columnCheck } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'blocks_enabled'
      ) AS exists
    `);
    console.log(`✅ profiles.blocks_enabled column: ${columnCheck[0].exists ? 'EXISTS' : 'MISSING'}`);

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 All migrations completed successfully!');
    console.log('═'.repeat(60));
    console.log('\nNew tables:');
    console.log('  - profile_blocks: Modular blocks for profile customization');
    console.log('  - profile_themes: Per-profile theming (colors, backgrounds)');
    console.log('\nNew columns:');
    console.log('  - profiles.blocks_enabled: Flag to enable block system');
    console.log('');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
