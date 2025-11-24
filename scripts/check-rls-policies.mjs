import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env vars from .env.local
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLS() {
  console.log('Checking RLS policies...\n');

  // Query pg_policies to see all policies
  const { data: policies, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('bags', 'bag_items', 'profiles')
      ORDER BY tablename, policyname;
    `
  });

  if (error) {
    // Try alternative approach - direct query
    console.log('RPC not available, trying direct query...\n');

    // Check if RLS is enabled on tables
    const { data: tables, error: tableError } = await supabase
      .from('bags')
      .select('*')
      .limit(1);

    console.log('Bags table accessible:', !tableError);
    if (tableError) console.log('Bags error:', tableError);

    const { data: items, error: itemError } = await supabase
      .from('bag_items')
      .select('*')
      .limit(1);

    console.log('Bag_items table accessible:', !itemError);
    if (itemError) console.log('Bag_items error:', itemError);

    // Try to insert a test item to see the error
    console.log('\n--- Testing insert permissions ---\n');

    // First get a bag to test with
    const { data: testBag } = await supabase
      .from('bags')
      .select('id, owner_id, title')
      .limit(1)
      .single();

    if (testBag) {
      console.log('Test bag:', testBag.title, '(owner:', testBag.owner_id, ')');

      // Try inserting an item
      const { data: insertResult, error: insertError } = await supabase
        .from('bag_items')
        .insert({
          bag_id: testBag.id,
          custom_name: 'RLS Test Item - DELETE ME',
          sort_index: 999,
          quantity: 1
        })
        .select();

      if (insertError) {
        console.log('\nInsert error:', insertError);
      } else {
        console.log('\nInsert successful! Item ID:', insertResult[0]?.id);
        // Clean up
        await supabase.from('bag_items').delete().eq('custom_name', 'RLS Test Item - DELETE ME');
        console.log('Cleaned up test item');
      }
    }

    return;
  }

  console.log('RLS Policies:\n');
  console.log(JSON.stringify(policies, null, 2));
}

checkRLS().catch(console.error);
