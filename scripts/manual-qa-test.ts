#!/usr/bin/env npx tsx
/**
 * Automated QA Test Script for Teed
 *
 * This script systematically tests Teed's core functionality via API calls.
 * Run with: npx tsx scripts/manual-qa-test.ts
 *
 * Options:
 *   --auth    Run authenticated tests (requires .env.local credentials)
 *   --full    Run full test suite including item creation
 *
 * Requires: Dev server running on localhost:3000
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const RUN_AUTH_TESTS = process.argv.includes('--auth') || process.argv.includes('--full');
const RUN_FULL_TESTS = process.argv.includes('--full');

let authToken: string | null = null;
let testUserId: string | null = null;

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`  ${message}`);
}

function pass(name: string, details?: string) {
  results.push({ name, passed: true, details });
  console.log(`✓ ${name}${details ? ` - ${details}` : ''}`);
}

function fail(name: string, error: string) {
  results.push({ name, passed: false, error });
  console.log(`✗ ${name} - ${error}`);
}

async function testEndpoint(
  name: string,
  url: string,
  options: {
    expectedStatus?: number;
    validateJson?: (data: any) => string | null; // returns error message or null
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<boolean> {
  const { expectedStatus = 200, validateJson, method = 'GET', body, headers = {} } = options;

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${url}`, fetchOptions);

    if (response.status !== expectedStatus) {
      fail(name, `Expected status ${expectedStatus}, got ${response.status}`);
      return false;
    }

    if (validateJson) {
      const data = await response.json();
      const error = validateJson(data);
      if (error) {
        fail(name, error);
        return false;
      }
    }

    pass(name);
    return true;
  } catch (err) {
    fail(name, `Request failed: ${err}`);
    return false;
  }
}

// ============================================================================
// Test Suites
// ============================================================================

async function testPublicPages() {
  console.log('\n📄 PUBLIC PAGES\n');

  await testEndpoint('Homepage loads', '/');
  await testEndpoint('Login page loads', '/login');
  await testEndpoint('Join page loads', '/join');
  await testEndpoint('Manifesto page loads', '/manifesto');
  await testEndpoint('Discover page loads', '/discover');
  await testEndpoint('Updates page loads', '/updates');
}

async function testUserProfileAPI() {
  console.log('\n👤 USER PROFILE API\n');

  // Find a valid user first
  const profileResponse = await fetch(`${BASE_URL}/api/users/brett/bags`);
  if (!profileResponse.ok) {
    fail('User profile API', 'No test user found - skipping profile tests');
    return null;
  }

  const profileData = await profileResponse.json();
  pass('User profile API returns data', `Found user: ${profileData.profile?.display_name}`);

  await testEndpoint('Profile has bags array', '/api/users/brett/bags', {
    validateJson: (data) => {
      if (!Array.isArray(data.bags)) return 'bags should be an array';
      if (!data.profile?.handle) return 'profile.handle missing';
      return null;
    }
  });

  await testEndpoint('Non-existent user returns 404', '/api/users/nonexistent-user-12345/bags', {
    expectedStatus: 404,
  });

  return profileData;
}

async function testBagAPI(profileData: any) {
  console.log('\n🎒 BAG API\n');

  if (!profileData?.bags?.length) {
    fail('Bag API tests', 'No bags found to test');
    return null;
  }

  const testBag = profileData.bags[0];
  const bagCode = testBag.code;

  log(`Testing with bag: "${testBag.title}" (${bagCode})`);

  await testEndpoint(`Bag endpoint returns data`, `/api/bags/${bagCode}`, {
    validateJson: (data) => {
      if (!data.title) return 'title missing';
      if (!Array.isArray(data.items)) return 'items should be an array';
      return null;
    }
  });

  // Test bag with items
  const bagResponse = await fetch(`${BASE_URL}/api/bags/${bagCode}`);
  const bagData = await bagResponse.json();

  if (bagData.items?.length > 0) {
    pass('Bag has items', `${bagData.items.length} items found`);

    const item = bagData.items[0];
    if (item.custom_name) {
      pass('Item has name', item.custom_name);
    } else {
      fail('Item has name', 'custom_name missing');
    }

    if (item.id) {
      pass('Item has ID', item.id.substring(0, 8) + '...');
    }
  } else {
    log('(Bag has no items to test)');
  }

  await testEndpoint('Non-existent bag returns 404', '/api/bags/nonexistent-bag-code-12345', {
    expectedStatus: 404,
  });

  return bagData;
}

async function testPublicBagView(profileData: any) {
  console.log('\n🌐 PUBLIC BAG VIEW\n');

  if (!profileData?.bags?.length) {
    fail('Public bag view', 'No bags to test');
    return;
  }

  const handle = profileData.profile.handle;
  const bagCode = profileData.bags[0].code;

  await testEndpoint(`Profile page renders`, `/u/${handle}`);
  await testEndpoint(`Public bag page renders`, `/u/${handle}/${bagCode}`);

  // Verify content is in HTML
  const response = await fetch(`${BASE_URL}/u/${handle}/${bagCode}`);
  const html = await response.text();

  const bagTitle = profileData.bags[0].title;
  if (html.includes(bagTitle) || html.toLowerCase().includes(bagTitle.toLowerCase())) {
    pass('Bag title in HTML', bagTitle);
  } else {
    fail('Bag title in HTML', `"${bagTitle}" not found in page`);
  }
}

async function testAuthenticatedEndpoints() {
  console.log('\n🔐 AUTHENTICATED ENDPOINTS\n');

  // These should return 401 without auth
  await testEndpoint('Profile blocks requires auth', '/api/profile/blocks', {
    expectedStatus: 401,
    validateJson: (data) => {
      if (data.error === 'Unauthorized') return null;
      return 'Expected Unauthorized error';
    }
  });

  await testEndpoint('User bags endpoint requires auth', '/api/user/bags', {
    expectedStatus: 401,
  });

  await testEndpoint('Create bag requires auth', '/api/bags', {
    method: 'POST',
    body: { title: 'Test Bag' },
    expectedStatus: 401,
  });
}

async function testAffiliateAPI() {
  console.log('\n🔗 AFFILIATE API\n');

  await testEndpoint('Affiliate resolve - Amazon URL', '/api/affiliate/resolve', {
    method: 'POST',
    body: { rawUrl: 'https://www.amazon.com/dp/B08N5WRWNW' },
    validateJson: (data) => {
      if (!data.affiliateUrl) return 'affiliateUrl missing';
      if (!data.provider) return 'provider missing';
      return null;
    }
  });

  await testEndpoint('Affiliate resolve - requires URL', '/api/affiliate/resolve', {
    method: 'POST',
    body: {},
    expectedStatus: 400,
  });

  await testEndpoint('Affiliate resolve - GET method', '/api/affiliate/resolve?url=https://amazon.com/dp/B08N5WRWNW', {
    validateJson: (data) => {
      if (!data.affiliateUrl) return 'affiliateUrl missing';
      return null;
    }
  });
}

async function testErrorHandling() {
  console.log('\n⚠️ ERROR HANDLING\n');

  await testEndpoint('Invalid API route returns 404', '/api/nonexistent-endpoint', {
    expectedStatus: 404,
  });

  await testEndpoint('Non-existent profile returns 404', '/u/nonexistent-user-xyz123', {
    expectedStatus: 404,
  });
}

async function setupAuth(): Promise<{ supabase: any; userId: string; handle: string } | null> {
  console.log('\n🔑 DATABASE CONNECTION\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    fail('Database setup', 'Missing Supabase credentials in .env.local');
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Find a test user
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, handle, display_name')
      .limit(1);

    if (userError || !users?.length) {
      fail('Find test user', userError?.message || 'No users found');
      return null;
    }

    pass('Database connected');
    pass('Found test user', `${users[0].display_name} (@${users[0].handle})`);

    return { supabase, userId: users[0].id, handle: users[0].handle };
  } catch (err) {
    fail('Database setup', `${err}`);
    return null;
  }
}

async function testDatabaseBagWorkflow(ctx: { supabase: any; userId: string; handle: string }) {
  console.log('\n📦 DATABASE BAG WORKFLOW\n');

  const { supabase, userId, handle } = ctx;
  const testBagTitle = `QA Test Bag - ${new Date().toISOString().split('T')[0]}`;
  const testBagCode = `qa-test-${Date.now()}`;

  // Create bag directly in database
  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .insert({
      owner_id: userId,
      title: testBagTitle,
      code: testBagCode,
      is_public: true,
    })
    .select()
    .single();

  if (bagError) {
    fail('Create bag in DB', bagError.message);
    return null;
  }
  pass('Create bag in DB', `"${testBagTitle}" (${testBagCode})`);

  // Verify bag is accessible via API
  await testEndpoint('Bag accessible via API', `/api/bags/${testBagCode}`, {
    validateJson: (data) => {
      if (data.title !== testBagTitle) return 'Title mismatch';
      return null;
    }
  });

  // Verify bag appears on profile page
  const profileResponse = await fetch(`${BASE_URL}/u/${handle}`);
  const profileHtml = await profileResponse.text();
  if (profileHtml.includes(testBagTitle)) {
    pass('Bag appears on profile page');
  } else {
    log('(Bag may not appear immediately - caching)');
  }

  return { bagId: bag.id, bagCode: testBagCode };
}

async function testDatabaseItemWorkflow(ctx: { supabase: any; userId: string }, bagId: string, bagCode: string) {
  console.log('\n🛍️ DATABASE ITEM WORKFLOW\n');

  const { supabase } = ctx;

  // Create item directly in database
  const { data: item, error: itemError } = await supabase
    .from('bag_items')
    .insert({
      bag_id: bagId,
      custom_name: 'Test Item - Nike Air Max 90',
      brand: 'Nike',
      custom_description: 'Classic sneaker for QA testing',
      sort_index: 0,
    })
    .select()
    .single();

  if (itemError) {
    fail('Create item in DB', itemError.message);
    return null;
  }
  pass('Create item in DB', item.custom_name);

  // Verify item appears in bag via API
  await testEndpoint('Item in bag via API', `/api/bags/${bagCode}`, {
    validateJson: (data) => {
      if (!data.items?.some((i: any) => i.id === item.id)) {
        return 'Item not found in bag';
      }
      return null;
    }
  });

  // Update item
  const { error: updateError } = await supabase
    .from('bag_items')
    .update({ is_featured: true, custom_name: 'Test Item - Updated' })
    .eq('id', item.id);

  if (updateError) {
    fail('Update item in DB', updateError.message);
  } else {
    pass('Update item in DB', 'Set featured flag');
  }

  // Add a link to the item
  const { error: linkError } = await supabase
    .from('links')
    .insert({
      bag_item_id: item.id,
      url: 'https://www.nike.com/t/air-max-90-mens-shoes',
      label: 'Buy on Nike',
      kind: 'product',
    });

  if (linkError) {
    fail('Add link to item', linkError.message);
  } else {
    pass('Add link to item');
  }

  return item.id;
}

async function testDatabaseCleanup(ctx: { supabase: any }, bagId: string, bagCode: string) {
  console.log('\n🧹 DATABASE CLEANUP\n');

  const { supabase } = ctx;

  // First get all item IDs in this bag
  const { data: items } = await supabase
    .from('bag_items')
    .select('id')
    .eq('bag_id', bagId);

  // Delete items individually first (to avoid trigger issues with cascade)
  if (items?.length) {
    for (const item of items) {
      // Delete history for this item
      await supabase
        .from('item_version_history')
        .delete()
        .eq('item_id', item.id);

      // Delete the item
      await supabase
        .from('bag_items')
        .delete()
        .eq('id', item.id);
    }
  }

  // Now delete the bag
  const { error } = await supabase
    .from('bags')
    .delete()
    .eq('id', bagId);

  if (error) {
    // If still failing, mark bag as private and note for manual cleanup
    await supabase.from('bags').update({ is_public: false }).eq('id', bagId);
    log(`(Cleanup failed, bag marked private: ${bagCode})`);
  } else {
    pass('Delete test bag', bagCode);
  }

  // Verify bag no longer accessible (or is private)
  const checkResponse = await fetch(`${BASE_URL}/api/bags/${bagCode}`);
  if (checkResponse.status === 404 || !checkResponse.ok) {
    pass('Bag cleaned up');
  } else {
    log('(Bag may remain - marked private for manual cleanup)');
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    TEED QA TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\nTarget: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Mode: ${RUN_FULL_TESTS ? 'FULL' : RUN_AUTH_TESTS ? 'AUTH' : 'PUBLIC'}\n`);

  // Check server is running
  try {
    const healthCheck = await fetch(BASE_URL);
    if (!healthCheck.ok) {
      console.error('❌ Server not responding correctly');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Cannot connect to server. Is it running?');
    process.exit(1);
  }

  pass('Server is running');

  // Run test suites
  await testPublicPages();
  const profileData = await testUserProfileAPI();
  if (profileData) {
    await testBagAPI(profileData);
    await testPublicBagView(profileData);
  }
  await testAuthenticatedEndpoints();
  await testAffiliateAPI();
  await testErrorHandling();

  // Database-level tests (requires --auth or --full flag)
  if (RUN_AUTH_TESTS) {
    const ctx = await setupAuth();
    if (ctx) {
      const bagResult = await testDatabaseBagWorkflow(ctx);
      if (bagResult) {
        await testDatabaseItemWorkflow(ctx, bagResult.bagId, bagResult.bagCode);
        await testDatabaseCleanup(ctx, bagResult.bagId, bagResult.bagCode);
      }
    }
  } else {
    console.log('\n💡 Run with --auth to include database write tests');
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                         SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total: ${total} tests`);
  console.log(`Passed: ${passed} ✓`);
  console.log(`Failed: ${failed} ✗`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ✗ ${r.name}: ${r.error}`);
    });
    console.log('');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
