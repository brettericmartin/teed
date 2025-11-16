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

async function testSourceTypes() {
  console.log('🔍 Testing source_type values to find which are allowed...\n');

  // Test different source_type values (including null)
  const testValues = [
    'user_upload',
    'ai_vision',
    'google_image',
    'product_fetch',
    'manual',
    'camera',
    null, // Test if null is allowed
  ];

  const allowedValues = [];
  const notAllowedValues = [];

  for (const testValue of testValues) {
    const displayValue = testValue === null ? 'null' : `"${testValue}"`;
    console.log(`Testing source_type = ${displayValue}...`);

    const { data: insertData, error: insertError } = await supabase
      .from('media_assets')
      .insert({
        owner_id: '00000000-0000-0000-0000-000000000000', // Fake UUID
        url: 'https://test.com/test.jpg',
        source_type: testValue,
      })
      .select();

    if (insertError) {
      if (insertError.message.includes('check constraint') || insertError.message.includes('media_assets_source_type_check')) {
        console.log(`  ❌ ${displayValue} - NOT ALLOWED (check constraint)\n`);
        notAllowedValues.push(testValue);
      } else if (insertError.message.includes('foreign key')) {
        console.log(`  ✅ ${displayValue} - ALLOWED (passed check constraint)\n`);
        allowedValues.push(testValue);
      } else {
        console.log(`  ⚠️  ${displayValue} - Other error: ${insertError.message.substring(0, 80)}...\n`);
      }
    } else {
      console.log(`  ✅ ${displayValue} - ALLOWED AND INSERTED\n`);
      allowedValues.push(testValue);

      // Delete the test record
      await supabase
        .from('media_assets')
        .delete()
        .eq('id', insertData[0].id);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY:');
  console.log('='.repeat(60));
  console.log('\n✅ ALLOWED VALUES:');
  allowedValues.forEach(v => console.log(`   - ${v === null ? 'null' : v}`));

  console.log('\n❌ NOT ALLOWED VALUES:');
  notAllowedValues.forEach(v => console.log(`   - ${v === null ? 'null' : v}`));
}

testSourceTypes().catch(console.error);
