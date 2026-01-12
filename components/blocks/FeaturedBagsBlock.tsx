'use client';

import { useState } from 'react';
import { Package, Lock, ChevronDown, ChevronUp, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FeaturedBagsBlockConfig } from '@/lib/blocks/types';

interface BagItem {
  id: string;
  custom_name: string | null;
  photo_url: string | null;
  is_featured: boolean;
  featured_position: number | null;
}

interface Bag {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  background_image?: string | null;
  is_public: boolean;
  category?: string | null;
  items?: BagItem[];
}

interface FeaturedBagsBlockProps {
  bags: Bag[];
  handle: string;
  config?: FeaturedBagsBlockConfig;
  isOwner?: boolean;
  onToggleFeatured?: (bagId: string) => void;
}

// Gradient uses theme primary/accent colors via inline styles
// No static gradient options needed - theme colors applied dynamically

const PLACEHOLDER_COLORS = [
  'bg-[var(--copper-2)]',
  'bg-[var(--sky-2)]',
  'bg-[var(--sand-2)]',
];

const getPlaceholderColor = (index: number) => PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];

// Size-specific styling
const SIZE_CONFIG = {
  thumbnail: {
    grid: 'grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4',
    cardHeight: 'h-[120px]',
    infoSection: 'p-2',
    titleSize: 'text-sm',
    showDescription: false,
    maxCols: 4,
  },
  standard: {
    grid: 'grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3',
    cardHeight: 'h-[180px]',
    infoSection: 'p-3',
    titleSize: 'text-base',
    showDescription: true,
    maxCols: 3,
  },
  showcase: {
    grid: 'grid-cols-1 gap-6 sm:grid-cols-2',
    cardHeight: 'h-[220px] sm:h-[260px]',
    infoSection: 'p-4',
    titleSize: 'text-lg',
    showDescription: true,
    maxCols: 2,
  },
};

