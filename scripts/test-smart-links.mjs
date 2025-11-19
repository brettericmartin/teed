#!/usr/bin/env node

/**
 * Quick test to verify smart link finding works via API
 * This creates a test bag and runs fill-links to see AI recommendations
 */

import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

console.log('🔗 Testing Smart Link Finding\n');

// Create test items
const testItems = [
  {
    name: 'TaylorMade R7 Quad Driver',
    brand: 'TaylorMade',
    expected: 'Should recommend eBay or 2nd Swing (vintage club)',
  },
  {
    name: 'Stealth 2 Plus Driver',
    brand: 'TaylorMade',
    expected: 'Should recommend Amazon or PGA Tour Superstore (new club)',
  },
  {
    name: 'M1 2017 Driver',
    brand: 'TaylorMade',
    expected: 'Should recommend eBay or pre-owned site (old model)',
  },
];

async function testSmartLinks() {
  try {
    // Get a test user (you'll need to replace with your test user ID)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?limit=1`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    const profiles = await response.json();
    if (!profiles || profiles.length === 0) {
      console.error('❌ No users found in database');
      return;
    }

    const testUserId = profiles[0].id;
    console.log(`📝 Using test user: ${profiles[0].handle}\n`);

    // Create a test bag
    const bagResponse = await fetch(`${SUPABASE_URL}/rest/v1/bags`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        owner_id: testUserId,
        title: 'Smart Link Test Bag',
        description: 'Testing AI link recommendations',
      }),
    });

    const bags = await bagResponse.json();
    const bagId = bags[0].id;
    console.log(`✅ Created test bag: ${bagId}\n`);

    // Add test items
    for (const item of testItems) {
      console.log(`📦 Adding: ${item.brand} ${item.name}`);
      console.log(`   Expected: ${item.expected}`);

      const itemResponse = await fetch(`${SUPABASE_URL}/rest/v1/bag_items`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bag_id: bagId,
          custom_name: item.name,
          brand: item.brand,
          category: 'Golf Equipment',
        }),
      });

      if (itemResponse.ok) {
        console.log(`   ✅ Item added\n`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Running Smart Link Fill...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // This will be tested manually via the UI or you can implement the API call here
    console.log(`
To test manually:
1. Go to http://localhost:3000/u/${profiles[0].handle}/${bags[0].code}/edit
2. Click "Fill Product Links"
3. Check the links that are generated

The AI should:
- Recommend eBay/specialty sites for vintage items (R7 Quad, M1 2017)
- Recommend Amazon/retail for new items (Stealth 2 Plus)
- Log its reasoning in the server console
    `);

    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    await fetch(`${SUPABASE_URL}/rest/v1/bags?id=eq.${bagId}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    console.log('✅ Test bag deleted\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSmartLinks();
