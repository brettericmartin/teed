import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Source video
const sourceVideo = {
  custom_name: "What's In My Camera Bag 2023",
  brand: 'Peter McKinnon',
  url: 'https://www.youtube.com/watch?v=krcbIAwggHw',
  photo_url: 'https://img.youtube.com/vi/krcbIAwggHw/maxresdefault.jpg',
  notes: 'Full 2023 camera bag breakdown - Peter walks through every piece of gear he uses for photography and filmmaking.'
};

// Products with accurate data from scraping + ASIN lookups
const products = [
  // === CAMERA BAG (HERO) ===
  {
    custom_name: 'Peter McKinnon Camera Collection',
    brand: 'Nomatic',
    url: 'https://bit.ly/3OrFZz2',
    photo_url: 'https://www.nomatic.com/cdn/shop/collections/Desktop_-_PLP_-_Camera_-_McKinnon.png?v=1730832628',
    notes: 'Peter McKinnon x Nomatic camera bag collection. Customizable compartments, sleek design, built to protect your gear.',
    is_hero: true
  },

  // === CAMERA BODY ===
  {
    custom_name: 'EOS R5 (Body Only)',
    brand: 'Canon',
    url: 'https://amzn.to/3ykrRQG',
    photo_url: 'https://m.media-amazon.com/images/I/71xyxGGvvGL._AC_SL1500_.jpg',
    notes: 'Full-frame mirrorless. 45MP CMOS sensor, DIGIC X processor, 8K video, up to 12fps mechanical / 20fps electronic shutter. In-body stabilization up to 8 stops.'
  },

  // === LENSES ===
  {
    custom_name: 'RF 15-35mm F2.8 L IS USM',
    brand: 'Canon',
    url: 'https://amzn.to/33OBc5g',
    photo_url: 'https://m.media-amazon.com/images/I/71xqVeDKfML._AC_SL1500_.jpg',
    notes: 'Wide-angle L-series zoom. f/2.8 max aperture, Nano USM for quiet focusing, 5 stops shake correction. Great for landscapes and architecture.'
  },
  {
    custom_name: 'RF 50mm F1.8 STM',
    brand: 'Canon',
    url: 'https://amzn.to/3fnJ6rJ',
    photo_url: 'https://m.media-amazon.com/images/I/61kKSqDks2L._AC_SL1500_.jpg',
    notes: 'Compact "nifty fifty" prime. f/1.8 for beautiful bokeh, STM motor for smooth video AF. Affordable alternative for portraits and low-light.'
  },
  {
    custom_name: 'RF 70-200mm F2.8 L IS USM',
    brand: 'Canon',
    url: 'https://amzn.to/3bsPZqL',
    photo_url: 'https://m.media-amazon.com/images/I/61JW-sGNfmL._AC_SL1500_.jpg',
    notes: "Canon's shortest & lightest 70-200 f/2.8. Dual Nano USM motors, 5 stops IS, minimum focus 2.3ft. Ideal for portraits, weddings, sports."
  },

  // === POLARPRO x PM PRODUCTS ===
  {
    custom_name: 'Helix MagLock - McKinnon Edition',
    brand: 'PolarPro',
    url: 'https://bit.ly/HelixMagLock',
    photo_url: 'https://www.polarpro.com/cdn/shop/files/Untitled-1_3_94376d2f-ddd6-4ba0-91df-1ac5881e601b.jpg?v=1729107340',
    notes: 'Magnetic quick-release filter system. No threading - magnets + quarter turn lock. No vignetting down to 17mm. Rubber frame dampens vibrations. $329.99'
  },
  {
    custom_name: 'PMVND Edition II',
    brand: 'PolarPro',
    url: 'https://bit.ly/pmvnd',
    photo_url: 'https://www.polarpro.com/cdn/shop/files/VND_2-5.jpg?v=1741888433',
    notes: 'Peter McKinnon Variable ND Filters. Seamless light control 2-5 stops. Essential for outdoor shooting - control exposure without changing settings. $149.99'
  },
  {
    custom_name: 'Recon VND/PL Matte Box Kit',
    brand: 'PolarPro',
    url: 'https://bit.ly/ReconVNDMatteBox',
    photo_url: 'https://www.polarpro.com/cdn/shop/files/CHROMA-VND-PL-BASEKIT_d931303e-b629-4aea-a3cc-36bdd04b730b.jpg?v=1729100995',
    notes: 'Professional matte box with integrated VND and polarizer. Precision filmmaking, reduces glare, optimal light control. $399.99 (reg $449.99)'
  },

  // === LIGHTING ===
  {
    custom_name: 'Studio Lighting',
    brand: 'Aputure',
    url: 'https://bit.ly/4gySTsW',
    photo_url: 'https://cdn.shopify.com/oxygen-v2/32598/21497/44510/2706712/assets/meta-image-CEJ7VDhJ.jpg',
    notes: 'Professional LED lighting. Aputure is known for cinema-grade lights with excellent color accuracy and output.'
  },

  // === AUDIO ===
  {
    custom_name: 'VideoMic Pro R',
    brand: 'Rode',
    url: 'https://amzn.to/3bAiIdk',
    photo_url: 'https://m.media-amazon.com/images/I/71lOXzW8F0L._AC_SL1500_.jpg',
    notes: 'Broadcast-quality on-camera shotgun mic. Supercardioid pattern, Rycote Lyre shockmount, 80Hz high-pass filter, -10dB pad. 70+ hours on 9V battery.'
  },

  // === DRONE ===
  {
    custom_name: 'Mini 2 Fly More Combo',
    brand: 'DJI',
    url: 'https://amzn.to/33NJjzl',
    photo_url: 'https://m.media-amazon.com/images/I/71uPpemuvaL._AC_SL1500_.jpg',
    notes: 'Under 249g = legal almost everywhere without registration. 4K/30fps, 12MP photos, 31 min flight time, 10km OcuSync 2.0 transmission. Folds to fit in palm.'
  },

  // === ACTION CAMERAS ===
  {
    custom_name: 'X5 Action Camera',
    brand: 'Insta360',
    url: 'https://www.insta360.com/sal/x5',
    photo_url: 'https://res.insta360.com/static/cfc3003a35f72bfefd1bf7ea79c8d36a/x5-pc.png',
    notes: '360° action camera for immersive POV shots. Reframe in post to any angle.'
  },
  {
    custom_name: 'Ace Pro 2',
    brand: 'Insta360',
    url: 'https://www.insta360.com/sal/ace-pro-2',
    photo_url: 'https://res.insta360.com/static/ecdfa62e8dc48b21a6f9a9b6ccb3bba0/ace-pro-2-pc.png',
    notes: 'Premium action camera with large 1/1.3" sensor. Low-light king with Leica optics.'
  },

  // === SUPPORT & ACCESSORIES ===
  {
    custom_name: 'GorillaPod Rig',
    brand: 'JOBY',
    url: 'https://amzn.to/3eTpXyX',
    photo_url: 'https://m.media-amazon.com/images/I/71MDAE+xOtL._AC_SL1500_.jpg',
    notes: 'Flexible tripod with arms for mounting lights and mics. Holds up to 5kg. Essential for vlogging and run-and-gun content creation.'
  },
  {
    custom_name: 'OM 4 Smartphone Gimbal',
    brand: 'DJI',
    url: 'https://amzn.to/3op361j',
    photo_url: 'https://m.media-amazon.com/images/I/51NJ2n8URIL._AC_SL1500_.jpg',
    notes: 'Magnetic phone attachment, 3-axis stabilization, ActiveTrack 3.0, gesture control. Foldable for portability.'
  },
  {
    custom_name: 'Gripper Mount for Action Cams',
    brand: 'Dango Design',
    url: 'https://amzn.to/3wbjepV',
    photo_url: 'https://m.media-amazon.com/images/I/71BU2fPHJWL._AC_SL1500_.jpg',
    notes: 'Universal jaw clamp for helmet chin guard mounting. Works with GoPro, DJI, Insta360. Dual torsion spring, up to 2.5" thick objects.'
  },
  {
    custom_name: 'Filter Nest Mini',
    brand: 'Think Tank',
    url: 'https://amzn.to/3hxZcSg',
    photo_url: 'https://m.media-amazon.com/images/I/71hB1bRJDkL._AC_SL1500_.jpg',
    notes: 'Protective filter pouch for 4 round filters up to 82mm. Keeps filters organized and scratch-free in your bag.'
  },
  {
    custom_name: 'AirTag (4 Pack)',
    brand: 'Apple',
    url: 'https://amzn.to/3wdBy1w',
    photo_url: 'https://m.media-amazon.com/images/I/71gY9E+cTaS._AC_SL1500_.jpg',
    notes: 'Track your camera bags and gear cases. Precision Finding with U1 chip. Never lose your kit on a shoot.'
  },

  // === PM BRANDED PRODUCTS ===
  {
    custom_name: 'Color Grading LUTs Pack',
    brand: 'Peter McKinnon',
    url: 'https://www.petermckinnon.com/luts',
    photo_url: 'https://images.squarespace-cdn.com/content/v1/5a6c319b18b27d288ea06e66/1607107082091-8Z7MKCMVH51XHPBXE9FT/LUTs.jpg',
    notes: "Peter's signature color grading LUTs for video. Cinematic looks in one click."
  },
  {
    custom_name: 'Lightroom Presets + Limited Edition Prints',
    brand: 'Peter McKinnon',
    url: 'https://bit.ly/3pAM2X9',
    notes: 'Photo editing presets for Lightroom and exclusive limited edition prints.'
  },
  {
    custom_name: 'PM x James Coffee',
    brand: 'Peter McKinnon',
    url: 'https://bit.ly/3oum4p2',
    notes: 'Peter McKinnon x James Coffee collaboration. Fuel for early morning shoots and late editing sessions.'
  },
  {
    custom_name: 'Hoodies, Rings & Pendants',
    brand: 'Clocks & Colours x PM',
    url: 'https://bit.ly/3oum4p2',
    notes: 'Peter McKinnon x Clocks & Colours collaboration. Signature jewelry and apparel.'
  }
];

