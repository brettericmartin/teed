'use client';

/**
 * Base wrapper for all profile blocks in edit mode.
 *
 * IMPORTANT: This component uses `h-full` on all wrapper divs to ensure
 * blocks fill their allocated grid cell height. Do not remove these classes.
 * See GRID_LAYOUT.md for the full height chain requirements.
 */

import { ReactNode, useState } from 'react';
import { GripVertical, EyeOff } from 'lucide-react';
import { ProfileBlock } from '@/lib/blocks/types';
import BlockToolbar from './BlockToolbar';

interface BaseBlockProps {
  block: ProfileBlock;
  isEditMode?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  children: ReactNode;
  onSelect?: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onOpenSettings?: (id: string) => void;
}

export default function BaseBlock({
  block,
  isEditMode = false,
  isSelected = false,
  isDragging = false,
  children,
  onSelect,
  onToggleVisibility,
  onDelete,
  onDuplicate,
  onOpenSettings,
}: BaseBlockProps) {
  const [isHovered, setIsHovered] = useState(false);

  // View mode - render content directly, no wrapper chrome
  if (!isEditMode) {
    if (!block.is_visible) return null;
    return <div className="block-content w-full h-full">{children}</div>;
  }

  // Edit mode
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger selection if clicking on buttons or toolbar
    if ((e.target as HTMLElement).closest('button')) return;
    if ((e.target as HTMLElement).closest('.block-toolbar')) return;
    onSelect?.(block.id);
    onOpenSettings?.(block.id);
  };

  const handleDelete = () => {
    if (confirm('Delete this block?')) {
      onDelete?.(block.id);
    }
  };

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left margin drag handle - always visible in edit mode */}
      <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-10 flex justify-center z-10">
        <button
          className={`
            drag-handle p-1.5 rounded-md transition-all
            ${isSelected || isHovered
              ? 'opacity-100 bg-[var(--surface-elevated)] shadow-sm border border-[var(--border-subtle)]'
              : 'opacity-50 hover:opacity-80'
            }
            text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]
            cursor-grab active:cursor-grabbing
          `}
          title="Drag to reposition"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Floating toolbar - appears when selected */}
      {isSelected && (
        <BlockToolbar
          block={block}
          onToggleVisibility={() => onToggleVisibility?.(block.id)}
          onOpenSettings={() => onOpenSettings?.(block.id)}
          onDuplicate={() => onDuplicate?.(block.id)}
          onDelete={handleDelete}
        />
      )}

      {/* Block wrapper - WYSIWYG content */}
      <div
        onClick={handleClick}
        className={`
          relative rounded-xl transition-all cursor-pointer h-full
          ${isDragging
            ? 'ring-2 ring-[var(--teed-green-9)] shadow-xl scale-[1.01] z-50 bg-[var(--surface)]'
            : isSelected
              ? 'ring-2 ring-[var(--teed-green-9)] shadow-md bg-[var(--surface)]'
              : 'border-2 border-dashed border-[var(--border-subtle)]/40 hover:border-[var(--teed-green-5)] hover:bg-[var(--surface)]/50'
          }
          ${!block.is_visible ? 'opacity-50' : ''}
        `}
      >
        {/* Hidden indicator badge */}
        {!block.is_visible && (
          <div className="absolute top-3 right-3 z-10
                          flex items-center gap-1.5 px-2 py-1
                          bg-[var(--copper-2)] text-[var(--copper-9)]
                          rounded-md text-xs font-medium
                          border border-[var(--copper-3)]">
            <EyeOff className="w-3 h-3" />
            Hidden
          </div>
        )}

        {/* Block content - WYSIWYG, exactly like view mode */}
        <div className={`block-content h-full ${!block.is_visible ? 'pointer-events-none' : ''}`}>
          {children}
        </div>

        {/* Resize handle indicator (bottom-right corner) - shown when selected */}
        {isSelected && (
          <div className="absolute bottom-1 right-1 w-4 h-4
                          border-r-2 border-b-2 border-[var(--teed-green-7)]
                          rounded-br-sm opacity-70
                          pointer-events-none" />
        )}
      </div>
    </div>
  );
}
