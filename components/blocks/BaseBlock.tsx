'use client';

/**
 * Base wrapper for all profile blocks in edit mode.
 *
 * IMPORTANT: This component uses `h-full` on all wrapper divs to ensure
 * blocks fill their allocated grid cell height. Do not remove these classes.
 * See GRID_LAYOUT.md for the full height chain requirements.
 */

import { ReactNode, useState } from 'react';
import { GripVertical, EyeOff, Pencil, Trash2 } from 'lucide-react';
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
    const target = e.target as HTMLElement;

    // Only ignore clicks on toolbar, drag handle, and edit button
    if (target.closest('.block-toolbar')) {
      return;
    }
    if (target.closest('.drag-handle')) {
      return;
    }
    if (target.closest('.edit-button')) {
      return;
    }

    onSelect?.(block.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(block.id);
    onOpenSettings?.(block.id);
  };

  const handleDelete = () => {
    if (confirm('Delete this panel?')) {
      onDelete?.(block.id);
    }
  };

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
        {/* Edit controls - pills at top of block, inside panel bounds to avoid clipping */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {/* Drag handle - hidden on mobile (mobile uses arrow buttons instead) */}
          <div
            className={`
              drag-handle hidden md:flex items-center gap-1.5 px-3 py-1.5
              bg-[var(--surface-elevated)] text-[var(--text-secondary)]
              border border-[var(--border-subtle)]
              rounded-full shadow-md
              cursor-grab active:cursor-grabbing
              transition-all
              ${isDragging ? 'scale-110 shadow-xl bg-[var(--teed-green-9)] text-white border-transparent' : 'hover:scale-105 hover:shadow-lg hover:border-[var(--teed-green-6)]'}
            `}
            title="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
            <span className="text-xs font-medium">Drag</span>
          </div>

          {/* Edit button - opens settings panel (hidden on mobile - tap panel instead) */}
          <button
            onClick={handleEditClick}
            className="edit-button hidden md:flex items-center gap-1.5 px-3 py-1.5
              bg-[var(--teed-green-9)] text-white
              rounded-full shadow-md
              transition-all
              hover:scale-105 hover:shadow-lg hover:bg-[var(--teed-green-10)]
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--teed-green-7)]"
            title="Edit panel"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Edit</span>
          </button>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5
              bg-[var(--surface-elevated)] text-[var(--copper-9)]
              border border-[var(--border-subtle)]
              rounded-full shadow-md
              transition-all
              hover:scale-105 hover:shadow-lg hover:bg-[var(--copper-2)] hover:border-[var(--copper-6)]
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--copper-7)]"
            title="Delete panel"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

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
