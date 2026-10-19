/**
 * Create Brett's garage golf-simulator setup as the first "golf-sim" bag.
 *
 * Idempotent: if a bag with CODE already exists for the owner, the script
 * exits without touching it (delete it in the editor to re-seed).
 *
 * Every link below was curl-verified (HTTP 200) on 2026-10-17. Where a deep
 * product page could not be verified, the brand homepage is used, per the
 * auto-bag rule: never fabricate URLs. Every stowgolf.com link goes through
 * stowgolfUrl() so the visit carries utm_source=teed and ref=TEED-<CODE>.
 *
 * Copy rules (copy-bank § T, council 2026-10-18): the StowGolf item gets the
 * three fixed lines (T1) as its note and the first-person why-chosen (T3);
 * labels say "paid" and "list"; subscriptions are their own yearly lines.
 * Prices Brett has not confirmed stay null (no [CHECK] text ships in data).
 *
 * Run (from the repo root, with .env.local present):
 *   set -a && source .env.local && set +a && npx tsx scripts/create-garage-sim-bag.ts
 * Dry run (no env, no DB; prints the payload and exits):
 *   npx tsx scripts/create-garage-sim-bag.ts --dry-run
 * Optional: OWNER_HANDLE=teed to seed under the platform account instead.
 */

import { createClient } from '@supabase/supabase-js';
import { stowgolfUrl } from '../lib/outbound';
import { DISCLOSURE } from '../lib/disclosure';

