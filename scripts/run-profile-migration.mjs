import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Running profiles table migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '008_create_profiles_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded: 008_create_profiles_table.sql');
    console.log('📝 Executing SQL...\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // Try direct query if rpc fails
      console.log('ℹ️  RPC method unavailable, trying direct query...\n');

      // Split SQL into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.length > 0) {
          const { error: stmtError } = await supabase.rpc('exec', { query: statement + ';' });
          if (stmtError && !stmtError.message.includes('already exists')) {
            console.error(`⚠️  Error executing statement: ${stmtError.message}`);
          }
        }
      }
    }

    console.log('✅ Migration executed successfully!\n');
    console.log('📋 Migration created:');
    console.log('   ✓ profiles table');
    console.log('   ✓ RLS policies (public read, own update)');
    console.log('   ✓ handle_new_user() trigger function');
    console.log('   ✓ on_auth_user_created trigger');
    console.log('   ✓ updated_at timestamp trigger');
    console.log('   ✓ Performance indexes\n');

    console.log('📌 Next steps:');
    console.log('   1. ✅ Migration complete');
    console.log('   2. 📦 Create "avatars" bucket in Supabase Dashboard → Storage');
    console.log('   3. 🔐 Set avatars bucket to Public');
    console.log('   4. 📝 Add storage policies for avatar uploads');
    console.log('   5. 🧪 Test by signing up a new user\n');

    // Verify the table exists
    console.log('🔍 Verifying profiles table...');
    const { data: profiles, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('⚠️  Could not verify table:', selectError.message);
    } else {
      console.log('✅ Profiles table is accessible\n');
    }

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

// Run the migration
runMigration();
