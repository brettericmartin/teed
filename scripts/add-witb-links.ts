/**
 * Add product links to all WITB bag items.
 * Prioritizes manufacturer/brand websites, falls back to retailers.
 * Run: set -a && source .env.local && set +a && npx tsx scripts/add-witb-links.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ItemLink {
  itemId: string;
  links: { url: string; kind: string; label: string }[];
}

// Map item IDs to their product links
const itemLinks: ItemLink[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ANTHONY KIM — LIV Adelaide WITB
  // ═══════════════════════════════════════════════════════════════════════════

  // Callaway Quantum Triple Diamond Driver
  {
    itemId: 'abb8d19d-de03-4307-9f2a-257239ac2919',
    links: [
      { url: 'https://www.callawaygolf.com/golf-clubs/drivers/drivers-2025-elyte-triple-diamond.html', kind: 'product', label: 'Callaway' },
      { url: 'https://www.golfgalaxy.com/search/?query=callaway+quantum+triple+diamond+driver', kind: 'product', label: 'Golf Galaxy' },
    ],
  },
  // Driver Shaft — Mitsubishi Diamana D+ Limited 60 TX
  {
    itemId: 'aac1dc06-e8ef-49fc-9b54-b63435d38c4c',
    links: [
      { url: 'https://www.mitsubishigolf.com/shafts/diamana-d-plus-limited/', kind: 'product', label: 'Mitsubishi Golf' },
    ],
  },
  // Callaway Paradym Ai Smoke Triple Diamond 3-Wood
  {
    itemId: '3e782f09-a528-4915-99ed-34e7aa71a732',
    links: [
      { url: 'https://www.callawaygolf.com/golf-clubs/fairway-woods/fwys-2024-paradym-ai-smoke-triple-diamond.html', kind: 'product', label: 'Callaway' },
    ],
  },
  // 3-Wood Shaft — Fujikura Ventus Blue 7 X
  {
    itemId: 'caad3d59-79f7-49ce-a776-1b235a262c2e',
    links: [
      { url: 'https://www.fujikuragolf.com/product/ventus-blue/', kind: 'product', label: 'Fujikura Golf' },
    ],
  },
  // Callaway Elyte Triple Diamond 5-Wood
  {
    itemId: '0a6a28c7-a8c2-4919-b590-1f27ea5b51a7',
    links: [
      { url: 'https://www.callawaygolf.com/golf-clubs/fairway-woods/', kind: 'product', label: 'Callaway' },
    ],
  },
  // TaylorMade P7TW Irons (4-PW)
  {
    itemId: '6c81eba3-d49e-4986-ab65-dc5c0628703a',
    links: [
      { url: 'https://www.taylormadegolf.com/P7TW-Irons/DW-TA436.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // Iron Shafts — True Temper Dynamic Gold S400
  {
    itemId: 'd3ccd116-5d5a-4a2b-a4cc-65d1f8235899',
    links: [
      { url: 'https://www.truetemper.com/product/dynamic-gold/', kind: 'product', label: 'True Temper' },
    ],
  },
  // TaylorMade MG5 Wedge (50°) — AK
  {
    itemId: 'e8c7610f-7071-498f-9246-a07d7048aaef',
    links: [
      { url: 'https://www.taylormadegolf.com/Milled-Grind-5-Wedge/DW-TA497.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // TaylorMade MG5 Wedge (54°) — AK
  {
    itemId: '6dfcb6b7-04f2-4900-8c25-eafbdd2ccbf9',
    links: [
      { url: 'https://www.taylormadegolf.com/Milled-Grind-5-Wedge/DW-TA497.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // TaylorMade MG5 Wedge (58°) — AK
  {
    itemId: 'c7ac0d94-03f4-4b35-a90c-8ac6c7f54e20',
    links: [
      { url: 'https://www.taylormadegolf.com/Milled-Grind-5-Wedge/DW-TA497.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // Scotty Cameron Blade Putter
  {
    itemId: 'e93324ca-b703-49b1-94e3-da471683e949',
    links: [
      { url: 'https://www.scottycameron.com/putters/', kind: 'product', label: 'Scotty Cameron' },
      { url: 'https://www.titleist.com/golf-clubs/putters', kind: 'product', label: 'Titleist' },
    ],
  },
  // Bridgestone Tour B X Golf Ball — AK
  {
    itemId: '8e0e27bb-0805-43dd-963d-971232273ef4',
    links: [
      { url: 'https://www.bridgestonegolf.com/en-us/balls/tour-b-x', kind: 'product', label: 'Bridgestone Golf' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHRIS GOTTERUP — Phoenix Open WITB
  // ═══════════════════════════════════════════════════════════════════════════

  // Ping G440 LST Driver
  {
    itemId: '93f9a59a-705b-4540-bb3a-c42945189938',
    links: [
      { url: 'https://ping.com/en-us/clubs/drivers/g440-lst', kind: 'product', label: 'Ping' },
    ],
  },
  // Driver Shaft — Project X HZRDUS Smoke Black RDX 70 TX
  {
    itemId: '9b4c5dd2-f1bf-497d-be13-53e4c866b639',
    links: [
      { url: 'https://www.truetemper.com/product/hzrdus-smoke-black-rdx/', kind: 'product', label: 'True Temper (Project X)' },
    ],
  },
  // TaylorMade BRNR Mini Copper
  {
    itemId: 'c0d28f2e-2467-4aa5-bfb7-c88b47204b96',
    links: [
      { url: 'https://www.taylormadegolf.com/BRNR-Mini-Driver-Copper/DW-TA475.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // Mini Driver Shaft — Project X HZRDUS Smoke Black RDX 80 TX
  {
    itemId: 'dc8c3a29-a35a-4633-8c6f-486099183767',
    links: [
      { url: 'https://www.truetemper.com/product/hzrdus-smoke-black-rdx/', kind: 'product', label: 'True Temper (Project X)' },
    ],
  },
  // TaylorMade Qi35 5-Wood
  {
    itemId: 'a1654cb0-97c2-4d01-920a-9640537cecf4',
    links: [
      { url: 'https://www.taylormadegolf.com/Qi35-Fairway/DW-TA490.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // 5-Wood Shaft — Mitsubishi Diamana
  {
    itemId: '218c58b1-7597-4181-98f1-cd4d30177ce4',
    links: [
      { url: 'https://www.mitsubishigolf.com/shafts/', kind: 'product', label: 'Mitsubishi Golf' },
    ],
  },
  // Bridgestone 220 MB Irons (5-PW)
  {
    itemId: '0d943a00-5999-4218-9988-eec9d9ea8532',
    links: [
      { url: 'https://www.bridgestonegolf.com/en-us/clubs/irons/220-mb', kind: 'product', label: 'Bridgestone Golf' },
    ],
  },
  // TaylorMade MG5 Wedge (50°) — CG
  {
    itemId: 'e72cac07-55e4-44a0-acbe-2d1a3b7abd63',
    links: [
      { url: 'https://www.taylormadegolf.com/Milled-Grind-5-Wedge/DW-TA497.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // TaylorMade MG5 Wedge (54°) — CG
  {
    itemId: 'fb37805d-ab77-4b1d-959c-17627be2ada0',
    links: [
      { url: 'https://www.taylormadegolf.com/Milled-Grind-5-Wedge/DW-TA497.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // TaylorMade MG5 Wedge (58°) — CG
  {
    itemId: 'fb7dbc89-c225-46d7-8322-b7212468afe7',
    links: [
      { url: 'https://www.taylormadegolf.com/Milled-Grind-5-Wedge/DW-TA497.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // TaylorMade Spider Tour X Putter — CG
  {
    itemId: 'ecffd1c2-41d2-4f90-bec0-61c00e3d14d1',
    links: [
      { url: 'https://www.taylormadegolf.com/Spider-Tour-X-Putter/DW-TA434.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // Bridgestone Tour B X Golf Ball — CG
  {
    itemId: 'a7490d3b-2c14-4d27-8d54-abe365409344',
    links: [
      { url: 'https://www.bridgestonegolf.com/en-us/balls/tour-b-x', kind: 'product', label: 'Bridgestone Golf' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RORY MCILROY — 2026 Equipment Overhaul
  // ═══════════════════════════════════════════════════════════════════════════

  // TaylorMade Qi4D Driver
  {
    itemId: '0b6ded96-8a33-4788-a8b4-4981a3a5d2b3',
    links: [
      { url: 'https://www.taylormadegolf.com/Qi4D-Driver/DW-TA510.html', kind: 'product', label: 'TaylorMade' },
      { url: 'https://www.taylormadegolf.com/tourplayers/rory-mcilroy.html', kind: 'source', label: "Rory's WITB (TaylorMade)" },
    ],
  },
  // Driver Shaft — Fujikura Ventus Black 60g X-Stiff
  {
    itemId: 'b27396b8-ba87-4892-bdfb-92cdd82fbc73',
    links: [
      { url: 'https://www.fujikuragolf.com/product/ventus-black/', kind: 'product', label: 'Fujikura Golf' },
    ],
  },
  // TaylorMade Qi4D 3-Wood
  {
    itemId: '4cb233ca-eb08-45f4-a098-03b6bd638861',
    links: [
      { url: 'https://www.taylormadegolf.com/Qi4D-Fairway/DW-TA511.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // 3-Wood Shaft — Fujikura Ventus Black 80g X-Stiff
  {
    itemId: '3103979e-f8f8-4c1f-97b1-d0eb63d1b991',
    links: [
      { url: 'https://www.fujikuragolf.com/product/ventus-black/', kind: 'product', label: 'Fujikura Golf' },
    ],
  },
  // TaylorMade Qi4D 5-Wood
  {
    itemId: '290b149d-a2ea-4970-9325-ffde2ebf80bc',
    links: [
      { url: 'https://www.taylormadegolf.com/Qi4D-Fairway/DW-TA511.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // 5-Wood Shaft — Fujikura Ventus Black 90g X-Stiff
  {
    itemId: 'c69784c4-7869-4b85-9624-aa228ae1a0a7',
    links: [
      { url: 'https://www.fujikuragolf.com/product/ventus-black/', kind: 'product', label: 'Fujikura Golf' },
    ],
  },
  // TaylorMade RORS Proto Irons (5-9)
  {
    itemId: '9bed706d-814d-4cbe-abe1-685e6b6bcc92',
    links: [
      { url: 'https://www.taylormadegolf.com/tourplayers/rory-mcilroy.html', kind: 'source', label: "Rory's WITB (TaylorMade)" },
      { url: 'https://www.taylormadegolf.com/P7MB-Irons/DW-TA437.html', kind: 'product', label: 'TaylorMade P7MB (closest retail)' },
    ],
  },
  // TaylorMade MG5 Wedge (46°) — Rory
  {
    itemId: '51104a51-8fb2-44f1-8020-5c7f39a32aee',
    links: [
      { url: 'https://www.taylormadegolf.com/Milled-Grind-5-Wedge/DW-TA497.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // TaylorMade MG5 Wedge (50°) — Rory
  {
    itemId: 'ee1ecbb0-7b78-4dcb-bd07-a5db7703f2f3',
    links: [
      { url: 'https://www.taylormadegolf.com/Milled-Grind-5-Wedge/DW-TA497.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // TaylorMade MG5 Wedge (54°) — Rory
  {
    itemId: 'a87ae384-5de9-43bd-8bc3-5305a5e66a85',
    links: [
      { url: 'https://www.taylormadegolf.com/Milled-Grind-5-Wedge/DW-TA497.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // TaylorMade MG5 Wedge (60° bent to 61°) — Rory
  {
    itemId: '22c2eed0-41db-4a98-a6bb-aff88294dc09',
    links: [
      { url: 'https://www.taylormadegolf.com/Milled-Grind-5-Wedge/DW-TA497.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // TaylorMade Spider Tour X Putter — Rory
  {
    itemId: '37c13f97-b825-4300-9167-fab86f4d3181',
    links: [
      { url: 'https://www.taylormadegolf.com/Spider-Tour-X-Putter/DW-TA434.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
  // TaylorMade TP5 Golf Ball (2026)
  {
    itemId: '3593cf32-f705-4b55-ba6c-5431e1f2e610',
    links: [
      { url: 'https://www.taylormadegolf.com/TP5-Golf-Balls/DW-TA512.html', kind: 'product', label: 'TaylorMade' },
    ],
  },
];

async function main() {
  console.log(`Adding links to ${itemLinks.length} items...\n`);

  let added = 0;
  let failed = 0;

  for (const item of itemLinks) {
    for (const link of item.links) {
      const { error } = await supabase.from('links').insert({
        bag_item_id: item.itemId,
        url: link.url,
        kind: link.kind,
        label: link.label,
        metadata: {},
      });

      if (error) {
        console.error(`  FAILED: ${link.label} for ${item.itemId}:`, error.message);
        failed++;
      } else {
        added++;
      }
    }
  }

  console.log(`Done! Added ${added} links. ${failed} failed.`);
}

main().catch(console.error);
