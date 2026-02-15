/**
 * Update Anthony Kim's Winning Bag: February 2026
 * - Fix 3 existing items (driver name, shaft identity, 5-wood details)
 * - Add 13 missing items
 * - Add product links for all items
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/update-ak-bag-feb2026.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BAG_ID = 'b3e6ae22-f99f-4c7d-8b31-bd1348dfb6f8';

// Existing item IDs to update
const EXISTING = {
  driver: '0320a660-7a5f-49ed-a30a-bc4dcfb8ad22',
  driverShaft: '5bfe8cc4-f32e-4e59-9ec0-8f12828684d1', // currently "Ventus Blue 6X" — wrong
  fiveWood: 'fdbfefc3-ce98-4aa9-9a9b-4dee602a79ba',
};

// ─── Items to create ───────────────────────────────────────────────────────────

interface NewItem {
  custom_name: string;
  brand: string;
  custom_description: string;
  sort_index: number;
}

const newItems: NewItem[] = [
  // 3-wood (sort 4)
  {
    custom_name: 'Paradym Ai Smoke Triple Diamond 3-Wood',
    brand: 'Callaway',
    custom_description: '15 degrees. Ai Smoke face for consistent spin. Versatile off the tee and from the deck.',
    sort_index: 4,
  },
  // 3-wood shaft (sort 5)
  {
    custom_name: '3-Wood Shaft — Fujikura Ventus Blue 7 X',
    brand: 'Fujikura',
    custom_description: 'Ventus Blue profile — mid launch, low spin. 70g X-Stiff.',
    sort_index: 5,
  },
  // 5-wood shaft (sort 7)
  {
    custom_name: '5-Wood Shaft — Fujikura Ventus Black 8 X',
    brand: 'Fujikura',
    custom_description: 'Ventus Black profile — low launch, low spin. 80g X-Stiff for maximum control.',
    sort_index: 7,
  },
  // Irons — Titleist T250 (4-iron) (sort 8)
  {
    custom_name: 'Titleist T250 4-Iron',
    brand: 'Titleist',
    custom_description: '4-iron. Players distance iron with forged feel and a compact shape. Strong long-iron in a split-set with P7 TW.',
    sort_index: 8,
  },
  // Irons — TaylorMade P7 TW (5-9) (sort 9)
  {
    custom_name: 'P7 TW Irons (5-9)',
    brand: 'TaylorMade',
    custom_description: "Tiger Woods' signature muscle-back blades. 5 through 9 iron. Pure feel, zero forgiveness.",
    sort_index: 9,
  },
  // Iron shafts (sort 10)
  {
    custom_name: 'Iron Shafts — True Temper Dynamic Gold S400',
    brand: 'True Temper',
    custom_description: 'The most popular iron shaft in professional golf. Stiff flex, mid-high launch, penetrating ball flight.',
    sort_index: 10,
  },
  // Wedges — 46 (sort 11)
  {
    custom_name: 'Vokey Design SM11 Wedge (46)',
    brand: 'Titleist',
    custom_description: '46 degree pitching wedge. SM11 spin milled face for maximum greenside spin.',
    sort_index: 11,
  },
  // Wedges — 50 (sort 12)
  {
    custom_name: 'Vokey Design SM11 Wedge (50)',
    brand: 'Titleist',
    custom_description: '50 degree gap wedge. SM11.',
    sort_index: 12,
  },
  // Wedges — 54 (sort 13)
  {
    custom_name: 'Vokey Design SM11 Wedge (54)',
    brand: 'Titleist',
    custom_description: '54 degree sand wedge. SM11.',
    sort_index: 13,
  },
  // Wedges — 58 (sort 14)
  {
    custom_name: 'Vokey Design SM11 Wedge (58)',
    brand: 'Titleist',
    custom_description: '58 degree lob wedge. SM11.',
    sort_index: 14,
  },
  // Wedge shaft (sort 15)
  {
    custom_name: 'Wedge Shafts — True Temper Dynamic Gold S400',
    brand: 'True Temper',
    custom_description: 'Same Dynamic Gold S400 as the irons. Consistency throughout the scoring clubs.',
    sort_index: 15,
  },
  // Putter (sort 16)
  {
    custom_name: 'Scotty Cameron Tour Prototype Putter',
    brand: 'Titleist',
    custom_description: 'Tour-only Scotty Cameron prototype. Not available at retail — custom built for tour players.',
    sort_index: 16,
  },
  // Grips (sort 17)
  {
    custom_name: 'Golf Pride Tour Velvet Cord Grips',
    brand: 'Golf Pride',
    custom_description: 'Full-cord grip for maximum traction in all conditions. The most popular grip on tour.',
    sort_index: 17,
  },
  // Ball (sort 18)
  {
    custom_name: '2025 Pro V1 Golf Ball',
    brand: 'Titleist',
    custom_description: 'The #1 ball in golf. Consistent flight, Drop-and-Stop greenside control, soft feel.',
    sort_index: 18,
  },
];

// ─── Links ─────────────────────────────────────────────────────────────────────

// Links use the item custom_name as a key (matched after insert via name lookup)
interface LinkDef {
  itemName: string; // partial match against custom_name
  links: { url: string; kind: string; label: string }[];
}

const linkDefs: LinkDef[] = [
  // Driver
  {
    itemName: 'Quantum Triple Diamond Driver',
    links: [
      { url: 'https://www.callawaygolf.com/golf-clubs/drivers/', kind: 'product', label: 'Callaway' },
    ],
  },
  // Driver shaft
  {
    itemName: 'Diamana D+ Limited 60 TX',
    links: [
      { url: 'https://www.mitsubishigolf.com/shafts/diamana-d-plus-limited/', kind: 'product', label: 'Mitsubishi Golf' },
    ],
  },
  // 3-wood
  {
    itemName: 'Paradym Ai Smoke Triple Diamond',
    links: [
      { url: 'https://www.callawaygolf.com/golf-clubs/fairway-woods/fwys-2024-paradym-ai-smoke-triple-diamond.html', kind: 'product', label: 'Callaway' },
    ],
  },
  // 3-wood shaft
  {
    itemName: 'Ventus Blue 7 X',
    links: [
      { url: 'https://www.fujikuragolf.com/product/ventus-blue/', kind: 'product', label: 'Fujikura Golf' },
    ],
  },
  // 5-wood
  {
    itemName: 'Elyte Triple Diamond 5-Wood',
    links: [
      { url: 'https://www.callawaygolf.com/golf-clubs/fairway-woods/', kind: 'product', label: 'Callaway' },
    ],
  },
  // 5-wood shaft
  {
    itemName: 'Ventus Black 8 X',
    links: [
      { url: 'https://www.fujikuragolf.com/product/ventus-black/', kind: 'product', label: 'Fujikura Golf' },
    ],
  },
  // Titleist T250
  {
    itemName: 'T250',
    links: [
      { url: 'https://www.titleist.com/golf-clubs/irons/t250', kind: 'product', label: 'Titleist' },
    ],
  },
  // TaylorMade P7 TW
  {
    itemName: 'P7 TW',
    links: [
      { url: 'https://www.taylormadegolf.com/P7TW-Irons/DW-TA436.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // Iron Shafts
  {
    itemName: 'Iron Shafts',
    links: [
      { url: 'https://www.truetemper.com/product/dynamic-gold/', kind: 'product', label: 'True Temper' },
    ],
  },
  // Vokey SM11 (46)
  {
    itemName: 'SM11 Wedge (46)',
    links: [
      { url: 'https://www.vokey.com/wedges/sm11.html', kind: 'product', label: 'Vokey' },
    ],
  },
  // Vokey SM11 (50)
  {
    itemName: 'SM11 Wedge (50)',
    links: [
      { url: 'https://www.vokey.com/wedges/sm11.html', kind: 'product', label: 'Vokey' },
    ],
  },
  // Vokey SM11 (54)
  {
    itemName: 'SM11 Wedge (54)',
    links: [
      { url: 'https://www.vokey.com/wedges/sm11.html', kind: 'product', label: 'Vokey' },
    ],
  },
  // Vokey SM11 (58)
  {
    itemName: 'SM11 Wedge (58)',
    links: [
      { url: 'https://www.vokey.com/wedges/sm11.html', kind: 'product', label: 'Vokey' },
    ],
  },
  // Wedge shafts
  {
    itemName: 'Wedge Shafts',
    links: [
      { url: 'https://www.truetemper.com/product/dynamic-gold/', kind: 'product', label: 'True Temper' },
    ],
  },
  // Scotty Cameron
  {
    itemName: 'Scotty Cameron',
    links: [
      { url: 'https://www.scottycameron.com/putters/', kind: 'product', label: 'Scotty Cameron' },
    ],
  },
  // Golf Pride
  {
    itemName: 'Tour Velvet Cord',
    links: [
      { url: 'https://www.golfpride.com/grips/tour-velvet-cord/', kind: 'product', label: 'Golf Pride' },
    ],
  },
  // Pro V1
  {
    itemName: 'Pro V1',
    links: [
      { url: 'https://www.titleist.com/golf-balls/pro-v1', kind: 'product', label: 'Titleist' },
    ],
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Updating Anthony Kim Winning Bag: February 2026 ===\n');

  // ── Step 1: Fix existing items ──
  console.log('Step 1: Fixing 3 existing items...');

  // Fix driver name
  const { error: e1 } = await supabase
    .from('bag_items')
    .update({
      custom_name: 'Quantum Triple Diamond Driver',
      custom_description: '10 degrees. Low-spin head for maximum distance. The Triple Diamond is the tour-preferred compact shape.',
      sort_index: 1,
    })
    .eq('id', EXISTING.driver);
  console.log(`  Driver: ${e1 ? `ERROR: ${e1.message}` : 'Updated'}`);

  // Fix driver shaft (was "Ventus Blue 6X" → "Diamana D+ Limited 60 TX")
  const { error: e2 } = await supabase
    .from('bag_items')
    .update({
      custom_name: 'Driver Shaft — Mitsubishi Diamana D+ Limited 60 TX',
      brand: 'Mitsubishi',
      custom_description: 'Tour-exclusive Diamana D+ Limited in 60g TX flex. Low launch, low spin profile.',
      sort_index: 2,
      photo_url: null, // Clear wrong photo (was Ventus Blue image)
    })
    .eq('id', EXISTING.driverShaft);
  console.log(`  Driver shaft: ${e2 ? `ERROR: ${e2.message}` : 'Updated'}`);

  // Fix 5-wood
  const { error: e3 } = await supabase
    .from('bag_items')
    .update({
      custom_name: 'Elyte Triple Diamond 5-Wood',
      custom_description: '18 degrees. All-Callaway fairway wood setup.',
      sort_index: 6,
    })
    .eq('id', EXISTING.fiveWood);
  console.log(`  5-Wood: ${e3 ? `ERROR: ${e3.message}` : 'Updated'}`);

  // Also update bag description
  const { error: bagErr } = await supabase
    .from('bags')
    .update({
      description: "Anthony Kim's winning bag — February 2026. No equipment sponsor. Mixed Callaway woods, split Titleist/TaylorMade irons, Vokey wedges, Scotty Cameron putter, and Titleist Pro V1. The ultimate free agent setup.",
    })
    .eq('id', BAG_ID);
  console.log(`  Bag description: ${bagErr ? `ERROR: ${bagErr.message}` : 'Updated'}`);

  // ── Step 2: Add new items ──
  console.log(`\nStep 2: Adding ${newItems.length} new items...`);

  const itemsToInsert = newItems.map((item) => ({
    bag_id: BAG_ID,
    custom_name: item.custom_name,
    brand: item.brand,
    custom_description: item.custom_description,
    sort_index: item.sort_index,
  }));

  const { data: insertedItems, error: insertErr } = await supabase
    .from('bag_items')
    .insert(itemsToInsert)
    .select('id, custom_name, sort_index');

  if (insertErr) {
    console.error('  ERROR inserting items:', insertErr.message);
    return;
  }

  console.log(`  Inserted ${insertedItems?.length || 0} items:`);
  for (const item of insertedItems || []) {
    console.log(`    [${item.sort_index}] ${item.custom_name} → ${item.id}`);
  }

  // ── Step 3: Build complete item list for link matching ──
  console.log('\nStep 3: Fetching all items for link matching...');

  const { data: allItems, error: fetchErr } = await supabase
    .from('bag_items')
    .select('id, custom_name')
    .eq('bag_id', BAG_ID);

  if (fetchErr || !allItems) {
    console.error('  ERROR fetching items:', fetchErr?.message);
    return;
  }

  console.log(`  Found ${allItems.length} total items`);

  // ── Step 4: Add links ──
  console.log(`\nStep 4: Adding links...`);

  let linkCount = 0;
  for (const linkDef of linkDefs) {
    const matchingItem = allItems.find((item) =>
      item.custom_name.includes(linkDef.itemName)
    );

    if (!matchingItem) {
      console.log(`  WARNING: No item matching "${linkDef.itemName}" — skipping`);
      continue;
    }

    for (const link of linkDef.links) {
      const { error: linkErr } = await supabase.from('links').insert({
        bag_item_id: matchingItem.id,
        kind: link.kind,
        url: link.url,
        label: link.label,
        is_auto_generated: false,
      });

      if (linkErr) {
        console.log(`  ERROR adding link for "${matchingItem.custom_name}": ${linkErr.message}`);
      } else {
        linkCount++;
        console.log(`  ${matchingItem.custom_name} → ${link.label}`);
      }
    }
  }

  console.log(`\n=== Done! Added ${linkCount} links across ${allItems.length} items ===`);
}

main().catch(console.error);
