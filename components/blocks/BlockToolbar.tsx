'use client';

import { useRef, useEffect, useState } from 'react';
import { Eye, EyeOff, Settings, Copy, Trash2, GripVertical } from 'lucide-react';
import { ProfileBlock, BlockType } from '@/lib/blocks/types';

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  header: 'Header',
  bio: 'Bio',
  social_links: 'Social Links',
  embed: 'Embed',
  featured_bags: 'Curations',
  custom_text: 'Text',
  spacer: 'Spacer',
  divider: 'Divider',
  destinations: 'Links',
  quote: 'Quote',
  affiliate_disclosure: 'Disclosure',
};

interface BlockToolbarProps {
  block: ProfileBlock;
  onToggleVisibility: () => void;
  onOpenSettings: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function BlockToolbar({
  block,
  onToggleVisibility,
  onOpenSettings,
  onDuplicate,
  onDelete,
}: BlockToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');

  // Smart positioning - flip to bottom if near top of viewport
  useEffect(() => {
    if (toolbarRef.current) {
      const rect = toolbarRef.current.getBoundingClientRect();
      if (rect.top < 80) {
        setPosition('bottom');
      } else {
        setPosition('top');
      }
    }
  }, []);

  const positionClasses = position === 'top'
    ? 'bottom-full mb-2'
    : 'top-full mt-2';

  return (
    <div
      ref={toolbarRef}
      className={`
        block-toolbar
        absolute left-1/2 -translate-x-1/2 ${positionClasses}
        bg-[var(--surface)] border border-[var(--border-subtle)]
        rounded-lg shadow-lg
        flex items-center p-1 gap-0.5
        z-50
        animate-in fade-in slide-in-from-bottom-2 duration-150
      `}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Drag Handle */}
      <button
        className="drag-handle p-2 rounded-md hover:bg-[var(--surface-hover)]
                   cursor-grab active:cursor-grabbing text-[var(--text-tertiary)]
                   transition-colors"
        title="Drag to reposition"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-[var(--border-subtle)] mx-0.5" />

      {/* Block Type Label */}
      <span className="px-2 py-1 text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
        {BLOCK_TYPE_LABELS[block.block_type] || 'Block'}
      </span>

      {/* Divider */}
      <div className="w-px h-6 bg-[var(--border-subtle)] mx-0.5" />

      {/* Visibility Toggle */}
      <button
        onClick={onToggleVisibility}
        className={`
          flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors whitespace-nowrap
          ${block.is_visible
            ? 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            : 'text-[var(--copper-9)] bg-[var(--copper-2)] hover:bg-[var(--copper-3)]'
          }
        `}
        title={block.is_visible ? 'Hide block' : 'Show block'}
      >
        {block.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        <span className="hidden sm:inline">{block.is_visible ? 'Visible' : 'Hidden'}</span>
      </button>

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm
                   text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]
                   transition-colors whitespace-nowrap"
        title="Block settings"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Settings</span>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-[var(--border-subtle)] mx-0.5" />

      {/* Duplicate */}
      <button
        onClick={onDuplicate}
        className="p-2 rounded-md text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)]
                   transition-colors"
        title="Duplicate block"
      >
        <Copy className="w-4 h-4" />
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="p-2 rounded-md text-[var(--text-tertiary)]
                   hover:bg-[var(--copper-2)] hover:text-[var(--copper-9)]
                   transition-colors"
        title="Delete block"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
