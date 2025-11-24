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

async function cleanupEmptyBags() {
  console.log('Finding bags with 0 items...\n');

  // First, get all bags
  const { data: bags, error: bagsError } = await supabase
    .from('bags')
    .select('id, title, code, owner_id');

  if (bagsError) {
    console.error('Error fetching bags:', bagsError);
    return;
  }

  console.log(`Found ${bags.length} total bags\n`);

  // For each bag, count items in bag_items table
  const emptyBags = [];
  const bagCounts = [];

  for (const bag of bags) {
    const { count, error: countError } = await supabase
      .from('bag_items')
      .select('*', { count: 'exact', head: true })
      .eq('bag_id', bag.id);

    if (countError) {
      console.error(`Error counting items for bag ${bag.id}:`, countError);
      continue;
    }

    bagCounts.push({ title: bag.title, code: bag.code, count: count || 0 });

    if (count === 0) {
      emptyBags.push(bag);
    }
  }

  // Show all bag counts
  console.log('Bag item counts:');
  bagCounts.sort((a, b) => a.count - b.count).forEach(b => {
    console.log(`  ${b.count} items: "${b.title}" (${b.code})`);
  });

  console.log(`\nFound ${emptyBags.length} bags with 0 items:`);

  if (emptyBags.length === 0) {
    console.log('No empty bags to delete.');
    return;
  }

  emptyBags.forEach(bag => {
    console.log(`  - "${bag.title}" (code: ${bag.code}, id: ${bag.id})`);
  });

  console.log('\nDeleting empty bags...');

  // Delete empty bags
  const emptyBagIds = emptyBags.map(b => b.id);

  const { error: deleteError } = await supabase
    .from('bags')
    .delete()
    .in('id', emptyBagIds);

  if (deleteError) {
    console.error('Error deleting bags:', deleteError);
    return;
  }

  console.log(`\nSuccessfully deleted ${emptyBags.length} empty bags.`);
}

cleanupEmptyBags().catch(console.error);
