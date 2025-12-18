import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sync() {
  // First, set category for Christmas List to wishlist
  await supabase
    .from('bags')
    .update({ category: 'wishlist' })
    .eq('id', 'b3e798bd-42c3-43e4-a80d-412a0fc22f86');
  console.log('Set Christmas List category to wishlist');

  // Get all featured bags
  const { data: featured } = await supabase
    .from('bags')
    .select('id, title, category, is_featured')
    .eq('is_featured', true);

  // Group by category
  const byCategory = {};
  for (const bag of featured || []) {
    if (bag.category) {
      if (!byCategory[bag.category]) byCategory[bag.category] = [];
      byCategory[bag.category].push(bag);
    }
  }

  // For each category, set the first featured bag as spotlight
  for (const [category, bags] of Object.entries(byCategory)) {
    const spotlightBag = bags[0];

    // Set this bag as spotlight
    await supabase
      .from('bags')
      .update({ is_spotlight: true })
      .eq('id', spotlightBag.id);

    console.log('Set spotlight for ' + category + ': ' + spotlightBag.title);
  }

  // Verify
  const { data: result } = await supabase
    .from('bags')
    .select('id, title, category, is_featured, is_spotlight')
    .eq('is_spotlight', true);

  console.log('\nSpotlight bags now:');
  console.log(result);
}

sync();
