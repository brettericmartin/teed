import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Source videos - updated with verification dates
const sourceVideos = [
  {
    custom_name: 'MKBHD Studio Tour 2021',
    brand: 'The Studio',
    url: 'https://www.youtube.com/watch?v=pkuxIy3kFZM',
    notes: 'Studio tour showing full production setup. Many items still in use today.'
  },
  {
    custom_name: "Gerald Undone x MKBHD Studio Tour (2023)",
    brand: 'Gerald Undone',
    url: 'https://www.youtube.com/watch?v=m9WbQMhkYvw',
    notes: 'More recent deep-dive covering gear philosophy and production workflow.'
  }
];

// CONFIRMED 2024 PRODUCTS
const recentProducts = [
  // Ridge Collab - Oct/Nov 2024
  {
    custom_name: 'Commuter Pro Backpack - MKBHD',
    brand: 'Ridge',
    url: 'https://ridge.com/products/commuter-pro-mkbhd',
    notes: 'Co-designed by MKBHD as Ridge\'s Chief Creative Partner. Signature red/black aesthetic. Launched Oct 2024.',
    is_hero: true
  },
  {
    custom_name: 'Carry-On - MKBHD Edition',
    brand: 'Ridge',
    url: 'https://ridge.com/products/mkbhd-carry-on',
    notes: 'Travel suitcase from MKBHD x Ridge collab. Launched 2024. $395.'
  },
  {
    custom_name: 'Wallet - Test Card',
    brand: 'Ridge',
    url: 'https://ridge.com/products/ridge-wallet-test-card',
    notes: 'MKBHD collaboration celebrating creators and engineers. Test card design. $76.'
  },
  // Camera - Verified April 2024
  {
    custom_name: 'V-RAPTOR 8K VV',
    brand: 'RED',
    url: 'https://www.red.com/v-raptor',
    notes: 'Primary camera. Shoots 8K compressed RAW in 2:1 aspect ratio. Verified April 2024. ~$24,500.'
  },
  {
    custom_name: 'EOS C500 Mark II',
    brand: 'Canon',
    url: 'https://www.usa.canon.com/shop/p/eos-c500-mark-ii',
    notes: 'Four units in the Waveform podcast room. Verified April 2024. ~$16,000 each.'
  },
  {
    custom_name: 'EOS R5',
    brand: 'Canon',
    url: 'https://www.usa.canon.com/shop/p/eos-r5',
    notes: 'Travel camera for first-person shots. Lighter for handheld work. Verified 2024. ~$3,899.'
  },
  // Lenses - Verified April 2024
  {
    custom_name: '24-35mm T2.2 FF Cine',
    brand: 'Sigma',
    url: 'https://www.sigmaphoto.com/24-35mm-t2-2-ff',
    notes: 'Primary lens for RED camera. His "go-to for any run and gun situation." Verified April 2024.'
  },
  {
    custom_name: 'Otus 55mm f/1.4',
    brand: 'Zeiss',
    url: 'https://www.zeiss.com/consumer-products/us/photography/otus/otus-1455.html',
    notes: 'For telephoto shots with wide aperture. Verified April 2024. ~$4,000.'
  },
  {
    custom_name: 'RF 15-35mm f/2.8L IS USM',
    brand: 'Canon',
    url: 'https://www.usa.canon.com/shop/p/rf15-35mm-f2-8-l-is-usm',
    notes: 'Paired with R5 for stills and first-person footage. Verified April 2024. ~$2,299.'
  },
  // Lighting - Verified April 2024
  {
    custom_name: 'SkyPanel S60-C',
    brand: 'ARRI',
    url: 'https://www.arri.com/en/lighting/led/skypanel/skypanel-s60',
    notes: 'Key light in 3-point setup. RGB color control. Verified April 2024. ~$3,450.'
  },
  {
    custom_name: '600c Pro',
    brand: 'Aputure',
    url: 'https://www.aputure.com/products/ls-600c-pro/',
    notes: 'Rim light and studio ambient lighting. Multiple units. Verified April 2024. ~$1,999 each.'
  },
  // Audio - Verified April 2024
  {
    custom_name: 'MKH 416 Shotgun Microphone',
    brand: 'Sennheiser',
    url: 'https://www.sennheiser.com/microphone-shotgun-broadcast-film-mkh-416',
    notes: 'Used for 95% of video content since 2016. Still in use. Verified April 2024. ~$989.'
  },
  // Computer - Confirmed Oct 2024
  {
    custom_name: 'MacBook Pro 16" M1 Max',
    brand: 'Apple',
    url: 'https://www.apple.com/shop/buy-mac/macbook-pro',
    notes: 'MKBHD confirmed Oct 2024 he\'s "still on M1 Max and doing just fine." Laptop of choice.'
  }
];

