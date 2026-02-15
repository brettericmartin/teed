import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const codes = [
    'anthony-kim-s-liv-adelaide-witb-feb-2026',
    'chris-gotterup-s-phoenix-open-witb-feb-2026',
    'rory-mcilroy-s-2026-equipment-overhaul'
  ];
  for (const code of codes) {
    const { data: bag } = await sb.from('bags').select('id, code').eq('code', code).single();
    if (!bag) { console.log('NOT FOUND:', code); continue; }
    const { data: items } = await sb.from('bag_items').select('id, custom_name, brand, sort_index').eq('bag_id', bag.id).order('sort_index');
    console.log(`\n=== ${bag.code} (bag_id: ${bag.id}) ===`);
    for (const it of items!) {
      console.log(`${it.sort_index} | ${it.id} | ${it.brand} | ${it.custom_name}`);
    }
  }
}
main();
