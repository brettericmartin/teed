'use client';

import { useState } from 'react';
import { ExternalLink, Tag } from 'lucide-react';
import type { BagViewItem, ItemLink } from '@/lib/types/bagViewTypes';
import { ItemImage } from '@/components/ui/ItemImage';
import { DISCLOSURE, isOwnedBrand } from '@/lib/disclosure';
import { formatMoney, listedPrice, yearlyCost } from '@/lib/bags/totals';

interface ListViewItemProps {
  item: BagViewItem;
  isHero: boolean;
  /** Render the price column (true when any item in the bag carries a price). */
  showPrice?: boolean;
  onItemClick: () => void;
  onLinkClick: (linkId: string, itemId: string, url: string) => void;
  getLinkCTA: (link: ItemLink) => string;
  getLinkDomain: (url: string) => string;
}

/** Spec keys rendered elsewhere (price cell, pricing badge, supplement block) or never on a row. */
const HIDDEN_SPEC_KEYS = new Set([
  'pricing_model', 'price_amount', 'price_period', 'platforms', 'free_tier_available', 'url',
  'dosage', 'serving_size', 'timing', 'frequency', 'form', 'stack_notes', 'category',
  'list_price', 'founders_price',
]);

const MAX_SPEC_PAIRS = 4;

/** "width_ft" -> "Width", "height_in" -> "Height"; value gets the unit the key implies. */
function formatSpecPair(key: string, value: unknown): { label: string; value: string } | null {
  if (value === undefined || value === null || value === '') return null;
  let label = key;
  let unit = '';
  if (key.endsWith('_ft')) { label = key.slice(0, -3); unit = ' ft'; }
  else if (key.endsWith('_in')) { label = key.slice(0, -3); unit = ' in'; }
  else if (key.endsWith('_lb') || key.endsWith('_lbs')) { label = key.replace(/_lbs?$/, ''); unit = ' lb'; }
  label = label.replace(/_/g, ' ');
  label = label.charAt(0).toUpperCase() + label.slice(1);
  const text = Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return { label, value: `${text}${unit}` };
}

