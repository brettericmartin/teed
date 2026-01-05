'use client';

import { ReactNode } from 'react';
import { Pencil, Package, Sparkles, Link2, MessageSquare, Music, Type } from 'lucide-react';
import { BlockType } from '@/lib/blocks/types';

type SectionType = 'collections' | 'links' | 'about' | 'featured' | 'embed' | 'custom';

interface BlockContainerProps {
  children: ReactNode;
  blockId: string;
  blockType: BlockType;
  title?: string;
  showTitle?: boolean; // From config, defaults to true
  isOwner?: boolean;
  onEdit?: (blockId: string) => void;
  count?: number;
}

// Default titles for each block type
const DEFAULT_TITLES: Partial<Record<BlockType, string>> = {
  bio: 'About',
  social_links: 'Connect',
  featured_bags: 'Collections',
  embed: 'Featured',
  destinations: 'Destinations',
  custom_text: '',
};

// Map block types to section types for icons
const BLOCK_TO_SECTION: Partial<Record<BlockType, SectionType>> = {
  bio: 'about',
  social_links: 'links',
  featured_bags: 'collections',
  embed: 'embed',
  destinations: 'links',
  custom_text: 'custom',
};

const SECTION_ICONS: Record<SectionType, React.ComponentType<{ className?: string }>> = {
  collections: Package,
  links: Link2,
  about: MessageSquare,
  featured: Sparkles,
  embed: Music,
  custom: Type,
};

export default function BlockContainer({
  children,
  blockId,
  blockType,
  title,
  showTitle = true, // defaults to true, can be set to false via config
  isOwner = false,
  onEdit,
  count,
}: BlockContainerProps) {
  // Don't show container for header, spacer, divider, or custom_text blocks
  const skipContainer = ['header', 'spacer', 'divider', 'custom_text'].includes(blockType);

  if (skipContainer) {
    return <>{children}</>;
  }

  const displayTitle = title || DEFAULT_TITLES[blockType] || '';
  const sectionType = BLOCK_TO_SECTION[blockType] || 'custom';
  const Icon = SECTION_ICONS[sectionType];

  // Respect showTitle setting - if false, hide the title section
  const shouldShowTitle = showTitle !== false && displayTitle;

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(blockId);
    }
  };

  return (
    <div className="block-container relative group/block h-full">
      {/* Soft floating container */}
      <div className="bg-[var(--surface)]/60 backdrop-blur-sm rounded-2xl border border-[var(--border-subtle)]/50 shadow-sm overflow-hidden h-full flex flex-col">
        {/* Section header with title */}
        {shouldShowTitle && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Icon container */}
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--theme-primary, var(--teed-green-7))', opacity: 0.15 }}
                >
                  <span style={{ color: 'var(--theme-primary, var(--teed-green-9))' }}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                </div>
                {/* Title */}
                <h3 className="text-sm font-semibold text-[var(--theme-text-secondary,var(--text-secondary))]">
                  {displayTitle}
                </h3>
                {/* Count badge */}
                {count !== undefined && count > 0 && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: 'var(--theme-primary, var(--teed-green-7))',
                      color: 'white',
                      opacity: 0.9,
                    }}
                  >
                    {count}
                  </span>
                )}
              </div>

              {/* Edit pencil for owners */}
              {isOwner && onEdit && (
                <button
                  onClick={handleEditClick}
                  className="
                    opacity-0 group-hover/block:opacity-100
                    w-7 h-7 rounded-full
                    bg-[var(--surface-hover)] hover:bg-[var(--teed-green-3)]
                    flex items-center justify-center
                    text-[var(--text-tertiary)] hover:text-[var(--teed-green-9)]
                    transition-all duration-200
                    border border-transparent hover:border-[var(--teed-green-6)]
                  "
                  title="Edit block"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Block content - flex-1 to fill remaining height */}
        <div className={`flex-1 flex flex-col ${shouldShowTitle ? 'pt-0' : ''}`}>
          {children}
        </div>
      </div>

      {/* Owner-only persistent edit button (always visible on mobile, hover on desktop) */}
      {isOwner && onEdit && !shouldShowTitle && (
        <button
          onClick={handleEditClick}
          className="
            absolute top-2 right-2 z-10
            opacity-60 hover:opacity-100 sm:opacity-0 sm:group-hover/block:opacity-100
            w-7 h-7 rounded-full
            bg-[var(--surface)] hover:bg-[var(--teed-green-3)]
            flex items-center justify-center
            text-[var(--text-tertiary)] hover:text-[var(--teed-green-9)]
            transition-all duration-200
            shadow-sm border border-[var(--border-subtle)]
          "
          title="Edit block"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
