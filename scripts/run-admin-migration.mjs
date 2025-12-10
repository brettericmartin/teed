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
dotenv.config({ path: join(__dirname, '..', '.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL in .env.local');
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
    console.log('Running admin roles migration (035)...\n');

    // Connect to database
    await client.connect();
    console.log('Connected to database\n');

    // Read the migration file
    const migrationPath = join(__dirname, 'migrations', '035_create_admin_roles.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('Admin roles migration completed successfully!\n');
    console.log('Created:');
    console.log('   - admin_role column on profiles table');
    console.log('   - admin_audit_log table');
    console.log('   - RLS policies for admin access');
    console.log('   - Helper functions: is_admin(), get_admin_role(), has_admin_permission()');
    console.log('   - Initial super_admin setup for brett.eric.martin@gmail.com');

    // Verify the migration
    console.log('\nVerifying migration...\n');

    // Check admin_role column exists
    const { rows: columns } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'profiles' AND column_name = 'admin_role'
    `);

    if (columns.length > 0) {
      console.log('admin_role column exists on profiles table');
    } else {
      console.log('admin_role column not found');
    }

    // Check audit log table
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_name = 'admin_audit_log'
    `);

    if (tables.length > 0) {
      console.log('admin_audit_log table exists');
    } else {
      console.log('admin_audit_log table not found');
    }

    // Check if super_admin is set
    const { rows: superAdmins } = await client.query(`
      SELECT handle, admin_role FROM profiles
      WHERE admin_role = 'super_admin'
    `);

    if (superAdmins.length > 0) {
      console.log(`Super admin set: @${superAdmins[0].handle}`);
    } else {
      console.log('No super admin found');
    }

    console.log('\nDone!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
