'use client';

import { useRef, useState, useCallback } from 'react';
import { ChevronDown, Package } from 'lucide-react';
import Link from 'next/link';

// Types
export interface BagItem {
  id: string;
  custom_name: string | null;
  brand: string | null;
  custom_description: string | null;
  photo_url: string | null;
  is_featured: boolean;
  featured_position: number | null;
  sort_index: number;
  links: Array<{
    id: string;
    url: string;
    kind: string;
    label: string | null;
  }>;
}

export interface BagOwner {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
}

export interface FeaturedBag {
  id: string;
  code: string;
  title: string;
  description: string | null;
  is_public: boolean;
  background_image: string | null;
  category: string | null;
  tags: string[];
  created_at: string;
  item_count: number;
  items: BagItem[];
  owner: BagOwner;
}

interface FeaturedBagCardProps {
  bag: FeaturedBag;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

// Gradient options (same as DiscoverClient)
const GRADIENT_OPTIONS = [
  'from-[var(--teed-green-6)] to-[var(--sky-6)]',
  'from-[var(--copper-4)] to-[var(--sky-5)]',
  'from-[var(--sand-5)] to-[var(--copper-5)]',
  'from-[var(--sky-5)] to-[var(--teed-green-5)]',
  'from-[var(--evergreen-6)] to-[var(--teed-green-6)]',
];

const getBagGradient = (bagId: string) => {
  let hash = 0;
  for (let i = 0; i < bagId.length; i++) {
    hash = ((hash << 5) - hash) + bagId.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % GRADIENT_OPTIONS.length;
  return GRADIENT_OPTIONS[index];
};

const PLACEHOLDER_COLORS = [
  'bg-[var(--copper-2)]',
  'bg-[var(--sky-2)]',
  'bg-[var(--sand-2)]',
];

const getPlaceholderColor = (index: number) => {
  return PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Category colors
const getCategoryColor = (categoryValue: string) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    golf: { bg: 'bg-[var(--teed-green-8)]', text: 'text-white' },
    outdoor: { bg: 'bg-[var(--evergreen-9)]', text: 'text-white' },
    travel: { bg: 'bg-[var(--sky-6)]', text: 'text-white' },
    tech: { bg: 'bg-[var(--sky-7)]', text: 'text-white' },
    fashion: { bg: 'bg-[var(--copper-7)]', text: 'text-white' },
    fitness: { bg: 'bg-[var(--copper-8)]', text: 'text-white' },
    gaming: { bg: 'bg-[var(--copper-6)]', text: 'text-white' },
    photography: { bg: 'bg-[var(--sand-9)]', text: 'text-white' },
    music: { bg: 'bg-[var(--sand-8)]', text: 'text-white' },
    other: { bg: 'bg-[var(--grey-7)]', text: 'text-white' },
  };
  return colorMap[categoryValue] || { bg: 'bg-[var(--teed-green-8)]', text: 'text-white' };
};

const CATEGORIES: Record<string, string> = {
  golf: '⛳',
  travel: '✈️',
  outdoor: '🏔️',
  tech: '💻',
  fashion: '👔',
  fitness: '💪',
  photography: '📷',
  gaming: '🎮',
  music: '🎵',
  other: '📦',
};

function useTiltEffect() {
  const [tiltStyle, setTiltStyle] = useState({
    transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)',
  });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * 10; // ±5°
    const rotateY = (x - 0.5) * 10; // ±5°

    setTiltStyle({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
    });
    setGlowPos({ x: x * 100, y: y * 100 });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setTiltStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)',
    });
  }, []);

  return { ref, tiltStyle, glowPos, isHovering, handleMouseMove, handleMouseEnter, handleMouseLeave };
}

