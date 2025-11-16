#!/usr/bin/env node
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const API_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? 'http://localhost:3000'
  : 'http://localhost:3000';

// We'll need to authenticate with Supabase first
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log('🧪 Testing Teed API Endpoints\n');
console.log('════════════════════════════════════════════════════════════');

let accessToken = null;
let testBagCode = null;
let testItemId = null;
let testLinkId = null;

async function authenticate() {
  console.log('\n📝 Step 1: Authenticating...');

  // For testing, we'll use the Supabase API directly to get a session
  // In a real scenario, you'd sign in through the app

  // First, try to sign in with test credentials
  const signInResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@teed-test.com',
      password: 'test-password'
    })
  });

  if (!signInResponse.ok) {
    console.log('   No test user found. Please create one first or test will use existing profile.');
    console.log('   Continuing with anonymous requests (will test public endpoints only)...');
    return null;
  }

  const authData = await signInResponse.json();
  accessToken = authData.access_token;

  console.log('✅ Authenticated successfully');
  return accessToken;
}

async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function testCreateBag() {
  console.log('\n📝 Step 2: Creating a test bag...');

  const result = await apiRequest('/api/bags', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Camping Kit',
      description: 'API test bag - safe to delete',
      is_public: true,
    }),
  });

  if (!result.ok) {
    console.error('❌ Failed to create bag:', result.data);
    process.exit(1);
  }

  testBagCode = result.data.code;
  console.log(`✅ Created bag: "${result.data.title}" (code: ${testBagCode})`);
  return result.data;
}

async function testGetBag() {
  console.log('\n📝 Step 3: Retrieving bag by code...');

  const result = await apiRequest(`/api/bags/${testBagCode}`);

  if (!result.ok) {
    console.error('❌ Failed to get bag:', result.data);
    process.exit(1);
  }

  console.log(`✅ Retrieved bag: "${result.data.title}"`);
  console.log(`   Items count: ${result.data.items?.length || 0}`);
  return result.data;
}

