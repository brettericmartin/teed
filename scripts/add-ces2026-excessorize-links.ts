/**
 * Add verified links to CES 2026 EXCESSORIZE ME bag items
 * Source video: https://www.youtube.com/watch?v=J1JBx8H5M5o
 * All URLs verified via curl HTTP 200 + WebSearch
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BAG_ID = '3a5daf98-e05e-4e84-86e8-46fc6526e19a';

const ITEMS = {
  ikkoMindOnePro: 'abf97ca1-96eb-4250-87d3-e4b5afe362c5',
  aulumuA17Case: '29e1ef52-1f05-47c7-a99b-3f3edf90297d',
  aulumuS26Case: 'a79c5af4-f4b5-4ce7-887a-31ca96995f5f',
  aulumuM10PowerBank: 'ca989fe4-f993-4e09-8631-7e76e279213a',
  aulumuG09Stand: 'eb356a62-0c46-469c-93a3-828634b15c51',
  senseRobotChess: 'f9a79978-0ae2-4edb-a9ff-9997aaa13e47',
  goveeIceMaker: '41e31f72-0619-4995-9fa3-e7bb1d95e0ed',
  tpLinkTapoC425: '316e43b7-4d29-4339-86a9-bac2b134e4cc',
  tiltaFEDesign: '255188de-ae4b-4464-964d-f5dbbe9e27b6',
  hypershellXUltra: '0d90be84-bfb6-42e0-a226-fb81e4cf2c4f',
  ugreenNexodePro: 'b043d723-3dd3-4427-85a4-135e4ce5630a',
  rollingSquareAwait: '54c56a53-87de-4e33-8f0d-7072525e6a6a',
  annoRobotLatte: '35cda2b0-bcc3-468b-ab05-f8967c87aef5',
  sotsuFlipAction: '3d13af91-d8f0-4bc6-83a3-f88a04ec63c5',
};

interface LinkInput {
  bag_item_id: string;
  kind: string;
  url: string;
  label: string;
}

async function main() {
  console.log('Adding verified links to CES 2026 EXCESSORIZE ME bag...\n');

  const links: LinkInput[] = [
    // ── IKKO MindOne Pro ─────────────────────────────────
    {
      bag_item_id: ITEMS.ikkoMindOnePro,
      kind: 'product',
      url: 'https://ikko.com/products/mind-one-phone',
      label: 'IKKO (official)',
    },

    // ── Aulumu A17 iPhone 17 Case ────────────────────────
    {
      bag_item_id: ITEMS.aulumuA17Case,
      kind: 'product',
      url: 'https://aulumu.com/collections/iphone-17-series-case',
      label: 'Aulumu (official)',
    },
    {
      bag_item_id: ITEMS.aulumuA17Case,
      kind: 'retailer',
      url: 'https://www.amazon.com/Aulumu-CoolHyper-Technology-Compatible-Translucent/dp/B0FQJGNGYF',
      label: 'Amazon',
    },

    // ── Aulumu Samsung S26 Ultra Case ────────────────────
    {
      bag_item_id: ITEMS.aulumuS26Case,
      kind: 'product',
      url: 'https://aulumu.com/pages/aulumu-s26-cases-for-samsung-galaxy-s26-ultra',
      label: 'Aulumu (official)',
    },

    // ── Aulumu M10 MagSafe PowerBank ─────────────────────
    {
      bag_item_id: ITEMS.aulumuM10PowerBank,
      kind: 'product',
      url: 'https://aulumu.com/products/m10-10000mah-multi-charging-dual-mag-power-bank',
      label: 'Aulumu (official, $90)',
    },
    {
      bag_item_id: ITEMS.aulumuM10PowerBank,
      kind: 'retailer',
      url: 'https://www.amazon.com/Aulumu-Magnetic-Portable-Retractable-Flight-Approved/dp/B0G646HYT7',
      label: 'Amazon',
    },

    // ── Aulumu G09 MagSafe Stand ─────────────────────────
    {
      bag_item_id: ITEMS.aulumuG09Stand,
      kind: 'product',
      url: 'https://aulumu.com/products/g09-infinite-360-magsafe-stand',
      label: 'Aulumu (official)',
    },

    // ── Sense Robot AI Chess Coach ───────────────────────
    {
      bag_item_id: ITEMS.senseRobotChess,
      kind: 'product',
      url: 'https://www.senserobotchess.com/products/senserobot-ai-chess-robot-training',
      label: 'Sense Robot (official)',
    },

    // ── GoveeLife Smart Nugget Ice Maker ─────────────────
    {
      bag_item_id: ITEMS.goveeIceMaker,
      kind: 'product',
      url: 'https://us.govee.com/products/goveelife-nugget-ice-maker',
      label: 'GoveeLife (official)',
    },

    // ── TP-Link Tapo C425 ───────────────────────────────
    {
      bag_item_id: ITEMS.tpLinkTapoC425,
      kind: 'retailer',
      url: 'https://www.amazon.com/dp/B0CJCGBXWG',
      label: 'Amazon',
    },

    // ── Tilta FE Design Bags ─────────────────────────────
    {
      bag_item_id: ITEMS.tiltaFEDesign,
      kind: 'product',
      url: 'https://tilta.com/product-category/lifestyle/fe-design/',
      label: 'Tilta (official)',
    },

    // ── Hypershell X Ultra Exoskeleton ───────────────────
    {
      bag_item_id: ITEMS.hypershellXUltra,
      kind: 'product',
      url: 'https://hypershell.tech/en-us/products/hypershell-x-ultra',
      label: 'Hypershell (official, $1,599)',
    },

    // ── UGREEN Nexode Pro 300W ───────────────────────────
    {
      bag_item_id: ITEMS.ugreenNexodePro,
      kind: 'product',
      url: 'https://www.ugreen.com/pages/visit-ugreen-at-ces-exhibition',
      label: 'UGREEN CES 2026 (coming Q2 2026)',
    },

    // ── Rolling Square Await Camera ──────────────────────
    {
      bag_item_id: ITEMS.rollingSquareAwait,
      kind: 'product',
      url: 'https://rollingsquare.com/',
      label: 'Rolling Square (crowdfunding soon)',
    },

    // ── Anno Robot AI Latte Art Kiosk ────────────────────
    {
      bag_item_id: ITEMS.annoRobotLatte,
      kind: 'product',
      url: 'https://www.annorobots.com/',
      label: 'Anno Robot (official)',
    },

    // ── SOTSU FlipAction Elite 16" ──────────────────────
    {
      bag_item_id: ITEMS.sotsuFlipAction,
      kind: 'product',
      url: 'https://www.sotsu.com/products/flipaction-elite-16',
      label: 'SOTSU (official)',
    },
    {
      bag_item_id: ITEMS.sotsuFlipAction,
      kind: 'retailer',
      url: 'https://www.amazon.com/dp/B0F8NY59XF',
      label: 'Amazon',
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

  console.log('\nDone! Bag: https://teed.club/u/teed/ces-2026-14-gadgets-that-actually-impressed-us');
}

main().catch(console.error);
