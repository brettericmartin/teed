'use client';

import { Package, Lock, Star } from 'lucide-react';
import Link from 'next/link';

// Types
export interface BagItem {
  id: string;
  custom_name: string | null;
  photo_url: string | null;
  is_featured: boolean;
  featured_position: number | null;
}

export interface BagOwner {
  id?: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
}

export interface Bag {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  background_image?: string | null;
  is_public: boolean;
  category?: string | null;
  items?: BagItem[];
  owner?: BagOwner;
}

export interface BagCardProps {
  bag: Bag;
  size?: 'thumbnail' | 'standard' | 'showcase';
  showOwnerBadge?: boolean;
  showFeaturedStar?: boolean;
  isFeaturedOnProfile?: boolean;
  isOwner?: boolean;
  onToggleFeatured?: (bagId: string) => void;
  onClick?: () => void;
}

// Constants
const PLACEHOLDER_COLORS = [
  'bg-[var(--copper-2)]',
  'bg-[var(--sky-2)]',
  'bg-[var(--sand-2)]',
];

const GRADIENT_OPTIONS = [
  'from-[var(--teed-green-6)] to-[var(--sky-6)]',
  'from-[var(--copper-4)] to-[var(--sky-5)]',
  'from-[var(--sand-5)] to-[var(--copper-5)]',
  'from-[var(--sky-5)] to-[var(--teed-green-5)]',
  'from-[var(--evergreen-6)] to-[var(--teed-green-6)]',
];

const SIZE_CONFIG = {
  thumbnail: {
    cardHeight: 'h-[100px] sm:h-[120px]',
    infoSection: 'p-2',
    titleSize: 'text-xs sm:text-sm',
    showDescription: false,
  },
  standard: {
    cardHeight: 'h-[140px] sm:h-[180px]',
    infoSection: 'p-2 sm:p-3',
    titleSize: 'text-sm sm:text-base',
    showDescription: true,
  },
  showcase: {
    cardHeight: 'h-[220px] sm:h-[260px]',
    infoSection: 'p-4',
    titleSize: 'text-lg',
    showDescription: true,
  },
};

// Helper functions
const getPlaceholderColor = (index: number) => PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];

