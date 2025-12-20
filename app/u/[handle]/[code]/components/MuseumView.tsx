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

interface MuseumViewProps {
  items: Item[];
  heroItemId: string | null;
  onItemClick: (item: Item) => void;
  onLinkClick: (linkId: string, itemId: string, url: string) => void;
}

function MuseumCard({
  item,
  isHero,
  isFeatured,
  onItemClick,
  onLinkClick,
}: {
  item: Item;
  isHero: boolean;
  isFeatured: boolean;
  onItemClick: () => void;
  onLinkClick: (linkId: string, itemId: string, url: string) => void;
}) {
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getLinkDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'View';
    }
  };

  const truncateName = (name: string, maxLength: number = 40) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength).trim() + '…';
  };

  const hasNote = item.notes && item.notes.trim().length > 0;
  const notePreview = item.notes?.substring(0, 80) || '';
  const needsExpansion = (item.notes?.length || 0) > 80;

  return (
    <article
      className={`group relative ${
        isHero || isFeatured ? 'md:col-span-2' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div
        className="relative aspect-square cursor-pointer overflow-hidden rounded-lg"
        onClick={onItemClick}
      >
        {item.photo_url ? (
          <img
            src={item.photo_url}
            alt={item.custom_name || 'Item'}
            className="w-full h-full object-contain transition-all duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
            <span className="text-[#333] text-4xl">?</span>
          </div>
        )}

        {/* Subtle glow on hover - enhanced for premium feel */}
        <div
          className={`absolute inset-0 rounded-lg transition-all duration-500 pointer-events-none ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(74, 222, 128, 0.25), 0 0 40px rgba(74, 222, 128, 0.15), 0 0 80px rgba(74, 222, 128, 0.05)',
          }}
        />

        {/* Quantity badge - subtle glass effect */}
        {item.quantity > 1 && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white/[0.87] text-xs font-medium rounded-md">
            ×{item.quantity}
          </div>
        )}

        {/* Hero/Featured indicator - glowing accent */}
        {isHero && (
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#4ade80]/20 backdrop-blur-md text-[#4ade80] text-xs font-medium rounded-md shadow-[0_0_20px_rgba(74,222,128,0.3)]">
            Featured
          </div>
        )}

        {/* Links overlay - appears on hover with smooth glow */}
        {item.links.length > 0 && (
          <div
            className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-all duration-500 ${
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <div className="flex flex-wrap gap-2">
              {item.links.slice(0, 3).map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLinkClick(link.id, item.id, link.url);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/[0.87] bg-white/10 hover:bg-[#4ade80]/20 hover:text-[#4ade80] rounded-md backdrop-blur-sm transition-all duration-300"
                >
                  <span>{getLinkDomain(link.url)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Text Content - generous spacing */}
      <div className="mt-4 px-1">
        {/* Brand - 38% opacity (muted) */}
        {item.brand && (
          <p className="text-[10px] uppercase tracking-widest text-white/[0.38] mb-1.5 font-medium">
            {item.brand}
          </p>
        )}

        {/* Name - 87% opacity (high emphasis) */}
        <h3
          className="text-sm font-medium text-white/[0.87] leading-snug cursor-pointer hover:text-[#4ade80] transition-colors"
          onClick={onItemClick}
        >
          {truncateName(item.custom_name || 'Untitled')}
        </h3>

        {/* Curator Note - 60% opacity (medium emphasis), serif italic */}
        {hasNote && (
          <div className="mt-3">
            <p className="text-xs text-white/[0.60] italic leading-relaxed font-serif">
              "{isNoteExpanded ? item.notes : notePreview}
              {!isNoteExpanded && needsExpansion && '…'}"
            </p>
            {needsExpansion && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNoteExpanded(!isNoteExpanded);
                }}
                className="mt-2 text-[10px] text-[#4ade80] hover:text-[#6ee7a0] transition-colors flex items-center gap-1"
              >
                {isNoteExpanded ? (
                  <>
                    <span>Less</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>More</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function MuseumView({
  items,
  heroItemId,
  onItemClick,
  onLinkClick,
}: MuseumViewProps) {
  // Sort items: hero first, then featured, then rest
  const sortedItems = [...items].sort((a, b) => {
    if (a.id === heroItemId) return -1;
    if (b.id === heroItemId) return 1;
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  return (
    <div className="bg-[#121212] rounded-2xl p-8 md:p-12">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
        {sortedItems.map((item) => (
          <MuseumCard
            key={item.id}
            item={item}
            isHero={item.id === heroItemId}
            isFeatured={item.is_featured}
            onItemClick={() => onItemClick(item)}
            onLinkClick={onLinkClick}
          />
        ))}
      </div>
    </div>
  );
}
