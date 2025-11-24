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

// Service role client (bypasses RLS)
const adminClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Anon client (subject to RLS)
const anonClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRLSDetailed() {
  console.log('=== RLS Policy Check ===\n');

  // Get RLS status for tables using SQL
  const { data: rlsStatus, error: rlsError } = await adminClient.rpc('exec_sql', {
    sql: `
      SELECT
        relname as table_name,
        relrowsecurity as rls_enabled,
        relforcerowsecurity as rls_forced
      FROM pg_class
      WHERE relnamespace = 'public'::regnamespace
        AND relname IN ('bags', 'bag_items', 'profiles')
    `
  });

  if (rlsError) {
    console.log('Cannot query pg_class directly, using alternative method...\n');
  } else {
    console.log('RLS Status:', rlsStatus);
  }

  // Get all policies using information schema
  const { data: policies, error: polError } = await adminClient.rpc('exec_sql', {
    sql: `
      SELECT
        tablename,
        policyname,
        cmd,
        qual as using_expression,
        with_check as check_expression
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `
  });

  if (!polError && policies) {
    console.log('\n=== All Policies ===\n');
    console.log(JSON.stringify(policies, null, 2));
  }

  // Test with anon client
  console.log('\n=== Testing with Anon Client (no auth) ===\n');

  // Try to read bags
  const { data: bags, error: bagReadError } = await anonClient
    .from('bags')
    .select('id, title, is_public')
    .limit(3);

  console.log('Read public bags:', bags?.length || 0, 'bags');
  if (bagReadError) console.log('Read error:', bagReadError.message);

  // Try to insert without auth
  const { error: insertNoAuth } = await anonClient
    .from('bag_items')
    .insert({
      bag_id: '00000000-0000-0000-0000-000000000000',
      custom_name: 'Test',
      sort_index: 1,
      quantity: 1
    });

  console.log('Insert without auth:', insertNoAuth?.message || 'ALLOWED (unexpected)');

  // Get a real user to test with
  console.log('\n=== Testing authenticated scenarios ===\n');

  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, handle')
    .limit(3);

  console.log('Users available for testing:');
  profiles?.forEach(p => console.log(`  - ${p.handle} (${p.id})`));

  // Check if there are any bags owned by users
  const { data: userBags } = await adminClient
    .from('bags')
    .select('id, title, owner_id, profiles!bags_owner_id_fkey(handle)')
    .limit(5);

  console.log('\nBags with owners:');
  userBags?.forEach(b => {
    console.log(`  - "${b.title}" owned by ${b.profiles?.handle || b.owner_id}`);
  });

  // Check bag_items foreign key constraints
  console.log('\n=== Checking bag_items constraints ===\n');

  const { data: constraints, error: constError } = await adminClient.rpc('exec_sql', {
    sql: `
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'bag_items'
    `
  });

  if (!constError && constraints) {
    console.log('Constraints on bag_items:');
    console.log(JSON.stringify(constraints, null, 2));
  }
}

checkRLSDetailed().catch(console.error);
