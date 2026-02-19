/**
 * Add links to BDEDC Top 10 EDC Picks 2025 bag
 * Source: https://www.youtube.com/watch?v=TN7in_xfcMI
 *
 * Uses BDEDC affiliate links from description where available.
 * Direct manufacturer links only for items without BDEDC affiliates.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ITEMS = {
  sourceVideo:        '69b85447-19e6-4389-86e8-6c9012dd0825',
  worksharpRMX:       'c865ab42-c60f-406e-8886-5e50c932f186',
  vampireHunter:      '8981cc6d-fede-465e-9659-40331d396372',
  rzeUTD8000:         '2e6777b6-f07e-4d13-805d-4c9029e199b7',
  arkProUltra:        '5347e18f-ec9a-4f91-aa67-be8d72b3432d',
  waveAlpha:          '0f6e78eb-8cec-4f1e-aa94-b8518b823824',
  pocketProUSA:       'dcd82988-8118-475d-a829-f60dc1b52d87',
  iconSocketSet:      '7134bd0d-361b-4124-ac0c-eaf657018d2c',
  garminFenix8:       '617d5f90-c23b-4f2f-be60-dfb013a26f85',
  crktProvokeX:       '1707f22a-4962-41e8-bee7-ced8c31370a3',
  knafsLander5:       '9ba8e83c-bed3-46c3-894d-12e1383487b2',
  arcTalos:           '42905776-997c-4774-a765-749d6873b9ea',
  nextoolF12:         '9e9db52c-bf7d-4957-a5cc-c99d6e65c921',
  tirantUltra:        '4fb0632b-176f-4944-a671-802b0c1609b8',
  bidOverlook:        '6117d655-4a0d-4b8b-a5a5-fefd907f5e2d',
  crktCompactTuna:    'ca405ebe-5b96-4ffd-a931-46783f479d8c',
  rockwallFlipper:    '7ada27b6-b4ea-4de1-be99-950452b78564',
  schwarzOverlandX:   '8eb5849a-865a-4ec6-9054-4b0cde6bd17c',
  knafsLittleLulu:    '8404f734-6141-46d7-9c9a-c1b5a14ab726',
  bidSignal:          '6325eeaa-fc38-4410-b71b-67d04413a525',
  bidTiGMT:           'a3483ba5-31d1-4b38-9f0f-ea54faef2e16',
  exceedRampant:      '6d82e930-3937-4262-870f-62cb4fc28ee8',
};

interface LinkInput {
  bag_item_id: string;
  kind: string;
  url: string;
  label: string;
}

async function main() {
  console.log('Adding links to BDEDC Top 10 EDC Picks 2025 bag...\n');

  const links: LinkInput[] = [
    // ── Source Video ──────────────────────────────────────
    {
      bag_item_id: ITEMS.sourceVideo,
      kind: 'source',
      url: 'https://www.youtube.com/watch?v=TN7in_xfcMI',
      label: 'Watch on YouTube',
    },

    // ── MAIN PICKS (affiliate links from description) ────

    // 1. WorkSharp RMX
    {
      bag_item_id: ITEMS.worksharpRMX,
      kind: 'product',
      url: 'https://shrtm.nu/gp9KAMk',
      label: 'WorkSharp (BDEDC affiliate)',
    },

    // 2. Jack Wolf Knives Vampire Hunter
    {
      bag_item_id: ITEMS.vampireHunter,
      kind: 'product',
      url: 'https://www.jackwolfknives.com/',
      label: 'Jack Wolf Knives (official)',
    },

    // 3. RZE UTD-8000
    {
      bag_item_id: ITEMS.rzeUTD8000,
      kind: 'product',
      url: 'https://collabs.shop/ktjlie',
      label: 'RZE (BDEDC affiliate)',
    },

    // 4. Olight ArkPro Ultra
    {
      bag_item_id: ITEMS.arkProUltra,
      kind: 'retailer',
      url: 'https://amzn.to/4pbMwQv',
      label: 'Amazon (BDEDC affiliate)',
    },
    {
      bag_item_id: ITEMS.arkProUltra,
      kind: 'product',
      url: 'https://edcm.xyz/olight',
      label: 'Olight (BDEDC affiliate — code CARRYON 10% off)',
    },

    // 5. Leatherman Wave Alpha
    {
      bag_item_id: ITEMS.waveAlpha,
      kind: 'product',
      url: 'https://shrtm.nu/ZcloaOj',
      label: 'Leatherman (BDEDC affiliate)',
    },

    // 6. BID Pocket Pro USA Bronze
    {
      bag_item_id: ITEMS.pocketProUSA,
      kind: 'product',
      url: 'https://collabs.shop/b5pkch',
      label: 'Big Idea Design (BDEDC affiliate — code CARRYON 10% off)',
    },

    // 7. ICON Socket Set
    {
      bag_item_id: ITEMS.iconSocketSet,
      kind: 'product',
      url: 'https://shrtm.nu/35dIgyK',
      label: 'Harbor Freight / ICON (BDEDC affiliate)',
    },

    // 8. Garmin Fenix 8 Pro
    {
      bag_item_id: ITEMS.garminFenix8,
      kind: 'retailer',
      url: 'https://amzn.to/3YM0CNn',
      label: 'Amazon (BDEDC affiliate)',
    },

    // 9. CRKT Provoke X
    {
      bag_item_id: ITEMS.crktProvokeX,
      kind: 'product',
      url: 'https://www.crkt.com/axe/provokex-axe',
      label: 'CRKT (official)',
    },

    // 10. Knafs Lander 5
    {
      bag_item_id: ITEMS.knafsLander5,
      kind: 'product',
      url: 'https://collabs.shop/vknj5j',
      label: 'Knafs (BDEDC affiliate — code BESTDAMNEDC 10% off)',
    },

    // 11. Leatherman Arc Talos
    {
      bag_item_id: ITEMS.arcTalos,
      kind: 'product',
      url: 'https://shrtm.nu/tAd021X',
      label: 'Leatherman (BDEDC affiliate)',
    },

    // ── COMMUNITY VOTES ──────────────────────────────────

    // Nextool Mini Flagship F12
    {
      bag_item_id: ITEMS.nextoolF12,
      kind: 'retailer',
      url: 'https://amzn.to/49mlMYC',
      label: 'Amazon (BDEDC affiliate)',
    },

    // Exceed Designs TiRant Ultra
    {
      bag_item_id: ITEMS.tirantUltra,
      kind: 'product',
      url: 'https://shrtm.nu/LXphoC6',
      label: 'Exceed Designs (BDEDC affiliate)',
    },

    // ── HONORABLE MENTIONS ───────────────────────────────
    // Use BDEDC affiliate links where available, official links otherwise

    // BID Overlook
    {
      bag_item_id: ITEMS.bidOverlook,
      kind: 'product',
      url: 'https://shrtm.nu/bigidesign',
      label: 'Big Idea Design (BDEDC affiliate — code CARRYON 10% off)',
    },
    {
      bag_item_id: ITEMS.bidOverlook,
      kind: 'product',
      url: 'https://bigidesign.com/products/the-overlook',
      label: 'Big Idea Design (direct)',
    },

    // CRKT Compact Tuna
    {
      bag_item_id: ITEMS.crktCompactTuna,
      kind: 'product',
      url: 'https://www.crkt.com/knife/tuna-compact-folding-knife-with-frame-lock',
      label: 'CRKT (official)',
    },

    // Tactile Knife Co Rockwall Flipper
    {
      bag_item_id: ITEMS.rockwallFlipper,
      kind: 'product',
      url: 'https://bit.ly/3EzN0eN',
      label: 'Tactile Knife Co. (BDEDC affiliate)',
    },
    {
      bag_item_id: ITEMS.rockwallFlipper,
      kind: 'product',
      url: 'https://tactileknife.co/products/skeletonized-rockwall-flipper',
      label: 'Tactile Knife Co. (direct)',
    },

    // Schwarz Knives Overland X
    {
      bag_item_id: ITEMS.schwarzOverlandX,
      kind: 'product',
      url: 'https://bit.ly/3OU1dr5',
      label: 'Schwarz Knives (BDEDC affiliate — code BESTDAMN 10% off)',
    },
    {
      bag_item_id: ITEMS.schwarzOverlandX,
      kind: 'product',
      url: 'https://www.schwarzknives.com/product-page/overland-x',
      label: 'Schwarz Knives (direct)',
    },

    // Knafs Little Lulu
    {
      bag_item_id: ITEMS.knafsLittleLulu,
      kind: 'product',
      url: 'http://knafs.com/bestdamnedc',
      label: 'Knafs (BDEDC affiliate — code BESTDAMNEDC 10% off)',
    },
    {
      bag_item_id: ITEMS.knafsLittleLulu,
      kind: 'product',
      url: 'https://www.knafs.com/products/little-lulu-stonewash-magnacut-green-micarta',
      label: 'Knafs Little Lulu (direct)',
    },

    // BID Signal
    {
      bag_item_id: ITEMS.bidSignal,
      kind: 'product',
      url: 'https://shrtm.nu/bigidesign',
      label: 'Big Idea Design (BDEDC affiliate — code CARRYON 10% off)',
    },
    {
      bag_item_id: ITEMS.bidSignal,
      kind: 'product',
      url: 'https://bigidesign.com/products/usa-signal-fixed-blade',
      label: 'Big Idea Design Signal (direct)',
    },

    // BID Ti GMT Watch
    {
      bag_item_id: ITEMS.bidTiGMT,
      kind: 'product',
      url: 'https://shrtm.nu/bigidesign',
      label: 'Big Idea Design (BDEDC affiliate — code CARRYON 10% off)',
    },
    {
      bag_item_id: ITEMS.bidTiGMT,
      kind: 'product',
      url: 'https://bigidesign.com/products/ti-gmt-watch',
      label: 'Big Idea Design Ti GMT (direct)',
    },

    // Exceed Designs Rampant
    {
      bag_item_id: ITEMS.exceedRampant,
      kind: 'product',
      url: 'https://exceeddesigns.com/product/rampant-r4-edc-flashlight-fine-satin-stonewashed-aluminum-ti-buttons-bezel-1300-lumens-nichia-519a/',
      label: 'Exceed Designs (official)',
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
      console.log(`  ✓ ${link.label}`);
    }
  }

  console.log('\nDone! Bag: https://teed.club/u/teed/my-top-10-edc-picks-for-2025-best-damn-edc');
}

main().catch(console.error);
