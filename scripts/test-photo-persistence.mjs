import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPhotoData() {
  console.log('🔍 Testing Photo Persistence\n');
  console.log('='.repeat(60));

  // 1. Check bag_items with custom_photo_id
  console.log('\n1️⃣  Checking bag_items with photos...\n');
  const { data: items, error: itemsError } = await supabase
    .from('bag_items')
    .select('id, custom_name, custom_photo_id')
    .not('custom_photo_id', 'is', null)
    .limit(5);

  if (itemsError) {
    console.error('❌ Error fetching items:', itemsError);
  } else {
    console.log(`Found ${items?.length || 0} items with photos:`);
    items?.forEach((item) => {
      console.log(`  - ${item.custom_name} (${item.id})`);
      console.log(`    Photo ID: ${item.custom_photo_id}`);
    });
  }

  // 2. Check media_assets
  console.log('\n2️⃣  Checking media_assets...\n');
  const { data: mediaAssets, error: mediaError } = await supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (mediaError) {
    console.error('❌ Error fetching media assets:', mediaError);
  } else {
    console.log(`Found ${mediaAssets?.length || 0} media assets:`);
    mediaAssets?.forEach((asset) => {
      console.log(`  - ID: ${asset.id}`);
      console.log(`    URL: ${asset.url.substring(0, 80)}...`);
      console.log(`    Source: ${asset.source_type}`);
      console.log(`    Created: ${asset.created_at}`);
      console.log('');
    });
  }

  // 3. Test the GET endpoint logic
  console.log('\n3️⃣  Testing GET endpoint logic...\n');

  // Get test bag
  const { data: bag } = await supabase
    .from('bags')
    .select('id, code')
    .eq('code', 'test-bag-1763259921402')
    .single();

  if (bag) {
    console.log(`Testing with bag: ${bag.code}\n`);

    // Fetch items
    const { data: bagItems } = await supabase
      .from('bag_items')
      .select('*')
      .eq('bag_id', bag.id)
      .order('sort_index', { ascending: true });

    console.log(`Found ${bagItems?.length || 0} items in bag`);

    // Get photo IDs
    const photoIds = bagItems
      ?.map((item) => item.custom_photo_id)
      .filter((id) => id !== null) || [];

    console.log(`Photo IDs to fetch: ${photoIds.length}`);
    console.log(photoIds);

    if (photoIds.length > 0) {
      // Fetch media assets
      const { data: photos, error: photosError } = await supabase
        .from('media_assets')
        .select('id, url')
        .in('id', photoIds);

      if (photosError) {
        console.error('❌ Error fetching photos:', photosError);
      } else {
        console.log(`\nFetched ${photos?.length || 0} photos:`);

        const photoUrls = (photos || []).reduce((acc, asset) => {
          acc[asset.id] = asset.url;
          return acc;
        }, {});

        console.log('\nPhoto URLs map:');
        console.log(photoUrls);

        // Build items with photo_url
        const itemsWithPhotos = (bagItems || []).map((item) => {
          const photoUrl = item.custom_photo_id ? photoUrls[item.custom_photo_id] || null : null;
          return {
            id: item.id,
            custom_name: item.custom_name,
            custom_photo_id: item.custom_photo_id,
            photo_url: photoUrl
          };
        });

        console.log('\nFinal items with photo_url:');
        itemsWithPhotos.forEach((item) => {
          console.log(`  - ${item.custom_name}`);
          console.log(`    custom_photo_id: ${item.custom_photo_id}`);
          console.log(`    photo_url: ${item.photo_url ? 'YES' : 'NO'}`);
        });
      }
    }
  }

  console.log('\n' + '='.repeat(60));
}

testPhotoData().catch(console.error);
