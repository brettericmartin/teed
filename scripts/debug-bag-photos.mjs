// Debug bag photo display
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBag() {
  // Find bags with "side table" in the title
  const { data: bags, error } = await supabase
    .from('bags')
    .select(`
      id,
      code,
      title,
      background_image,
      items:bag_items(
        id,
        custom_name,
        is_featured,
        custom_photo_id
      )
    `)
    .ilike('title', '%side table%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!bags || bags.length === 0) {
    console.log('No bags found with "side table" in title');
    return;
  }

  for (const bag of bags) {
    console.log('\n' + '='.repeat(60));
    console.log(`Bag: ${bag.title} (${bag.code})`);
    console.log('Has background_image:', !!bag.background_image);
    console.log('Total items:', bag.items?.length || 0);

    const featuredWithPhotos = bag.items?.filter(item => item.is_featured && item.custom_photo_id) || [];
    const featured = bag.items?.filter(item => item.is_featured) || [];
    const withPhotos = bag.items?.filter(item => item.custom_photo_id) || [];

    console.log('Items marked as featured:', featured.length);
    console.log('Items with photos:', withPhotos.length);
    console.log('Items featured AND with photos:', featuredWithPhotos.length);

    console.log('\nItem details:');
    bag.items?.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.custom_name}`);
      console.log(`     - Featured: ${item.is_featured}`);
      console.log(`     - Has photo: ${!!item.custom_photo_id}`);
    });

    console.log('\nWhat will show on card:');
    if (bag.background_image && featuredWithPhotos.length > 0) {
      console.log('  Layout: Bag photo (hero) + 6 item photos');
      console.log(`  Will show: Bag + ${Math.min(6, featuredWithPhotos.length)} items = ${Math.min(6, featuredWithPhotos.length) + 1} photos total`);
    } else if (featuredWithPhotos.length > 0) {
      console.log('  Layout: 8 equal-sized item photos (no bag photo)');
      console.log(`  Will show: ${Math.min(8, featuredWithPhotos.length)} items`);
    } else if (bag.background_image) {
      console.log('  Layout: Only bag photo (no items)');
    } else {
      console.log('  Layout: Empty placeholder');
    }
  }
}

debugBag();
