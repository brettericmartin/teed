'use client';

import { useState } from 'react';
import { Pencil, Check } from 'lucide-react';
import { useEditMode } from '@/app/u/[handle]/components/EditModeProvider';
import { useCelebration } from '@/lib/celebrations';
import { cn } from '@/lib/utils';

/**
 * FloatingEditButton - Appears in the bottom-right corner of the profile
 *
 * In Showcase Mode (default): Shows "Edit" button
 * In Edit Mode: Shows "Done" button with checkmark
 *
 * Keyboard shortcuts:
 * - Press 'E' to enter edit mode
 * - Press 'Escape' to exit edit mode
 */
export function FloatingEditButton() {
  const { isEditMode, isOwner, setEditMode, hadChanges, isSaving } = useEditMode();
  const { celebrateProfileUpdate } = useCelebration();
  const [showToast, setShowToast] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Don't show for non-owners
  if (!isOwner) return null;

  const handleClick = () => {
    if (isEditMode) {
      // Exiting edit mode
      setIsExiting(true);

      // Wait for any pending saves
      setTimeout(() => {
        setEditMode(false);

        // Show celebration and toast if changes were made
        if (hadChanges) {
          celebrateProfileUpdate();
          setShowToast(true);
          setTimeout(() => setShowToast(false), 2500);
        }

        setIsExiting(false);
      }, isSaving ? 500 : 0);
    } else {
      // Entering edit mode
      setEditMode(true);
    }
  };

  return (
    <>
      {/* Floating button with tooltip */}
      {/* On desktop in edit mode, shift left to avoid overlap with settings panel (380px + margin) */}
      {/* On mobile, position above the navigation bar using CSS custom property */}
      <div className={cn(
        "fixed z-50 group transition-all duration-300",
        "right-6",
        isEditMode && "lg:right-[420px]",
        // Mobile: above nav. Desktop: standard
        "bottom-[calc(var(--mobile-bottom-base,0px)+16px)] md:bottom-6"
      )}>
        <button
          onClick={handleClick}
          disabled={isExiting}
          title={isEditMode ? 'Press E to finish editing' : 'Press E to edit'}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5',
            'rounded-full shadow-lg',
            'transition-all duration-200 ease-out',
            'font-medium text-sm',
            isEditMode
              ? 'bg-teed-green text-white hover:bg-teed-green/90'
              : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-xl border border-gray-200',
            isExiting && 'opacity-50 cursor-wait'
          )}
        >
          {isEditMode ? (
            <>
              <Check className="w-4 h-4" />
              <span>Done</span>
              <kbd className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-mono">E</kbd>
            </>
          ) : (
            <>
              <Pencil className="w-4 h-4" />
              <span>Edit</span>
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-500">E</kbd>
            </>
          )}
        </button>
      </div>

      {/* Success toast */}
      <div
        className={cn(
          'fixed z-50',
          'right-6',
          'px-4 py-2.5 rounded-lg',
          'bg-teed-green text-white shadow-lg',
          'text-sm font-medium',
          'transition-all duration-300 ease-out',
          // Mobile: above nav + button. Desktop: standard
          'bottom-[calc(var(--mobile-bottom-base,0px)+80px)] md:bottom-20',
          showToast
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2 pointer-events-none'
        )}
      >
        Your showcase is updated
      </div>

    </>
  );
}
