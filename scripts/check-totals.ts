/**
 * Fixture test for lib/bags/totals.ts, lib/outbound.ts and lib/disclosure.ts.
 * No database, no env.
 *
 *   npx tsx scripts/check-totals.ts
 */
import assert from 'node:assert/strict';
import {
  computeTotals,
  formatBagTotalLine,
  formatMoney,
  listedPrice,
  yearlyCost,
} from '../lib/bags/totals';
import { MAX_REF_LENGTH, stowgolfUrl, teedRefCode } from '../lib/outbound';
import { DISCLOSURE, isOwnedBrand } from '../lib/disclosure';

const items = [
  // StowGolf sample: nothing paid, list price counts and it is "priced"
  { price_paid: null, specs: { list_price: 2495, founders_price: 2295 } },
  { price_paid: 476, specs: {} },
  { price_paid: null, specs: {} }, // ball bungees, unpriced
  { price_paid: 599.99, specs: null },
  // Rapsodo Premium: yearly subscription
  { price_paid: null, specs: { pricing_model: 'subscription', price_amount: 199.99, price_period: 'yearly' } },
  { price_paid: null, specs: {} }, // projector, price unknown
  { price_paid: 50 },
  { price_paid: null }, // laptop, owned before
  // GSPro: yearly subscription
  { price_paid: null, specs: { pricing_model: 'subscription', price_amount: 250, price_period: 'yearly' } },
  // a monthly subscription normalises to x12
  { price_paid: null, specs: { pricing_model: 'subscription', price_amount: 10, price_period: 'monthly' } },
  // a subscription with no amount falls back to price_paid as the yearly figure
  { price_paid: 99, specs: { pricing_model: 'subscription' } },
];

const t = computeTotals(items);
assert.equal(t.itemCount, 11);
assert.equal(t.paid, 2495 + 476 + 599.99 + 50);
assert.equal(t.pricedCount, 4);
assert.equal(t.unpricedCount, 3);
assert.equal(t.subscriptionCount, 4);
assert.equal(t.yearly, 199.99 + 250 + 120 + 99);

assert.deepEqual(listedPrice(items[0]), { amount: 2495, kind: 'list' });
assert.deepEqual(listedPrice(items[1]), { amount: 476, kind: 'paid' });
assert.equal(listedPrice(items[2]), null);
assert.equal(yearlyCost(items[9]), 120);
assert.equal(yearlyCost(items[1]), null);

assert.equal(formatMoney(3620.99), '$3,621');
assert.equal(formatBagTotalLine(t), 'Total listed $3,621 · 4 of 7 priced · $669 a year');

const empty = computeTotals([]);
assert.equal(formatBagTotalLine(empty), '');

// Outbound helper: the whole ref is at most 24 characters (stowgolf.com's sanitizeRef cap)
assert.equal(teedRefCode('garage-sim-fall-2026'), 'TEED-GARAGE-SIM-FALL-202');
assert.ok(teedRefCode('garage-sim-fall-2026').length <= MAX_REF_LENGTH);
assert.equal(teedRefCode('abc_def!'), 'TEED-ABCDEF');
assert.equal(teedRefCode('enclosures-compared-oct-2026'), 'TEED-ENCLOSURES-COMPARED'); // trailing hyphen trimmed
assert.ok(teedRefCode('x'.repeat(60)).length <= MAX_REF_LENGTH);
const u = new URL(stowgolfUrl('/finish-your-bay', 'garage-sim-fall-2026'));
assert.equal(u.origin, 'https://stowgolf.com');
assert.equal(u.pathname, '/finish-your-bay');
assert.equal(u.searchParams.get('utm_source'), 'teed');
assert.equal(u.searchParams.get('utm_medium'), 'bag');
assert.equal(u.searchParams.get('utm_campaign'), 'garage-sim-fall-2026');
assert.equal(u.searchParams.get('ref'), 'TEED-GARAGE-SIM-FALL-202');
assert.ok((u.searchParams.get('ref') || '').length <= MAX_REF_LENGTH);
// Explicit short ref (what the seed passes)
const e = new URL(stowgolfUrl('/', 'garage-sim-fall-2026', 'TEED-GARAGE-SIM'));
assert.equal(e.searchParams.get('ref'), 'TEED-GARAGE-SIM');
assert.equal(e.searchParams.get('utm_campaign'), 'garage-sim-fall-2026');
assert.equal(new URL(stowgolfUrl('/', 'x')).pathname, '/');

// Disclosure
assert.equal(DISCLOSURE, 'Disclosure: Brett Martin runs Teed and builds StowGolf.');
assert.equal(isOwnedBrand('StowGolf'), true);
assert.equal(isOwnedBrand('stowgolf'), true);
assert.equal(isOwnedBrand("Carl's Place"), false);
assert.equal(isOwnedBrand(null), false);

console.log('check-totals: all assertions passed');
console.log(JSON.stringify(t));
