'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface ItemLink {
  id: string;
  url: string;
  kind: string;
  label: string | null;
  metadata: any;
  is_auto_generated?: boolean;
}

interface Item {
  id: string;
  custom_name: string | null;
  brand: string | null;
  custom_description: string | null;
  notes: string | null;
  quantity: number;
  sort_index: number;
  photo_url: string | null;
  promo_codes: string | null;
  is_featured: boolean;
  links: ItemLink[];
}

interface EditorialViewProps {
  items: Item[];
  heroItemId: string | null;
  onItemClick: (item: Item) => void;
  onLinkClick: (linkId: string, itemId: string, url: string) => void;
}

type CardSize = 'hero' | 'medium' | 'compact';

function EditorialCard({
  item,
  size,
  onItemClick,
  onLinkClick,
}: {
  item: Item;
  size: CardSize;
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

  // Deterministic color based on item ID - using Teed brand colors
  const getCardAccent = (id: string) => {
    const colors = [
      { bg: 'from-[var(--teed-green-2)] to-[var(--teed-green-3)]', border: 'border-[var(--teed-green-6)]', accent: 'text-[var(--teed-green-11)]', quote: 'border-[var(--teed-green-7)]', button: 'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)]' },
      { bg: 'from-[var(--sky-2)] to-[var(--sky-3)]', border: 'border-[var(--sky-6)]', accent: 'text-[var(--sky-11)]', quote: 'border-[var(--sky-7)]', button: 'bg-[var(--sky-9)] hover:bg-[var(--sky-10)]' },
      { bg: 'from-[var(--sand-2)] to-[var(--sand-3)]', border: 'border-[var(--sand-6)]', accent: 'text-[var(--sand-11)]', quote: 'border-[var(--sand-7)]', button: 'bg-[var(--sand-9)] hover:bg-[var(--sand-10)]' },
      { bg: 'from-[var(--copper-2)] to-[var(--copper-3)]', border: 'border-[var(--copper-6)]', accent: 'text-[var(--copper-11)]', quote: 'border-[var(--copper-7)]', button: 'bg-[var(--copper-8)] hover:bg-[var(--copper-9)]' },
      { bg: 'from-[var(--evergreen-2)] to-[var(--evergreen-3)]', border: 'border-[var(--evergreen-6)]', accent: 'text-[var(--evergreen-11)]', quote: 'border-[var(--evergreen-7)]', button: 'bg-[var(--evergreen-9)] hover:bg-[var(--evergreen-10)]' },
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const cardColor = getCardAccent(item.id);
  const hasNote = item.notes && item.notes.trim().length > 0;
  const primaryLink = item.links.find(l => l.kind === 'product') || item.links[0];

  // Size-based styling
  const isHero = size === 'hero';
  const isMedium = size === 'medium';
  const isCompact = size === 'compact';

  const noteLimit = isHero ? 280 : isMedium ? 180 : 140;
  const notePreview = item.notes?.substring(0, noteLimit) || '';
  const needsExpansion = (item.notes?.length || 0) > noteLimit;

  return (
    <article className={`group bg-gradient-to-br ${cardColor.bg} rounded-2xl border ${cardColor.border} overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
      {/* Image */}
      {item.photo_url && (
        <div
          className={`relative cursor-pointer overflow-hidden bg-white/60 ${
            isHero ? 'aspect-[4/3]' : isMedium ? 'aspect-square' : 'aspect-[4/3]'
          }`}
          onClick={onItemClick}
        >
          <img
            src={item.photo_url}
            alt={item.custom_name || 'Item'}
            className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-500"
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
      <div className={`${isHero ? 'p-7' : isMedium ? 'p-6' : 'p-5'}`}>
        {/* Brand */}
        {item.brand && (
          <p className={`uppercase tracking-wider ${cardColor.accent} mb-2 font-bold ${isHero ? 'text-xs' : 'text-[11px]'}`}>
            {item.brand}
          </p>
        )}

        {/* Name */}
        <h3
          className={`font-bold text-gray-900 leading-tight cursor-pointer hover:text-gray-700 transition-colors ${
            isHero ? 'text-xl md:text-2xl' : isMedium ? 'text-lg' : 'text-base line-clamp-2'
          }`}
          onClick={onItemClick}
        >
          {item.custom_name || 'Untitled'}
        </h3>

        {/* Curator Note */}
        {hasNote && (
          <div className={`${isHero ? 'mt-5' : 'mt-4'} p-3 rounded-lg bg-white/60 border-l-[3px] ${cardColor.quote}`}>
            <p className={`text-editorial ${isHero ? 'text-base' : 'text-sm'}`}>
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

        {/* Shop Link */}
        {primaryLink && (
          <a
            href={primaryLink.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              onLinkClick(primaryLink.id, item.id, primaryLink.url);
            }}
            className={`inline-flex items-center gap-2 ${cardColor.button} text-white font-medium rounded-lg shadow-sm transition-colors ${
              isHero ? 'mt-6 px-5 py-2.5 text-sm' : 'mt-4 px-4 py-2 text-xs'
            }`}
          >
            <span>Shop Now</span>
            <ExternalLink className={isHero ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          </a>
        )}
      </div>
    </article>
  );
}

export function EditorialView({
  items,
  heroItemId,
  onItemClick,
  onLinkClick,
}: EditorialViewProps) {
  // Separate hero, featured, and regular items
  const heroItem = items.find(item => item.id === heroItemId);
  const featuredItems = items.filter(
    item => item.is_featured && item.id !== heroItemId
  );
  const regularItems = items.filter(
    item => !item.is_featured && item.id !== heroItemId
  );

  // Create layout sections
  const sections: { type: 'hero' | 'featured' | 'grid'; items: Item[] }[] = [];

  // Hero row
  if (heroItem) {
    sections.push({ type: 'hero', items: [heroItem] });
  }

  // Featured items in pairs
  for (let i = 0; i < featuredItems.length; i += 2) {
    sections.push({
      type: 'featured',
      items: featuredItems.slice(i, i + 2),
    });
  }

  // Regular items in groups of 3-4
  for (let i = 0; i < regularItems.length; i += 3) {
    sections.push({
      type: 'grid',
      items: regularItems.slice(i, i + 3),
    });
  }

  // If no structure, show all in grid
  if (sections.length === 0) {
    sections.push({ type: 'grid', items: items });
  }

  return (
    <div className="bg-gradient-to-br from-slate-100 via-gray-50 to-stone-100 rounded-3xl p-6 md:p-8 shadow-inner space-y-8">
      {sections.map((section, idx) => {
        if (section.type === 'hero' && section.items[0]) {
          return (
            <div key={`hero-${idx}`} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <EditorialCard
                  item={section.items[0]}
                  size="hero"
                  onItemClick={() => onItemClick(section.items[0])}
                  onLinkClick={onLinkClick}
                />
              </div>
              {/* Add first regular item beside hero if available */}
              {regularItems[0] && (
                <div className="hidden lg:block">
                  <EditorialCard
                    item={regularItems[0]}
                    size="medium"
                    onItemClick={() => onItemClick(regularItems[0])}
                    onLinkClick={onLinkClick}
                  />
                </div>
              )}
            </div>
          );
        }

        if (section.type === 'featured') {
          // Asymmetrical layouts for featured pairs - alternate patterns
          const isEvenSection = idx % 2 === 0;

          if (section.items.length === 2) {
            // Two-item asymmetrical layout: 2/3 + 1/3 or 1/3 + 2/3
            return (
              <div
                key={`featured-${idx}`}
                className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isEvenSection ? '' : 'md:[direction:rtl]'}`}
              >
                <div className={`md:col-span-2 ${isEvenSection ? '' : 'md:[direction:ltr]'}`}>
                  <EditorialCard
                    item={section.items[0]}
                    size="hero"
                    onItemClick={() => onItemClick(section.items[0])}
                    onLinkClick={onLinkClick}
                  />
                </div>
                <div className={`md:col-span-1 ${isEvenSection ? '' : 'md:[direction:ltr]'}`}>
                  <EditorialCard
                    item={section.items[1]}
                    size="medium"
                    onItemClick={() => onItemClick(section.items[1])}
                    onLinkClick={onLinkClick}
                  />
                </div>
              </div>
            );
          }

          // Single featured item - full width with offset
          return (
            <div
              key={`featured-${idx}`}
              className="grid grid-cols-1 md:grid-cols-4 gap-8"
            >
              <div className={`md:col-span-3 ${isEvenSection ? 'md:col-start-1' : 'md:col-start-2'}`}>
                {section.items.map((item) => (
                  <EditorialCard
                    key={item.id}
                    item={item}
                    size="hero"
                    onItemClick={() => onItemClick(item)}
                    onLinkClick={onLinkClick}
                  />
                ))}
              </div>
            </div>
          );
        }

        // Grid section
        return (
          <div
            key={`grid-${idx}`}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {section.items.map((item) => (
              <EditorialCard
                key={item.id}
                item={item}
                size="compact"
                onItemClick={() => onItemClick(item)}
                onLinkClick={onLinkClick}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
