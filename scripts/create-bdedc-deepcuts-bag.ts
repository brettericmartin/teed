/**
 * Create "Real EDC Gear That Saved People From Really Bad Jobs" bag
 * Source: https://www.youtube.com/watch?v=EMLSeJ9cBVU (Best Damn EDC — Taylor Martin)
 *
 * Captures every product from:
 *   - Source video (item 0)
 *   - Sponsor products (WorkSharp RMX, Big Idea Design Lookout & Ti Manu, Poncho)
 *   - Carry of the Week (Fresh Goblin's carry)
 *   - What's In My Pockets (Taylor's carry)
 *   - Community comment mentions (Leatherman Surge, Arc, Spyderco PM2, etc.)
 *   - Evans Pull Cord Drum Key
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
  console.log('Creating Best Damn EDC Deep Cuts bag...\n');

  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .insert({
      owner_id: TEED_USER_ID,
      title: 'Real EDC Gear That Saved People From Really Bad Jobs — Best Damn EDC',
      description:
        'Every piece of gear from Best Damn EDC\'s Deep Cuts episode: sponsor picks (WorkSharp RMX, Big Idea Design Lookout, Poncho), Fresh Goblin\'s copper-themed Carry of the Week, Taylor\'s current pocket dump, and the community-mentioned tools that saved people from their worst jobs.',
      is_public: true,
      tags: ['EDC', 'everyday carry', 'knives', 'multi-tool', 'flashlight', 'Best Damn EDC', 'deep cuts'],
    })
    .select('id, code')
    .single();

  if (bagError) {
    console.error('Failed to create bag:', bagError);
    process.exit(1);
  }

  console.log(`Bag created: ${bag.code} (${bag.id})\n`);

  const items: ItemInput[] = [
    // ── Source Video ──────────────────────────────────────
    {
      custom_name: 'Real EDC Gear That Saved People From Really Bad Jobs — Best Damn EDC',
      brand: 'Best Damn EDC',
      custom_description:
        'Deep Cuts community episode by Taylor Martin. Viewers share their worst jobs and the gear that saved the day — from Leatherman multi-tools in sewage-filled crawl spaces to iPods making warehouse work bearable. Plus Carry of the Week and Taylor\'s current pocket dump.',
      price_paid: null,
      sort_index: 0,
    },

    // ── Sponsor Products ─────────────────────────────────
    {
      custom_name: 'WorkSharp RMX Drop Point',
      brand: 'WorkSharp',
      custom_description:
        'Folding knife from WorkSharp (yes, the sharpener company). Taylor\'s been carrying this through shop renovations — stripping Romex, digging out receptacle holes. Also available in reverse tanto.',
      price_paid: null,
      sort_index: 1,
    },
    {
      custom_name: 'Big Idea Design USA Lookout Fixed Blade',
      brand: 'Big Idea Design',
      custom_description:
        'USA-made fixed blade knife with three configurations. Tanto grind, manufactured in Big Idea Design\'s Chattanooga, TN machine shop. Just launched.',
      price_paid: null,
      sort_index: 2,
    },
    {
      custom_name: 'Big Idea Design Ti Manu',
      brand: 'Big Idea Design',
      custom_description:
        'Titanium folding knife designed by Ken Onion Jr. (son of Ken Onion). On washers, comfortable ergonomics. Launched via Kickstarter collaboration with Big Idea Design.',
      price_paid: null,
      sort_index: 3,
    },
    {
      custom_name: 'Poncho Outdoors Performance Shirt',
      brand: 'Poncho',
      custom_description:
        'Button-down performance shirt with magnetic pockets, hidden zipper breast pocket, and built-in microfiber lens wipe. Stretchy, comfortable fit. Taylor\'s go-to shirt.',
      price_paid: null,
      sort_index: 4,
    },

    // ── Carry of the Week (Fresh Goblin) ─────────────────
    {
      custom_name: 'Prevail Onward Explorer Watch',
      brand: 'Prevail',
      custom_description:
        'Future field watch with custom NATO strap. Copper/brown themed to match Fresh Goblin\'s entire carry. From Carry of the Week segment.',
      price_paid: null,
      sort_index: 5,
    },
    {
      custom_name: 'Kershaw Natrix Copper XS',
      brand: 'Kershaw',
      custom_description:
        '2.75" D2 stonewashed blade with copper handles. Taylor called it "an awesome older knife" and a classic that nobody talks about anymore. Model 7006CU.',
      price_paid: null,
      sort_index: 6,
    },
    {
      custom_name: 'Olight i3T EOS',
      brand: 'Olight',
      custom_description:
        'Compact AAA flashlight, 180 lumens. Part of Fresh Goblin\'s copper-themed carry.',
      price_paid: null,
      sort_index: 7,
    },
    {
      custom_name: 'Zippo Armor High Polish Brass',
      brand: 'Zippo',
      custom_description:
        'Armored brass Zippo lighter fitted with a butane insert (sold separately) for a cleaner, more reliable flame. Fresh Goblin\'s carry.',
      price_paid: null,
      sort_index: 8,
    },
    {
      custom_name: 'BIC 4-Color Shine Pen',
      brand: 'BIC',
      custom_description:
        'Classic 4-color retractable ballpoint pen in the metallic "Shine" finish. A simple, practical EDC writing tool from Fresh Goblin\'s carry.',
      price_paid: null,
      sort_index: 9,
    },
    {
      custom_name: 'Leatherman Rebar',
      brand: 'Leatherman',
      custom_description:
        'Full-size multi-tool. Fresh Goblin modded his with an Ulti-Clip mounted directly to the frame for deep carry — Taylor noted he\'d never seen that mod before.',
      price_paid: null,
      sort_index: 10,
    },

    // ── What's In My Pockets (Taylor) ────────────────────
    {
      custom_name: 'Tale of Knives Belt Holster (Clipped)',
      brand: 'Tale of Knives',
      custom_description:
        'Leather belt holster in clipped configuration — no belt threading required, clips on and off easily. Taylor\'s multi-tool carry method for the Victorinox Swiss Tool MX.',
      price_paid: null,
      sort_index: 11,
    },
    {
      custom_name: 'Victorinox Swiss Tool MX',
      brand: 'Victorinox',
      custom_description:
        '26-function Swiss-made multi-tool with one-handed blade. All tools lockable and accessible from the outside. Taylor carries the non-clip version in a Tale of Knives holster.',
      price_paid: null,
      sort_index: 12,
    },
    {
      custom_name: 'Tactile Turn Switch Pen (Titanium)',
      brand: 'Tactile Turn',
      custom_description:
        'Side-click bolt-action pen in titanium. Taylor\'s current EDC pen.',
      price_paid: null,
      sort_index: 13,
    },
    {
      custom_name: 'Okluma DC0',
      brand: 'Okluma',
      custom_description:
        'Premium titanium EDC flashlight. Made-to-order with limited drops. Taylor carries this when not wearing his Garmin (which has a built-in flashlight).',
      price_paid: null,
      sort_index: 14,
    },
    {
      custom_name: 'Tactile Knife Co. Redhawk',
      brand: 'Tactile Knife Co.',
      custom_description:
        'Taylor\'s constant pocket knife — "keeps coming back." Just restocked this week. Fixed blade design.',
      price_paid: null,
      sort_index: 15,
    },
    {
      custom_name: 'Carry Commission Hitchhiker Wallet',
      brand: 'Wildr Goods / Carry Commission',
      custom_description:
        'Rustic heirloom leather wallet. Carry Commission exclusive collaboration with Wildr Goods Co. (formerly Rustic Heirloom). Pueblo leather construction.',
      price_paid: null,
      sort_index: 16,
    },
    {
      custom_name: 'Islander × Lume Shot Glacier Watch',
      brand: 'Islander',
      custom_description:
        'Limited edition automatic dive watch (ISL-124). Glacier dial, chunky case. Collaboration between Islander (Long Island Watch house brand) and Lume Shot YouTube channel. Limited to 200 pieces.',
      price_paid: null,
      sort_index: 17,
    },

    // ── Community Comment Gear ───────────────────────────
    {
      custom_name: 'Leatherman Surge',
      brand: 'Leatherman',
      custom_description:
        'Heavy-duty multi-tool. Mentioned by CJ Cornhole — used to pull rags, mops, and debris out of clogged sewer pumps. "Saved by the gear."',
      price_paid: null,
      sort_index: 18,
    },
    {
      custom_name: 'Leatherman Arc',
      brand: 'Leatherman',
      custom_description:
        'Premium multi-tool with MagnaCut blade. Nathan used his to replace bracket screws inside a phenolic resin tank during a hazmat suit cleanup job.',
      price_paid: null,
      sort_index: 19,
    },
    {
      custom_name: 'Spyderco Para Military 2',
      brand: 'Spyderco',
      custom_description:
        'Iconic folding knife. Nathan cut himself out of a broken Tyvek hazmat suit with his PM2 after the zipper failed inside a chemical tank.',
      price_paid: null,
      sort_index: 20,
    },
    {
      custom_name: 'RovyVon Angel Eyes E90',
      brand: 'RovyVon',
      custom_description:
        '3500-lumen flat EDC flashlight. Nathan used his to navigate out of a dark phenolic resin tank after his work light failed.',
      price_paid: null,
      sort_index: 21,
    },
    {
      custom_name: 'Evans Pull Cord Drum Key',
      brand: 'Evans / D\'Addario',
      custom_description:
        'Rip-cord powered drum key — pull the cord and it spins the key via a retractable spring mechanism. Like a pull-string toy but functional. Dustin Coaster says it revolutionized drum head changes on tour.',
      price_paid: null,
      sort_index: 22,
    },
  ];

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
      console.log(`  ${item.sort_index}. ${inserted.custom_name} (${inserted.id})`);
    }
  }

  console.log(`\nDone! Bag: https://teed.club/u/teed/${bag.code}`);
  console.log(`\nNext: Run add-bdedc-deepcuts-links.ts to attach verified URLs.`);
}

main().catch(console.error);
