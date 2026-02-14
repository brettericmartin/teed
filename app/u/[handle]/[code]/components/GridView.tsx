'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { BagViewItem } from '@/lib/types/bagViewTypes';

interface GridViewProps {
  items: BagViewItem[];
  heroItemId: string | null;
  onItemClick: (item: BagViewItem) => void;
  onLinkClick: (linkId: string, itemId: string, url: string) => void;
}

function GridCard({
  item,
  isHero,
  onItemClick,
  onLinkClick,
}: {
  item: BagViewItem;
  isHero: boolean;
  onItemClick: () => void;
  onLinkClick: (linkId: string, itemId: string, url: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

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
      { ring: 'ring-[var(--teed-green-6)]', button: 'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)]', text: 'text-[var(--teed-green-11)]' },
      { ring: 'ring-[var(--sky-6)]', button: 'bg-[var(--sky-9)] hover:bg-[var(--sky-10)]', text: 'text-[var(--sky-11)]' },
      { ring: 'ring-[var(--sand-6)]', button: 'bg-[var(--sand-9)] hover:bg-[var(--sand-10)]', text: 'text-[var(--sand-11)]' },
      { ring: 'ring-[var(--copper-6)]', button: 'bg-[var(--copper-8)] hover:bg-[var(--copper-9)]', text: 'text-[var(--copper-11)]' },
      { ring: 'ring-[var(--evergreen-6)]', button: 'bg-[var(--evergreen-9)] hover:bg-[var(--evergreen-10)]', text: 'text-[var(--evergreen-11)]' },
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const cardColor = getCardAccent(item.id);
  const primaryLink = item.links.find(l => l.kind === 'product') || item.links[0];

  const getLinkCTA = (link: typeof primaryLink) => {
    if (!link) return 'Shop Now';
    const url = link.url.toLowerCase();
    const videoPatterns = ['youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv', 'tiktok.com', 'vm.tiktok.com'];
    if (link.kind === 'video' || link.kind === 'youtube' || videoPatterns.some(p => url.includes(p))) {
      return 'Watch Now';
    }
    if (link.kind === 'article' || url.includes('medium.com') || url.includes('substack.com')) {
      return 'Read Now';
    }
    return 'Shop Now';
  };

  return (
    <article
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl ring-1 ${cardColor.ring} transition-all duration-300 hover:-translate-y-1`}>
        {/* Image - fixed square aspect ratio for uniform grid */}
        <div
          className="relative aspect-square cursor-pointer overflow-hidden bg-gradient-to-br from-gray-50 to-slate-100"
          onClick={onItemClick}
        >
          {item.photo_url ? (
            <img
              src={item.photo_url}
              alt={item.custom_name || 'Item'}
              className="w-full h-full object-contain group-hover:scale-[1.05] transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-gray-200">
              <span className="text-slate-400 text-4xl font-light">?</span>
            </div>
          )}

          {/* Quantity badge */}
          {item.quantity > 1 && (
            <div className={`absolute top-3 left-3 px-2.5 py-1 ${cardColor.button} text-white text-xs font-bold rounded-full shadow-lg`}>
              ×{item.quantity}
            </div>
          )}

          {/* Featured badge */}
          {(isHero || item.is_featured) && (
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
              {isHero ? 'Hero' : 'Featured'}
            </div>
          )}

          {/* Hover overlay with link */}
          {primaryLink && (
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end justify-center pb-4 transition-opacity duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <a
                href={primaryLink.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  onLinkClick(primaryLink.id, item.id, primaryLink.url);
                }}
                className={`px-5 py-2.5 ${cardColor.button} text-white rounded-full text-sm font-semibold shadow-lg transition-transform hover:scale-105 flex items-center gap-2`}
              >
                <span>{getLinkCTA(primaryLink)}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 bg-gradient-to-b from-white to-slate-50">
          {/* Brand */}
          {item.brand && (
            <p className={`text-[11px] uppercase tracking-wider ${cardColor.text} mb-1 font-bold`}>
              {item.brand}
            </p>
          )}

          {/* Name */}
          <h3
            className="text-sm font-bold text-gray-900 leading-snug cursor-pointer hover:text-gray-700 transition-colors line-clamp-2"
            onClick={onItemClick}
          >
            {item.custom_name || 'Untitled'}
          </h3>
        </div>
      </div>
    </article>
  );
}

export function GridView({
  items,
  heroItemId,
  onItemClick,
  onLinkClick,
}: GridViewProps) {
  // Sort items: hero first, then featured, then rest by sort_index
  const sortedItems = [...items].sort((a, b) => {
    if (a.id === heroItemId) return -1;
    if (b.id === heroItemId) return 1;
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return a.sort_index - b.sort_index;
  });

  return (
    <div className="bg-gradient-to-br from-slate-100 via-gray-50 to-stone-100 rounded-3xl p-5 md:p-8 shadow-inner">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {sortedItems.map((item) => (
          <GridCard
            key={item.id}
            item={item}
            isHero={item.id === heroItemId}
            onItemClick={() => onItemClick(item)}
            onLinkClick={onLinkClick}
          />
        ))}
      </div>
    </div>
  );
}
