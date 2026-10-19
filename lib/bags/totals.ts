/**
 * Setup-bag totals (client-side, no DB).
 *
 * Wording rule: labels say "paid" and "list", never "total cost" or "deal".
 * - `price_paid` is what the owner paid. When it is null and `specs.list_price`
 *   exists, the list price counts toward the total (the StowGolf sample case) and
 *   the item is still "priced".
 * - Items whose `specs.pricing_model === 'subscription'` total separately as a
 *   yearly figure: `price_amount` x 12 for monthly, x 1 for yearly; when the
 *   amount is missing, `price_paid` is used as the yearly figure.
 * - Everything else with no price at all counts in `unpricedCount`.
 */

export interface TotalsItem {
  price_paid?: number | null;
  specs?: {
    pricing_model?: string;
    price_amount?: number;
    price_period?: string;
    list_price?: number;
    [key: string]: unknown;
  } | null;
}

export interface BagTotals {
  /** One-time money: price paid, or list price when nothing was paid. */
  paid: number;
  /** Subscriptions, normalised to per year. */
  yearly: number;
  /** Items contributing to `paid` (paid or list). */
  pricedCount: number;
  /** Items contributing to `yearly`. */
  subscriptionCount: number;
  /** Items with no price anywhere. */
  unpricedCount: number;
  /** All items considered. */
  itemCount: number;
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function isSubscription(item: TotalsItem): boolean {
  return item.specs?.pricing_model === 'subscription';
}

/** Yearly cost of a subscription item, or null when it has no usable amount. */
export function yearlyCost(item: TotalsItem): number | null {
  if (!isSubscription(item)) return null;
  const amount = num(item.specs?.price_amount);
  if (amount !== null) {
    const period = item.specs?.price_period;
    if (period === 'monthly') return amount * 12;
    if (period === 'lifetime') return null; // one-time; handled as paid
    return amount; // yearly or unspecified
  }
  const paid = num(item.price_paid);
  return paid !== null ? paid : null;
}

/** The one-time figure for an item: price paid, else list price, else null. */
export function listedPrice(item: TotalsItem): { amount: number; kind: 'paid' | 'list' } | null {
  const paid = num(item.price_paid);
  if (paid !== null) return { amount: paid, kind: 'paid' };
  const list = num(item.specs?.list_price);
  if (list !== null) return { amount: list, kind: 'list' };
  return null;
}

export function computeTotals(items: TotalsItem[]): BagTotals {
  let paid = 0;
  let yearly = 0;
  let pricedCount = 0;
  let subscriptionCount = 0;
  let unpricedCount = 0;

  for (const item of items) {
    if (isSubscription(item)) {
      const y = yearlyCost(item);
      if (y !== null) {
        yearly += y;
        subscriptionCount += 1;
        continue;
      }
      // lifetime or amount-less subscription falls through to the one-time path
    }
    const listed = listedPrice(item);
    if (listed) {
      paid += listed.amount;
      pricedCount += 1;
    } else {
      unpricedCount += 1;
    }
  }

  return {
    paid: round2(paid),
    yearly: round2(yearly),
    pricedCount,
    subscriptionCount,
    unpricedCount,
    itemCount: items.length,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** `$1,234` with no cents (prices on the row and in totals). */
export function formatMoney(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

/** "Total listed $6,120 · 11 of 13 priced", plus "· $450 a year" when subscriptions exist. */
export function formatBagTotalLine(t: BagTotals): string {
  const oneTime = t.pricedCount + t.unpricedCount;
  const parts: string[] = [];
  if (t.pricedCount > 0) {
    parts.push(`Total listed ${formatMoney(t.paid)}`);
    parts.push(`${t.pricedCount} of ${oneTime} priced`);
  }
  if (t.subscriptionCount > 0) {
    parts.push(`${formatMoney(t.yearly)} a year`);
  }
  return parts.join(' · ');
}
