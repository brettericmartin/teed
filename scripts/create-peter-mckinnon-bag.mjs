import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Source video
const sourceVideo = {
  custom_name: "What's In My Camera Bag 2023 - Updated Kit",
  brand: 'Peter McKinnon',
  url: 'https://www.youtube.com/watch?v=krcbIAwggHw',
  notes: 'Full 2023 camera bag breakdown with all the gear Peter uses for photography and filmmaking.'
};

// Products from the video description - using Peter's actual affiliate links
const products = [
  {
    custom_name: 'Camera Bag',
    brand: 'Nomatic',
    url: 'https://bit.ly/3OrFZz2',
    notes: "Peter's go-to camera bag. Collaboration with Nomatic. HERO ITEM.",
    is_hero: true
  },
  {
    custom_name: 'Daily Camera (Primary)',
    brand: 'Sony',
    url: 'https://amzn.to/3ykrRQG',
    notes: "Peter's go-to daily camera for most shoots."
  },
  {
    custom_name: 'Most Used Lens',
    brand: 'Sony',
    url: 'https://amzn.to/33OBc5g',
    notes: 'Currently his most-used lens for video and photo work.'
  },
  {
    custom_name: 'Portrait & Detail Lens (Affordable Alternative)',
    brand: 'Sony',
    url: 'https://amzn.to/3fnJ6rJ',
    notes: 'Incredible for portraits and detail shots. Cheaper alternative option.'
  },
  {
    custom_name: 'Magical Telephoto Lens',
    brand: 'Sony',
    url: 'https://amzn.to/3bsPZqL',
    notes: "Peter's telephoto lens for compressed, cinematic shots."
  },
  {
    custom_name: 'Studio Lighting',
    brand: 'Aputure',
    url: 'https://bit.ly/4gySTsW',
    notes: 'The lighting Peter uses for his studio and indoor shoots.'
  },
  {
    custom_name: 'Vlog Microphone',
    brand: 'Rode',
    url: 'https://amzn.to/3bAiIdk',
    notes: 'On-camera mic for vlogging and run-and-gun shooting.'
  },
  {
    custom_name: 'VND Filters Edition II',
    brand: 'PolarPro x PM',
    url: 'http://bit.ly/PMVND_EDII',
    notes: 'PM VND Filters - imperative for outdoor shooting. Peter McKinnon signature collab.'
  },
  {
    custom_name: 'Helix Mag Lock',
    brand: 'PolarPro x PM',
    url: 'https://bit.ly/HelixMagLock',
    notes: 'Quick-release magnetic filter system.'
  },
  {
    custom_name: 'VND Filters',
    brand: 'PolarPro x PM',
    url: 'https://bit.ly/pmvnd',
    notes: 'Variable ND filters for controlling exposure outdoors.'
  },
  {
    custom_name: 'RECON VND Matte Box',
    brand: 'PolarPro x PM',
    url: 'https://bit.ly/ReconVNDMatteBox',
    notes: 'Professional matte box system with integrated VND.'
  },
  {
    custom_name: 'Drone (Legal Everywhere)',
    brand: 'DJI',
    url: 'https://amzn.to/33NJjzl',
    notes: 'Under 250g drone that can be flown legally in most places without registration.'
  },
  {
    custom_name: 'X5 Action Camera',
    brand: 'Insta360',
    url: 'https://www.insta360.com/sal/x5',
    notes: '360° action camera for immersive POV shots.'
  },
  {
    custom_name: 'Ace Pro Action Camera',
    brand: 'Insta360',
    url: 'https://www.insta360.com/sal/ace-pro-2',
    notes: 'High-end action camera with large sensor.'
  },
  {
    custom_name: 'Jaw Clamp for Action Cam',
    brand: 'GoPro',
    url: 'https://amzn.to/3wbjepV',
    notes: 'Versatile mounting clamp for action cameras.'
  },
  {
    custom_name: 'AirTags',
    brand: 'Apple',
    url: 'https://amzn.to/3wdBy1w',
    notes: 'Track camera bags and gear. Never lose your kit.'
  },
  {
    custom_name: 'Filter Case / Storage',
    brand: 'Various',
    url: 'https://amzn.to/3hxZcSg',
    notes: 'Keeps filters organized and protected in the bag.'
  },
  {
    custom_name: 'Travel Tripod',
    brand: 'Peak Design',
    url: 'https://amzn.to/3eTpXyX',
    notes: 'Compact travel tripod for on-location shoots.'
  },
  {
    custom_name: 'Gimbal Stabilizer',
    brand: 'DJI',
    url: 'https://amzn.to/3op361j',
    notes: 'Motorized gimbal for smooth handheld video.'
  },
  {
    custom_name: 'LUTs Pack',
    brand: 'Peter McKinnon',
    url: 'https://www.petermckinnon.com/luts',
    notes: "Peter's signature color grading LUTs for video."
  },
  {
    custom_name: 'Lightroom Presets + Prints',
    brand: 'Peter McKinnon',
    url: 'https://bit.ly/3pAM2X9',
    notes: 'Photo editing presets and limited edition prints.'
  },
  {
    custom_name: 'Coffee',
    brand: 'PM x James Coffee',
    url: 'https://bit.ly/3oum4p2',
    notes: 'Peter McKinnon x James Coffee collaboration. Fuel for creating.'
  },
  {
    custom_name: 'Hoodies, Rings & Pendants',
    brand: 'PM x Clocks & Colours',
    url: 'https://bit.ly/3oum4p2',
    notes: 'Peter McKinnon jewelry and apparel collaboration.'
  }
];

async function createPeterMcKinnonBag() {
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

  // Bag code
  const code = 'peter-mckinnon-camera-bag';

  // Check if bag already exists
  const { data: existingBag } = await supabase
    .from('bags')
    .select('id, code')
    .eq('code', code)
    .single();

  if (existingBag) {
    console.log('Bag already exists with code:', code);
    console.log('Deleting existing bag to recreate...');

    // Delete existing items first (links will cascade)
    await supabase.from('bag_items').delete().eq('bag_id', existingBag.id);
    // Delete existing bag
    await supabase.from('bags').delete().eq('id', existingBag.id);
  }

  // Create the bag
  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .insert({
      owner_id: teedProfile.id,
      title: "Peter McKinnon's Camera Bag 2023",
      description: "The complete kit Peter McKinnon uses to create stunning photography and cinematic videos. 6M+ subscribers. Filmmaker, photographer, coffee enthusiast.",
      is_public: true,
      code: code,
      tags: ['photography', 'filmmaking', 'youtube', 'camera-gear', 'peter-mckinnon']
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

  // Add source video first
  console.log('\nAdding source video...');
  const { data: videoItem, error: videoError } = await supabase
    .from('bag_items')
    .insert({
      bag_id: bag.id,
      custom_name: sourceVideo.custom_name,
      brand: sourceVideo.brand,
      notes: sourceVideo.notes,
      sort_index: sortIndex++
    })
    .select()
    .single();

  if (videoError) {
    console.error('Error adding video:', videoError);
  } else {
    // Add link for video
    await supabase.from('links').insert({
      bag_item_id: videoItem.id,
      url: sourceVideo.url,
      kind: 'video',
      label: 'Watch on YouTube'
    });
    console.log('  Added video:', sourceVideo.custom_name);
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
        label: product.url.includes('youtube') ? 'Watch' : 'Buy'
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
  console.log('Items: ' + (1 + products.length));
}

createPeterMcKinnonBag();
