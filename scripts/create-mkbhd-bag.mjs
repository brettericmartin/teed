import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate random bag code
function generateCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Source videos (following Sean Walsh pattern - channel name as "brand")
const sourceVideos = [
  {
    custom_name: 'MKBHD Studio Tour 2021!',
    brand: 'The Studio',
    url: 'https://www.youtube.com/watch?v=pkuxIy3kFZM',
    notes: 'Official studio tour showing full setup, cameras, lighting, and workspace.'
  },
  {
    custom_name: "MKBHD's Ridiculous YouTube Studio Tour",
    brand: 'Gerald Undone',
    url: 'https://www.youtube.com/watch?v=m9WbQMhkYvw',
    notes: '2023 deep-dive interview covering gear philosophy and production workflow.'
  },
  {
    custom_name: "What's in my Tech Bag! [2020]",
    brand: 'MKBHD',
    url: 'https://www.youtube.com/watch?v=il9SZU_nsVc',
    notes: 'EDC breakdown showing everyday carry tech and accessories.'
  }
];

// Products from the extraction
const products = [
  {
    custom_name: 'Commuter Backpack - MKBHD Edition',
    brand: 'Ridge',
    url: 'https://ridge.com/products/commuter-backpack-mkbhd',
    notes: "Co-designed by MKBHD as Ridge's Chief Creative Partner. Signature red/black aesthetic. HERO ITEM.",
    is_hero: true
  },
  {
    custom_name: 'Embody Chair',
    brand: 'Herman Miller',
    url: 'https://www.hermanmiller.com/products/seating/office-chairs/embody-chairs/',
    notes: 'Industry-standard ergonomic chair for long editing sessions. ~$1,635.'
  },
  {
    custom_name: 'Pro Display XDR (x2)',
    brand: 'Apple',
    url: 'https://www.apple.com/shop/buy-mac/pro-display-xdr',
    notes: 'Dual 6K Retina displays. $10,000 total for the pair.'
  },
  {
    custom_name: 'K2 Wireless Mechanical Keyboard',
    brand: 'Keychron',
    url: 'https://www.keychron.com/products/keychron-k2-wireless-mechanical-keyboard',
    notes: 'His first mechanical keyboard. Mac layout, wireless, compact 75% layout. ~$90.'
  },
  {
    custom_name: 'MX Master 3',
    brand: 'Logitech',
    url: 'https://www.logitech.com/products/mice/mx-master-3s.html',
    notes: 'Premium productivity mouse with MagSpeed scroll wheel. ~$100.'
  },
  {
    custom_name: 'MKH 416 Shotgun Microphone',
    brand: 'Sennheiser',
    url: 'https://www.sennheiser.com/microphone-shotgun-recording-mke-416',
    notes: 'Used for 95% of video content since 2016. Industry standard. ~$989.'
  },
  {
    custom_name: 'ATH-M50x Red Limited Edition',
    brand: 'Audio-Technica',
    url: 'https://www.audio-technica.com/en-us/ath-m50x',
    notes: 'Daily headphones. Red limited edition matches his signature aesthetic. ~$209.'
  },
  {
    custom_name: 'HS8 Studio Monitors',
    brand: 'Yamaha',
    url: 'https://usa.yamaha.com/products/proaudio/speakers/hs_series/index.html',
    notes: 'Industry-standard studio reference monitors (pair). ~$750.'
  },
  {
    custom_name: 'Apollo Twin MkII',
    brand: 'Universal Audio',
    url: 'https://www.uaudio.com/audio-interfaces/apollo-twin.html',
    notes: 'Professional audio interface with UAD processing. ~$1,099.'
  },
  {
    custom_name: 'V-RAPTOR 8K VV',
    brand: 'RED',
    url: 'https://www.red.com/v-raptor',
    notes: 'Primary camera. Shoots 8K compressed RAW. ~$24,500.'
  },
  {
    custom_name: 'EOS R5',
    brand: 'Canon',
    url: 'https://www.usa.canon.com/shop/p/eos-r5',
    notes: 'Travel camera. Lighter for handheld and first-person shots. ~$3,899.'
  },
  {
    custom_name: 'EF 100mm f/2.8L Macro IS USM',
    brand: 'Canon',
    url: 'https://www.usa.canon.com/shop/p/ef-100mm-f-2-8l-macro-is-usm',
    notes: 'Creates his signature tech detail shots. ~$1,299.'
  },
  {
    custom_name: 'SkyPanel S60-C',
    brand: 'ARRI',
    url: 'https://www.arri.com/en/lighting/led/skypanel/skypanel-s60',
    notes: 'Main key light. Cinema-grade RGB LED panel. ~$3,450.'
  },
  {
    custom_name: 'Hien Mousepad (Wine Red)',
    brand: 'Artisan',
    url: 'https://www.artisan-jp.com/fx-hien-eng.html',
    notes: 'Japanese import. Red to match signature aesthetic. ~$84.'
  },
  {
    custom_name: 'Air Pro Standing Desk',
    brand: 'XDesk',
    url: 'https://www.xdesk.com/air-pro',
    notes: 'Electric standing desk with solid aluminum construction. ~$2,578.'
  }
];

