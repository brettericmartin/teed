import Link from 'next/link';
import type { ComponentStripCard } from '@/lib/components/strip';

/**
 * Card for one component category on /for/golf-simulators. Same shell as
 * SetupCard (hairline border, no shadow, no lift, hover moves the border
 * colour only); text instead of a cover, since a reference list has no room
 * photo. "Reference list" and "Guide" are the only labels: no "best", no ranks.
 */
export function ComponentCard({ label, blurb, href, kind, itemCount }: ComponentStripCard) {
  const metaLine =
    kind === 'bag'
      ? `${itemCount ?? 0} ${itemCount === 1 ? 'item' : 'items'} · reference list`
      : 'Guide';

  return (
    <Link
      href={href}
      className="group flex flex-col bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden hover:border-[var(--evergreen-6)] focus-visible:border-[var(--evergreen-6)] transition-colors"
    >
      <div className="h-1.5 bg-[var(--sky-2)] group-hover:bg-[var(--evergreen-4)] transition-colors" aria-hidden="true" />
      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] leading-snug">{label}</h3>
        <p className="text-sm text-[var(--text-secondary)] line-clamp-3">{blurb}</p>
        <p className="text-sm tabular-nums text-[var(--text-tertiary)] mt-auto">{metaLine}</p>
      </div>
    </Link>
  );
}
