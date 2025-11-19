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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(filename) {
  console.log(`\n📝 Running migration: ${filename}`);

  const migrationPath = path.join(__dirname, 'migrations', filename);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error(`❌ Migration ${filename} failed:`, error);
    throw error;
  }

  console.log(`✅ Migration ${filename} completed successfully`);
  return data;
}

async function main() {
  try {
    console.log('🚀 Running affiliate system migrations...\n');

    // Run migrations in order
    await runMigration('011_create_affiliate_links.sql');
    await runMigration('012_create_creator_settings.sql');
    await runMigration('013_create_affiliate_clicks.sql');

    console.log('\n✨ All affiliate migrations completed successfully!');
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  }
}

main();