export default function FeaturedBagCard({ bag, isExpanded, onToggleExpand }: FeaturedBagCardProps) {
  const { ref: tiltRef, tiltStyle, glowPos, isHovering, handleMouseMove, handleMouseEnter, handleMouseLeave } = useTiltEffect();

  // Get all items with photos
  const allItemsWithPhotos = bag.items?.filter(item => item.photo_url) || [];

  // Prioritize featured items
  const featuredItems = allItemsWithPhotos
    .filter(item => item.is_featured)
    .sort((a, b) => (a.featured_position || 0) - (b.featured_position || 0));
  const nonFeaturedItems = allItemsWithPhotos.filter(item => !item.is_featured);

  const hasBagPhoto = !!bag.background_image;

  const renderHeroContent = () => {
    if (hasBagPhoto && allItemsWithPhotos.length > 0) {
      // Layout 1: Bag photo as hero + up to 6 item photos
      const itemsToShow = [...featuredItems, ...nonFeaturedItems].slice(0, 6);
      return (
        <div className="grid grid-cols-4 grid-rows-3 gap-1.5 p-2 h-full">
          {/* Hero: Bag photo (2x2 space) */}
          <div className="col-span-2 row-span-2 relative bg-white rounded-lg overflow-hidden shadow-sm">
            <img
              src={bag.background_image!}
              alt={bag.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Item photos (6 smaller tiles) */}
          {itemsToShow.map((item) => (
            <div key={item.id} className="relative bg-white rounded overflow-hidden shadow-sm">
              <img
                src={item.photo_url!}
                alt={item.custom_name || 'Item'}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
          ))}

          {/* Fill empty slots with placeholders */}
          {Array.from({ length: Math.max(0, 6 - itemsToShow.length) }).map((_, i) => (
            <div key={`placeholder-${i}`} className={`${getPlaceholderColor(i)} rounded opacity-40`}></div>
          ))}
        </div>
      );
    } else if (allItemsWithPhotos.length > 0) {
      // Layout 2: No bag photo, show up to 8 equal-sized item photos
      const itemsToShow = [...featuredItems, ...nonFeaturedItems].slice(0, 8);
      return (
        <div className="grid grid-cols-4 gap-1.5 p-2 h-full">
          {itemsToShow.map((item) => (
            <div key={item.id} className="relative bg-white rounded overflow-hidden shadow-sm">
              <img
                src={item.photo_url!}
                alt={item.custom_name || 'Item'}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
          ))}

          {/* Fill empty slots with placeholders */}
          {Array.from({ length: Math.max(0, 8 - itemsToShow.length) }).map((_, i) => (
            <div key={`placeholder-${i}`} className={`${getPlaceholderColor(i)} rounded opacity-40`}></div>
          ))}
        </div>
      );
    } else if (bag.background_image) {
      // Layout 3: Only bag photo, no items
      return (
        <img
          src={bag.background_image}
          alt={bag.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      );
    } else {
      // Layout 4: No photos at all, show placeholder
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="w-16 h-16 text-[var(--evergreen-12)] opacity-20" />
        </div>
      );
    }
  };

  return (
    <div
      ref={tiltRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...tiltStyle,
        transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      className={`bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] border overflow-hidden ${
        isExpanded
          ? 'ring-2 ring-[var(--teed-green-6)] border-[var(--teed-green-6)] shadow-[var(--shadow-5)]'
          : 'border-[var(--border-subtle)] hover:shadow-[var(--shadow-4)]'
      }`}
    >
      {/* Cover Image / Featured Items Grid */}
      <div
        onClick={onToggleExpand}
        title={isExpanded ? "Click to collapse" : "Click to expand"}
        className={`h-[200px] bg-gradient-to-br ${getBagGradient(bag.id)} relative overflow-hidden cursor-pointer border-b border-[var(--border-subtle)] group`}
      >
        {renderHeroContent()}

        {/* Light reflection overlay on hover */}
        {isHovering && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{
              background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
            }}
          />
        )}

        {/* Hover overlay with description */}
        {bag.description && !isExpanded && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white text-sm font-medium line-clamp-3 drop-shadow-lg">
                {bag.description}
              </p>
            </div>
          </div>
        )}

        {/* Owner Badge (bottom-left) */}
        <Link
          href={`/u/${bag.owner.handle}`}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1.5 shadow-sm hover:bg-white transition-colors group/owner"
        >
          {bag.owner.avatar_url ? (
            <img
              src={bag.owner.avatar_url}
              alt={bag.owner.display_name}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--teed-green-7)] to-[var(--teed-green-9)] flex items-center justify-center text-white text-[10px] font-medium">
              {getInitials(bag.owner.display_name)}
            </div>
          )}
          <span className="text-xs font-medium text-[var(--text-primary)] group-hover/owner:text-[var(--teed-green-9)] transition-colors max-w-[120px] truncate">
            {bag.owner.display_name}
          </span>
        </Link>

        {/* Expand indicator (bottom-right) */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
          <ChevronDown
            className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Bag Info */}
      <div
        className="p-4 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-xl font-semibold text-[var(--text-primary)] line-clamp-1 flex-1"
          >
            {bag.title}
          </h3>
          {/* Category Badge */}
          {bag.category && (
            <span className={`flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-medium ${getCategoryColor(bag.category).bg} ${getCategoryColor(bag.category).text}`}>
              {CATEGORIES[bag.category] || '📦'}
            </span>
          )}
        </div>

        {/* Item count - directly below title */}
        <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mt-1">
          <span className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            {bag.item_count} {bag.item_count === 1 ? 'item' : 'items'}
          </span>
          <span className="font-medium text-[var(--text-secondary)]">/{bag.code}</span>
        </div>

        {/* Click to expand hint - always visible */}
        <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] text-center">
          <span className="text-xs text-[var(--teed-green-9)] font-medium">
            {isExpanded ? '↑ Click to collapse' : '↓ Click to see items'}
          </span>
        </div>
      </div>
    </div>
  );
}
