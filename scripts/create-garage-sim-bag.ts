/**
 * Create Brett's garage golf-simulator setup as the first "golf-sim" bag.
 *
 * Idempotent: if a bag with CODE already exists for the owner, the script
 * exits without touching it (delete it in the editor to re-seed).
 *
 * Every link below was curl-verified (HTTP 200) on 2026-10-17. Where a deep
 * product page could not be verified, the brand homepage is used, per the
 * auto-bag rule: never fabricate URLs.
 *
 * Run (from the repo root, with .env.local present):
 *   set -a && source .env.local && set +a && npx tsx scripts/create-garage-sim-bag.ts
 * Optional: OWNER_HANDLE=teed to seed under the platform account instead.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OWNER_HANDLE = process.env.OWNER_HANDLE || 'brett';
const CODE = 'garage-sim-fall-2026';

type SeedLink = { url: string; kind: string; label: string };
type SeedItem = {
  customName: string;
  brand: string;
  customDescription: string;
  whyChosen?: string;
  notes?: string;
  pricePaid?: number | null;
  purchaseDate?: string | null;
  itemType?: 'physical_product' | 'software' | 'service';
  links?: SeedLink[];
};
type SeedSection = { name: string; description?: string; items: SeedItem[] };

const bag = {
  title: "Brett's Garage Sim — Fall 2026",
  description:
    'A two-car garage in Tempe that still parks a car. The enclosure is the StowGolf factory sample (10 ft wide, 7 ft 6 in to the screen top, 5 ft deep) and folds flat against the wall when the session ends. Launch monitor on the floor beside the ball, projector on a cart, GSPro on an old gaming laptop. Every item lists what it cost and why it is here; the history below records each swap as the setup changes.',
  category: 'golf-sim',
  tags: ['golf simulator', 'garage', 'fold-flat', 'gspro', 'mlm2pro', 'under-10k', 'keeps-the-car'],
  sourceLinks: [
    { url: 'https://stowgolf.com/finish-your-bay', kind: 'source', label: 'How this bay was finished (tiers, room math, subscriptions)' },
  ] as SeedLink[],
};

const sections: SeedSection[] = [
  {
    name: 'Enclosure & screen',
    description: 'The part that decides whether the garage still parks a car.',
    items: [
      {
        customName: 'StowGolf fold-flat enclosure (factory sample)',
        brand: 'StowGolf',
        customDescription:
          '10 ft × 7 ft 6 in × 5 ft freestanding bay: aluminum folding frame, three black 600D shell panels, impact screen hung on ball bungees. Folds flat against the garage wall so the car backs in after the session.',
        whyChosen:
          'It is the product I am building. The sample landed October 8, stood up October 10, and ran its first real GSPro round October 12. The sample stands in for the production unit, which has a shallower fold.',
        notes: 'Factory sample, not a production unit. Production list price is $2,495 for the enclosure and screen.',
        pricePaid: null,
        purchaseDate: '2026-10-08',
        links: [
          { url: 'https://stowgolf.com/', kind: 'product', label: 'StowGolf' },
          { url: 'https://stowgolf.com/finish-your-bay', kind: 'article', label: 'Finish your bay: what else you need' },
        ],
      },
      {
        customName: 'Carl\'s Place Preferred impact screen',
        brand: "Carl's Place",
        customDescription:
          'Preferred-grade impact screen sized for the 10 ft × 7 ft 6 in opening, hung on ball bungees through grommets.',
        whyChosen:
          'The known-good US screen while the factory screen samples are still in transit. It is the screen in every photo and clip of the sample so far.',
        pricePaid: 476,
        links: [{ url: 'https://www.carlofet.com/', kind: 'product', label: "Carl's Place" }],
      },
      {
        customName: 'Ball bungees (about 90 per set)',
        brand: 'Generic',
        customDescription:
          'Roughly 27 on the screen, 36 on the side panels, 22 on the canopy, 4 to stow the crossbar. Counted off the prototype on October 15.',
        notes: 'Production sets will ship 100 so there are spares.',
      },
    ],
  },
  {
    name: 'Launch monitor',
    description: 'Sits beside the ball, so it fits a five-foot-deep bay.',
    items: [
      {
        customName: 'Rapsodo MLM2PRO',
        brand: 'Rapsodo',
        customDescription:
          'Dual-camera plus radar launch monitor with shot video. Runs on a phone or tablet; drives GSPro on the laptop through the Rapsodo Premium plan.',
        whyChosen:
          'Already owned before the enclosure existed, and the price of entry for GSPro at home. Honest caveat: as a behind-the-ball radar it wants more room than this bay gives it, which is exactly the depth question the StowGolf fit guide walks buyers through.',
        pricePaid: 599.99,
        links: [{ url: 'https://rapsodo.com/products/mlm2pro', kind: 'product', label: 'Rapsodo MLM2PRO' }],
      },
      {
        customName: 'Rapsodo Premium membership',
        brand: 'Rapsodo',
        customDescription: 'Annual plan required for course play and third-party software such as GSPro. $199.99 per year, or $599.99 lifetime.',
        whyChosen: 'Without it the MLM2PRO cannot talk to GSPro. This is the subscription most build guides leave out of the total.',
        pricePaid: 199.99,
        itemType: 'software',
        notes: 'Yearly.',
        links: [{ url: 'https://rapsodo.com/products/mlm2pro', kind: 'product', label: 'Rapsodo MLM2PRO (plans)' }],
      },
    ],
  },
  {
    name: 'Projector',
    description: 'On a cart, not the ceiling, because the bay folds away.',
    items: [
      {
        customName: 'BenQ TK710STi',
        brand: 'BenQ',
        customDescription:
          '4K short-throw projector. Fills the 10-foot screen from inside the bay, which keeps the hitter\'s shadow off the picture.',
        whyChosen:
          'A short throw is the only way to light a screen from a cart in a five-foot-deep enclosure. Bought instead of the used BenQ TH671ST that was on the original list.',
        links: [{ url: 'https://www.benq.com/en-us/', kind: 'product', label: 'BenQ' }],
      },
      {
        customName: 'Projector cart',
        brand: 'Generic',
        customDescription: 'A $50 rolling cart. The projector lives on it and rolls out of the way with the bay.',
        whyChosen: 'A ceiling mount would defeat the point of an enclosure that folds flat and gives the garage back.',
        pricePaid: 50,
      },
    ],
  },
  {
    name: 'Computer & software',
    description: 'The honest part of the bill: software is yearly.',
    items: [
      {
        customName: 'Gaming laptop (existing)',
        brand: 'Various',
        customDescription: 'An older gaming laptop on AC power in performance mode runs GSPro fine for one bay. The new desktop build is for the office, not the garage.',
        whyChosen: 'Already owned. A laptop one GPU tier up is genuinely enough for GSPro; it does not need to live in the garage.',
      },
      {
        customName: 'GSPro',
        brand: 'GSPro',
        customDescription: 'The community-favorite simulator software. Windows only. $250 per year.',
        whyChosen: 'Course library and physics the sim community trusts, and the software the first real session in the sample ran on (subscribed October 11, 2026).',
        pricePaid: 250,
        purchaseDate: '2026-10-11',
        itemType: 'software',
        notes: 'Yearly subscription.',
        links: [
          { url: 'https://gsprogolf.com/', kind: 'product', label: 'GSPro' },
          { url: 'https://gsprogolf.com/subscribe/', kind: 'purchase', label: 'GSPro subscription' },
        ],
      },
    ],
  },
];

async function main() {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, handle')
    .eq('handle', OWNER_HANDLE)
    .single();
  if (profileError || !profile) {
    throw new Error(`Owner @${OWNER_HANDLE} not found: ${profileError?.message}`);
  }

  const { data: existing } = await supabase
    .from('bags')
    .select('id')
    .eq('owner_id', profile.id)
    .eq('code', CODE)
    .maybeSingle();
  if (existing) {
    console.log(`Bag ${CODE} already exists for @${OWNER_HANDLE}; nothing to do.`);
    return;
  }

  const { data: created, error: bagError } = await supabase
    .from('bags')
    .insert({
      owner_id: profile.id,
      code: CODE,
      title: bag.title,
      description: bag.description,
      category: bag.category,
      tags: bag.tags,
      is_public: true,
    })
    .select('id')
    .single();
  if (bagError || !created) throw new Error(`Bag insert failed: ${bagError?.message}`);
  const bagId = created.id as string;
  console.log(`Created bag ${CODE} (${bagId}) for @${OWNER_HANDLE}`);

  for (const link of bag.sourceLinks) {
    await supabase.from('links').insert({ bag_id: bagId, url: link.url, kind: link.kind, label: link.label });
  }

  let sortIndex = 0;
  let heroItemId: string | null = null;

  for (const [sectionIndex, section] of sections.entries()) {
    const { data: sec, error: secError } = await supabase
      .from('bag_sections')
      .insert({ bag_id: bagId, name: section.name, description: section.description || null, sort_index: sectionIndex })
      .select('id')
      .single();
    if (secError || !sec) throw new Error(`Section insert failed (${section.name}): ${secError?.message}`);

    for (const item of section.items) {
      sortIndex += 1;
      const { data: row, error: itemError } = await supabase
        .from('bag_items')
        .insert({
          bag_id: bagId,
          section_id: sec.id,
          custom_name: item.customName,
          brand: item.brand,
          custom_description: item.customDescription,
          why_chosen: item.whyChosen || null,
          notes: item.notes || null,
          price_paid: item.pricePaid ?? null,
          purchase_date: item.purchaseDate ?? null,
          item_type: item.itemType || 'physical_product',
          quantity: 1,
          sort_index: sortIndex,
        })
        .select('id')
        .single();
      if (itemError || !row) throw new Error(`Item insert failed (${item.customName}): ${itemError?.message}`);
      if (!heroItemId) heroItemId = row.id;

      for (const link of item.links || []) {
        await supabase.from('links').insert({ bag_item_id: row.id, url: link.url, kind: link.kind, label: link.label });
      }
      console.log(`  + ${section.name} / ${item.customName}`);
    }
  }

  if (heroItemId) {
    await supabase.from('bags').update({ hero_item_id: heroItemId }).eq('id', bagId);
  }

  console.log(`Done. View at /u/${OWNER_HANDLE}/${CODE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