export const getBagGradient = (bagId: string) => {
  let hash = 0;
  for (let i = 0; i < bagId.length; i++) {
    hash = ((hash << 5) - hash) + bagId.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % GRADIENT_OPTIONS.length;
  return GRADIENT_OPTIONS[index];
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function BagCard({
  bag,
  size = 'standard',
  showOwnerBadge = false,
  showFeaturedStar = false,
  isFeaturedOnProfile = false,
  isOwner = false,
  onToggleFeatured,
  onClick,
}: BagCardProps) {
  const sizeConfig = SIZE_CONFIG[size];

  // Process items for display
  const allItemsWithPhotos = bag.items?.filter(item => item.photo_url) || [];
  const featuredItems = allItemsWithPhotos
    .filter(item => item.is_featured)
    .sort((a, b) => (a.featured_position || 0) - (b.featured_position || 0));
  const nonFeaturedItems = allItemsWithPhotos.filter(item => !item.is_featured);
  const hasBagPhoto = !!bag.background_image;

  // Determine which layout to use
  const renderCoverContent = () => {
    if (hasBagPhoto && allItemsWithPhotos.length > 0) {
      // Layout 1: Bag photo (2x2) + up to 6 item photos
      const itemsToShow = [...featuredItems, ...nonFeaturedItems].slice(0, 6);
      return (
        <>
          <div className="grid grid-cols-4 grid-rows-3 gap-1.5 p-2 h-full">
            <div className="col-span-2 row-span-2 relative bg-white rounded-lg overflow-hidden shadow-sm">
              <img src={bag.background_image!} alt={bag.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
            {itemsToShow.map((item) => (
              <div key={item.id} className="relative bg-white rounded overflow-hidden shadow-sm">
                <img src={item.photo_url!} alt={item.custom_name || 'Item'} className="w-full h-full object-contain" loading="lazy" />
              </div>
            ))}
            {Array.from({ length: Math.max(0, 6 - itemsToShow.length) }).map((_, i) => (
              <div key={`placeholder-${i}`} className={`${getPlaceholderColor(i)} rounded opacity-40`}></div>
            ))}
          </div>
          {bag.description && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-sm font-medium line-clamp-3 drop-shadow-lg">{bag.description}</p>
              </div>
            </div>
          )}
        </>
      );
    } else if (allItemsWithPhotos.length > 0) {
      // Layout 2: No bag photo - show up to 8 item photos
      const itemsToShow = [...featuredItems, ...nonFeaturedItems].slice(0, 8);
      return (
        <>
          <div className="grid grid-cols-4 gap-1.5 p-2 h-full">
            {itemsToShow.map((item) => (
              <div key={item.id} className="relative bg-white rounded overflow-hidden shadow-sm">
                <img src={item.photo_url!} alt={item.custom_name || 'Item'} className="w-full h-full object-contain" loading="lazy" />
              </div>
            ))}
            {Array.from({ length: Math.max(0, 8 - itemsToShow.length) }).map((_, i) => (
              <div key={`placeholder-${i}`} className={`${getPlaceholderColor(i)} rounded opacity-40`}></div>
            ))}
          </div>
          {bag.description && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-sm font-medium line-clamp-3 drop-shadow-lg">{bag.description}</p>
              </div>
            </div>
          )}
        </>
      );
    } else if (bag.background_image) {
      // Layout 3: Only bag photo, no items
      return (
        <>
          <img src={bag.background_image} alt={bag.title} className="w-full h-full object-cover" loading="lazy" />
          {bag.description && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-sm font-medium line-clamp-3 drop-shadow-lg">{bag.description}</p>
              </div>
            </div>
          )}
        </>
      );
    } else {
      // Layout 4: No photos at all - placeholder
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="w-16 h-16 text-[var(--evergreen-12)] opacity-20" />
        </div>
      );
    }
  };

  return (
    <div
      onClick={onClick}
      className="gallery-frame bg-[var(--surface)] overflow-hidden cursor-pointer group"
    >
      {/* Cover Image */}
      <div
        className={`${sizeConfig.cardHeight} relative overflow-hidden bg-gradient-to-br ${getBagGradient(bag.id)}`}
      >
        {/* Featured star */}
        {showFeaturedStar && (isFeaturedOnProfile || (isOwner && onToggleFeatured)) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isOwner && onToggleFeatured) {
                onToggleFeatured(bag.id);
              }
            }}
            disabled={!isOwner || !onToggleFeatured}
            className={`
              absolute top-2 left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center
              transition-all duration-200 shadow-md
              ${isFeaturedOnProfile
                ? 'bg-[var(--sand-8)]'
                : 'bg-black/40 hover:bg-[var(--sand-8)]'
              }
              ${isOwner && onToggleFeatured ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
            `}
            title={isOwner && onToggleFeatured
              ? (isFeaturedOnProfile ? 'Remove from featured' : 'Add to featured')
              : 'Featured collection'
            }
          >
            <Star
              className={`w-4 h-4 transition-all ${
                isFeaturedOnProfile
                  ? 'text-white fill-white'
                  : 'text-white/70 hover:text-white hover:fill-white'
              }`}
            />
          </button>
        )}

        {/* Private indicator */}
        {!bag.is_public && isOwner && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-white text-xs">
            <Lock className="w-3 h-3" />
            <span>Private</span>
          </div>
        )}

        {/* Cover content */}
        {renderCoverContent()}

        {/* Owner Badge */}
        {showOwnerBadge && bag.owner && (
          <Link
            href={`/u/${bag.owner.handle}`}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1.5 shadow-sm hover:bg-white transition-colors group/owner z-10"
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
        )}
      </div>

      {/* Bag Info */}
      <div className={sizeConfig.infoSection}>
        <h3 className={`${sizeConfig.titleSize} font-semibold text-[var(--theme-text,var(--text-primary))] group-hover:text-[var(--theme-primary,var(--teed-green-9))] transition-colors line-clamp-1 mb-1`}>
          {bag.title}
        </h3>
        {sizeConfig.showDescription && bag.description && size === 'showcase' && (
          <p className="text-sm text-[var(--theme-text-secondary,var(--text-secondary))] line-clamp-2 mb-2">
            {bag.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-[var(--theme-text-tertiary,var(--text-tertiary))]">
          <span className="flex items-center gap-1 text-[var(--theme-primary,var(--teed-green-10))]">
            <Package className="w-3.5 h-3.5" />
            <span className="font-medium">{bag.items?.length || 0}</span>
          </span>
          <span className="text-[var(--theme-text-secondary,var(--text-secondary))]">/{bag.code}</span>
        </div>
      </div>
    </div>
  );
}
