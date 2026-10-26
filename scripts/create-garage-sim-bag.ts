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
 * Emit SQL (no env, no DB; the keyless path, same shape as seed-components.ts --emit-sql):
 *   npx tsx scripts/create-garage-sim-bag.ts --emit-sql --out docs/sql/garage-sim.sql
 * The bag lives on the @teed house account at /u/teed/garage-sim. OWNER_HANDLE overrides
 * the owner for the service-key path only; --emit-sql always targets the house account.
 */

import fs from 'fs';
import path from 'path';
import { stowgolfUrl } from '../lib/outbound';
import { DISCLOSURE } from '../lib/disclosure';

const HOUSE_HANDLE = 'teed';
const HOUSE_USER_ID = '2c3e503a-78ce-4a8d-ae37-60b4a16d916e';
const OWNER_HANDLE = process.env.OWNER_HANDLE || HOUSE_HANDLE;
const CODE = 'garage-sim';
/** Explicit short ref for stowgolf.com (its sanitizeRef caps the whole ref at 24 chars). */
const REF = 'TEED-GARAGE-SIM';
const DRY_RUN = process.argv.includes('--dry-run');
const EMIT_SQL = process.argv.includes('--emit-sql');
const OUT_INDEX = process.argv.indexOf('--out');
const OUT = OUT_INDEX >= 0 ? process.argv[OUT_INDEX + 1] : undefined;

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
  title: "Brett's Garage Sim, Fall 2026",
  description:
    'A two-car garage in Tempe that still parks a car. The enclosure is the StowGolf factory sample (10 ft wide, 7 ft 6 in to the screen top, 5 ft deep) and folds flat against the wall when the session ends. Launch monitor on the floor beside the ball, projector on a cart, GSPro on an old gaming laptop. Every item lists what it cost and why it is here; the history below records each swap as the setup changes.',
  category: 'golf-sim',
  tags: ['golf simulator', 'garage', 'fold-flat', 'gspro', 'mlm2pro', 'under-10k', 'keeps-the-car'],
  sourceLinks: [
    {
      url: stowgolfUrl('/finish-your-bay', CODE, REF),
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
          `${DISCLOSURE} This is the factory sample, 10 ft wide, 5 ft deep, 7 ft 6 in to the screen top, and it folds flat against the garage wall so the car backs in when I'm done. List is $2,495; the first 25 are $2,295 and arrive in December, offered first to a free email list.`,
        // T1: the three fixed lines, same in every bag.
        notes: [
          DISCLOSURE,
          '10 ft wide, 5 ft deep, 7 ft 6 in to the screen top; freestanding, nothing drilled; folds flat against the wall so the car parks back in.',
          'List $2,495; the first 25 at the founders price of $2,295, arriving in December.',
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
          { url: stowgolfUrl('/', CODE, REF), kind: 'product', label: 'See it' },
          { url: stowgolfUrl('/finish-your-bay', CODE, REF), kind: 'article', label: 'Finish your bay' },
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
        links: [{ url: 'https://shop.carlofet.com/preferred-golf-impact-screens', kind: 'product', label: "Carl's Place" }],
      },
      {
        customName: 'Ball bungees (about 90 per set)',
        brand: 'Generic',
        customDescription:
          'Roughly 27 on the screen, 36 on the side panels, 22 on the canopy, 4 to stow the crossbar. Counted off the prototype on October 15.',
        whyChosen:
          'They hold the screen and the panels to the frame, and they are the part you will lose under the car. Any 9 in ball bungee works; production sets ship 100 so there are spares.',
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
        links: [{ url: 'https://rapsodo.com/products/mlm2pro-mobile-launch-monitor-golf-simulator', kind: 'product', label: 'Rapsodo MLM2PRO' }],
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
        links: [{ url: 'https://rapsodo.com/products/mlm2pro-mobile-launch-monitor-golf-simulator', kind: 'product', label: 'Rapsodo MLM2PRO (plans)' }],
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
        links: [{ url: 'https://www.benq.com/en-us/projector/home-projectors/tk710sti.html', kind: 'product', label: 'BenQ' }],
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

// =============================================================================
// SQL emitter (--emit-sql): the upsert path as one re-runnable PostgreSQL script
// =============================================================================
//
// Same shape as scripts/seed-components.ts --emit-sql: owner by handle (asserted
// against HOUSE_USER_ID), bag by (owner_id, code), sections by (bag_id, name),
// items by (bag_id, custom_name), links deleted and re-inserted per seeded item,
// hero_item_id set only when the bag has none, stale items reported and never
// deleted. The bag-level source link (links.bag_id, no bag_item_id) is deleted
// and re-inserted too. Unlike the component bags this one carries price_paid and
// purchase_date, because the garage bag lists what Brett actually paid.

function dollarTag(base: string, ...contents: string[]): string {
  for (let n = 0; ; n++) {
    const tag = `$${base}${n === 0 ? '' : n}$`;
    if (!contents.some((c) => c.includes(tag))) return tag;
  }
}

/** Text literal, dollar-quoted so nothing inside needs escaping; NULL for null. */
function sqlText(value: string | null | undefined): string {
  if (value === null || value === undefined) return 'NULL';
  const tag = dollarTag('q', value);
  return `${tag}${value}${tag}`;
}

function sqlJsonb(value: unknown): string {
  const json = JSON.stringify(value);
  const tag = dollarTag('j', json);
  return `${tag}${json}${tag}::jsonb`;
}

function sqlNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'NULL';
  if (!Number.isFinite(value)) throw new Error(`not a finite number: ${value}`);
  return String(value);
}

function sqlDate(value: string | null | undefined): string {
  if (!value) return 'NULL';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`not a date: ${value}`);
  return `'${value}'::date`;
}

function doBody(): string {
  const lines: string[] = [];
  const push = (s = '') => lines.push(s);
  const items = sections.flatMap((s) => s.items.map((item) => ({ section: s.name, item })));

  push('DECLARE');
  push('  v_owner uuid;');
  push('  v_bag uuid;');
  push('  v_section uuid;');
  push('  v_item uuid;');
  push('  v_first_item uuid := NULL;');
  push('  v_stale integer := 0;');
  push('BEGIN');
  push(`  -- 1. Owner: @${HOUSE_HANDLE} must resolve to the house account.`);
  push(`  SELECT id INTO v_owner FROM profiles WHERE handle = ${sqlText(HOUSE_HANDLE)};`);
  push('  IF v_owner IS NULL THEN');
  push(`    RAISE EXCEPTION 'House account @${HOUSE_HANDLE} not found in profiles';`);
  push('  END IF;');
  push(`  IF v_owner <> '${HOUSE_USER_ID}'::uuid THEN`);
  push(`    RAISE EXCEPTION '@${HOUSE_HANDLE} resolved to %, expected ${HOUSE_USER_ID}; refusing to seed under the wrong account', v_owner;`);
  push('  END IF;');
  push();
  push(`  -- 2. Bag ${CODE} by (owner_id, code).`);
  push(`  SELECT id INTO v_bag FROM bags WHERE owner_id = v_owner AND code = ${sqlText(CODE)};`);
  push('  IF v_bag IS NULL THEN');
  push('    INSERT INTO bags (owner_id, code, title, description, category, tags, is_public, updated_at)');
  push(`    VALUES (v_owner, ${sqlText(CODE)}, ${sqlText(bag.title)}, ${sqlText(bag.description)}, ${sqlText(bag.category)}, ${sqlJsonb(bag.tags)}, true, now())`);
  push('    RETURNING id INTO v_bag;');
  push('  ELSE');
  push('    UPDATE bags SET');
  push(`      title = ${sqlText(bag.title)},`);
  push(`      description = ${sqlText(bag.description)},`);
  push(`      category = ${sqlText(bag.category)},`);
  push(`      tags = ${sqlJsonb(bag.tags)},`);
  push('      is_public = true,');
  push('      updated_at = now()');
  push('    WHERE id = v_bag;');
  push('  END IF;');
  push('  -- Bag-level source links: deleted and re-inserted.');
  push('  DELETE FROM links WHERE bag_id = v_bag AND bag_item_id IS NULL;');
  for (const l of bag.sourceLinks) {
    push(`  INSERT INTO links (bag_id, kind, url, label) VALUES (v_bag, ${sqlText(l.kind)}, ${sqlText(l.url)}, ${sqlText(l.label)});`);
  }
  push();
  push('  -- 3. Sections by (bag_id, name), sort_index in file order.');
  for (const [index, section] of sections.entries()) {
    push(`  SELECT id INTO v_section FROM bag_sections WHERE bag_id = v_bag AND name = ${sqlText(section.name)};`);
    push('  IF v_section IS NULL THEN');
    push(`    INSERT INTO bag_sections (bag_id, name, description, sort_index) VALUES (v_bag, ${sqlText(section.name)}, ${sqlText(section.description || null)}, ${index});`);
    push('  ELSE');
    push(`    UPDATE bag_sections SET description = ${sqlText(section.description || null)}, sort_index = ${index} WHERE id = v_section;`);
    push('  END IF;');
  }
  push();
  push("  -- 4. Items by (bag_id, custom_name); 5. each item's links deleted and re-inserted.");
  for (const [index, { section, item }] of items.entries()) {
    const itemType = item.itemType || 'physical_product';
    const specs = item.specs || {};
    push(`  -- item ${index + 1}: ${item.customName.replace(/[\r\n]+/g, ' ')}`);
    push(`  SELECT id INTO v_section FROM bag_sections WHERE bag_id = v_bag AND name = ${sqlText(section)};`);
    push(`  SELECT id INTO v_item FROM bag_items WHERE bag_id = v_bag AND custom_name = ${sqlText(item.customName)};`);
    push('  IF v_item IS NULL THEN');
    push('    INSERT INTO bag_items (bag_id, section_id, custom_name, brand, custom_description, why_chosen, notes, price_paid, purchase_date, item_type, specs, quantity, sort_index)');
    push(
      `    VALUES (v_bag, v_section, ${sqlText(item.customName)}, ${sqlText(item.brand)}, ${sqlText(item.customDescription)}, ${sqlText(item.whyChosen || null)}, ${sqlText(item.notes || null)}, ${sqlNumber(item.pricePaid)}, ${sqlDate(item.purchaseDate)}, ${sqlText(itemType)}, ${sqlJsonb(specs)}, 1, ${index + 1})`
    );
    push('    RETURNING id INTO v_item;');
    push('  ELSE');
    push('    UPDATE bag_items SET');
    push('      section_id = v_section,');
    push(`      brand = ${sqlText(item.brand)},`);
    push(`      custom_description = ${sqlText(item.customDescription)},`);
    push(`      why_chosen = ${sqlText(item.whyChosen || null)},`);
    push(`      notes = ${sqlText(item.notes || null)},`);
    push(`      price_paid = ${sqlNumber(item.pricePaid)},`);
    push(`      purchase_date = ${sqlDate(item.purchaseDate)},`);
    push(`      item_type = ${sqlText(itemType)},`);
    push(`      specs = ${sqlJsonb(specs)},`);
    push('      quantity = 1,');
    push(`      sort_index = ${index + 1}`);
    push('    WHERE id = v_item;');
    push('  END IF;');
    push('  IF v_first_item IS NULL THEN v_first_item := v_item; END IF;');
    push('  DELETE FROM links WHERE bag_item_id = v_item;');
    const links = item.links || [];
    if (links.length) {
      push('  INSERT INTO links (bag_item_id, kind, url, label) VALUES');
      links.forEach((l, i) => {
        const end = i === links.length - 1 ? ';' : ',';
        push(`    (v_item, ${sqlText(l.kind)}, ${sqlText(l.url)}, ${sqlText(l.label)})${end}`);
      });
    }
    push();
  }
  push('  -- Items in the bag that are not in this file are reported, never deleted.');
  push('  SELECT count(*) INTO v_stale FROM bag_items');
  push(`  WHERE bag_id = v_bag AND custom_name NOT IN (${items.map((i) => sqlText(i.item.customName)).join(', ')});`);
  push('  IF v_stale > 0 THEN');
  push(`    RAISE NOTICE '${CODE}: % item(s) in the bag are not in the file', v_stale;`);
  push('  END IF;');
  push();
  push('  -- hero_item_id: the first item, only when the bag has none.');
  push('  IF v_first_item IS NOT NULL THEN');
  push('    UPDATE bags SET hero_item_id = v_first_item WHERE id = v_bag AND hero_item_id IS NULL;');
  push('  END IF;');
  push(`  RAISE NOTICE '${CODE}: bag %, ${sections.length} section(s), ${items.length} item(s) upserted', v_bag;`);
  push('END');
  return lines.join('\n');
}

function emitSql(): string {
  const body = doBody();
  const tag = dollarTag('seed', body);
  const out: string[] = [];
  out.push('-- Generated by scripts/create-garage-sim-bag.ts --emit-sql');
  out.push(`-- Bag: ${CODE} on @${HOUSE_HANDLE} (${HOUSE_USER_ID}), served at /u/${HOUSE_HANDLE}/${CODE}`);
  out.push('-- Idempotent: re-running updates in place (bag by owner_id + code, sections by bag_id + name,');
  out.push("-- items by bag_id + custom_name; each seeded item's links are deleted and re-inserted). Nothing");
  out.push('-- else is deleted. One transaction: any error rolls the whole file back.');
  out.push('BEGIN;');
  out.push('');
  out.push(`-- ${CODE}: ${bag.title}`);
  out.push(`DO ${tag}`);
  out.push(body);
  out.push(`${tag};`);
  out.push('');
  out.push('-- 6. Summary: one row.');
  out.push('SELECT');
  out.push('  b.code,');
  out.push('  (SELECT count(*) FROM bag_sections s WHERE s.bag_id = b.id) AS sections,');
  out.push('  (SELECT count(*) FROM bag_items i WHERE i.bag_id = b.id) AS items,');
  out.push('  (SELECT count(*) FROM links l JOIN bag_items i ON i.id = l.bag_item_id WHERE i.bag_id = b.id) AS links');
  out.push('FROM bags b');
  out.push(`WHERE b.owner_id = '${HOUSE_USER_ID}'::uuid AND b.code = ${sqlText(CODE)};`);
  out.push('');
  out.push('COMMIT;');
  out.push('');
  return out.join('\n');
}

async function main() {
  const payload = { owner: OWNER_HANDLE, code: CODE, bag, sections };

  if (EMIT_SQL) {
    const sql = emitSql();
    const itemCount = sections.reduce((n, s) => n + s.items.length, 0);
    const linkCount = sections.reduce((n, s) => n + s.items.reduce((m, i) => m + (i.links?.length || 0), 0), 0);
    if (OUT) {
      fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
      fs.writeFileSync(OUT, sql, 'utf-8');
      console.log(`[emit-sql] wrote ${OUT}: 1 bag, ${sections.length} section(s), ${itemCount} item(s), ${linkCount} item link(s), ${bag.sourceLinks.length} bag link(s). No database call made.`);
    } else {
      process.stdout.write(sql);
    }
    return;
  }

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
  const { createClient } = await import('@supabase/supabase-js');
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
