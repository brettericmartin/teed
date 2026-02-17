/**
 * Create "Home Espresso Setup" bag from r/espresso post
 * Source: https://www.reddit.com/r/espresso/comments/1r5iw4s/my_setup_is_done/
 *
 * Products:
 *   1. Quick Mill Pop-Up (Model 02044) — espresso machine
 *   2. Timemore Sculptor 064S — flat burr grinder
 *   3. Timemore PUCKS Espresso Accessories Set — WDT + distributor + tamper
 *   4. Quick Mill Bottomless Portafilter — 58mm naked portafilter
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEED_USER_ID = '2c3e503a-78ce-4a8d-ae37-60b4a16d916e';

interface ItemInput {
  name: string;
  brand: string;
  category: string;
  description: string;
  price_cents: number | null;
  position: number;
}

async function main() {
  console.log('Creating espresso setup bag...\n');

  // 1. Create the bag
  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .insert({
      owner_id: TEED_USER_ID,
      title: 'Home Espresso Setup: Quick Mill Pop-Up + Timemore Sculptor 064S',
      description:
        'A complete home espresso station featuring the Quick Mill Pop-Up with PID and pressure profiling, paired with the Timemore Sculptor 064S flat burr grinder and PUCKS accessories set. Inspired by an r/espresso setup post.',
      is_public: true,
      tags: ['espresso', 'coffee', 'home barista', 'espresso setup', 'quick mill', 'timemore'],
    })
    .select('id, code')
    .single();

  if (bagError) {
    console.error('Failed to create bag:', bagError);
    process.exit(1);
  }

  console.log(`Bag created: ${bag.code} (${bag.id})\n`);

  // 2. Define items
  const items: ItemInput[] = [
    {
      name: 'Quick Mill Pop-Up Espresso Machine',
      brand: 'Quick Mill',
      category: 'Espresso Machine',
      description:
        'Single-boiler semi-automatic with PID temperature control, pressure profiling valve, 58mm semi-saturated group head, and patented quiet vibration pump. Model 02044.',
      price_cents: 129500,
      position: 0,
    },
    {
      name: 'Timemore Sculptor 064S Electric Coffee Grinder',
      brand: 'Timemore',
      category: 'Coffee Grinder',
      description:
        '64mm flat burr stepless electric grinder with brushless 150W motor (800-1200 RPM adjustable). Single-dose design with magnetic catch cup and very low retention.',
      price_cents: 59900,
      position: 1,
    },
    {
      name: 'Timemore PUCKS Espresso Accessories Set',
      brand: 'Timemore',
      category: 'Espresso Accessories',
      description:
        '3-in-1 espresso prep tool set for 58.4mm portafilters: orbital WDT tool (0.3mm needles), gravity distributor, and calibrated tamper (30 lbs). Includes magnetic base stand.',
      price_cents: 19900,
      position: 2,
    },
    {
      name: 'Quick Mill Bottomless Portafilter',
      brand: 'Quick Mill',
      category: 'Espresso Accessories',
      description:
        '58mm bottomless (naked) portafilter with walnut wood handle and chrome-plated brass head. Includes 21g triple shot basket. Compatible with Quick Mill E61 group head machines.',
      price_cents: 8500,
      position: 3,
    },
  ];

  // 3. Insert items
  for (const item of items) {
    const { data: inserted, error: itemError } = await supabase
      .from('bag_items')
      .insert({
        bag_id: bag.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        description: item.description,
        price_cents: item.price_cents,
        position: item.position,
      })
      .select('id, name')
      .single();

    if (itemError) {
      console.error(`Failed to insert "${item.name}":`, itemError);
    } else {
      console.log(`  Item: ${inserted.name} (${inserted.id})`);
    }
  }

  console.log(`\nDone! Bag: https://teed.club/u/teed/${bag.code}`);
  console.log(`\nNext: Run the add-links script to attach verified URLs.`);
}

main().catch(console.error);
