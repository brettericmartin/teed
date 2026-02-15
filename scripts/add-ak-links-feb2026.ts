/**
 * Add product links to Anthony Kim's Feb 2026 bag items.
 * Links constraint: bag_item_id only (no bag_id).
 * Run: set -a && source .env.local && set +a && npx tsx scripts/add-ak-links-feb2026.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BAG_ID = 'b3e6ae22-f99f-4c7d-8b31-bd1348dfb6f8';

async function main() {
  // Fetch all items
  const { data: items, error } = await supabase
    .from('bag_items')
    .select('id, custom_name')
    .eq('bag_id', BAG_ID);

  if (error || !items) {
    console.error('Failed to fetch items:', error?.message);
    return;
  }

  console.log(`Found ${items.length} items\n`);

  // Helper to find item by partial name match
  const find = (partial: string) => items.find(i => i.custom_name.includes(partial));

  // Define links: [itemNamePartial, url, kind, label]
  const links: [string, string, string, string][] = [
    ['Quantum Triple Diamond Driver', 'https://www.callawaygolf.com/golf-clubs/drivers/', 'product', 'Callaway'],
    ['Diamana D+ Limited', 'https://www.mitsubishigolf.com/shafts/diamana-d-plus-limited/', 'product', 'Mitsubishi Golf'],
    ['Paradym Ai Smoke', 'https://www.callawaygolf.com/golf-clubs/fairway-woods/fwys-2024-paradym-ai-smoke-triple-diamond.html', 'product', 'Callaway'],
    ['Ventus Blue 7', 'https://www.fujikuragolf.com/product/ventus-blue/', 'product', 'Fujikura Golf'],
    ['Elyte Triple Diamond', 'https://www.callawaygolf.com/golf-clubs/fairway-woods/', 'product', 'Callaway'],
    ['Ventus Black 8', 'https://www.fujikuragolf.com/product/ventus-black/', 'product', 'Fujikura Golf'],
    ['T250', 'https://www.titleist.com/golf-clubs/irons/t250', 'product', 'Titleist'],
    ['P7 TW', 'https://www.taylormadegolf.com/P7TW-Irons/DW-TA436.html', 'product', 'TaylorMade'],
    ['Iron Shafts', 'https://www.truetemper.com/product/dynamic-gold/', 'product', 'True Temper'],
    ['SM11 Wedge (46)', 'https://www.vokey.com/wedges/sm11.html', 'product', 'Vokey'],
    ['SM11 Wedge (50)', 'https://www.vokey.com/wedges/sm11.html', 'product', 'Vokey'],
    ['SM11 Wedge (54)', 'https://www.vokey.com/wedges/sm11.html', 'product', 'Vokey'],
    ['SM11 Wedge (58)', 'https://www.vokey.com/wedges/sm11.html', 'product', 'Vokey'],
    ['Wedge Shafts', 'https://www.truetemper.com/product/dynamic-gold/', 'product', 'True Temper'],
    ['Scotty Cameron', 'https://www.scottycameron.com/putters/', 'product', 'Scotty Cameron'],
    ['Tour Velvet Cord', 'https://www.golfpride.com/grips/tour-velvet-cord/', 'product', 'Golf Pride'],
    ['Pro V1', 'https://www.titleist.com/golf-balls/pro-v1', 'product', 'Titleist'],
  ];

  let ok = 0;
  let fail = 0;

  for (const [partial, url, kind, label] of links) {
    const item = find(partial);
    if (!item) {
      console.log(`  SKIP: no item matching "${partial}"`);
      fail++;
      continue;
    }

    const { error: linkErr } = await supabase.from('links').insert({
      bag_item_id: item.id,
      kind,
      url,
      label,
      is_auto_generated: false,
    });

    if (linkErr) {
      console.log(`  ERROR: ${item.custom_name} — ${linkErr.message}`);
      fail++;
    } else {
      console.log(`  OK: ${item.custom_name} → ${label} (${url})`);
      ok++;
    }
  }

  console.log(`\nDone: ${ok} links added, ${fail} failures`);
}

main().catch(console.error);
