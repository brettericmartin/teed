/**
 * Create "CES 2026 — 14 Gadgets That Actually Impressed Us" bag
 * Source: https://www.youtube.com/watch?v=J1JBx8H5M5o (EXCESSORIZE ME.)
 *
 * All 14 products from the video with verified links.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEED_USER_ID = '2c3e503a-78ce-4a8d-ae37-60b4a16d916e';

interface ItemInput {
  custom_name: string;
  brand: string;
  custom_description: string;
  price_paid: number | null;
  sort_index: number;
}

async function main() {
  console.log('Creating CES 2026 EXCESSORIZE ME bag...\n');

  // 1. Create the bag
  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .insert({
      owner_id: TEED_USER_ID,
      title: 'CES 2026: 14 Gadgets That Actually Impressed Us',
      description:
        'Every product from EXCESSORIZE ME\'s CES 2026 floor tour — from the card-sized IKKO MindOne Pro phone to the Hypershell X Ultra exoskeleton. A mix of everyday carry, smart home, and futuristic tech that stood out at the show.',
      is_public: true,
      tags: ['CES 2026', 'tech', 'gadgets', 'EDC', 'smart home', 'EXCESSORIZE ME'],
    })
    .select('id, code')
    .single();

  if (bagError) {
    console.error('Failed to create bag:', bagError);
    process.exit(1);
  }

  console.log(`Bag created: ${bag.code} (${bag.id})\n`);

  // 2. Define items (all 14 from video)
  const items: ItemInput[] = [
    {
      custom_name: 'IKKO MindOne Pro',
      brand: 'IKKO',
      custom_description:
        'Card-sized AI phone with 4" AMOLED display, 50MP rotating camera, 8GB/256GB, Android 15, and free global internet via NovaLink for 60 regions. Measures just 86×72mm.',
      price_paid: 369,
      sort_index: 0,
    },
    {
      custom_name: 'Aulumu A17 iPhone 17 Case',
      brand: 'Aulumu',
      custom_description:
        'Slim shockproof MagSafe case for iPhone 17 series with Avient corners (4× shock absorption beyond MIL-STD-810G), CoolHyper cooling, and color-changing temperature indicator. Available in aramid fiber, vegan leather, rugged, and frosted variants.',
      price_paid: null,
      sort_index: 1,
    },
    {
      custom_name: 'Aulumu Samsung S26 Ultra Case',
      brand: 'Aulumu',
      custom_description:
        'MagSafe-compatible case for Samsung Galaxy S26 Ultra with built-in magnets, CoolHyper cooling system, aramid fiber or TPU construction, and glow-in-the-dark panel option.',
      price_paid: null,
      sort_index: 2,
    },
    {
      custom_name: 'Aulumu M10 MagSafe PowerBank',
      brand: 'Aulumu',
      custom_description:
        '10,000mAh dual-mag power bank with MagSafe wireless (15W), Apple Watch charger, 35W USB-C PD, built-in retractable cable, and active cooling. Weighs 248g. Flight-approved.',
      price_paid: 90,
      sort_index: 3,
    },
    {
      custom_name: 'Aulumu G09 Infinite 360° MagSafe Stand',
      brand: 'Aulumu',
      custom_description:
        'World\'s first 3-axis 360° rotation MagSafe stand. Works as phone grip, kickstand, and magnetic mount. Aluminum body, 35g, 6.15mm thin. Compatible with iPhone 12–17.',
      price_paid: null,
      sort_index: 4,
    },
    {
      custom_name: 'Sense Robot AI Chess Coach',
      brand: 'Sense Robot',
      custom_description:
        'AI-powered robotic chess board that physically moves pieces. Adaptive difficulty from beginner to master level. Built-in coaching, puzzles, and online play capability.',
      price_paid: null,
      sort_index: 5,
    },
    {
      custom_name: 'GoveeLife Smart Nugget Ice Maker',
      brand: 'GoveeLife',
      custom_description:
        'Countertop nugget ice maker with smart app control via Govee Home. Makes soft, chewable nugget ice. Wi-Fi connected for scheduling and monitoring.',
      price_paid: null,
      sort_index: 6,
    },
    {
      custom_name: 'TP-Link Tapo C425 Outdoor Security Camera',
      brand: 'TP-Link',
      custom_description:
        'Wire-free outdoor security camera with starlight night vision, smart AI detection, IP66 weatherproof rating, and long battery life. Works with Tapo app.',
      price_paid: null,
      sort_index: 7,
    },
    {
      custom_name: 'Tilta FE Design Bags',
      brand: 'Tilta',
      custom_description:
        'Premium lifestyle bags from Tilta\'s FE Design line. Designed for creators and tech carry — modular compartments for cameras, gadgets, and everyday essentials.',
      price_paid: null,
      sort_index: 8,
    },
    {
      custom_name: 'Hypershell X Ultra Exoskeleton',
      brand: 'Hypershell',
      custom_description:
        'AI-powered wearable exoskeleton with 1000W of power, 30km battery range, titanium and carbon fiber frame weighing just 5 lbs. 12 sensors for adaptive assistance during hiking, cycling, and daily use. SGS-certified.',
      price_paid: 1599,
      sort_index: 9,
    },
    {
      custom_name: 'UGREEN Nexode Pro 300W Desktop Charger',
      brand: 'UGREEN',
      custom_description:
        '8-port GaN desktop charging station with three 140W PD 3.1 ports, a 240W DC port for gaming laptops, 3-inch TFT status display, and 5 smart charging modes via UGREEN App. Showcased at CES 2026.',
      price_paid: null,
      sort_index: 10,
    },
    {
      custom_name: 'Rolling Square Await Camera',
      brand: 'Rolling Square',
      custom_description:
        'Retro-styled digital camera limited to 24 shots per "roll." No rear screen — shoot through a viewfinder, wait 24 hours to see photos in the app, then get 4×6 prints mailed to you. Transparent Swiss design. Expected $70–100.',
      price_paid: null,
      sort_index: 11,
    },
    {
      custom_name: 'Anno Robot AI Latte Art Kiosk',
      brand: 'Anno Robot',
      custom_description:
        'AI-powered robotic barista kiosk with a precision robotic arm that executes latte art. 99% standardization rate, 300+ cups/day capacity. Showcased at CES 2026 alongside their AI Bartender Kiosk.',
      price_paid: null,
      sort_index: 12,
    },
    {
      custom_name: 'SOTSU FlipAction Elite 16" Portable Monitor',
      brand: 'SOTSU',
      custom_description:
        '16" 4K portable monitor (3840×2400) with 450 nits, 100% DCI-P3, patent-pending 180° FlipAction rotation. CNC aluminum body at just 6mm thin and 925g. USB-C + Mini HDMI + SD slot.',
      price_paid: null,
      sort_index: 13,
    },
  ];

  // 3. Insert items
  for (const item of items) {
    const { data: inserted, error: itemError } = await supabase
      .from('bag_items')
      .insert({
        bag_id: bag.id,
        custom_name: item.custom_name,
        brand: item.brand,
        custom_description: item.custom_description,
        price_paid: item.price_paid,
        sort_index: item.sort_index,
      })
      .select('id, custom_name')
      .single();

    if (itemError) {
      console.error(`Failed to insert "${item.custom_name}":`, itemError);
    } else {
      console.log(`  Item: ${inserted.custom_name} (${inserted.id})`);
    }
  }

  console.log(`\nDone! Bag: https://teed.club/u/teed/${bag.code}`);
  console.log(`\nNext: Run add-ces2026-excessorize-links.ts to attach verified URLs.`);
}

main().catch(console.error);
