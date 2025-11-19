import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSql(sql) {
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement.trim().length === 0) continue;

    try {
      const { data, error } = await supabase.rpc('exec', {
        query: statement + ';'
      });

      if (error) {
        console.error('Statement error:', error);
        console.error('Failed statement:', statement.substring(0, 200));
        throw error;
      }
    } catch (err) {
      // Try direct query if RPC fails
      console.log('Trying direct query method...');
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: statement + ';' })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Direct query failed:', errorText);
        throw new Error(`Failed to execute: ${errorText}`);
      }
    }
  }
}

async function runMigration(filename) {
  console.log(`\n📝 Running migration: ${filename}`);

  const migrationPath = path.join(__dirname, 'migrations', filename);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    await executeSql(sql);
    console.log(`✅ Migration ${filename} completed successfully`);
  } catch (error) {
    console.error(`❌ Migration ${filename} failed:`, error.message);
    throw error;
  }
}

async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  return !error || error.code !== '42P01'; // 42P01 = undefined table
}

async function main() {
  try {
    console.log('🚀 Checking affiliate system database schema...\n');

    // Check if tables already exist
    const tablesExist = {
      affiliate_links: await checkTableExists('affiliate_links'),
      creator_settings: await checkTableExists('creator_settings'),
      affiliate_clicks: await checkTableExists('affiliate_clicks'),
    };

    console.log('Current schema status:');
    console.log('  affiliate_links:', tablesExist.affiliate_links ? '✅ Exists' : '❌ Missing');
    console.log('  creator_settings:', tablesExist.creator_settings ? '✅ Exists' : '❌ Missing');
    console.log('  affiliate_clicks:', tablesExist.affiliate_clicks ? '✅ Exists' : '❌ Missing');

    if (tablesExist.affiliate_links && tablesExist.creator_settings && tablesExist.affiliate_clicks) {
      console.log('\n✨ All affiliate tables already exist!');
      console.log('\nIf you need to re-run migrations, drop the tables first in Supabase SQL Editor:');
      console.log('  DROP TABLE IF EXISTS affiliate_clicks CASCADE;');
      console.log('  DROP TABLE IF EXISTS affiliate_links CASCADE;');
      console.log('  DROP TABLE IF EXISTS creator_settings CASCADE;');
      return;
    }

    console.log('\n📋 Tables to create:');
    if (!tablesExist.affiliate_links) console.log('  - affiliate_links');
    if (!tablesExist.creator_settings) console.log('  - creator_settings');
    if (!tablesExist.affiliate_clicks) console.log('  - affiliate_clicks');

    console.log('\n⚠️  Note: Automatic migration via API is not supported.');
    console.log('Please run the SQL files manually in Supabase SQL Editor:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/jvljmfdroozexzodqupg/sql/new');
    console.log('2. Copy and run each migration file:');
    console.log('   - scripts/migrations/011_create_affiliate_links.sql');
    console.log('   - scripts/migrations/012_create_creator_settings.sql');
    console.log('   - scripts/migrations/013_create_affiliate_clicks.sql');
    console.log('\nOr run all at once:');
    console.log('   - scripts/migrations/ALL_MIGRATIONS.sql\n');

  } catch (error) {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  }
}

main();
