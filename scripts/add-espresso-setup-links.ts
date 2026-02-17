/**
 * Add verified links to espresso setup bag items
 * All URLs verified via WebSearch site: queries in research phase
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BAG_ID = '3c3c4423-b2a1-422d-b8ae-7e55d93b87c8';

// Item IDs from the insert step
const ITEMS = {
  quickMillPopUp: 'd1c51edb-a770-4a57-bae2-32d8e9b31d36',
  timemoreSculptor: '0899ca84-4d1a-4169-95d9-a4f64a419991',
  timemorePucks: 'aace914f-3fe6-4785-afe4-ee61233ace31',
  quickMillPortafilter: '936117be-ed54-4cf0-89fa-1a19089a74e6',
};

interface LinkInput {
  bag_item_id: string;
  kind: string;
  url: string;
  label: string;
}

async function main() {
  console.log('Adding verified links to espresso setup bag...\n');

  const links: LinkInput[] = [
    // ── Quick Mill Pop-Up ──────────────────────────────────
    {
      bag_item_id: ITEMS.quickMillPopUp,
      kind: 'retailer',
      url: 'https://clivecoffee.com/products/quick-mill-pop-up-espresso-machine',
      label: 'Clive Coffee ($1,295)',
    },
    {
      bag_item_id: ITEMS.quickMillPopUp,
      kind: 'retailer',
      url: 'https://idrinkcoffee.com/en-us/products/quick-mill-popup-espresso-machine',
      label: 'iDrinkCoffee ($1,137)',
    },
    {
      bag_item_id: ITEMS.quickMillPopUp,
      kind: 'product',
      url: 'https://www.quick-mill.com/products/pop-up/',
      label: 'Quick Mill (manufacturer)',
    },

    // ── Timemore Sculptor 064S ────────────────────────────
    {
      bag_item_id: ITEMS.timemoreSculptor,
      kind: 'retailer',
      url: 'https://prima-coffee.com/equipment/timemore/70tgd060aa101-timem-pp',
      label: 'Prima Coffee ($549)',
    },
    {
      bag_item_id: ITEMS.timemoreSculptor,
      kind: 'retailer',
      url: 'https://www.amazon.com/TIMEMORE-Sculptor-Electric-Coarseness-Adjustment/dp/B0DNYWJV2Z',
      label: 'Amazon ($599)',
    },
    {
      bag_item_id: ITEMS.timemoreSculptor,
      kind: 'product',
      url: 'https://www.timemore.com/products/timemore-electric-coffee-grinder-sculptor-series',
      label: 'Timemore (official)',
    },

    // ── Timemore PUCKS Set ────────────────────────────────
    {
      bag_item_id: ITEMS.timemorePucks,
      kind: 'product',
      url: 'https://www.timemore.com/products/timemore-pucks-espresso-accessories-set',
      label: 'Timemore (official, $199)',
    },
    {
      bag_item_id: ITEMS.timemorePucks,
      kind: 'retailer',
      url: 'https://www.espressogear.com/products/pucks-espresso-accessories-set-metal-version',
      label: 'Espresso Gear (metal)',
    },

    // ── Quick Mill Bottomless Portafilter ──────────────────
    {
      bag_item_id: ITEMS.quickMillPortafilter,
      kind: 'retailer',
      url: 'https://www.chriscoffee.com/products/quick-mill-wooden-bottomless-portafilter-complete',
      label: "Chris' Coffee ($85)",
    },
    {
      bag_item_id: ITEMS.quickMillPortafilter,
      kind: 'retailer',
      url: 'https://www.wholelattelove.com/products/quick-mill-walnut-handle-bottomless-portafilter',
      label: 'Whole Latte Love ($75)',
    },
  ];

  for (const link of links) {
    const { error } = await supabase.from('links').insert({
      bag_item_id: link.bag_item_id,
      kind: link.kind,
      url: link.url,
      label: link.label,
    });

    if (error) {
      console.error(`  Failed: ${link.label} — ${error.message}`);
    } else {
      console.log(`  Added: ${link.label}`);
    }
  }

  console.log('\nDone! Bag: https://teed.club/u/teed/home-espresso-setup-quick-mill-pop-up-timemore-scu');
}

main().catch(console.error);
