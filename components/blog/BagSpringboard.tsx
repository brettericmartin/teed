import Link from 'next/link';
import { getSupabasePublic } from '@/lib/supabasePublic';
import { computeTotals, formatMoney, type TotalsItem } from '@/lib/bags/totals';

interface BagSpringboardProps {
  handle: string;
  code: string;
}

function readDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * The guide's springboard to the bag it is written from, placed under the post header.
 * Before this the only internal link in a 4,200-word guide was the "Featured bag" card
 * at the products section, 3,300 to 3,500 px down. Server component; renders nothing
 * when the bag is missing or private.
 */
export default async function BagSpringboard({ handle, code }: BagSpringboardProps) {
  const supabase = getSupabasePublic();
  const { data: profile } = await supabase.from('profiles').select('id').eq('handle', handle).single();
  if (!profile) return null;

  const { data: bag } = await supabase
    .from('bags')
    .select('title, items:bag_items!bag_items_bag_id_fkey(price_paid, specs)')
    .eq('owner_id', profile.id)
    .eq('code', code)
    .eq('is_public', true)
    .single();
  if (!bag) return null;

  const items = (bag.items || []) as Array<{ price_paid: number | null; specs: Record<string, unknown> | null }>;
  const totals = computeTotals(items.map((it) => ({ price_paid: it.price_paid, specs: it.specs as TotalsItem['specs'] })));
  const readDates = items
    .map((it) => (it.specs?.price_read_on as string | undefined) || null)
    .filter((d): d is string => Boolean(d))
    .sort();
  const readOn = readDates.length > 0 ? readDates[readDates.length - 1] : null;

  const parts = [`${items.length} ${items.length === 1 ? 'item' : 'items'}`];
  if (totals.pricedCount > 0) parts.push(`${formatMoney(totals.paid)} listed`);
  if (readOn) parts.push(`prices read ${readDateLabel(readOn)}`);
  parts.push('one link to the maker per item');

  return (
    <aside className="mb-8 rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
          The bag this guide is built on
        </p>
        <p className="text-base font-semibold text-[var(--text-primary)] leading-snug">{bag.title}</p>
        <p className="text-sm text-[var(--text-secondary)] tabular-nums mt-1">{parts.join(' · ')}</p>
      </div>
      <Link
        href={`/u/${handle}/${code}`}
        className="inline-flex items-center justify-center shrink-0 px-5 py-2.5 min-h-[44px] text-sm font-medium text-white bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] rounded-lg transition-colors"
      >
        View the bag
      </Link>
    </aside>
  );
}
