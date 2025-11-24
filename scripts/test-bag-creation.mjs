import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env vars
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const adminClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const anonClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testBagCreation() {
  console.log('=== Testing Bag Creation RLS ===\n');

  // Test 1: Try to create bag without auth (should fail)
  console.log('Test 1: Create bag without auth...');
  const { data: noAuthBag, error: noAuthError } = await anonClient
    .from('bags')
    .insert({
      owner_id: 'df296265-89f2-461a-8e35-87bfe821409d', // test user
      title: 'RLS Test Bag',
      code: 'rls-test-bag-' + Date.now(),
      is_public: true
    })
    .select()
    .single();

  if (noAuthError) {
    console.log('  ✓ Correctly blocked:', noAuthError.message);
  } else {
    console.log('  ✗ UNEXPECTED: Insert allowed without auth!');
    // Clean up
    await adminClient.from('bags').delete().eq('id', noAuthBag.id);
  }

  // Test 2: Check what policies exist on bags table
  console.log('\nTest 2: Querying RLS policies via SQL...');

  // Use raw SQL to check policies
  const { data: result, error: sqlError } = await adminClient
    .from('bags')
    .select('*')
    .limit(0);

  // Try to get policies through the REST API's SQL function
  const policiesQuery = `
    SELECT
      policyname,
      cmd,
      roles::text,
      qual,
      with_check
    FROM pg_policies
    WHERE tablename = 'bags'
    AND schemaname = 'public'
  `;

  // Can't run raw SQL directly, let's check via Supabase dashboard
  console.log('  (Need to check Supabase dashboard for policies)');

  // Test 3: Check if there's a profile for the user
  console.log('\nTest 3: Checking if users have profiles...');
  const { data: users } = await adminClient.auth.admin.listUsers();

  console.log(`  Found ${users?.users?.length || 0} auth users`);

  for (const user of (users?.users || []).slice(0, 5)) {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, handle')
      .eq('id', user.id)
      .single();

    console.log(`  - ${user.email}: profile ${profile ? '✓ exists' : '✗ MISSING'} (${profile?.handle || 'N/A'})`);
  }

  // Test 4: Simulate authenticated insert using service role but checking the policy logic
  console.log('\nTest 4: Checking bags table structure...');
  const { data: sampleBag } = await adminClient
    .from('bags')
    .select('*')
    .limit(1)
    .single();

  if (sampleBag) {
    console.log('  Bag columns:', Object.keys(sampleBag).join(', '));
  }

  // Test 5: Check if there's any trigger or constraint blocking inserts
  console.log('\nTest 5: Testing admin insert (should work)...');
  const testCode = 'admin-test-' + Date.now();
  const { data: adminBag, error: adminError } = await adminClient
    .from('bags')
    .insert({
      owner_id: 'a3b6d2c3-5fe7-4d0c-b19c-f6c2a1023d42', // test-user-api
      title: 'Admin Test Bag',
      code: testCode,
      is_public: true
    })
    .select()
    .single();

  if (adminError) {
    console.log('  ✗ Admin insert failed:', adminError.message);
    console.log('    Details:', adminError);
  } else {
    console.log('  ✓ Admin insert succeeded:', adminBag.id);
    // Clean up
    await adminClient.from('bags').delete().eq('id', adminBag.id);
    console.log('  Cleaned up test bag');
  }

  console.log('\n=== Summary ===');
  console.log('The RLS policy for bags INSERT likely requires:');
  console.log('  - auth.uid() = owner_id (user can only create bags they own)');
  console.log('  - OR a profile must exist for the user');
  console.log('\nCheck Supabase Dashboard > Authentication > Policies > bags table');
}

testBagCreation().catch(console.error);