async function updatePeterMcKinnonBag() {
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

  const code = 'peter-mckinnon-camera-bag';

  // Check if bag exists
  const { data: existingBag } = await supabase
    .from('bags')
    .select('id, code')
    .eq('code', code)
    .single();

  if (existingBag) {
    console.log('Deleting existing bag:', code);
    await supabase.from('bag_items').delete().eq('bag_id', existingBag.id);
    await supabase.from('bags').delete().eq('id', existingBag.id);
  }

  // Create the bag
  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .insert({
      owner_id: teedProfile.id,
      title: "Peter McKinnon's Camera Bag 2023",
      description: "Everything Peter McKinnon uses to create stunning photography and cinematic videos. Canon EOS R5, RF L-series glass, PolarPro filters, and the gear that powers 6M+ subscribers.",
      is_public: true,
      code: code,
      tags: ['photography', 'filmmaking', 'youtube', 'camera-gear', 'peter-mckinnon', 'canon']
    })
    .select()
    .single();

  if (bagError) {
    console.error('Error creating bag:', bagError);
    return;
  }

  console.log('Created bag:', bag.id, '-', bag.title);

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
      photo_url: sourceVideo.photo_url,
      sort_index: sortIndex++
    })
    .select()
    .single();

  if (!videoError) {
    await supabase.from('links').insert({
      bag_item_id: videoItem.id,
      url: sourceVideo.url,
      kind: 'video',
      label: 'Watch on YouTube'
    });
    console.log('  ✓ ' + sourceVideo.custom_name);
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
        photo_url: product.photo_url || null,
        sort_index: sortIndex++
      })
      .select()
      .single();

    if (itemError) {
      console.error('  ✗ Error adding ' + product.custom_name + ':', itemError.message);
    } else {
      // Add link
      await supabase.from('links').insert({
        bag_item_id: item.id,
        url: product.url,
        kind: 'product',
        label: 'Buy'
      });

      const heroTag = product.is_hero ? ' [HERO]' : '';
      const photoTag = product.photo_url ? ' 📷' : '';
      console.log('  ✓ ' + product.brand + ' ' + product.custom_name + heroTag + photoTag);
    }
  }

  // Set hero item
  const { data: heroItem } = await supabase
    .from('bag_items')
    .select('id')
    .eq('bag_id', bag.id)
    .eq('custom_name', 'Peter McKinnon Camera Collection')
    .single();

  if (heroItem) {
    await supabase.from('bags').update({ hero_item_id: heroItem.id }).eq('id', bag.id);
    console.log('\n✓ Set hero item: Nomatic Camera Collection');
  }

  console.log('\n✅ Bag updated successfully!');
  console.log('URL: https://teed.club/u/teed/' + bag.code);
  console.log('Local: http://localhost:3000/u/teed/' + bag.code);
  console.log('Items: ' + (1 + products.length));
}

updatePeterMcKinnonBag();
