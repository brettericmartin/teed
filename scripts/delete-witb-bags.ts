import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const codes = [
    'anthony-kim-s-liv-adelaide-witb-feb-2026',
    'chris-gotterup-s-phoenix-open-witb-feb-2026',
    'rory-mcilroy-s-2026-equipment-overhaul'
  ];

  for (const code of codes) {
    const { data: bag } = await sb.from('bags').select('id').eq('code', code).single();
    if (!bag) { console.log('NOT FOUND:', code); continue; }

    const { data: items } = await sb.from('bag_items').select('id').eq('bag_id', bag.id);
    const itemIds = items?.map(i => i.id) || [];

    if (itemIds.length > 0) {
      const { data: dl } = await sb.from('links').delete().in('bag_item_id', itemIds).select('id');
      console.log(`  Deleted ${dl?.length ?? 0} item links`);
    }

    const { data: bl } = await sb.from('links').delete().eq('bag_id', bag.id).select('id');
    console.log(`  Deleted ${bl?.length ?? 0} bag links`);

    const { data: di } = await sb.from('bag_items').delete().eq('bag_id', bag.id).select('id');
    console.log(`  Deleted ${di?.length ?? 0} items`);

    const { error } = await sb.from('bags').delete().eq('id', bag.id);
    if (error) console.error(`  FAILED:`, error.message);
    else console.log(`DELETED: ${code}`);
  }
}
main();
