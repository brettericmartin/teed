import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running promo codes migration...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, 'migrations', '006_add_promo_codes.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL:');
    console.log(sql);
    console.log('\n' + '='.repeat(60) + '\n');

    // Execute migration using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      // Try alternative method - direct query
      console.log('⚠️  RPC not available, trying direct query...\n');

      const { error: directError } = await supabase
        .from('bag_items')
        .select('promo_codes')
        .limit(1);

      if (directError && directError.message.includes('column "promo_codes" does not exist')) {
        console.error('❌ Migration failed. Please run this SQL manually in Supabase SQL Editor:');
        console.error('\n' + sql + '\n');
        process.exit(1);
      } else if (!directError) {
        console.log('✅ Column already exists!');
        return;
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('\nVerifying...');

    // Verify the column exists
    const { data: verifyData, error: verifyError } = await supabase
      .from('bag_items')
      .select('id, promo_codes')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ Verification successful - promo_codes column exists');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigration();
