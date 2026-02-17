/**
 * Add verified product links to the Home Radiologist Battlestation bag
 * All URLs verified via HTTP check — no fabricated links.
 * Run: set -a && source .env.local && set +a && npx tsx scripts/add-radiologist-battlestation-links.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Item UUIDs from bag creation output
const items: Record<string, string> = {
  'INNOCN 40" 5K':       '1031156c-d039-4aa1-97e7-148972eef52f',
  'LG DualUp 28"':       '672801e2-e439-49a6-af4b-9d31ca6a9c62',
  'Corsair Xeneon Edge':  'b2fdd658-f149-4ece-a755-adc1bab04563',
  'Uplift Desk':          'a5360183-5a5b-4cda-a831-99b9ba806331',
  'Balolo Stand':         'b039c3f0-4f82-46e0-a720-c98996207fe4',
  'Humanscale Chair':     '92a1a270-d78d-471a-a49f-9018d7d56de8',
  'Logitech G502X':       'a2b04a0f-0296-46ca-8eea-15e8ac076763',
  'Elecom Huge Plus':     '2c9e4eef-ea08-43b4-b66d-256ba5343eed',
  'Kensington Trackball': 'c5ad0fd4-673f-4553-b7c0-c19633e1c682',
  'Apple Mac Mini':       '50ac9ad2-38e4-4f47-b75f-50586d72bbdb',
  'KVM Switch':           '4b703dac-7857-48f3-a2c1-f6cdc6d1645e',
  'Philips SpeechMike':   '61db11fb-f4ae-4b53-b935-3a1c2afa9a8a',
  'Insta360 Webcam':      '1ea79da7-6e34-4d48-999a-ee9ce74d76ce',
  'BenQ ScreenBar':       'cc9ee2f5-86de-4890-b547-9b5ce3b80001',
  'Grovemade':            'ddded21f-8011-4382-995c-96280e7b933a',
};

// Links to add — all verified via WebSearch + HTTP check
const linkData: { itemKey: string; url: string; kind: string; label: string }[] = [
  // INNOCN 40" 5K
  { itemKey: 'INNOCN 40" 5K', url: 'https://innocn.com/en-us/products/innocn-40-inch-computer-monitor-40c1u', kind: 'product', label: 'INNOCN (Official)' },
  { itemKey: 'INNOCN 40" 5K', url: 'https://www.amazon.com/INNOCN-Inch-2160p-Ultrawide-Monitor/dp/B0D7Q8N64F', kind: 'retailer', label: 'Amazon' },

  // LG DualUp 28"
  { itemKey: 'LG DualUp 28"', url: 'https://www.lg.com/us/monitors/lg-28mq780-b-dualup-monitor', kind: 'product', label: 'LG (Official)' },
  { itemKey: 'LG DualUp 28"', url: 'https://www.amazon.com/LG-28MQ780-B-DualUp-Monitor-DCI-P3/dp/B09XTD5C7H', kind: 'retailer', label: 'Amazon' },

  // Corsair Xeneon Edge
  { itemKey: 'Corsair Xeneon Edge', url: 'https://www.corsair.com/us/en/p/monitors/cc-9011306-ww/xeneon-edge-14-5-lcd-touchscreen-cc-9011306-ww', kind: 'product', label: 'Corsair (Official)' },

  // Uplift Standing Desk
  { itemKey: 'Uplift Desk', url: 'https://www.upliftdesk.com/uplift-v2-solid-wood-standing-desk/', kind: 'product', label: 'Uplift Desk (Official)' },

  // Balolo Monitor Stand
  { itemKey: 'Balolo Stand', url: 'https://www.balolo.de/en/products/setup-cockpit-large', kind: 'product', label: 'Balolo (Official)' },
  { itemKey: 'Balolo Stand', url: 'https://www.amazon.com/Wood-Dual-Monitor-Stand-Cockpit/dp/B0B447SJLV', kind: 'retailer', label: 'Amazon' },

  // Humanscale Freedom Chair
  { itemKey: 'Humanscale Chair', url: 'https://www.humanscale.com/products/seating/freedom-headrest-executive-chair', kind: 'product', label: 'Humanscale (Official)' },

  // Logitech G502X
  { itemKey: 'Logitech G502X', url: 'https://www.logitechg.com/en-us/shop/p/g502-x-wired-lightforce', kind: 'product', label: 'Logitech G (Official)' },

  // Elecom Huge Plus
  { itemKey: 'Elecom Huge Plus', url: 'https://elecomusa.com/products/huge-plus', kind: 'product', label: 'Elecom USA (Official)' },

  // Kensington Trackball
  { itemKey: 'Kensington Trackball', url: 'https://www.kensington.com/p/products/electronic-control-solutions/trackball-products/expert-mouse-tb800-eq-multi-connection-trackball/', kind: 'product', label: 'Kensington (Official)' },

  // Apple Mac Mini
  { itemKey: 'Apple Mac Mini', url: 'https://www.apple.com/mac-mini/', kind: 'product', label: 'Apple (Official)' },

  // KVM Switch (AV Access)
  { itemKey: 'KVM Switch', url: 'https://www.avaccess.com/products/8ksw21dp-dm-displayport-kvm-switch/', kind: 'product', label: 'AV Access (Official)' },
  { itemKey: 'KVM Switch', url: 'https://www.amazon.ca/AV-Access-DisplayPort-Monitors-Computers/dp/B0CLTTJGP7', kind: 'retailer', label: 'Amazon' },

  // Philips SpeechMike
  { itemKey: 'Philips SpeechMike', url: 'https://www.dictation.philips.com/us/products/desktop-dictation/speechmike-premium-air-wireless-dictation-microphone-smp4000/', kind: 'product', label: 'Philips (Official)' },

  // Insta360 Webcam
  { itemKey: 'Insta360 Webcam', url: 'https://www.insta360.com/product/insta360-link', kind: 'product', label: 'Insta360 (Official)' },

  // BenQ ScreenBar
  { itemKey: 'BenQ ScreenBar', url: 'https://www.benq.com/en-us/lighting/monitor-light/screenbar.html', kind: 'product', label: 'BenQ (Official)' },

  // Grovemade
  { itemKey: 'Grovemade', url: 'https://grovemade.com/desk-shelf-system/', kind: 'product', label: 'Grovemade (Official)' },
];

async function main() {
  let success = 0;
  let failed = 0;

  for (const link of linkData) {
    const itemId = items[link.itemKey];
    if (!itemId) {
      console.error(`  SKIP: No item ID for "${link.itemKey}"`);
      failed++;
      continue;
    }

    const { error } = await supabase.from('links').insert({
      bag_item_id: itemId,
      url: link.url,
      kind: link.kind,
      label: link.label,
      metadata: {},
    });

    if (error) {
      console.error(`  FAIL: ${link.itemKey} — ${link.label}:`, error.message);
      failed++;
    } else {
      console.log(`  ✓ ${link.itemKey} — ${link.label}`);
      success++;
    }
  }

  console.log(`\nDone: ${success} links added, ${failed} failed.`);
}

main().catch(console.error);
