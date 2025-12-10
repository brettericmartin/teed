import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/brettm/development/teed/teed/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getBagDetails() {
  const bagId = '4e38ad4d-63ff-4b6c-9565-232e527eb57b';

  const { data: items, error: itemsError } = await supabase
    .from('bag_items')
    .select('id, custom_name, brand, notes, custom_description')
    .eq('bag_id', bagId)
    .order('sort_index');

  if (itemsError) {
    console.error('Items error:', itemsError);
    return;
  }

  const itemIds = items?.map(i => i.id) || [];
  const { data: links, error: linksError } = await supabase
    .from('links')
    .select('id, item_id, url, kind, label')
    .in('item_id', itemIds);

  if (linksError) console.error('Links error:', linksError);

  console.log('=== SEAN WALSH BAG ITEMS ===\n');
  for (const item of items || []) {
    console.log('---');
    console.log('Name:', item.custom_name);
    console.log('Brand:', item.brand);
    console.log('Notes:', item.notes || '(none)');
    const itemLinks = links?.filter(l => l.item_id === item.id) || [];
    for (const l of itemLinks) {
      console.log('Link:', l.url);
    }
  }
}

getBagDetails();