async function testUpdateBag() {
  console.log('\n📝 Step 4: Updating bag...');

  const result = await apiRequest(`/api/bags/${testBagCode}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'Updated Camping Kit',
      description: 'Updated description via API test',
    }),
  });

  if (!result.ok) {
    console.error('❌ Failed to update bag:', result.data);
    process.exit(1);
  }

  console.log(`✅ Updated bag: "${result.data.title}"`);
  return result.data;
}

async function testAddItem() {
  console.log('\n📝 Step 5: Adding item to bag...');

  const result = await apiRequest(`/api/bags/${testBagCode}/items`, {
    method: 'POST',
    body: JSON.stringify({
      custom_name: 'Test Sleeping Bag',
      custom_description: 'A cozy sleeping bag for testing',
      notes: 'API test item',
      quantity: 1,
    }),
  });

  if (!result.ok) {
    console.error('❌ Failed to add item:', result.data);
    process.exit(1);
  }

  testItemId = result.data.id;
  console.log(`✅ Added item: "${result.data.custom_name}" (id: ${testItemId})`);
  return result.data;
}

async function testAddSecondItem() {
  console.log('\n📝 Step 6: Adding second item...');

  const result = await apiRequest(`/api/bags/${testBagCode}/items`, {
    method: 'POST',
    body: JSON.stringify({
      custom_name: 'Test Tent',
      custom_description: '4-person tent',
      notes: 'Another test item',
      quantity: 1,
    }),
  });

  if (!result.ok) {
    console.error('❌ Failed to add second item:', result.data);
    process.exit(1);
  }

  console.log(`✅ Added item: "${result.data.custom_name}"`);
  return result.data;
}

async function testUpdateItem() {
  console.log('\n📝 Step 7: Updating item...');

  const result = await apiRequest(`/api/items/${testItemId}`, {
    method: 'PUT',
    body: JSON.stringify({
      custom_name: 'Updated Sleeping Bag',
      quantity: 2,
    }),
  });

  if (!result.ok) {
    console.error('❌ Failed to update item:', result.data);
    process.exit(1);
  }

  console.log(`✅ Updated item: "${result.data.custom_name}" (qty: ${result.data.quantity})`);
  return result.data;
}

async function testAddLink() {
  console.log('\n📝 Step 8: Adding link to item...');

  const result = await apiRequest(`/api/items/${testItemId}/links`, {
    method: 'POST',
    body: JSON.stringify({
      url: 'https://www.rei.com/product/12345',
      kind: 'purchase',
      label: 'REI - Test Link',
      metadata: {
        price: '$199.99',
        title: 'Test Sleeping Bag',
      },
    }),
  });

  if (!result.ok) {
    console.error('❌ Failed to add link:', result.data);
    process.exit(1);
  }

  testLinkId = result.data.id;
  console.log(`✅ Added link: ${result.data.kind} - ${result.data.url}`);
  return result.data;
}

async function testAddSecondLink() {
  console.log('\n📝 Step 9: Adding second link...');

  const result = await apiRequest(`/api/items/${testItemId}/links`, {
    method: 'POST',
    body: JSON.stringify({
      url: 'https://www.youtube.com/watch?v=test',
      kind: 'review',
      label: 'YouTube Review',
    }),
  });

  if (!result.ok) {
    console.error('❌ Failed to add second link:', result.data);
    process.exit(1);
  }

  console.log(`✅ Added link: ${result.data.kind} - ${result.data.url}`);
  return result.data;
}

async function testUpdateLink() {
  console.log('\n📝 Step 10: Updating link...');

  const result = await apiRequest(`/api/links/${testLinkId}`, {
    method: 'PUT',
    body: JSON.stringify({
      label: 'Updated REI Link',
      metadata: {
        price: '$179.99',
        title: 'Updated Sleeping Bag',
        sale: true,
      },
    }),
  });

  if (!result.ok) {
    console.error('❌ Failed to update link:', result.data);
    process.exit(1);
  }

  console.log(`✅ Updated link: "${result.data.label}"`);
  return result.data;
}

async function testGetBagWithItemsAndLinks() {
  console.log('\n📝 Step 11: Retrieving bag with all items and links...');

  const result = await apiRequest(`/api/bags/${testBagCode}`);

  if (!result.ok) {
    console.error('❌ Failed to get bag:', result.data);
    process.exit(1);
  }

  console.log(`✅ Retrieved bag with complete data:`);
  console.log(`   Title: "${result.data.title}"`);
  console.log(`   Items: ${result.data.items.length}`);

  result.data.items.forEach((item, idx) => {
    console.log(`   Item ${idx + 1}: ${item.custom_name} (${item.links?.length || 0} links)`);
  });

  return result.data;
}

async function testDeleteLink() {
  console.log('\n📝 Step 12: Deleting link...');

  const result = await apiRequest(`/api/links/${testLinkId}`, {
    method: 'DELETE',
  });

  if (!result.ok) {
    console.error('❌ Failed to delete link:', result.data);
    process.exit(1);
  }

  console.log(`✅ Deleted link`);
  return result.data;
}

async function testDeleteItem() {
  console.log('\n📝 Step 13: Deleting item...');

  const result = await apiRequest(`/api/items/${testItemId}`, {
    method: 'DELETE',
  });

  if (!result.ok) {
    console.error('❌ Failed to delete item:', result.data);
    process.exit(1);
  }

  console.log(`✅ Deleted item (should cascade delete remaining links)`);
  return result.data;
}

async function testDeleteBag() {
  console.log('\n📝 Step 14: Deleting bag...');

  const result = await apiRequest(`/api/bags/${testBagCode}`, {
    method: 'DELETE',
  });

  if (!result.ok) {
    console.error('❌ Failed to delete bag:', result.data);
    process.exit(1);
  }

  console.log(`✅ Deleted bag (should cascade delete all items and links)`);
  return result.data;
}

async function testVerifyCleanup() {
  console.log('\n📝 Step 15: Verifying cleanup...');

  const result = await apiRequest(`/api/bags/${testBagCode}`);

  if (result.status === 404) {
    console.log(`✅ Bag not found (correctly deleted)`);
    return true;
  }

  console.error('❌ Bag still exists after deletion');
  return false;
}

async function runTests() {
  try {
    // Step 1: Authenticate
    await authenticate();

    if (!accessToken) {
      console.log('\n⚠️  Skipping tests that require authentication');
      console.log('   To test authenticated endpoints, create a test user first.');
      process.exit(0);
    }

    // Step 2-15: Run all tests
    await testCreateBag();
    await testGetBag();
    await testUpdateBag();
    await testAddItem();
    await testAddSecondItem();
    await testUpdateItem();
    await testAddLink();
    await testAddSecondLink();
    await testUpdateLink();
    await testGetBagWithItemsAndLinks();
    await testDeleteLink();
    await testDeleteItem();
    await testDeleteBag();
    await testVerifyCleanup();

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('🎉 All API endpoint tests passed!\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

runTests();
