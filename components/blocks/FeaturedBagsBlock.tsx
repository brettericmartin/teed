'use client';

import { useState } from 'react';
import { Package, ChevronDown, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FeaturedBagsBlockConfig } from '@/lib/blocks/types';
import { BagCard, Bag } from '@/components/bags';
import CollectionsModal from './CollectionsModal';

// Grid config for collapsed view based on size
const SIZE_GRID_CONFIG = {
  thumbnail: 'grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4',
  standard: 'grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3',
  showcase: 'grid-cols-1 gap-6 sm:grid-cols-2',
};

interface FeaturedBagsBlockProps {
  bags: Bag[];
  handle: string;
  config?: FeaturedBagsBlockConfig;
  isOwner?: boolean;
  onToggleFeatured?: (bagId: string) => void;
}

export default function FeaturedBagsBlock({
  bags,
  handle,
  config = {},
  isOwner = false,
  onToggleFeatured,
}: FeaturedBagsBlockProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPrivate, setShowPrivate] = useState(true);
  const { bag_ids, max_display = 6, size = 'standard' } = config;
  const gridConfig = SIZE_GRID_CONFIG[size] || SIZE_GRID_CONFIG.standard;

  const isFeaturedOnProfile = (bagId: string) => bag_ids && bag_ids.includes(bagId);

  const hasPrivateBags = isOwner && bags.some(b => !b.is_public);
  const visibleBags = showPrivate ? bags : bags.filter(b => b.is_public);

  // Sort bags: featured first (by position in bag_ids), then others
  const sortedBags = [...visibleBags];
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

  const totalBags = sortedBags.length;
  // Cap inline display at 9 — show the rest via the modal
  const effectiveDisplay = Math.min(max_display, 9);
  const displayBags = sortedBags.slice(0, effectiveDisplay);
  const hasMoreBags = totalBags > effectiveDisplay;

  const handleBagClick = (bag: Bag) => {
    if (isOwner) {
      router.push(`/u/${handle}/${bag.code}/edit`);
    } else {
      router.push(`/u/${handle}/${bag.code}`);
    }
  };

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

  return (
    <>
      {/* Collapsed view - fits within grid cell */}
      <div className="px-4 py-4 h-full flex flex-col relative">
        {/* Visitor preview toggle — floated up into the header row */}
        {hasPrivateBags && (
          <button
            onClick={() => setShowPrivate(!showPrivate)}
            className={`
              absolute -top-9 right-4 z-10
              flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all
              ${showPrivate
                ? 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--teed-green-6)]'
                : 'bg-[var(--sky-2)] text-[var(--sky-11)] border border-[var(--sky-6)]'
              }
            `}
          >
            {showPrivate ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {showPrivate ? 'All' : 'Visitor view'}
          </button>
        )}

        {/* Grid of bags */}
        <div className="flex-1 min-h-0">
          <div className={`grid ${gridConfig}`}>
            {displayBags.map((bag) => (
              <BagCard
                key={bag.id}
                bag={bag}
                size={size}
                showFeaturedStar
                isFeaturedOnProfile={isFeaturedOnProfile(bag.id)}
                isOwner={isOwner}
                onToggleFeatured={onToggleFeatured}
                onClick={() => handleBagClick(bag)}
              />
            ))}
          </div>
        </div>

        {/* Expand button */}
        {hasMoreBags && (
          <div className="mt-3 flex justify-center flex-shrink-0">
            <button
              onClick={() => setIsExpanded(true)}
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
              <span>Show all {totalBags} collections</span>
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* Collections Modal - rendered via portal */}
      <CollectionsModal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        bags={sortedBags}
        handle={handle}
        isOwner={isOwner}
        featuredBagIds={bag_ids || []}
        onToggleFeatured={onToggleFeatured}
      />
    </>
  );
}
