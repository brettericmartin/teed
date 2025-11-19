#!/usr/bin/env node

/**
 * Run migration 010 - Add featured items support
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Running migration 010: Add featured items support...\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'migrations', '010_add_featured_items.sql');
    const migration = readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migration }).single();

    if (error) {
      // Try direct execution if RPC doesn't work
      console.log('Trying direct execution...');

      // Split by semicolons and execute each statement
      const statements = migration
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: execError } = await supabase.rpc('exec', { query: statement });
        if (execError) {
          console.error('Statement failed:', statement.substring(0, 100));
          throw execError;
        }
      }
    }

    console.log('✅ Migration 010 completed successfully!');
    console.log('\nAdded columns to bag_items:');
    console.log('  - is_featured (boolean, default false)');
    console.log('  - featured_position (integer, 1-8)');
    console.log('\nCreated index: idx_bag_items_featured');

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