async function createMKBHDBag() {
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

  // Generate unique code
  const code = 'mkbhd-studio-setup';

  // Check if bag already exists
  const { data: existingBag } = await supabase
    .from('bags')
    .select('id, code')
    .eq('code', code)
    .single();

  if (existingBag) {
    console.log('Bag already exists with code:', code);
    console.log('Deleting existing bag to recreate...');

    // Delete existing items first
    await supabase.from('bag_items').delete().eq('bag_id', existingBag.id);
    // Delete existing bag
    await supabase.from('bags').delete().eq('id', existingBag.id);
  }

  // Create the bag
  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .insert({
      owner_id: teedProfile.id,
      title: "MKBHD's Studio Setup",
      description: "Everything Marques Brownlee uses to create the internet's best tech reviews. 20M+ subscribers, Hollywood-grade production.",
      is_public: true,
      code: code,
      tags: ['tech', 'youtube', 'studio', 'mkbhd', 'desk-setup']
    })
    .select()
    .single();

  if (bagError) {
    console.error('Error creating bag:', bagError);
    return;
  }

  console.log('Created bag:', bag.id, '-', bag.title);
  console.log('Code:', bag.code);

  let sortIndex = 1;

  // Add source videos first
  console.log('\nAdding source videos...');
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

    if (itemError) {
      console.error('Error adding video ' + video.custom_name + ':', itemError);
    } else {
      // Add link for video
      const { error: linkError } = await supabase.from('links').insert({
        bag_item_id: item.id,
        url: video.url,
        kind: 'video',
        label: 'Watch on YouTube'
      });

      if (linkError) {
        console.error('Error adding link:', linkError);
      }

      console.log('  Added video: ' + video.custom_name);
    }
  }

  // Add products
  console.log('\nAdding products...');
  for (const product of products) {
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

    if (itemError) {
      console.error('Error adding product ' + product.custom_name + ':', itemError);
    } else {
      // Add link for product
      const { error: linkError } = await supabase.from('links').insert({
        bag_item_id: item.id,
        url: product.url,
        kind: 'product',
        label: 'Buy'
      });

      if (linkError) {
        console.error('Error adding link:', linkError);
      }

      const heroTag = product.is_hero ? ' [HERO]' : '';
      console.log('  Added: ' + product.brand + ' ' + product.custom_name + heroTag);
    }
  }

  console.log('\n✅ Bag created successfully!');
  console.log('URL: https://teed.club/u/teed/' + bag.code);
  console.log('Local: http://localhost:3000/u/teed/' + bag.code);
  console.log('Items: ' + (sourceVideos.length + products.length));
}

createMKBHDBag();
