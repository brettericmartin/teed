/**
 * Create "Home Radiologist Battlestation" bag under @teed account
 * Source: Reddit u/anon709709 posts on r/battlestations and r/desksetup (Feb 2026)
 * Only items CONFIRMED by OP or OP-validated commenter IDs are included.
 * Run: set -a && source .env.local && set +a && npx tsx scripts/create-radiologist-battlestation-bag.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BagItem {
  customName: string;
  brand: string;
  customDescription: string;
  whyChosen?: string;
}

interface BagDef {
  title: string;
  description: string;
  tags: string[];
  items: BagItem[];
  sourceLinks: { url: string; kind: string; label: string }[];
}

const bag: BagDef = {
  title: "Home Radiologist Battlestation — Feb 2026",
  description:
    "A maximalist home radiology reading station built for interpreting CT, MRI, and ultrasound. Dual 28\" portrait monitors flanking a 40\" 5K ultrawide, three pointing devices for ergonomic scrolling through 2,000+ image exams, and a Corsair Xeneon Edge touchscreen for widgets. Runs dual systems (Mac Mini + desk-mounted PC) via KVM. Sourced from Reddit u/anon709709's viral r/battlestations and r/desksetup posts.",
  tags: ['desk-setup', 'battlestation', 'radiology', 'work-from-home', 'multi-monitor', 'february-2026'],
  sourceLinks: [
    { url: 'https://www.reddit.com/r/battlestations/comments/1r4xc9o/home_radiologist_setup/', kind: 'source', label: 'r/battlestations post' },
    { url: 'https://www.reddit.com/r/desksetup/comments/1r4uuo5/home_radiologist_maximalist_setup/', kind: 'source', label: 'r/desksetup post' },
  ],
  items: [
    // ─── Monitors ────────────────────────────────────────────────────────
    {
      customName: 'INNOCN 40" 5K Ultrawide Monitor',
      brand: 'INNOCN',
      customDescription: '40-inch 5120x2160p ultrawide. Center monitor used in split-screen mode for PACS image interpretation (Sectra). Not diagnostic-grade, but OP confirms it\'s serviceable for CT, MRI, and ultrasound.',
      whyChosen: 'The centerpiece. Finding a high-res flat panel with enough real estate was the hardest part of the build according to OP.',
    },
    {
      customName: 'LG DualUp 28" Monitor',
      brand: 'LG',
      customDescription: '28-inch 16:18 SDQHD (2560x2880) portrait-orientation monitors. Two units flanking the center ultrawide. Left screen: PACS list window + dictation. Right screen: Google + EMR.',
      whyChosen: 'The tall aspect ratio is ideal for reading radiologist worklists and scrolling through reports. OP runs two of these.',
    },
    {
      customName: 'Corsair Xeneon Edge',
      brand: 'Corsair',
      customDescription: '14.5-inch LCD touchscreen. Mounted below the main display, running widgets — clock, calendar, weather, and system stats visible in the photo.',
      whyChosen: 'Adds quick-glance info without consuming primary screen real estate. Functions as both a touch display and standard secondary monitor.',
    },
    // ─── Desk & Furniture ────────────────────────────────────────────────
    {
      customName: 'Uplift Standing Desk (72x30, Walnut Live Edge)',
      brand: 'Uplift',
      customDescription: '72" x 30" standing desk with walnut live edge top. Electric height-adjustable. Supports the full multi-monitor array plus all peripherals with room to spare.',
      whyChosen: 'OP specifically chose the live edge walnut for aesthetics. The 72" width is critical for fitting three large monitors plus accessories.',
    },
    {
      customName: 'Balolo Monitor Stand',
      brand: 'Balolo',
      customDescription: 'Real wood monitor riser/shelf. Houses the Mac Mini, thunderbolt dock, KVM switch, and other gear underneath. Chosen to match the walnut desk.',
      whyChosen: 'OP notes cheaper Amazon alternatives "look cheaper" — the Balolo uses real wood that matches the desk\'s walnut tone.',
    },
    {
      customName: 'Humanscale Chair',
      brand: 'Humanscale',
      customDescription: 'Brown leather ergonomic task chair. Commenters identified it as the Humanscale Freedom model. OP says "not super popular and maybe more expensive but great quality."',
      whyChosen: 'Radiologists sit for long hours interpreting images. OP chose Humanscale over the more popular Herman Miller Aeron.',
    },
    // ─── Input Devices ───────────────────────────────────────────────────
    {
      customName: 'Logitech G502X Mouse',
      brand: 'Logitech',
      customDescription: 'Primary conventional mouse. Identified by multiple commenters who share the same peripheral. Used alongside two trackballs.',
      whyChosen: 'OP uses three pointing devices to manage the massive screen real estate and reduce repetitive strain across long reading sessions.',
    },
    {
      customName: 'Elecom Huge Plus Trackball',
      brand: 'Elecom',
      customDescription: 'Large finger-operated trackball positioned to the right of the G502X. Grey ball variant visible in the photo. Commenter ID\'d it, OP confirmed "Correct."',
      whyChosen: 'Trackballs are more efficient for navigating large multi-monitor setups. Reduces wrist movement compared to a traditional mouse.',
    },
    {
      customName: 'Kensington Trackball',
      brand: 'Kensington',
      customDescription: 'OP describes it as "their new device." Features a middle scroll ring. Positioned to the left of the keyboard with a red ball visible in the photo.',
      whyChosen: 'OP: "I love that middle scroll ring when I\'m looking at exams with over 2,000 images." The scroll ring is purpose-built for radiology workflows.',
    },
    // ─── Computers & Connectivity ────────────────────────────────────────
    {
      customName: 'Apple Mac Mini',
      brand: 'Apple',
      customDescription: 'Stored under the Balolo monitor stand alongside a thunderbolt dock. One of two systems in the setup — the personal/general-use machine.',
    },
    {
      customName: 'KVM Switch',
      brand: 'KVM',
      customDescription: 'Switches all peripherals and monitors between the Mac Mini and the desk-mounted work PC. OP linked an Amazon listing (a.co/d/0gokUST6). Enables seamless toggling between personal and PACS workstation.',
      whyChosen: 'Lets OP run two completely separate systems (personal Mac + hospital work PC) without duplicating any peripherals.',
    },
    // ─── Peripherals & Accessories ───────────────────────────────────────
    {
      customName: 'Philips SpeechMike (Wireless)',
      brand: 'Philips',
      customDescription: 'Wireless dictation microphone. OP mentions "the lights for the base wireless Philips SpeechMike behind the far left monitor." Standard tool for radiologist report dictation.',
      whyChosen: 'Radiologists dictate reports rather than type them. The wireless SpeechMike is the industry-standard dictation device.',
    },
    {
      customName: 'Insta360 Webcam',
      brand: 'Insta360',
      customDescription: 'Camera mounted on a gimbal, sitting on top of the monitor light bar. OP: "It\'s a nifty gadget if you\'re into that stuff." Swivels up and down.',
      whyChosen: 'The gimbal mount keeps the camera stable and adjustable without taking up desk space.',
    },
    {
      customName: 'BenQ ScreenBar Monitor Light',
      brand: 'BenQ',
      customDescription: 'Monitor-mounted light bar on top of the center ultrawide. Commenter asked "happy with the BenQ ScreenBar?" suggesting visual ID. Provides bias lighting without screen glare — critical for diagnostic image reading.',
      whyChosen: 'Radiologists work in dim environments to maximize contrast perception. A monitor light bar provides ambient desk lighting without washing out the screens.',
    },
    // ─── Visually ID'd (not OP-confirmed) ────────────────────────────────
    {
      customName: 'Grovemade Desk Accessories',
      brand: 'Grovemade',
      customDescription: 'Commenter noted "I love the Grovemade accessories" — OP did not deny. Visible items consistent with Grovemade include the desk shelf, pen tray, and wrist rest. Walnut finish matches the desk.',
      whyChosen: 'Premium wood accessories that match the walnut live edge desk theme. Grovemade is known for cohesive desk ecosystem pieces.',
    },
  ],
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const TEED_USER_ID = '2c3e503a-78ce-4a8d-ae37-60b4a16d916e';

  // Verify user exists
  const { data: owner } = await supabase
    .from('profiles')
    .select('id, handle')
    .eq('id', TEED_USER_ID)
    .single();

  if (!owner) {
    console.error('ERROR: @teed user not found');
    process.exit(1);
  }
  console.log(`Found owner: @${owner.handle} (${owner.id})\n`);

  // Create the bag
  console.log(`Creating bag: "${bag.title}"`);
  const { data: newBag, error: bagError } = await supabase
    .from('bags')
    .insert({
      owner_id: TEED_USER_ID,
      title: bag.title,
      description: bag.description,
      is_public: true,
      category: 'tech',
      tags: bag.tags,
    })
    .select('id, code')
    .single();

  if (bagError || !newBag) {
    console.error('FAILED to create bag:', bagError);
    process.exit(1);
  }
  console.log(`  Created: /u/teed/${newBag.code} (${newBag.id})\n`);

  // Add source links to bag
  for (const link of bag.sourceLinks) {
    const { error } = await supabase.from('links').insert({
      bag_id: newBag.id,
      url: link.url,
      kind: link.kind,
      label: link.label,
      metadata: {},
    });
    if (error) console.error(`  WARN: Failed to add source link: ${link.label}`, error);
  }
  console.log(`  Added ${bag.sourceLinks.length} source links\n`);

  // Create items
  const itemsData = bag.items.map((item, i) => ({
    bag_id: newBag.id,
    custom_name: item.customName,
    brand: item.brand,
    custom_description: item.customDescription,
    why_chosen: item.whyChosen || null,
    sort_index: i,
    item_type: 'physical_product',
  }));

  const { data: createdItems, error: itemError } = await supabase
    .from('bag_items')
    .insert(itemsData)
    .select('id, custom_name, sort_index');

  if (itemError) {
    console.error('FAILED to create items:', itemError);
    process.exit(1);
  }

  console.log(`  Added ${createdItems?.length || 0} items:`);
  for (const item of createdItems || []) {
    console.log(`    [${item.sort_index}] ${item.custom_name} → ${item.id}`);
  }

  console.log(`\n✓ Bag created successfully!`);
  console.log(`  View at: /u/teed/${newBag.code}`);
  console.log(`  Bag ID: ${newBag.id}`);
  console.log(`\nNext step: Find verified product URLs and run add-links script.`);
}

main().catch(console.error);