// LEGACY / OLDER FAVORITES - needs verification
const legacyProducts = [
  {
    custom_name: 'Embody Chair',
    brand: 'Herman Miller',
    url: 'https://www.hermanmiller.com/products/seating/office-chairs/embody-chairs/',
    notes: 'LEGACY: Industry-standard ergonomic chair. Featured in older studio tours. ~$1,635.'
  },
  {
    custom_name: 'Pro Display XDR (x2)',
    brand: 'Apple',
    url: 'https://www.apple.com/shop/buy-mac/pro-display-xdr',
    notes: 'LEGACY: Dual 6K displays. Featured in older studio tours. $10,000 total for pair.'
  },
  {
    custom_name: 'ATH-M50x Red Limited Edition',
    brand: 'Audio-Technica',
    url: 'https://www.audio-technica.com/en-us/ath-m50x',
    notes: 'LEGACY: Daily headphones from older setup. Red matches his aesthetic. ~$209.'
  },
  {
    custom_name: 'HS8 Studio Monitors',
    brand: 'Yamaha',
    url: 'https://usa.yamaha.com/products/proaudio/speakers/hs_series/index.html',
    notes: 'LEGACY: Studio reference monitors from older tours. ~$750 pair.'
  },
  {
    custom_name: 'MX Master 3',
    brand: 'Logitech',
    url: 'https://www.logitech.com/products/mice/mx-master-3s.html',
    notes: 'LEGACY: Premium productivity mouse. Featured in older desk setups. ~$100.'
  }
];

async function updateMKBHDBag() {
  // Get @teed profile
  const { data: teedProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('handle', 'teed')
    .single();

  if (profileError || !teedProfile) {
    console.error('Could not find @teed profile:', profileError);
    return;
  }

  console.log('Found @teed profile:', teedProfile.id);

  const code = 'mkbhd-studio-setup';

  // Find and delete existing bag
  const { data: existingBag } = await supabase
    .from('bags')
    .select('id, code')
    .eq('code', code)
    .single();

  if (existingBag) {
    console.log('Deleting existing bag...');
    // Delete links first
    const { data: items } = await supabase
      .from('bag_items')
      .select('id')
      .eq('bag_id', existingBag.id);

    if (items && items.length > 0) {
      const itemIds = items.map(i => i.id);
      await supabase.from('links').delete().in('bag_item_id', itemIds);
    }

    await supabase.from('bag_items').delete().eq('bag_id', existingBag.id);
    await supabase.from('bags').delete().eq('id', existingBag.id);
  }

  // Create the bag
  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .insert({
      owner_id: teedProfile.id,
      title: "MKBHD's Studio Setup",
      description: "Everything Marques Brownlee uses to create the internet's best tech reviews. 20M+ subscribers, Hollywood-grade production. Updated with 2024-verified sources.",
      is_public: true,
      code: code,
      tags: ['tech', 'youtube', 'studio', 'mkbhd', 'desk-setup', '2024']
    })
    .select()
    .single();

  if (bagError) {
    console.error('Error creating bag:', bagError);
    return;
  }

  console.log('Created bag:', bag.id);

  let sortIndex = 1;

  // Add source videos
  console.log('\n📹 Adding source videos...');
  for (const video of sourceVideos) {
    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .insert({
        bag_id: bag.id,
        custom_name: video.custom_name,
        brand: video.brand,
        notes: video.notes,
        sort_index: sortIndex++
      })
      .select()
      .single();

    if (!itemError && item) {
      await supabase.from('links').insert({
        bag_item_id: item.id,
        url: video.url,
        kind: 'video',
        label: 'Watch on YouTube'
      });
      console.log('  ✓ ' + video.custom_name);
    }
  }

  // Add 2024 verified products
  console.log('\n🆕 Adding 2024 VERIFIED products...');
  for (const product of recentProducts) {
    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .insert({
        bag_id: bag.id,
        custom_name: product.custom_name,
        brand: product.brand,
        notes: product.notes,
        sort_index: sortIndex++
      })
      .select()
      .single();

    if (!itemError && item) {
      await supabase.from('links').insert({
        bag_item_id: item.id,
        url: product.url,
        kind: 'product',
        label: 'Buy'
      });
      const heroTag = product.is_hero ? ' [HERO]' : '';
      console.log('  ✓ ' + product.brand + ' ' + product.custom_name + heroTag);
    }
  }

  // Add legacy products
  console.log('\n📦 Adding LEGACY favorites (older, needs verification)...');
  for (const product of legacyProducts) {
    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .insert({
        bag_id: bag.id,
        custom_name: product.custom_name,
        brand: product.brand,
        notes: product.notes,
        sort_index: sortIndex++
      })
      .select()
      .single();

    if (!itemError && item) {
      await supabase.from('links').insert({
        bag_item_id: item.id,
        url: product.url,
        kind: 'product',
        label: 'Buy'
      });
      console.log('  ○ ' + product.brand + ' ' + product.custom_name + ' [LEGACY]');
    }
  }

  const totalItems = sourceVideos.length + recentProducts.length + legacyProducts.length;
  console.log('\n✅ Bag updated successfully!');
  console.log('URL: http://localhost:3000/u/teed/' + bag.code);
  console.log('Total items: ' + totalItems);
  console.log('  - Source videos: ' + sourceVideos.length);
  console.log('  - 2024 verified: ' + recentProducts.length);
  console.log('  - Legacy items: ' + legacyProducts.length);
}

updateMKBHDBag();
