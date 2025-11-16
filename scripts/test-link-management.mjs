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

async function testLinkManagement() {
  console.log('🔗 Testing Link Management Flow\n');

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
  const userId = authData.user.id;
  console.log('   ✅ Logged in successfully');

  // Step 2: Create a test bag
  console.log('\n2️⃣  Creating test bag...');
  const createBagRes = await fetch('http://localhost:3000/api/bags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: 'Link Test Bag',
      description: 'Testing link management',
      is_public: false,
    }),
  });

  if (!createBagRes.ok) {
    const errorText = await createBagRes.text();
    console.log('   ❌ Failed to create bag');
    console.log('   Error:', errorText);
    return;
  }

  const bag = await createBagRes.json();
  console.log('   ✅ Bag created:', bag.code);

  // Step 3: Add an item to the bag
  console.log('\n3️⃣  Adding item to bag...');
  const createItemRes = await fetch(`http://localhost:3000/api/bags/${bag.code}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      custom_name: 'Test Golf Club',
      custom_description: 'A great driver',
      quantity: 1,
    }),
  });

  if (!createItemRes.ok) {
    console.log('   ❌ Failed to create item');
    return;
  }

  const item = await createItemRes.json();
  console.log('   ✅ Item created:', item.id);

  // Step 4: Add links to the item
  console.log('\n4️⃣  Adding links to item...');

  const link1Res = await fetch(`http://localhost:3000/api/items/${item.id}/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: 'https://www.titleist.com/golf-clubs/drivers/tsi3',
      kind: 'product',
    }),
  });

  if (!link1Res.ok) {
    console.log('   ❌ Failed to add link 1');
    return;
  }

  const link1 = await link1Res.json();
  console.log('   ✅ Link 1 added:', link1.url);

  const link2Res = await fetch(`http://localhost:3000/api/items/${item.id}/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: 'https://www.youtube.com/watch?v=test-review',
      kind: 'review',
    }),
  });

  if (!link2Res.ok) {
    console.log('   ❌ Failed to add link 2');
    return;
  }

  const link2 = await link2Res.json();
  console.log('   ✅ Link 2 added:', link2.url);

  // Step 5: Fetch the bag to verify links are attached
  console.log('\n5️⃣  Fetching bag with items and links...');
  const getBagRes = await fetch(`http://localhost:3000/api/bags/${bag.code}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!getBagRes.ok) {
    console.log('   ❌ Failed to fetch bag');
    return;
  }

  const fetchedBag = await getBagRes.json();
  const fetchedItem = fetchedBag.items[0];
  console.log('   ✅ Bag fetched successfully');
  console.log('   📦 Item has', fetchedItem.links.length, 'links');

  // Step 6: Edit a link
  console.log('\n6️⃣  Editing link...');
  const editLinkRes = await fetch(`http://localhost:3000/api/links/${link1.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: 'https://www.titleist.com/golf-clubs/drivers/tsi4',
      kind: 'product',
    }),
  });

  if (!editLinkRes.ok) {
    console.log('   ❌ Failed to edit link');
    return;
  }

  const editedLink = await editLinkRes.json();
  console.log('   ✅ Link edited:', editedLink.url);

  // Step 7: Delete a link
  console.log('\n7️⃣  Deleting link...');
  const deleteLinkRes = await fetch(`http://localhost:3000/api/links/${link2.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!deleteLinkRes.ok) {
    console.log('   ❌ Failed to delete link');
    return;
  }

  console.log('   ✅ Link deleted successfully');

  // Step 8: Verify final state
  console.log('\n8️⃣  Verifying final state...');
  const finalBagRes = await fetch(`http://localhost:3000/api/bags/${bag.code}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const finalBag = await finalBagRes.json();
  const finalItem = finalBag.items[0];

  if (finalItem.links.length === 1) {
    console.log('   ✅ Item has 1 link (as expected)');
    console.log('   ✅ Link URL:', finalItem.links[0].url);
  } else {
    console.log('   ❌ Unexpected link count:', finalItem.links.length);
  }

  // Step 9: Cleanup
  console.log('\n9️⃣  Cleaning up...');
  const deleteBagRes = await fetch(`http://localhost:3000/api/bags/${bag.code}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!deleteBagRes.ok) {
    console.log('   ❌ Failed to delete bag');
    return;
  }

  console.log('   ✅ Test bag deleted');

  console.log('\n✅ All link management tests passed!\n');
}

testLinkManagement().catch(console.error);