export default function ListViewItem({
  item,
  isHero,
  showPrice = false,
  onItemClick,
  onLinkClick,
  getLinkCTA,
  getLinkDomain,
}: ListViewItemProps) {
  const [notesOpen, setNotesOpen] = useState(false);

  const primaryLink = item.links.find((l) => l.kind === 'product') || item.links[0];
  const extraLinkCount = Math.max(0, item.links.length - (primaryLink ? 1 : 0));
  const disclosure = isOwnedBrand(item.brand) ? DISCLOSURE : null;

  // Verb: link.label when set, else the CTA helper without its trailing "on"
  const exitVerb = (link: ItemLink) => {
    const label = link.label?.trim();
    if (label) return label;
    return getLinkCTA(link).replace(/\s+on$/i, '');
  };

  const specPairs = Object.entries(item.specs || {})
    .filter(([key]) => !HIDDEN_SPEC_KEYS.has(key))
    .map(([key, value]) => formatSpecPair(key, value))
    .filter((p): p is { label: string; value: string } => p !== null)
    .slice(0, MAX_SPEC_PAIRS);

  // Price cell: paid as $1,234; "$2,495 list" when only a list price exists; subscriptions per year
  const price = (() => {
    const yearly = yearlyCost(item);
    if (yearly !== null) {
      return { text: `${formatMoney(yearly)} a year`, muted: false };
    }
    const listed = listedPrice(item);
    if (!listed) return { text: '–', muted: true };
    if (listed.kind === 'list') return { text: `${formatMoney(listed.amount)} list`, muted: true };
    return { text: formatMoney(listed.amount), muted: false };
  })();

  const thumb = (sizeClass: string) => (
    <div className={`${sizeClass} flex-shrink-0 bg-[var(--sky-2)] rounded-lg overflow-hidden flex items-center justify-center`}>
      {item.photo_url ? (
        <ItemImage
          src={item.photo_url}
          alt={item.custom_name || 'Item photo'}
          fallbackLabel={item.brand || item.custom_name}
          className="w-full h-full object-contain"
        />
      ) : (
        <span className="text-[var(--text-tertiary)] text-xs">No image</span>
      )}
    </div>
  );

  const head = (
    <>
      {item.brand && (
        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          {item.brand}
        </p>
      )}
      <div className="flex items-start gap-2 flex-wrap">
        <h3 className="text-base font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug">
          {item.custom_name}
        </h3>
        {item.quantity > 1 && (
          <span className="px-1.5 py-0.5 bg-[var(--sky-3)] text-[var(--evergreen-12)] text-xs font-medium rounded">
            ×{item.quantity}
          </span>
        )}
        {isHero && (
          <span className="px-1.5 py-0.5 border border-[var(--evergreen-6)] text-[var(--evergreen-11)] text-xs font-medium rounded">
            Centerpiece
          </span>
        )}
      </div>
      {item.promo_codes && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-[var(--sand-11)] bg-[var(--sand-2)] border border-dashed border-[var(--sand-6)] rounded-full">
            <Tag className="w-3 h-3" />
            {item.promo_codes}
          </span>
        </div>
      )}
    </>
  );

  const specs = specPairs.length > 0 ? (
    <dl className="text-sm text-[var(--text-primary)] leading-relaxed">
      {specPairs.map((pair, i) => (
        <span key={pair.label} className="inline">
          {i > 0 && <span className="text-[var(--text-tertiary)]"> · </span>}
          <dt className="inline text-[var(--text-tertiary)]">{pair.label} </dt>
          <dd className="inline">{pair.value}</dd>
        </span>
      ))}
    </dl>
  ) : item.custom_description ? (
    <p className="text-sm text-[var(--text-secondary)] line-clamp-1">{item.custom_description}</p>
  ) : null;

  const why = item.why_chosen ? (
    <div>
      <p className="text-sm text-[var(--text-primary)] line-clamp-2 border-l-2 border-[var(--evergreen-6)] pl-2">
        {item.why_chosen}
      </p>
      {disclosure && (
        <p className="text-xs text-[var(--text-tertiary)] mt-1 pl-2.5">{disclosure}</p>
      )}
    </div>
  ) : disclosure ? (
    <p className="text-xs text-[var(--text-tertiary)]">{disclosure}</p>
  ) : null;

  const notes = item.notes ? (
    <div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setNotesOpen((v) => !v);
        }}
        aria-expanded={notesOpen}
        className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] underline-offset-2 hover:underline"
      >
        {notesOpen ? 'Less' : 'More'}
      </button>
      {notesOpen && (
        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap mt-1">{item.notes}</p>
      )}
    </div>
  ) : null;

  const priceCell = (className: string) => (
    <div className={`text-sm font-medium tabular-nums ${price.muted ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'} ${className}`}>
      {price.text}
    </div>
  );

  const exit = (fullWidth: boolean) =>
    primaryLink ? (
      <div className={fullWidth ? 'w-full' : 'flex flex-col items-end gap-1'}>
        <a
          href={primaryLink.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            onLinkClick(primaryLink.id, item.id, primaryLink.url);
          }}
          className={`inline-flex items-center justify-center gap-1.5 px-4 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white text-sm font-medium rounded-lg transition-colors ${
            fullWidth ? 'w-full min-h-[44px] py-2.5' : 'min-h-[40px] py-2 whitespace-nowrap'
          }`}
        >
          <span className="truncate max-w-[12rem]">{exitVerb(primaryLink)}</span>
          <span aria-hidden="true">·</span>
          <span>{getLinkDomain(primaryLink.url)}</span>
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
        </a>
        {extraLinkCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onItemClick();
            }}
            className={`text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] ${fullWidth ? 'mt-1 self-start' : ''}`}
          >
            +{extraLinkCount} {extraLinkCount === 1 ? 'link' : 'links'}
          </button>
        )}
      </div>
    ) : null;

  const gridCols = showPrice
    ? 'sm:grid-cols-[56px_minmax(0,1fr)_88px_auto]'
    : 'sm:grid-cols-[56px_minmax(0,1fr)_auto]';

  return (
    <article
      className="bg-[var(--surface)] border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
      onClick={onItemClick}
    >
      {/* Desktop (sm and up): thumb / text / price / exit */}
      <div className={`hidden sm:grid ${gridCols} gap-4 px-4 py-3 items-start`}>
        {thumb('w-14 h-14')}
        <div className="min-w-0 space-y-1.5">
          {head}
          {specs}
          {why}
          {notes}
        </div>
        {showPrice && priceCell('text-right pt-0.5')}
        <div className="flex-shrink-0">{exit(false)}</div>
      </div>

      {/* Mobile (below sm): stacked rows */}
      <div className="flex flex-col gap-2 p-4 sm:hidden">
        <div className="flex items-start gap-3">
          {thumb('w-12 h-12')}
          <div className="min-w-0 flex-1">{head}</div>
          {showPrice && priceCell('text-right flex-shrink-0')}
        </div>
        {specs && <div className="line-clamp-2">{specs}</div>}
        {why}
        {notes}
        {exit(true)}
      </div>
    </article>
  );
}
