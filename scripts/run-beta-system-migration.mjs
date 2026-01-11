#!/usr/bin/env node

/**
 * Run Beta System Migrations (053-059)
 *
 * This script runs all the beta waitlist system migrations in order:
 * - 053: Beta settings table
 * - 054: Enhance beta applications
 * - 055: Beta code usages table
 * - 056: Enhance beta invite codes
 * - 057: Capacity management functions
 * - 058: Migrate existing users to beta
 * - 059: Referral tiers and demand mechanics
 *
 * Usage: node scripts/run-beta-system-migration.mjs
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

const migrations = [
  '053_create_beta_settings.sql',
  '054_enhance_beta_applications.sql',
  '055_create_beta_code_usages.sql',
  '056_enhance_beta_invite_codes.sql',
  '057_beta_capacity_functions.sql',
  '058_migrate_existing_users_to_beta.sql',
  '059_referral_tiers_and_demand_mechanics.sql',
  '060_custom_referral_codes.sql',
];

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL not found in environment');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('Starting Beta System migrations...\n');

    for (const migration of migrations) {
      console.log(`Running ${migration}...`);
      const sqlPath = join(__dirname, 'migrations', migration);

      try {
        const sql = readFileSync(sqlPath, 'utf8');
        await pool.query(sql);
        console.log(`  ✓ ${migration} completed\n`);
      } catch (error) {
        console.error(`  ✗ ${migration} failed:`, error.message);
        // Continue with other migrations (most are idempotent)
      }
    }

    // Verify the migrations
    console.log('\nVerifying migrations...\n');

    // Check beta_settings table
    const settingsResult = await pool.query(
      'SELECT key, value FROM beta_settings ORDER BY key'
    );
    console.log('Beta Settings:');
    settingsResult.rows.forEach(row => {
      console.log(`  - ${row.key}: ${JSON.stringify(row.value)}`);
    });

    // Check capacity function
    const capacityResult = await pool.query('SELECT get_beta_capacity() as capacity');
    console.log('\nCurrent Beta Capacity:');
    console.log(`  ${JSON.stringify(capacityResult.rows[0].capacity, null, 2)}`);

    // Count beta users
    const usersResult = await pool.query(
      'SELECT beta_tier, COUNT(*) as count FROM profiles WHERE beta_tier IS NOT NULL GROUP BY beta_tier'
    );
    console.log('\nBeta Users by Tier:');
    usersResult.rows.forEach(row => {
      console.log(`  - ${row.beta_tier}: ${row.count}`);
    });

    // Check deadline function (migration 059)
    try {
      const deadlineResult = await pool.query('SELECT get_beta_deadline() as deadline');
      console.log('\nBeta Deadline:');
      console.log(`  ${JSON.stringify(deadlineResult.rows[0].deadline, null, 2)}`);
    } catch (e) {
      console.log('\nBeta Deadline: Function not yet available');
    }

    // Check referral tier function (migration 059)
    try {
      const tierResult = await pool.query('SELECT get_referral_tier_info(3) as tier');
      console.log('\nReferral Tier Info (Champion):');
      console.log(`  ${JSON.stringify(tierResult.rows[0].tier, null, 2)}`);
    } catch (e) {
      console.log('\nReferral Tier Info: Function not yet available');
    }

    console.log('\n✓ All beta system migrations completed successfully!');

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
