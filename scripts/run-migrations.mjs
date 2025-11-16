#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Starting Teed Schema Migrations');
console.log('═'.repeat(60));

const migrations = [
  { file: '001_create_links_table.sql', name: 'Create links table' },
  { file: '002_add_code_to_bags.sql', name: 'Add code field to bags' },
  { file: '003_add_usage_tracking_to_share_links.sql', name: 'Add usage tracking to share_links' },
  { file: '004_add_updated_at_to_bags.sql', name: 'Add updated_at to bags' },
];

async function runMigration(file, name) {
  console.log(`\n🔄 Running migration: ${name}`);
  console.log('─'.repeat(60));

  const sql = readFileSync(join(__dirname, 'migrations', file), 'utf8');

  try {
    // Supabase doesn't have a direct SQL execution endpoint via the JS client
    // We need to use the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Migration failed: ${name}`);
      console.error('Error:', error);
      return false;
    }

    console.log(`✅ Migration completed: ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ Migration failed: ${name}`);
    console.error('Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('\n⚠️  Note: This script requires the exec_sql RPC function in your database.');
  console.log('If migrations fail, you can run them manually in the Supabase SQL Editor:');
  console.log(`https://supabase.com/dashboard/project/${supabaseUrl.match(/\/\/([^.]+)/)[1]}/sql\n`);

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await runMigration(migration.file, migration.name);
    if (success) {
      successCount++;
    } else {
      failCount++;
      console.log(`\n💡 Manual migration available at: scripts/migrations/${migration.file}`);
    }
    // Small delay between migrations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 Migration Summary');
  console.log('═'.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📝 Total: ${migrations.length}`);

  if (failCount > 0) {
    console.log('\n⚠️  Some migrations failed.');
    console.log('\n📝 To run manually:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy/paste the SQL from scripts/migrations/*.sql files');
    console.log('3. Run each migration in order (001, 002, 003, 004)');
    process.exit(1);
  } else {
    console.log('\n🎉 All migrations completed successfully!');
  }
}

main();
