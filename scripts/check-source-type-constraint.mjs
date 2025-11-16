import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraint() {
  console.log('🔍 Checking media_assets source_type constraint...\n');

  // Query the constraint definition
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conname = 'media_assets_source_type_check';
    `
  });

  if (error) {
    console.log('⚠️  RPC method not available, trying alternative approach...\n');

    // Try querying information_schema instead
    const { data: constraintData, error: constraintError } = await supabase
      .from('information_schema.check_constraints')
      .select('*')
      .eq('constraint_name', 'media_assets_source_type_check');

    if (constraintError) {
      console.log('❌ Cannot query constraint information:', constraintError.message);
      console.log('\n💡 Let me try inserting test values to see which ones work...\n');

      // Test different source_type values
      const testValues = ['user_upload', 'upload', 'ai_generated', 'google_search', 'url'];

      for (const testValue of testValues) {
        console.log(`Testing source_type = "${testValue}"...`);

        const { data: insertData, error: insertError } = await supabase
          .from('media_assets')
          .insert({
            owner_id: '00000000-0000-0000-0000-000000000000', // Fake UUID for testing
            url: 'https://test.com/test.jpg',
            source_type: testValue,
          })
          .select();

        if (insertError) {
          if (insertError.message.includes('check constraint')) {
            console.log(`  ❌ "${testValue}" - NOT ALLOWED`);
          } else {
            console.log(`  ⚠️  "${testValue}" - Other error: ${insertError.message.substring(0, 80)}...`);
          }
        } else {
          console.log(`  ✅ "${testValue}" - ALLOWED`);

          // Delete the test record
          await supabase
            .from('media_assets')
            .delete()
            .eq('id', insertData[0].id);
        }
      }
    } else {
      console.log('Constraint data:', constraintData);
    }
  } else {
    console.log('✅ Constraint definition found:');
    console.log(data);
  }
}

checkConstraint().catch(console.error);
