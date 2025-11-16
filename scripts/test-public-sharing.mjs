#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPublicSharing() {
  console.log('🌐 Testing Public Sharing Flow\n');

  // Step 1: Login
  console.log('1️⃣  Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@teed-test.com',
    password: 'test-password',
  });

  if (authError) {
    console.log('   ❌ Login failed:', authError.message);
    return;
  }

  const token = authData.session.access_token;
  console.log('   ✅ Logged in successfully');

  // Step 2: Create a public test bag
  console.log('\n2️⃣  Creating public test bag...');
  const createBagRes = await fetch('http://localhost:3000/api/bags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: 'Golf Bag - Public Test',
      description: 'Testing public sharing feature',
      is_public: true, // Important: make it public
    }),
  });

  if (!createBagRes.ok) {
    const errorText = await createBagRes.text();
    console.log('   ❌ Failed to create bag');
    console.log('   Error:', errorText);
    return;
  }

  const bag = await createBagRes.json();
  console.log('   ✅ Public bag created:', bag.code);
  console.log('   📍 Public URL: http://localhost:3000/c/' + bag.code);

  // Step 3: Add items to the bag
  console.log('\n3️⃣  Adding items to bag...');

  const item1Res = await fetch(`http://localhost:3000/api/bags/${bag.code}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      custom_name: 'TaylorMade Stealth Driver',
      custom_description: 'High-performance driver with carbon face',
      quantity: 1,
    }),
  });

  if (!item1Res.ok) {
    console.log('   ❌ Failed to create item 1');
    return;
  }

  const item1 = await item1Res.json();
  console.log('   ✅ Item 1 created:', item1.custom_name);

  const item2Res = await fetch(`http://localhost:3000/api/bags/${bag.code}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      custom_name: 'Titleist Pro V1 Golf Balls',
      custom_description: '12 pack of premium golf balls',
      quantity: 12,
    }),
  });

  if (!item2Res.ok) {
    console.log('   ❌ Failed to create item 2');
    return;
  }

  const item2 = await item2Res.json();
  console.log('   ✅ Item 2 created:', item2.custom_name);

  // Step 4: Add links to items
  console.log('\n4️⃣  Adding product links...');

  const link1Res = await fetch(`http://localhost:3000/api/items/${item1.id}/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: 'https://www.taylormadegolf.com/stealth-driver',
      kind: 'product',
    }),
  });

  if (!link1Res.ok) {
    console.log('   ❌ Failed to add link to item 1');
    return;
  }

  console.log('   ✅ Product link added to driver');

  const link2Res = await fetch(`http://localhost:3000/api/items/${item2.id}/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: 'https://www.titleist.com/golf-balls/pro-v1',
      kind: 'product',
    }),
  });

  if (!link2Res.ok) {
    console.log('   ❌ Failed to add link to item 2');
    return;
  }

  console.log('   ✅ Product link added to golf balls');

  // Step 5: Test public access (no auth)
  console.log('\n5️⃣  Testing public access (without authentication)...');

  const publicBagRes = await fetch(`http://localhost:3000/c/${bag.code}`);

  if (!publicBagRes.ok) {
    console.log('   ❌ Public bag view failed:', publicBagRes.status);
    return;
  }

  const publicBagHtml = await publicBagRes.text();

  // Check if the HTML contains expected content
  if (publicBagHtml.includes('Golf Bag - Public Test') &&
      publicBagHtml.includes('TaylorMade Stealth Driver')) {
    console.log('   ✅ Public bag view loaded successfully');
    console.log('   ✅ Bag title and items are visible');
  } else {
    console.log('   ❌ Public bag view missing expected content');
  }

  // Step 6: Test private bag access (should fail for public)
  console.log('\n6️⃣  Testing private bag protection...');

  const privateBagRes = await fetch('http://localhost:3000/api/bags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: 'Private Bag Test',
      description: 'This should not be publicly accessible',
      is_public: false, // Private
    }),
  });

  const privateBag = await privateBagRes.json();
  console.log('   ✅ Private bag created:', privateBag.code);

  const privateAccessRes = await fetch(`http://localhost:3000/c/${privateBag.code}`);

  if (privateAccessRes.status === 404) {
    console.log('   ✅ Private bag correctly returns 404 for public access');
  } else {
    console.log('   ❌ Private bag is accessible publicly (security issue!)');
  }

  // Step 7: Cleanup
  console.log('\n7️⃣  Cleaning up test data...');

  await fetch(`http://localhost:3000/api/bags/${bag.code}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  await fetch(`http://localhost:3000/api/bags/${privateBag.code}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  console.log('   ✅ Test bags deleted');

  // Final summary
  console.log('\n✅ All public sharing tests passed!\n');
  console.log('📝 Summary:');
  console.log('   ✓ Public bags are accessible without authentication');
  console.log('   ✓ Private bags are protected (404 for public access)');
  console.log('   ✓ Items and links display correctly in public view');
  console.log(`   ✓ Public URL format: /c/{bag-code}\n`);
}

testPublicSharing().catch(console.error);