const OWNER_HANDLE = process.env.OWNER_HANDLE || 'brett';
const CODE = 'garage-sim-fall-2026';
const DRY_RUN = process.argv.includes('--dry-run');

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
  specs?: Record<string, string | number | boolean>;
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
    {
      url: stowgolfUrl('/finish-your-bay', CODE),
      kind: 'source',
      label: 'How this bay was finished',
    },
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
        // T3, first person. The disclosure sentence is the DISCLOSURE constant so it never drifts.
        whyChosen:
          `${DISCLOSURE} This is the factory sample, 10 ft wide, 5 ft deep, 7 ft 6 in to the screen top, and it folds flat against the garage wall so the car backs in when I'm done. List is $2,495; the first 25 are $2,295, and a $100 refundable reservation holds a numbered slot.`,
        // T1: the three fixed lines, same in every bag.
        notes: [
          DISCLOSURE,
          '10 ft wide, 5 ft deep, 7 ft 6 in to the screen top; freestanding, nothing drilled; folds flat against the wall so the car parks back in.',
          'List $2,495; the first 25 at the founders price of $2,295; a $100 refundable reservation holds a numbered slot.',
        ].join('\n'),
        pricePaid: null, // factory sample, not bought; the money line rides in the note
        purchaseDate: '2026-10-08',
        specs: {
          list_price: 2495,
          founders_price: 2295,
          width_ft: 10,
          height_in: 90,
          depth_ft: 5,
        },
        links: [
          { url: stowgolfUrl('/', CODE), kind: 'product', label: 'See it' },
          { url: stowgolfUrl('/finish-your-bay', CODE), kind: 'article', label: 'Finish your bay' },
        ],
      },
      {
        customName: "Carl's Place Preferred impact screen",
        brand: "Carl's Place",
        customDescription:
          'Preferred-grade impact screen sized for the 10 ft × 7 ft 6 in opening, hung on ball bungees through grommets.',
        whyChosen:
          "Carl's Preferred, $476, bought before I had a factory screen to test. It's the screen in every photo of the sample so far. When the production screen replaces it, this line stays in the bag history so you can see what I started with.",
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
    description: 'Behind the ball, so room depth is the thing to check before you copy this.',
    items: [
      {
        customName: 'Rapsodo MLM2PRO',
        brand: 'Rapsodo',
        customDescription:
          'Dual-camera plus radar launch monitor with shot video. Runs on a phone or tablet; drives GSPro on the laptop through the Rapsodo Premium plan.',
        whyChosen:
          "I owned it before the enclosure existed, and with the Premium plan ($199.99 a year) it was my cheapest honest way into GSPro. It's a behind-the-ball radar, so it wants 6.5 to 8.5 ft behind the ball; the bay is 5 ft deep and I stand outside it, and room depth is the thing to check before you copy this.",
        pricePaid: 599.99,
        links: [{ url: 'https://rapsodo.com/products/mlm2pro', kind: 'product', label: 'Rapsodo MLM2PRO' }],
      },
      {
        customName: 'Rapsodo Premium membership',
        brand: 'Rapsodo',
        customDescription:
          'Annual plan required for course play and third-party software such as GSPro. $199.99 per year, or $599.99 lifetime.',
        whyChosen:
          'Without it the MLM2PRO cannot talk to GSPro. This is the subscription most build guides leave out of the total.',
        pricePaid: null, // the yearly amount lives in specs so it totals "a year", not as a one-time line
        itemType: 'software',
        specs: { pricing_model: 'subscription', price_amount: 199.99, price_period: 'yearly' },
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
          "4K short-throw projector. Fills the 10-foot screen from inside the bay, which keeps the hitter's shadow off the picture.",
        whyChosen:
          'Short throw, because the projector lives on a $50 rolling cart inside the bay and rolls out when the bay folds. A ceiling mount would have undone the whole point of an enclosure that gets out of the way.',
        pricePaid: null, // not yet confirmed by Brett
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
    name: 'PC & software',
    description: 'The honest part of the bill: software is yearly.',
    items: [
      {
        customName: 'Gaming laptop (existing)',
        brand: 'Various',
        customDescription:
          'An older gaming laptop on AC power in performance mode runs GSPro fine for one bay. The new desktop build is for the office, not the garage.',
        whyChosen:
          'An old gaming laptop on wall power in performance mode runs GSPro fine for one bay. I did not buy a PC for the garage and I would not tell you to. GSPro itself is $250 a year, which every build guide leaves off the total.',
        pricePaid: null, // owned before the build
      },
      {
        customName: 'GSPro',
        brand: 'GSPro',
        customDescription: 'The community-favorite simulator software. Windows only. $250 per year.',
        whyChosen:
          'Course library and physics the sim community trusts, and the software the first real session in the sample ran on (subscribed October 11, 2026).',
        pricePaid: null, // yearly amount lives in specs
        purchaseDate: '2026-10-11',
        itemType: 'software',
        specs: { pricing_model: 'subscription', price_amount: 250, price_period: 'yearly' },
        notes: 'Yearly subscription.',
        links: [
          { url: 'https://gsprogolf.com/', kind: 'product', label: 'GSPro' },
          { url: 'https://gsprogolf.com/subscribe/', kind: 'purchase', label: 'GSPro subscription' },
        ],
      },
    ],
  },
  {
    name: 'Mat',
    description: 'The one part of a garage sim that never folds.',
    items: [
      {
        customName: 'Hitting mat (the one I already owned)',
        brand: 'Various',
        customDescription: 'Owned before the build. Maker, size and price to be confirmed.',
        whyChosen:
          "The mat I already had. I don't sell mats and I'm not going to. It's the one part of a garage sim that never folds, so it's the thing you still pick up before the car comes in.",
        pricePaid: null, // owned before the build, price not recorded
      },
    ],
  },
];

async function main() {
  const payload = { owner: OWNER_HANDLE, code: CODE, bag, sections };

  if (DRY_RUN) {
    console.log(JSON.stringify(payload, null, 2));
    const itemCount = sections.reduce((n, s) => n + s.items.length, 0);
    console.log(`\n[dry run] ${sections.length} sections, ${itemCount} items, ${bag.sourceLinks.length} bag-level link(s). No database call made.`);
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (source .env.local), or pass --dry-run.');
  }
  const supabase = createClient(supabaseUrl, serviceKey);

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
          specs: item.specs || {},
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
