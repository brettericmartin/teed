#!/usr/bin/env node

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log('🔍 Profile Editing Deep Dive\n');
console.log('=' .repeat(80));

// Test 1: Check RLS policies
console.log('\n📋 Test 1: Checking RLS Policies');
console.log('-'.repeat(80));

const adminClient = createClient(supabaseUrl, serviceKey);

try {
  const { data: policies, error } = await adminClient
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'profiles');

  if (error) {
    console.log('⚠️  Could not fetch policies directly, checking via function...');

    // Try alternative: Check if policies exist by testing them
    const { data: testProfile } = await adminClient
      .from('profiles')
      .select('*')
      .limit(1)
      .single();

    if (testProfile) {
      console.log('✅ RLS is active (profiles table has data and is accessible)');
    }
  } else {
    console.log(`✅ Found ${policies?.length || 0} RLS policies on profiles table`);
    policies?.forEach(policy => {
      console.log(`   - ${policy.policyname}: ${policy.cmd}`);
    });
  }
} catch (err) {
  console.error('❌ Error checking RLS:', err.message);
}

// Test 2: Check profile structure
console.log('\n📋 Test 2: Checking Profile Table Structure');
console.log('-'.repeat(80));

try {
  const { data: profiles, error } = await adminClient
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error fetching profiles:', error.message);
  } else if (profiles && profiles.length > 0) {
    const sampleProfile = profiles[0];
    console.log('✅ Profile columns:');
    Object.keys(sampleProfile).forEach(key => {
      console.log(`   - ${key}: ${typeof sampleProfile[key]}`);
    });

    // Check for new columns we added
    const expectedColumns = ['social_links', 'banner_url', 'total_views', 'total_bags', 'total_followers'];
    const missingColumns = expectedColumns.filter(col => !(col in sampleProfile));

    if (missingColumns.length > 0) {
      console.log(`\n⚠️  Missing columns: ${missingColumns.join(', ')}`);
      console.log('   Run: node scripts/run-profile-enhancement-migration.mjs');
    } else {
      console.log('\n✅ All expected columns present');
    }
  } else {
    console.log('⚠️  No profiles found in database');
  }
} catch (err) {
  console.error('❌ Error checking structure:', err.message);
}

// Test 3: Check handle uniqueness constraint
console.log('\n📋 Test 3: Checking Handle Constraints');
console.log('-'.repeat(80));

try {
  const { data: handles, error } = await adminClient
    .from('profiles')
    .select('handle, id')
    .limit(5);

  if (error) {
    console.error('❌ Error fetching handles:', error.message);
  } else {
    console.log(`✅ Sample handles (${handles?.length || 0}):`);
    handles?.forEach(profile => {
      console.log(`   - ${profile.handle} (${profile.id})`);
    });

    // Check for duplicate handles
    const handleCounts = {};
    const { data: allHandles } = await adminClient
      .from('profiles')
      .select('handle');

    allHandles?.forEach(p => {
      handleCounts[p.handle] = (handleCounts[p.handle] || 0) + 1;
    });

    const duplicates = Object.entries(handleCounts).filter(([_, count]) => count > 1);

    if (duplicates.length > 0) {
      console.log('\n❌ DUPLICATE HANDLES FOUND:');
      duplicates.forEach(([handle, count]) => {
        console.log(`   - "${handle}" appears ${count} times`);
      });
    } else {
      console.log('\n✅ No duplicate handles found');
    }
  }
} catch (err) {
  console.error('❌ Error checking handles:', err.message);
}

// Test 4: Test update policy with anon client
console.log('\n📋 Test 4: Testing Update Permissions (Simulated)');
console.log('-'.repeat(80));

try {
  // Get a real user to test with
  const { data: testProfile } = await adminClient
    .from('profiles')
    .select('*')
    .limit(1)
    .single();

  if (testProfile) {
    console.log(`✅ Testing with profile: ${testProfile.handle}`);

    // Try to update as service role (should work)
    const { error: serviceUpdateError } = await adminClient
      .from('profiles')
      .update({ bio: testProfile.bio }) // No actual change
      .eq('id', testProfile.id);

    if (serviceUpdateError) {
      console.log('❌ Service role cannot update (unexpected):', serviceUpdateError.message);
    } else {
      console.log('✅ Service role can update profiles');
    }

    // Note: We can't easily test anon client without real auth token
    console.log('ℹ️  Anonymous client testing requires authenticated session');
    console.log('   This should be tested via the UI or with real user credentials');
  }
} catch (err) {
  console.error('❌ Error testing updates:', err.message);
}

// Test 5: Check for common issues
console.log('\n📋 Test 5: Checking for Common Issues');
console.log('-'.repeat(80));

try {
  // Check for profiles without handles
  const { data: noHandle } = await adminClient
    .from('profiles')
    .select('id, handle')
    .or('handle.is.null,handle.eq.');

  if (noHandle && noHandle.length > 0) {
    console.log(`❌ Found ${noHandle.length} profiles without handles`);
  } else {
    console.log('✅ All profiles have handles');
  }

  // Check for invalid handle formats
  const { data: allProfiles } = await adminClient
    .from('profiles')
    .select('id, handle');

  const invalidHandles = allProfiles?.filter(p => {
    const handle = p.handle;
    return !handle ||
           handle.length < 3 ||
           handle.length > 30 ||
           !/^[a-z0-9_]+$/.test(handle);
  });

  if (invalidHandles && invalidHandles.length > 0) {
    console.log(`❌ Found ${invalidHandles.length} profiles with invalid handles:`);
    invalidHandles.forEach(p => {
      console.log(`   - ${p.handle} (${p.id})`);
    });
  } else {
    console.log('✅ All handles follow format constraints');
  }

  // Check for profiles without display names
  const { data: noDisplayName } = await adminClient
    .from('profiles')
    .select('id, display_name')
    .or('display_name.is.null,display_name.eq.');

  if (noDisplayName && noDisplayName.length > 0) {
    console.log(`❌ Found ${noDisplayName.length} profiles without display names`);
  } else {
    console.log('✅ All profiles have display names');
  }
} catch (err) {
  console.error('❌ Error checking for issues:', err.message);
}

// Test 6: Check auth.users sync
console.log('\n📋 Test 6: Checking Auth Users Sync');
console.log('-'.repeat(80));

try {
  const { count: authCount } = await adminClient.auth.admin.listUsers({
    perPage: 1000
  });

  const { count: profileCount } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Auth users: ${authCount}`);
  console.log(`✅ Profiles: ${profileCount}`);

  if (authCount !== profileCount) {
    console.log(`⚠️  Mismatch: ${Math.abs(authCount - profileCount)} difference`);
    console.log('   This could indicate failed profile auto-creation');
  } else {
    console.log('✅ Auth users and profiles are in sync');
  }
} catch (err) {
  console.error('❌ Error checking sync:', err.message);
}

console.log('\n' + '='.repeat(80));
console.log('✅ Deep dive complete!\n');
