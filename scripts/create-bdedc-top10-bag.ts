/**
 * Create "My Top 10 EDC Picks for 2025" bag — Best Damn EDC (Taylor Martin)
 * Source: https://www.youtube.com/watch?v=TN7in_xfcMI
 *
 * 11 main picks + 2 unique community votes + 8 honorable mentions = 21 items + source video
 * All affiliate links from video description used where available.
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
  promo_codes?: string;
}

async function main() {
  console.log('Creating BDEDC Top 10 EDC Picks 2025 bag...\n');

  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .insert({
      owner_id: TEED_USER_ID,
      title: 'My Top 10 EDC Picks for 2025 — Best Damn EDC',
      description:
        'Taylor Martin\'s gear of the year picks across 11 categories: EDC folder, fixed blade, watch, flashlight, multi-tool, pen, truck tools, gadget, sleeper hit, best value, and most carried. Plus community votes and honorable mentions.',
      is_public: true,
      category: 'edc',
      tags: ['EDC', 'gear of the year', 'knives', 'flashlight', 'multi-tool', 'Best Damn EDC', '2025'],
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
      custom_name: 'My Top 10 EDC Picks for 2025 — Best Damn EDC',
      brand: 'Best Damn EDC',
      custom_description:
        'Taylor Martin\'s Deep Cuts Gear of the Year Edition. Covers every category from EDC folder to gadget of the year, with community votes and honorable mentions throughout.',
      price_paid: null,
      sort_index: 0,
    },

    // ── MAIN PICKS ───────────────────────────────────────

    {
      custom_name: 'WorkSharp RMX',
      brand: 'WorkSharp',
      custom_description:
        'EDC Folder of the Year. Ships with manual pivot, includes an auto pivot you swap in on the fly. Integral magnesium handle, M390 drop point or 3V reverse tanto. One screw to remove the blade. ~$150. "Hands down the knife of the year, bar none."',
      price_paid: 150,
      sort_index: 1,
    },
    {
      custom_name: 'Jack Wolf Knives Vampire Hunter',
      brand: 'Jack Wolf Knives',
      custom_description:
        'Fixed Blade of the Year. Boot knife style with MagnaCut blade, Coke bottle handle, manufactured by LT Wright. Available in Richlite with copper pins or desert ironwood. Comes with sheath. Sold out fast at Blade Show Texas.',
      price_paid: null,
      sort_index: 2,
    },
    {
      custom_name: 'RZE UTD-8000',
      brand: 'RZE',
      custom_description:
        'Watch of the Year. Titanium digital watch at $270 (bracelet adds $170 for $440 total) — far cheaper than titanium G-Shock ($1,000) or Garmin Marq ($2,000). Lightweight, unique, draws attention. "What is that thing?" is the most common reaction.',
      price_paid: 270,
      sort_index: 3,
    },
    {
      custom_name: 'Olight ArkPro Ultra',
      brand: 'Olight',
      custom_description:
        'Flashlight of the Year. Three modes (spotlight, flood, UV), side-mounted laser, magnetic tail and magnetic recharging, and finally USB-C charging. "The only reason it made this list is because Olight finally put a USB-C port on a flashlight."',
      price_paid: null,
      sort_index: 4,
      promo_codes: 'CARRYON — 10% off at Olight',
    },
    {
      custom_name: 'Leatherman Wave Alpha',
      brand: 'Leatherman',
      custom_description:
        'Multi-tool of the Year. Free-series one-handed technology in the Wave platform. Better tool set than the Arc individually, but the free technology and clip make it the winner. "Shows Leatherman is still fresh with good ideas." Imagine this in the Surge format.',
      price_paid: null,
      sort_index: 5,
    },
    {
      custom_name: 'Big Idea Design Pocket Pro USA (Bronze)',
      brand: 'Big Idea Design',
      custom_description:
        'Pen of the Year. Taylor\'s most carried pen all year, "not even close." USA-made in Chattanooga with mil clip (fixed his only complaint about the original). Available in bronze or titanium.',
      price_paid: null,
      sort_index: 6,
      promo_codes: 'CARRYON — 10% off at Big Idea Design',
    },
    {
      custom_name: 'ICON 1/4" Compact Socket and Bit Set (52-piece)',
      brand: 'ICON / Harbor Freight',
      custom_description:
        'Workshop/Truck Tool of the Year. Upgraded from last year\'s bit-only kit ($40) to include sockets ($80). Flex head ratchet, all bits, extension, sockets, and quarter-inch hex adapter in a compact case. "This and a pair of Knipex and you\'ve got a really capable tool set."',
      price_paid: 80,
      sort_index: 7,
    },
    {
      custom_name: 'Garmin Fenix 8 Pro',
      brand: 'Garmin',
      custom_description:
        'Gadget of the Year. On Taylor\'s wrist every day for 4 months. Step tracking, sleep tracking, workouts, built-in flashlight (replaced his EDC light), and Garmin InReach SOS/GPS. 2-week battery. "It feels like the future... something that could save your life." ~$1,400.',
      price_paid: 1400,
      sort_index: 8,
    },
    {
      custom_name: 'CRKT Provoke X',
      brand: 'CRKT',
      custom_description:
        'Sleeper Hit of the Year. Morphing karambit that swings down into an axe configuration, sheathless. "When I saw this at Blade Show I thought it was maul ninja gimmicky dumb... it\'s impossible to deny this thing is fun."',
      price_paid: null,
      sort_index: 9,
    },
    {
      custom_name: 'Knafs Lander 5',
      brand: 'Knafs',
      custom_description:
        'Value of the Year. Great folding knife at an accessible price point from Knafs.',
      price_paid: null,
      sort_index: 10,
      promo_codes: 'BESTDAMNEDC — 10% off at Knafs',
    },
    {
      custom_name: 'Leatherman Arc Talos',
      brand: 'Leatherman',
      custom_description:
        'Most Carried of the Year. The multi-tool actually in Taylor\'s pocket today. One-handed Arc platform — better blade, better scissors, better AWL than the Wave Alpha individually. The free technology\'s one-handed operation keeps him coming back.',
      price_paid: null,
      sort_index: 11,
    },

    // ── COMMUNITY GEAR OF THE YEAR (unique items) ────────

    {
      custom_name: 'Nextool Mini Flagship F12',
      brand: 'Nextool',
      custom_description:
        'Community Gear of the Year #3. Compact multi-tool that voters called out alongside the Wave Alpha and RMX.',
      price_paid: null,
      sort_index: 12,
    },
    {
      custom_name: 'Exceed Designs TiRant Ultra',
      brand: 'Exceed Designs',
      custom_description:
        'Community Gear of the Year #5. Hot-swap blade knife with cam design — drop in a utility blade or switch to a drop point. "One of the most innovative knives to come out this year."',
      price_paid: null,
      sort_index: 13,
    },

    // ── HONORABLE MENTIONS ───────────────────────────────

    {
      custom_name: 'Big Idea Design Overlook',
      brand: 'Big Idea Design',
      custom_description:
        'Folder runner-up. Titanium frame lock with M390 blade, ~$220. "Chris Reeve feel to it... understated, not overdone, very simple." Only complaint: feels 10% too small.',
      price_paid: 220,
      sort_index: 14,
      promo_codes: 'CARRYON — 10% off at Big Idea Design',
    },
    {
      custom_name: 'CRKT Compact Tuna',
      brand: 'CRKT',
      custom_description:
        'Folder runner-up. Higher-end Lucas Burnley design with S35VN blade and titanium frame lock. "Everything I wanted their Tuna to be — a stop gap between the budget Tuna and a custom."',
      price_paid: null,
      sort_index: 15,
    },
    {
      custom_name: 'Tactile Knife Co. Skeletonized Rockwall Flipper',
      brand: 'Tactile Knife Co.',
      custom_description:
        'Folder runner-up. Larger relaunched flipper with changed blade profile — thinner with a long swedge. "Super lightweight, super awesome."',
      price_paid: null,
      sort_index: 16,
    },
    {
      custom_name: 'Schwarz Knives Overland X',
      brand: 'Schwarz Knives',
      custom_description:
        'Fixed blade runner-up. Middle-of-the-road size between the too-big Overland and the too-small Sport. MagnaCut blade, made in Idaho.',
      price_paid: null,
      sort_index: 17,
    },
    {
      custom_name: 'Knafs Little Lulu',
      brand: 'Knafs',
      custom_description:
        'Fixed blade runner-up. First in-house manufactured knife from Knafs, made in Utah. MagnaCut blade. "I really grew to love this knife a lot."',
      price_paid: null,
      sort_index: 18,
      promo_codes: 'BESTDAMNEDC — 10% off at Knafs',
    },
    {
      custom_name: 'Big Idea Design Signal',
      brand: 'Big Idea Design',
      custom_description:
        'Fixed blade runner-up. Second in-house knife from BID after the Lookout, made in Chattanooga. "I wasn\'t a super huge fan initially, then I put it in the pocket and fell in love with it."',
      price_paid: null,
      sort_index: 19,
      promo_codes: 'CARRYON — 10% off at Big Idea Design',
    },
    {
      custom_name: 'Big Idea Design Ti GMT Watch',
      brand: 'Big Idea Design / RZE',
      custom_description:
        'Watch honorable mention. Titanium GMT with jubilee/beads-of-rice bracelet — "you don\'t see that in titanium done basically ever." Matte finish draws questions. Made by RZE for BID.',
      price_paid: null,
      sort_index: 20,
      promo_codes: 'CARRYON — 10% off at Big Idea Design',
    },
    {
      custom_name: 'Exceed Designs Rampant',
      brand: 'Exceed Designs',
      custom_description:
        'Flashlight runner-up. Stupid simple UI: rocker toggle — hold forward to ramp up, hold back to ramp down. "Does not get any more simple than this. Very, very intuitive."',
      price_paid: null,
      sort_index: 21,
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
        promo_codes: item.promo_codes || null,
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
  console.log(`\nNext: Run add-bdedc-top10-links.ts to attach verified URLs.`);
}

main().catch(console.error);
