/**
 * Add verified links to Best Damn EDC Deep Cuts bag items
 * Source video: https://www.youtube.com/watch?v=EMLSeJ9cBVU
 * All URLs verified via curl HTTP 200 checks
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ITEMS = {
  sourceVideo:       '28e3e463-baed-4a8a-8178-a8ad4ae18968',
  worksharpRMX:      '66d8881b-321e-463d-9349-e0bc3530e570',
  bidLookout:        '891c00ae-b4e9-44e3-8d82-90ecc9f83e36',
  bidTiManu:         '799bdea6-4277-4aff-a277-d6bbe9caf4c7',
  ponchoShirt:       'cdb5d822-b92a-4896-82f5-eade82351ace',
  prevailExplorer:   '9a5dcaa7-969c-4570-af09-e42779ff9ec4',
  kershawNatrix:     '7ce6ccd0-4af5-42f7-9ebf-57c0d6fa880f',
  olightI3T:         '4b8ebf1f-61d7-4c5d-bc5b-590396e58ec2',
  zippoArmor:        '190ba06e-70fc-44d5-847f-4012544bebfc',
  bicShine:          'b25dbb14-61d8-4a32-8236-bcfd10980b08',
  leathermanRebar:   '65c745e0-8b18-44eb-b596-9f9009ef47fb',
  tokHolster:        '34da2570-2e83-475f-aabe-e87d137a72f3',
  swissToolMX:       'c232cfa2-11d2-4fed-90c6-d0ddbaf0b6d1',
  tactileTurnSwitch: 'c105ab69-1da4-47b9-8d69-cd9b90bd51d0',
  oklumaDC0:         '6716fc83-c3ce-43dc-b881-c2ac2a7494f0',
  redhawk:           '091cb8dc-a98c-4fb4-91d2-895db06a5039',
  hitchhikerWallet:  '477525b1-9bdd-4018-9351-31e782067e88',
  islanderGlacier:   'd1c5aa80-746a-42a2-9474-92f94ea4bce9',
  leathermanSurge:   '6fb5fbe4-51c4-4ef9-96ed-b957f25014e4',
  leathermanArc:     '27d7186a-ceb2-4ab2-8615-603f5316c366',
  spydercoPM2:       '864614cd-365d-478a-a36a-3aad6d583412',
  rovyvonE90:        '759b02bd-8a16-414c-affd-76b485c7a8b1',
  evansDrumKey:      'ed5b6468-c387-4715-84a3-b40e4dc5359c',
};

interface LinkInput {
  bag_item_id: string;
  kind: string;
  url: string;
  label: string;
}

async function main() {
  console.log('Adding verified links to Best Damn EDC Deep Cuts bag...\n');

  const links: LinkInput[] = [
    // ── Source Video ──────────────────────────────────────
    {
      bag_item_id: ITEMS.sourceVideo,
      kind: 'source',
      url: 'https://www.youtube.com/watch?v=EMLSeJ9cBVU',
      label: 'Watch on YouTube',
    },

    // ── Sponsor Products ─────────────────────────────────
    {
      bag_item_id: ITEMS.worksharpRMX,
      kind: 'product',
      url: 'https://worksharptools.com/products/rmx-drop-point',
      label: 'WorkSharp (official)',
    },
    {
      bag_item_id: ITEMS.bidLookout,
      kind: 'product',
      url: 'https://bigidesign.com/products/usa-lookout-fixed-blade',
      label: 'Big Idea Design (official)',
    },
    {
      bag_item_id: ITEMS.bidTiManu,
      kind: 'product',
      url: 'https://bigidesign.com/collections/knives',
      label: 'Big Idea Design Knives',
    },
    {
      bag_item_id: ITEMS.ponchoShirt,
      kind: 'product',
      url: 'https://www.ponchooutdoors.com/collections/original',
      label: 'Poncho Outdoors (official)',
    },

    // ── Carry of the Week (Fresh Goblin) ─────────────────
    {
      bag_item_id: ITEMS.prevailExplorer,
      kind: 'product',
      url: 'https://prevailwatches.com/products/onward-future-field-watch-explorer-in-classic-black',
      label: 'Prevail Watches (official)',
    },
    {
      bag_item_id: ITEMS.kershawNatrix,
      kind: 'product',
      url: 'https://kershaw.kaiusa.com/natrix-copper-xs.html',
      label: 'Kershaw (official)',
    },
    {
      bag_item_id: ITEMS.olightI3T,
      kind: 'product',
      url: 'https://www.olight.com/store/i3t-eos',
      label: 'Olight (official)',
    },
    {
      bag_item_id: ITEMS.zippoArmor,
      kind: 'product',
      url: 'https://zippo.com/products/armor-high-polish-brass',
      label: 'Zippo (lighter)',
    },
    {
      bag_item_id: ITEMS.zippoArmor,
      kind: 'product',
      url: 'https://zippo.com/products/butane-lighter-insert-yellow-flame',
      label: 'Zippo (butane insert)',
    },
    {
      bag_item_id: ITEMS.bicShine,
      kind: 'retailer',
      url: 'https://www.amazon.com/BIC-4-Color-Metallic-Assorted-2-Count/dp/B01N4S92UB',
      label: 'Amazon',
    },
    {
      bag_item_id: ITEMS.leathermanRebar,
      kind: 'product',
      url: 'https://www.leatherman.com/products/rebar',
      label: 'Leatherman (official)',
    },

    // ── What's In My Pockets (Taylor) ────────────────────
    {
      bag_item_id: ITEMS.tokHolster,
      kind: 'product',
      url: 'https://taleofknives.com/collections/single-clip',
      label: 'Tale of Knives (official)',
    },
    {
      bag_item_id: ITEMS.swissToolMX,
      kind: 'retailer',
      url: 'https://www.amazon.com/Victorinox-Swiss-MX-Silver-Multitool/dp/B09PWTDQRL',
      label: 'Amazon',
    },
    {
      bag_item_id: ITEMS.tactileTurnSwitch,
      kind: 'product',
      url: 'https://tactileturn.com/products/switch',
      label: 'Tactile Turn (official)',
    },
    {
      bag_item_id: ITEMS.oklumaDC0,
      kind: 'product',
      url: 'https://okluma.com/products/dc0',
      label: 'Okluma (official, made-to-order)',
    },
    {
      bag_item_id: ITEMS.redhawk,
      kind: 'product',
      url: 'https://tactileknife.co/products/redhawk',
      label: 'Tactile Knife Co. (official)',
    },
    {
      bag_item_id: ITEMS.hitchhikerWallet,
      kind: 'product',
      url: 'https://www.carrycommission.com/products/carry-commission-hitchhiker-wallet',
      label: 'Carry Commission (official)',
    },
    {
      bag_item_id: ITEMS.islanderGlacier,
      kind: 'product',
      url: 'https://longislandwatch.com/islander-glacier-limited-edition-automatic-dive-watch-x-lume-shot-collaboration-isl-124/',
      label: 'Long Island Watch (official, ltd. 200 pcs)',
    },

    // ── Community Comment Gear ───────────────────────────
    {
      bag_item_id: ITEMS.leathermanSurge,
      kind: 'product',
      url: 'https://www.leatherman.com/products/surge',
      label: 'Leatherman (official)',
    },
    {
      bag_item_id: ITEMS.leathermanArc,
      kind: 'product',
      url: 'https://www.leatherman.com/products/arc',
      label: 'Leatherman (official)',
    },
    {
      bag_item_id: ITEMS.spydercoPM2,
      kind: 'product',
      url: 'https://spyderco.com/products/para-military%C2%AE-2',
      label: 'Spyderco (official)',
    },
    {
      bag_item_id: ITEMS.rovyvonE90,
      kind: 'product',
      url: 'https://www.rovyvon.com/products/rovyvon-e90-3500-lumens-flat-edc-flashlight',
      label: 'RovyVon (official)',
    },
    {
      bag_item_id: ITEMS.evansDrumKey,
      kind: 'product',
      url: 'https://www.daddario.com/products/percussion/percussion-accessories/drum-keys/pullcord-drum-key/',
      label: "D'Addario / Evans (official)",
    },
  ];

  for (const link of links) {
    const { error } = await supabase.from('links').insert({
      bag_item_id: link.bag_item_id,
      kind: link.kind,
      url: link.url,
      label: link.label,
    });

    if (error) {
      console.error(`  Failed: ${link.label} — ${error.message}`);
    } else {
      console.log(`  Added: ${link.label}`);
    }
  }

  console.log('\nDone! Bag: https://teed.club/u/teed/real-edc-gear-that-saved-people-from-really-bad-jo');
}

main().catch(console.error);
