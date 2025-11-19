import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugPreviewEnrichment() {
  console.log('🔍 Debug: Preview Enrichment Issue\n');

  // Find the "My side table setup" bag
  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .select('id, title, owner_id, code')
    .eq('title', 'My side table setup')
    .single();

  if (bagError || !bag) {
    console.error('❌ Bag not found:', bagError);
    return;
  }

  console.log('✅ Found bag:', bag);
  console.log('Bag ID:', bag.id);
  console.log('');

  // Get items from this bag
  const { data: items, error: itemsError } = await supabase
    .from('bag_items')
    .select('*')
    .eq('bag_id', bag.id);

  if (itemsError) {
    console.error('❌ Error fetching items:', itemsError);
    return;
  }

  console.log(`📦 Found ${items?.length || 0} items in bag:\n`);

  items?.forEach((item, idx) => {
    console.log(`Item ${idx + 1}:`, JSON.stringify(item, null, 2));
    console.log('');
  });

  // Check existing links
  if (items && items.length > 0) {
    const itemIds = items.map(item => item.id);
    const { data: links } = await supabase
      .from('links')
      .select('bag_item_id, url, label, is_auto_generated')
      .in('bag_item_id', itemIds);

    console.log(`🔗 Found ${links?.length || 0} links for these items\n`);
  }
}

debugPreviewEnrichment().catch(console.error);
