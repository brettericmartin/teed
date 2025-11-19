import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLinks() {
  // First get the bag
  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .select('id, code')
    .eq('code', 'my-side-table-setup')
    .single();

  if (bagError || !bag) {
    console.log('Bag not found:', bagError);
    return;
  }

  console.log('✅ Bag ID:', bag.id);

  // Get items in this bag
  const { data: items, error: itemsError } = await supabase
    .from('bag_items')
    .select('id, custom_name, brand')
    .eq('bag_id', bag.id);

  if (itemsError) {
    console.log('Error fetching items:', itemsError);
    return;
  }

  console.log('\n📦 Items in bag:', items?.length);

  if (!items || items.length === 0) {
    console.log('No items in bag!');
    return;
  }

  // Check for links
  const { data: links, error: linksError } = await supabase
    .from('links')
    .select('*')
    .in('bag_item_id', items.map(i => i.id));

  if (linksError) {
    console.log('Error fetching links:', linksError);
    return;
  }

  console.log('\n🔗 Total links found:', links?.length || 0);

  if (links && links.length > 0) {
    console.log('\nLinks Details:');
    links.forEach(link => {
      const item = items.find(i => i.id === link.bag_item_id);
      console.log(`\n  Item: ${item?.custom_name}`);
      console.log(`  URL: ${link.url}`);
      console.log(`  Auto-generated: ${link.is_auto_generated}`);
      console.log(`  Kind: ${link.kind}`);
      console.log(`  Label: ${link.label}`);
    });
  } else {
    console.log('\n❌ No links found! This explains why you don\'t see them.');
    console.log('\nItems without links:');
    items.forEach(item => {
      console.log(`  - ${item.custom_name} ${item.brand ? `(${item.brand})` : ''}`);
    });
  }
}

checkLinks().catch(console.error);