export default function FeaturedBagsBlock({
  bags,
  handle,
  config = {},
  isOwner = false,
  onToggleFeatured,
}: FeaturedBagsBlockProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const { bag_ids, max_display = 6, size = 'standard' } = config;
  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.standard;

  // Check if a bag is featured on profile
  const isFeaturedOnProfile = (bagId: string) => {
    return bag_ids && bag_ids.includes(bagId);
  };

  // Sort bags: featured first (by position in bag_ids), then others
  let sortedBags = [...bags];
  if (bag_ids && bag_ids.length > 0) {
    sortedBags.sort((a, b) => {
      const aFeatured = bag_ids.includes(a.id);
      const bFeatured = bag_ids.includes(b.id);
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      if (aFeatured && bFeatured) {
        return bag_ids.indexOf(a.id) - bag_ids.indexOf(b.id);
      }
      return 0;
    });
  }

  // Determine how many to show based on expansion state
  const totalBags = sortedBags.length;
  const hasMoreBags = totalBags > max_display;
  const displayBags = isExpanded ? sortedBags : sortedBags.slice(0, max_display);

  if (displayBags.length === 0) {
    if (isOwner) {
      return (
        <div className="px-4 py-8 h-full flex flex-col justify-center">
          <div className="text-center py-12 bg-[var(--surface-elevated)] rounded-xl border border-dashed border-[var(--border-subtle)]">
            <Package className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-[var(--text-secondary)] mb-4">No bags yet</p>
            <Link
              href="/bags/new"
              className="inline-block px-4 py-2 bg-[var(--teed-green-9)] text-white rounded-lg font-medium hover:bg-[var(--teed-green-10)] transition-colors"
            >
              Create Your First Bag
            </Link>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleBagClick = (bag: Bag) => {
    if (isOwner) {
      router.push(`/u/${handle}/${bag.code}/edit`);
    } else {
      router.push(`/u/${handle}/${bag.code}`);
    }
  };

  return (
    <div
      className={`px-4 py-4 flex flex-col ${isExpanded ? 'bg-[var(--surface)] rounded-b-2xl' : 'h-full'}`}
      style={{ position: isExpanded ? 'relative' : undefined, zIndex: isExpanded ? 50 : undefined }}
    >
      {/* Grid with size-based styling */}
      <div className={`grid ${sizeConfig.grid} ${isExpanded ? '' : 'flex-1'}`}>
        {displayBags.map((bag) => {
          const allItemsWithPhotos = bag.items?.filter(item => item.photo_url) || [];
          const featuredItems = allItemsWithPhotos
            .filter(item => item.is_featured)
            .sort((a, b) => (a.featured_position || 0) - (b.featured_position || 0));
          const nonFeaturedItems = allItemsWithPhotos.filter(item => !item.is_featured);
          const hasBagPhoto = !!bag.background_image;

          return (
            <div
              key={bag.id}
              onClick={() => handleBagClick(bag)}
              className="gallery-frame bg-[var(--surface)] overflow-hidden cursor-pointer group"
            >
              {/* Cover Image - height based on size, uses theme primary/accent gradient */}
              <div
                className={`${sizeConfig.cardHeight} relative overflow-hidden`}
                style={{
                  background: `linear-gradient(to bottom right, var(--theme-primary, #7A9770), var(--theme-accent, #4A90A4))`
                }}
              >
                {/* Featured star - toggleable for owners, indicator for visitors */}
                {(isFeaturedOnProfile(bag.id) || (isOwner && onToggleFeatured)) && (
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
                      ${isFeaturedOnProfile(bag.id)
                        ? 'bg-[var(--sand-8)]'
                        : 'bg-black/40 hover:bg-[var(--sand-8)]'
                      }
                      ${isOwner && onToggleFeatured ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                    `}
                    title={isOwner && onToggleFeatured
                      ? (isFeaturedOnProfile(bag.id) ? 'Remove from featured' : 'Add to featured')
                      : 'Featured collection'
                    }
                  >
                    <Star
                      className={`w-4 h-4 transition-all ${
                        isFeaturedOnProfile(bag.id)
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

                {(() => {
                  if (hasBagPhoto && allItemsWithPhotos.length > 0) {
                    const itemsToShow = [...featuredItems, ...nonFeaturedItems].slice(0, 6);
                    return (
                      <>
                        <div className="grid grid-cols-4 grid-rows-3 gap-1.5 p-2 h-full">
                          <div className="col-span-2 row-span-2 relative bg-white rounded-lg overflow-hidden shadow-sm">
                            <img
                              src={bag.background_image!}
                              alt={bag.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
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
                          {Array.from({ length: Math.max(0, 6 - itemsToShow.length) }).map((_, i) => (
                            <div key={`placeholder-${i}`} className={`${getPlaceholderColor(i)} rounded opacity-40`}></div>
                          ))}
                        </div>
                        {bag.description && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="absolute bottom-3 left-3 right-3">
                              <p className="text-white text-sm font-medium line-clamp-3 drop-shadow-lg">
                                {bag.description}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  } else if (allItemsWithPhotos.length > 0) {
                    const itemsToShow = [...featuredItems, ...nonFeaturedItems].slice(0, 8);
                    return (
                      <>
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
                          {Array.from({ length: Math.max(0, 8 - itemsToShow.length) }).map((_, i) => (
                            <div key={`placeholder-${i}`} className={`${getPlaceholderColor(i)} rounded opacity-40`}></div>
                          ))}
                        </div>
                        {bag.description && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="absolute bottom-3 left-3 right-3">
                              <p className="text-white text-sm font-medium line-clamp-3 drop-shadow-lg">
                                {bag.description}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  } else if (bag.background_image) {
                    return (
                      <>
                        <img
                          src={bag.background_image}
                          alt={bag.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {bag.description && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="absolute bottom-3 left-3 right-3">
                              <p className="text-white text-sm font-medium line-clamp-3 drop-shadow-lg">
                                {bag.description}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  } else {
                    return (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-16 h-16 text-[var(--evergreen-12)] opacity-20" />
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Bag Info - size-based styling */}
              <div className={sizeConfig.infoSection}>
                <h3 className={`${sizeConfig.titleSize} font-semibold text-[var(--theme-text,var(--text-primary))] group-hover:text-[var(--theme-primary,var(--teed-green-9))] transition-colors line-clamp-1 mb-1`}>
                  {bag.title}
                </h3>
                {/* Show description in showcase mode */}
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
        })}
      </div>

      {/* Expand/Collapse button when there are more bags */}
      {hasMoreBags && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="
              flex items-center gap-2 px-4 py-2
              text-sm font-medium
              text-[var(--theme-text-secondary,var(--text-secondary))]
              hover:text-[var(--theme-primary,var(--teed-green-9))]
              bg-[var(--surface-hover,#f5f5f5)]
              hover:bg-[var(--surface-active,#eee)]
              rounded-full
              transition-all duration-200
              group
            "
          >
            {isExpanded ? (
              <>
                <span>Show less</span>
                <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              </>
            ) : (
              <>
                <span>Show all {totalBags} collections</span>
                <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
