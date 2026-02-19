'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import type { BagViewItem } from '@/lib/types/bagViewTypes';

interface MasonryViewProps {
  items: BagViewItem[];
  heroItemId: string | null;
  onItemClick: (item: BagViewItem) => void;
  onLinkClick: (linkId: string, itemId: string, url: string) => void;
}

function MasonryCard({
  item,
  onItemClick,
  onLinkClick,
}: {
  item: BagViewItem;
  onItemClick: () => void;
  onLinkClick: (linkId: string, itemId: string, url: string) => void;
}) {
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);

  const getLinkDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'View';
    }
  };

  const hasNote = item.notes && item.notes.trim().length > 0;
  const notePreview = item.notes?.substring(0, 180) || '';
  const needsExpansion = (item.notes?.length || 0) > 180;

  const primaryLink = item.links.find(l => l.kind === 'product') || item.links[0];

  // Deterministic color based on item ID - using Teed brand colors
  const getCardAccent = (id: string) => {
    const colors = [
      { bg: 'from-[var(--teed-green-2)] to-[var(--teed-green-3)]', border: 'border-[var(--teed-green-6)]', accent: 'text-[var(--teed-green-11)]', button: 'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)]' },
      { bg: 'from-[var(--sky-2)] to-[var(--sky-3)]', border: 'border-[var(--sky-6)]', accent: 'text-[var(--sky-11)]', button: 'bg-[var(--sky-9)] hover:bg-[var(--sky-10)]' },
      { bg: 'from-[var(--sand-2)] to-[var(--sand-3)]', border: 'border-[var(--sand-6)]', accent: 'text-[var(--sand-11)]', button: 'bg-[var(--sand-9)] hover:bg-[var(--sand-10)]' },
      { bg: 'from-[var(--copper-2)] to-[var(--copper-3)]', border: 'border-[var(--copper-6)]', accent: 'text-[var(--copper-11)]', button: 'bg-[var(--copper-8)] hover:bg-[var(--copper-9)]' },
      { bg: 'from-[var(--evergreen-2)] to-[var(--evergreen-3)]', border: 'border-[var(--evergreen-6)]', accent: 'text-[var(--evergreen-11)]', button: 'bg-[var(--evergreen-9)] hover:bg-[var(--evergreen-10)]' },
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const cardColor = getCardAccent(item.id);

  return (
    <article className="group break-inside-avoid mb-5">
      <div className={`bg-gradient-to-br ${cardColor.bg} rounded-2xl overflow-hidden border ${cardColor.border} shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
        {/* Image - natural aspect ratio */}
        {item.photo_url && (
          <div
            className="relative cursor-pointer overflow-hidden bg-white/50"
            onClick={onItemClick}
          >
            <img
              src={item.photo_url}
              alt={item.custom_name || 'Item'}
              className="w-full h-auto object-contain group-hover:scale-[1.03] transition-transform duration-500"
              loading="lazy"
            />

            {/* Quantity badge */}
            {item.quantity > 1 && (
              <div className={`absolute top-3 left-3 px-2.5 py-1 ${cardColor.button} text-white text-xs font-bold rounded-full shadow-lg`}>
                ×{item.quantity}
              </div>
            )}

            {/* Featured badge */}
            {item.is_featured && (
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                Featured
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {/* Brand - colored accent */}
          {item.brand && (
            <p className={`text-[11px] uppercase tracking-wider ${cardColor.accent} mb-2 font-bold`}>
              {item.brand}
            </p>
          )}

          {/* Name - bold, high contrast */}
          <h3
            className="text-base font-bold text-gray-900 leading-snug cursor-pointer hover:text-gray-700 transition-colors line-clamp-2"
            onClick={onItemClick}
          >
            {item.custom_name || 'Untitled'}
          </h3>

          {/* Promo code */}
          {item.promo_codes && (
            <p className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-dashed border-amber-300 rounded-full">
              <Tag className="w-3 h-3 flex-shrink-0" />
              {item.promo_codes}
            </p>
          )}

          {/* Curator Note - highlighted */}
          {hasNote && (
            <div className={`mt-4 p-3 rounded-lg bg-white/60 border-l-[3px] ${cardColor.border}`}>
              <p className="text-sm text-editorial">
                "{isNoteExpanded ? item.notes : notePreview}{!isNoteExpanded && needsExpansion && '…'}"
              </p>
              {needsExpansion && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNoteExpanded(!isNoteExpanded);
                  }}
                  className={`mt-2 text-xs ${cardColor.accent} font-medium flex items-center gap-1`}
                >
                  {isNoteExpanded ? (
                    <>
                      <span>Show less</span>
                      <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <span>Read more</span>
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Shop link - prominent button */}
          {primaryLink && (
            <a
              href={primaryLink.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                onLinkClick(primaryLink.id, item.id, primaryLink.url);
              }}
              className={`inline-flex items-center gap-2 mt-4 px-4 py-2 ${cardColor.button} text-white text-sm font-medium rounded-lg transition-colors shadow-sm`}
            >
              <span>Shop</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function MasonryView({
  items,
  heroItemId,
  onItemClick,
  onLinkClick,
}: MasonryViewProps) {
  // Sort: featured items first for better column distribution
  const sortedItems = [...items].sort((a, b) => {
    if (a.id === heroItemId) return -1;
    if (b.id === heroItemId) return 1;
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  return (
    <div className="bg-gradient-to-br from-slate-100 via-gray-50 to-stone-100 rounded-3xl p-6 md:p-8 shadow-inner">
      <div
        className="masonry-grid"
        style={{
          columnCount: 2,
          columnGap: '16px',
        }}
      >
        {sortedItems.map((item) => (
          <MasonryCard
            key={item.id}
            item={item}
            onItemClick={() => onItemClick(item)}
            onLinkClick={onLinkClick}
          />
        ))}
      </div>

      {/* Responsive column CSS */}
      <style jsx>{`
        @media (min-width: 640px) {
          .masonry-grid {
            column-count: 3;
          }
        }
        @media (min-width: 1024px) {
          .masonry-grid {
            column-count: 4;
          }
        }
      `}</style>
    </div>
  );
}
