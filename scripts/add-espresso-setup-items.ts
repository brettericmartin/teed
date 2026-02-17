/**
 * Add items to the espresso setup bag (fixing column names)
 * Bag ID: 3c3c4423-b2a1-422d-b8ae-7e55d93b87c8
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BAG_ID = '3c3c4423-b2a1-422d-b8ae-7e55d93b87c8';

interface ItemInput {
  custom_name: string;
  brand: string;
  custom_description: string;
  sort_index: number;
}

async function main() {
  console.log('Adding items to espresso setup bag...\n');

  const items: ItemInput[] = [
    {
      custom_name: 'Quick Mill Pop-Up Espresso Machine',
      brand: 'Quick Mill',
      custom_description:
        'Single-boiler semi-automatic with PID temperature control, pressure profiling valve, 58mm semi-saturated group head, and patented quiet vibration pump. Model 02044.',
      sort_index: 0,
    },
    {
      custom_name: 'Timemore Sculptor 064S Electric Coffee Grinder',
      brand: 'Timemore',
      custom_description:
        '64mm flat burr stepless electric grinder with brushless 150W motor (800-1200 RPM adjustable). Single-dose design with magnetic catch cup and very low retention.',
      sort_index: 1,
    },
    {
      custom_name: 'Timemore PUCKS Espresso Accessories Set',
      brand: 'Timemore',
      custom_description:
        '3-in-1 espresso prep tool set for 58.4mm portafilters: orbital WDT tool (0.3mm needles), gravity distributor, and calibrated tamper (30 lbs). Includes magnetic base stand.',
      sort_index: 2,
    },
    {
      custom_name: 'Quick Mill Bottomless Portafilter',
      brand: 'Quick Mill',
      custom_description:
        '58mm bottomless (naked) portafilter with walnut wood handle and chrome-plated brass head. Includes 21g triple shot basket. Compatible with Quick Mill E61 group head machines.',
      sort_index: 3,
    },
  ];

  for (const item of items) {
    const { data: inserted, error: itemError } = await supabase
      .from('bag_items')
      .insert({
        bag_id: BAG_ID,
        custom_name: item.custom_name,
        brand: item.brand,
        custom_description: item.custom_description,
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

  console.log('\nDone! Now add links.');
}

main().catch(console.error);
