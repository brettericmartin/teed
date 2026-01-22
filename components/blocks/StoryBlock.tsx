'use client';

import { StoryBlockConfig } from '@/lib/blocks/types';
import StoryTimeline from '@/components/story/StoryTimeline';

interface Bag {
  id: string;
  code: string;
  title: string;
}

interface StoryBlockProps {
  profileId: string;
  bags?: Bag[];
  config?: StoryBlockConfig;
  isOwner?: boolean;
  onItemClick?: (bagCode: string, itemId?: string) => void;
}

/**
 * StoryBlock - Dashboard block wrapper for "The Story" timeline feature.
 *
 * DOCTRINE: Narrative framing, positions changes as curator's journey.
 * - Uses month/year timestamps only (no "days ago" freshness pressure)
 * - Neutral colors for removals (no red/urgent)
 * - "The Story" language instead of "History" or "Changelog"
 */
export default function StoryBlock({
  profileId,
  bags = [],
  config = {},
  isOwner = false,
  onItemClick,
}: StoryBlockProps) {
  const {
    maxItems = 5,
    showFiltersBar = true,
    groupByTimePeriod = true,
    showProfileChanges = true,
    showBagChanges = true,
  } = config;

  // Handle clicking on a bag-related event
  const handleBagClick = (bagCode: string) => {
    onItemClick?.(bagCode);
  };

  // Handle clicking on an item within a bag
  const handleItemClick = (entry: any) => {
    // If entry has a bagCode, we can navigate to it
    if (entry.details?.bagCode) {
      onItemClick?.(entry.details.bagCode, entry.details.entityId);
    }
  };

  return (
    <div className="h-full flex flex-col py-2 px-4">
      <StoryTimeline
        profileId={profileId}
        maxItems={maxItems}
        showFilters={showFiltersBar}
        groupByTimePeriod={groupByTimePeriod}
        isOwner={isOwner}
        onItemClick={handleItemClick}
        onBagClick={handleBagClick}
      />
    </div>
  );
}
