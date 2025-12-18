'use client';

import { Link2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { BagItem, BagOwner } from './FeaturedBagCard';

interface ExpandedBagItemsProps {
  items: BagItem[];
  bagCode: string;
  owner: BagOwner;
  maxItems?: number;
}

export default function ExpandedBagItems({ items, bagCode, owner, maxItems = 8 }: ExpandedBagItemsProps) {
  // Get items to display (prioritize featured, then by sort_index)
  const sortedItems = [...items].sort((a, b) => {
    // Featured items first
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    // Then by sort_index
    return a.sort_index - b.sort_index;
  });

  const displayItems = sortedItems.slice(0, maxItems);
  const remainingCount = items.length - maxItems;
  const bagUrl = `/u/${owner.handle}/${bagCode}`;

  return (
    <div className="py-3">
      {/* Items list */}
      <div className="divide-y divide-[var(--border-subtle)]">
        {displayItems.map((item) => {
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors"
            >
              {/* Thumbnail */}
              {item.photo_url ? (
                <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-white border border-[var(--border-subtle)]">
                  <img
                    src={item.photo_url}
                    alt={item.custom_name || 'Item'}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 flex-shrink-0 rounded-md bg-[var(--sky-2)] border border-[var(--border-subtle)]" />
              )}

              {/* Item info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {item.custom_name || 'Unnamed item'}
                </h4>
                {item.brand && (
                  <p className="text-xs text-[var(--text-tertiary)] truncate">
                    {item.brand}
                  </p>
                )}
              </div>

              {/* Link button */}
              {item.links && item.links.length > 0 && (
                <a
                  href={item.links[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--teed-green-8)] hover:border-[var(--teed-green-8)] hover:text-white transition-colors"
                  title={item.links[0].url}
                >
                  <Link2 className="w-4 h-4" />
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* View Full Bag CTA */}
      <div className="px-4 pt-3">
        <Link
          href={bagUrl}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--teed-green-8)] text-white rounded-lg text-sm font-medium hover:bg-[var(--teed-green-9)] transition-colors"
        >
          View Full Bag
          {remainingCount > 0 && (
            <span className="text-white/80">
              (+{remainingCount} more)
            </span>
          )}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
