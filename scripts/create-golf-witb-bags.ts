/**
 * Create 3 Golf WITB bags under @teed account
 * Shafts are separate items so each can get its own links/images.
 * Run: set -a && source .env.local && set +a && npx tsx scripts/create-golf-witb-bags.ts
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

// ─── Bag Definitions ─────────────────────────────────────────────────────────

const bags: BagDef[] = [
  {
    title: "Anthony Kim's LIV Adelaide WITB — Feb 2026",
    description:
      "The comeback bag. Anthony Kim won LIV Golf Adelaide — his first victory in 16 years — with a bogey-free final-round 63, beating Jon Rahm by 3 shots. No equipment sponsor. Mixed Callaway, TaylorMade, and Bridgestone setup.",
    tags: ['witb', 'golf', 'liv-golf', 'anthony-kim', 'february-2026'],
    sourceLinks: [
      { url: 'https://www.golfwrx.com/773326/anthony-kim-witb-2026-february/', kind: 'source', label: 'GolfWRX WITB' },
      { url: 'https://golf.com/gear/anthony-kims-liv-golf-adelaide-witb/', kind: 'source', label: 'Golf.com' },
      { url: 'https://www.golfdigest.com/story/the-clubs-anthony-kim-used-for-comeback-victory-at-2026-liv-golf-adelaide', kind: 'source', label: 'GolfDigest' },
    ],
    items: [
      // Driver
      {
        customName: 'Callaway Quantum Triple Diamond Driver',
        brand: 'Callaway',
        customDescription: '10° — Low-spin head for maximum distance. The Triple Diamond is the tour-preferred compact shape.',
        whyChosen: 'No equipment sponsor means Kim picks purely on performance. Callaway woods with TaylorMade irons — the ultimate free agent bag.',
      },
      {
        customName: 'Driver Shaft — Mitsubishi Diamana D+ Limited 60 TX',
        brand: 'Mitsubishi',
        customDescription: 'Tour-exclusive Diamana D+ Limited in 60g X-Stiff. Low launch, low spin profile.',
      },
      // 3-Wood
      {
        customName: 'Callaway Paradym Ai Smoke Triple Diamond 3-Wood',
        brand: 'Callaway',
        customDescription: '15° — Versatile fairway wood that works off the tee and from the deck. Ai Smoke face for consistent spin.',
      },
      {
        customName: '3-Wood Shaft — Fujikura Ventus Blue 7 X',
        brand: 'Fujikura',
        customDescription: 'Ventus Blue profile — mid launch, low spin. 70g in X-Stiff.',
      },
      // 5-Wood
      {
        customName: 'Callaway Elyte Triple Diamond 5-Wood',
        brand: 'Callaway',
        customDescription: 'Rounding out the all-Callaway fairway wood setup.',
      },
      // Irons
      {
        customName: 'TaylorMade P7TW Irons (4-PW)',
        brand: 'TaylorMade',
        customDescription: "Tiger's signature muscle-back blades. Pure feel, zero forgiveness.",
        whyChosen: "Kim trusts feel over forgiveness. The P7TW is the ultimate ball-striker's iron.",
      },
      {
        customName: 'Iron Shafts — True Temper Dynamic Gold S400',
        brand: 'True Temper',
        customDescription: 'The most popular iron shaft in professional golf. Stiff flex, mid-high launch, penetrating ball flight.',
      },
      // Wedges
      {
        customName: 'TaylorMade MG5 Wedge (50°)',
        brand: 'TaylorMade',
        customDescription: '50° gap wedge — Milled Grind 5 for precision scoring shots.',
      },
      {
        customName: 'TaylorMade MG5 Wedge (54°)',
        brand: 'TaylorMade',
        customDescription: '54° sand wedge.',
      },
      {
        customName: 'TaylorMade MG5 Wedge (58°)',
        brand: 'TaylorMade',
        customDescription: '58° lob wedge.',
      },
      // Putter
      {
        customName: 'Scotty Cameron Blade Putter',
        brand: 'Titleist',
        customDescription: 'Classic blade putter. No alignment aids, just pure stroke feedback.',
        whyChosen: 'Kim has always preferred Scotty Cameron on the greens. Traditional blade feel.',
      },
      // Ball
      {
        customName: 'Bridgestone Tour B X Golf Ball',
        brand: 'Bridgestone',
        customDescription: 'Three different brands in the bag — no sponsor deal means he picks what performs.',
        whyChosen: 'Tour-level spin and feel. The only ball brand in an otherwise Callaway/TaylorMade/Titleist bag.',
      },
    ],
  },
  {
    title: "Chris Gotterup's Phoenix Open WITB — Feb 2026",
    description:
      "The breakout bag. Chris Gotterup won the WM Phoenix Open in a playoff — his second consecutive PGA Tour win after the Sony Open. He's gaming Bridgestone 220 MB irons, the first new irons Bridgestone has released since 2019. Also scored Bridgestone's first official win for their new Tour B X ball.",
    tags: ['witb', 'golf', 'pga-tour', 'chris-gotterup', 'phoenix-open', 'february-2026'],
    sourceLinks: [
      { url: 'https://www.golfwrx.com/773054/chris-gotterups-winning-witb-2026-wm-phoenix-open/', kind: 'source', label: 'GolfWRX WITB' },
      { url: 'https://golf.com/gear/chris-gotterups-wm-phoenix-open-witb/', kind: 'source', label: 'Golf.com' },
      { url: 'https://www.golfdigest.com/story/chris-gotterup-clubs-used-to-win-2026-wm-phoenix-open', kind: 'source', label: 'GolfDigest' },
    ],
    items: [
      // Driver
      {
        customName: 'Ping G440 LST Driver',
        brand: 'Ping',
        customDescription: '9° — Low-spin technology for maximum distance. One of the most popular drivers on tour in 2026.',
        whyChosen: 'The G440 LST is the tour choice for high-speed players who need to keep spin down.',
      },
      {
        customName: 'Driver Shaft — Project X HZRDUS Smoke Black RDX 70 TX',
        brand: 'Project X',
        customDescription: '70g TX flex. The HZRDUS Smoke Black RDX is a low-spin, low-launch shaft for aggressive swingers.',
      },
      // Mini Driver / 3-Wood
      {
        customName: 'TaylorMade BRNR Mini Copper',
        brand: 'TaylorMade',
        customDescription: '13.5° — Mini driver that doubles as a fairway finder. The copper finish is a conversation starter.',
        whyChosen: 'A mini driver instead of a traditional 3-wood. More control off the tee with a unique look.',
      },
      {
        customName: 'Mini Driver Shaft — Project X HZRDUS Smoke Black RDX 80 TX',
        brand: 'Project X',
        customDescription: '80g TX flex. Heavier shaft for stability and control in the mini driver.',
      },
      // 5-Wood
      {
        customName: 'TaylorMade Qi35 5-Wood',
        brand: 'TaylorMade',
        customDescription: '18° — High launch fairway wood for long approach shots into par 5s.',
      },
      {
        customName: '5-Wood Shaft — Mitsubishi Diamana',
        brand: 'Mitsubishi',
        customDescription: 'Mitsubishi Diamana profile for a mid-launch, stable flight.',
      },
      // Irons
      {
        customName: 'Bridgestone 220 MB Irons (5-PW)',
        brand: 'Bridgestone',
        customDescription: "Muscle-back blades — the first irons Bridgestone has released since 2019. Gotterup is one of the first tour players to put them in play.",
        whyChosen: "Brand new Bridgestone blades that nobody else is playing yet. Pure feel, zero forgiveness — the ultimate ball-striker's iron.",
      },
      // Wedges
      {
        customName: 'TaylorMade MG5 Wedge (50°)',
        brand: 'TaylorMade',
        customDescription: 'Milled Grind 5 gap wedge for approach shots from 100-120 yards.',
      },
      {
        customName: 'TaylorMade MG5 Wedge (54°)',
        brand: 'TaylorMade',
        customDescription: 'Milled Grind 5 sand wedge for bunker play and greenside shots.',
      },
      {
        customName: 'TaylorMade MG5 Wedge (58°)',
        brand: 'TaylorMade',
        customDescription: 'Milled Grind 5 lob wedge for high-lofted shots around the green.',
      },
      // Putter
      {
        customName: 'TaylorMade Spider Tour X Putter',
        brand: 'TaylorMade',
        customDescription: 'High-MOI mallet putter with True Path alignment. Extremely stable through the stroke.',
        whyChosen: 'One of the most popular putters on tour. The Spider Tour X provides forgiveness on off-center hits.',
      },
      // Ball
      {
        customName: 'Bridgestone Tour B X Golf Ball',
        brand: 'Bridgestone',
        customDescription: "Gotterup scored Bridgestone's first official win for their new Tour B X ball.",
        whyChosen: 'Lower spin off the driver, higher spin around the greens. The new Tour B X was built for tour-level performance.',
      },
    ],
  },
  {
    title: "Rory McIlroy's 2026 Equipment Overhaul",
    description:
      "The experiment bag. Rory changed 7 of 14 clubs for 2026 — the biggest equipment shakeup of his career. New Qi4D driver, Qi4D fairway woods, tried P7CB cavity-back irons then abandoned them mid-season (\"that experiment's over\"). Now back to his trusted RORS Proto blades. Also switched to the new TaylorMade TP5 ball.",
    tags: ['witb', 'golf', 'pga-tour', 'rory-mcilroy', 'february-2026', 'equipment-change'],
    sourceLinks: [
      { url: 'https://www.golfwrx.com/771145/rory-mcilroy-teases-major-equipment-change-for-2026/', kind: 'source', label: 'GolfWRX' },
      { url: 'https://www.golfmonthly.com/tour/rory-mcilroy-whats-in-the-bag-2026', kind: 'source', label: 'Golf Monthly' },
      { url: 'https://www.golfwrx.com/773191/that-experiments-over-rory-mcilroy-explains-why-the-cavity-back-irons-didnt-work-for-him/', kind: 'source', label: 'GolfWRX (iron drama)' },
    ],
    items: [
      // Driver
      {
        customName: 'TaylorMade Qi4D Driver',
        brand: 'TaylorMade',
        customDescription: '9° (set to 7.75° via adjustable sleeve). Two 4g weights in front, two 11g weights in back.',
        whyChosen: 'New for 2026 — one of the 7 clubs Rory changed. Set two clicks toward lower for a penetrating flight.',
      },
      {
        customName: 'Driver Shaft — Fujikura Ventus Black 60g X-Stiff',
        brand: 'Fujikura',
        customDescription: 'The Ventus Black is one of the most popular tour shafts. Low launch, low spin, maximum energy transfer.',
      },
      // 3-Wood
      {
        customName: 'TaylorMade Qi4D 3-Wood',
        brand: 'TaylorMade',
        customDescription: '15° — Matching the driver with the full Qi4D family. New for 2026.',
      },
      {
        customName: '3-Wood Shaft — Fujikura Ventus Black 80g X-Stiff',
        brand: 'Fujikura',
        customDescription: '80g X-Stiff for stability and control in the fairway wood.',
      },
      // 5-Wood
      {
        customName: 'TaylorMade Qi4D 5-Wood',
        brand: 'TaylorMade',
        customDescription: '18° — Completing the Qi4D wood lineup.',
      },
      {
        customName: '5-Wood Shaft — Fujikura Ventus Black 90g X-Stiff',
        brand: 'Fujikura',
        customDescription: '90g X-Stiff. The heaviest shaft in the Ventus Black lineup for maximum fairway wood control.',
      },
      // Irons
      {
        customName: 'TaylorMade RORS Proto Irons (5-9)',
        brand: 'TaylorMade',
        customDescription: "Rory's bespoke blade irons. He tried P7CB cavity-backs in January but went back to these: \"That experiment's over.\"",
        whyChosen: "The iron drama of 2026. Rory tried cavity backs for more forgiveness, but the feedback wasn't right. Back to the blades he's played his whole career.",
      },
      // Wedges
      {
        customName: 'TaylorMade MG5 Wedge (46°)',
        brand: 'TaylorMade',
        customDescription: 'Pitching wedge replacement — Milled Grind 5.',
      },
      {
        customName: 'TaylorMade MG5 Wedge (50°)',
        brand: 'TaylorMade',
        customDescription: 'Gap wedge.',
      },
      {
        customName: 'TaylorMade MG5 Wedge (54°)',
        brand: 'TaylorMade',
        customDescription: 'Sand wedge.',
      },
      {
        customName: 'TaylorMade MG5 Wedge (60° bent to 61°)',
        brand: 'TaylorMade',
        customDescription: 'Lob wedge bent one degree open for extra versatility around the greens.',
      },
      // Putter
      {
        customName: 'TaylorMade Spider Tour X Putter',
        brand: 'TaylorMade',
        customDescription: 'Adopted at the 2024 Tour Championship and still going strong.',
        whyChosen: 'One of the few clubs Rory did NOT change for 2026. Trust.',
      },
      // Ball
      {
        customName: 'TaylorMade TP5 Golf Ball (2026)',
        brand: 'TaylorMade',
        customDescription: 'New for 2026 — lower launch, higher short-game spin, improved performance on 60-70 yard shots.',
        whyChosen: 'Rory praised the new ball for its spin characteristics during testing. One of the 7 changes for 2026.',
      },
    ],
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { data: teedUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('handle', 'teed')
    .single();

  if (!teedUser) {
    console.error('ERROR: @teed user not found');
    process.exit(1);
  }

  console.log(`Found @teed user: ${teedUser.id}\n`);

  for (const bag of bags) {
    console.log(`Creating: ${bag.title}`);

    const { data: newBag, error: bagError } = await supabase
      .from('bags')
      .insert({
        owner_id: teedUser.id,
        title: bag.title,
        description: bag.description,
        is_public: true,
        category: 'golf',
        tags: bag.tags,
      })
      .select('id, code')
      .single();

    if (bagError || !newBag) {
      console.error(`  FAILED to create bag:`, bagError);
      continue;
    }

    console.log(`  Created bag: /u/teed/${newBag.code}`);

    // Bag-level source links
    for (const link of bag.sourceLinks) {
      await supabase.from('links').insert({
        bag_id: newBag.id,
        url: link.url,
        kind: link.kind,
        label: link.label,
        metadata: {},
      });
    }
    console.log(`  Added ${bag.sourceLinks.length} source links`);

    // Items (auto-increment sort_index)
    for (let i = 0; i < bag.items.length; i++) {
      const item = bag.items[i];
      const { error: itemError } = await supabase
        .from('bag_items')
        .insert({
          bag_id: newBag.id,
          custom_name: item.customName,
          brand: item.brand,
          custom_description: item.customDescription,
          why_chosen: item.whyChosen || null,
          sort_index: i,
          item_type: 'physical_product',
        });

      if (itemError) {
        console.error(`  FAILED to create item "${item.customName}":`, itemError);
      }
    }

    console.log(`  Added ${bag.items.length} items`);
    console.log(`  URL: /u/teed/${newBag.code}\n`);
  }

  console.log('Done! All 3 golf WITB bags created under @teed.');
}

main().catch(console.error);
