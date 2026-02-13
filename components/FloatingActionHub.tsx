'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Link2, Camera, Package, LayoutGrid, Command, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditMode } from '@/app/u/[handle]/components/EditModeProvider';

interface FloatingActionHubProps {
  onOpenBlockPicker: () => void;
  onOpenLinkAdder: () => void;
}

interface ActionItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

/**
 * FloatingActionHub - The "+" button for quick creation
 *
 * Appears in the bottom-right corner (above the Edit button).
 * Expands to show contextual actions:
 * - Link: Open link adder or paste URL
 * - Photo: Add photo
 * - Bag: Create new bag
 * - Panel: Add profile panel
 */
export function FloatingActionHub({
  onOpenBlockPicker,
  onOpenLinkAdder,
}: FloatingActionHubProps) {
  const router = useRouter();
  const { isOwner, isEditMode } = useEditMode();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Show hint when entering edit mode for the first time
  useEffect(() => {
    if (isEditMode && !hasInteracted) {
      const timer = setTimeout(() => setShowHint(true), 1000);
      const hideTimer = setTimeout(() => setShowHint(false), 6000);
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [isEditMode, hasInteracted]);

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
    setHasInteracted(true);
    setShowHint(false);
  }, []);

  const handleAction = useCallback((action: () => void) => {
    action();
    setIsExpanded(false);
    setHasInteracted(true);
  }, []);

  // Don't show for non-owners
  if (!isOwner) return null;

  // Define actions
  const actions: ActionItem[] = [
    {
      id: 'link',
      icon: <Link2 className="w-5 h-5" />,
      label: 'Add Link',
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => handleAction(onOpenLinkAdder),
    },
    {
      id: 'photo',
      icon: <Camera className="w-5 h-5" />,
      label: 'Add Photo',
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => {
        // Redirect to bag creation
        handleAction(() => router.push('/bags/new'));
      },
    },
    {
      id: 'bag',
      icon: <Package className="w-5 h-5" />,
      label: 'New Bag',
      color: 'bg-amber-500 hover:bg-amber-600',
      onClick: () => handleAction(() => router.push('/bags/new')),
    },
    {
      id: 'block',
      icon: <LayoutGrid className="w-5 h-5" />,
      label: 'Add Panel',
      color: 'bg-teed-green-600 hover:bg-teed-green-700',
      onClick: () => handleAction(onOpenBlockPicker),
    },
  ];

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* FAB Container - Bottom left for mobile thumb zone */}
      <div className={cn(
        'fixed z-50 transition-all duration-300 group',
        'bottom-6 left-6'
      )}>
        {/* Action items - radiate upward from left */}
        <div className={cn(
          'absolute bottom-16 left-0 flex flex-col-reverse gap-3',
          'transition-all duration-300',
          isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}>
          {actions.map((action, index) => (
            <div
              key={action.id}
              className={cn(
                'flex items-center gap-3 transition-all',
                isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              )}
              style={{
                transitionDelay: isExpanded ? `${index * 50}ms` : '0ms',
              }}
            >
              {/* Button first (on left) */}
              <button
                onClick={action.onClick}
                className={cn(
                  'w-12 h-12 rounded-full shadow-lg text-white',
                  'flex items-center justify-center',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2',
                  action.color
                )}
              >
                {action.icon}
              </button>

              {/* Label (on right of button) */}
              <span className="px-3 py-1.5 bg-white rounded-lg shadow-lg text-sm font-medium text-gray-700 whitespace-nowrap">
                {action.label}
              </span>
            </div>
          ))}
        </div>

        {/* Main FAB */}
        <button
          onClick={handleToggle}
          className={cn(
            'w-14 h-14 rounded-full shadow-xl',
            'flex items-center justify-center',
            'transition-all duration-300',
            'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2',
            isExpanded
              ? 'bg-gray-800 hover:bg-gray-900 rotate-45'
              : 'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)]',
            // Pulsing animation when in edit mode and not yet interacted
            isEditMode && !hasInteracted && !isExpanded && 'animate-pulse ring-4 ring-[var(--teed-green-4)]'
          )}
        >
          {isExpanded ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Onboarding hint - shows after entering edit mode */}
        {showHint && !isExpanded && (
          <div className={cn(
            'absolute left-16 top-1/2 -translate-y-1/2',
            'px-3 py-2 bg-[var(--teed-green-9)] rounded-lg shadow-lg',
            'text-sm text-white font-medium',
            'animate-in slide-in-from-left-2 duration-300',
            'flex items-center gap-2 whitespace-nowrap'
          )}>
            <Sparkles className="w-4 h-4" />
            <span>Tap to add panels & links!</span>
            {/* Arrow pointing to button */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-[var(--teed-green-9)]" />
          </div>
        )}

        {/* Keyboard hint - shows on hover (when hint is not showing) */}
        {!isExpanded && !showHint && (
          <div className={cn(
            'absolute left-16 top-1/2 -translate-y-1/2',
            'px-2 py-1 bg-gray-800 rounded text-xs text-white',
            'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
            'flex items-center gap-1 whitespace-nowrap'
          )}>
            <Command className="w-3 h-3" />
            <span>K for quick add</span>
          </div>
        )}
      </div>
    </>
  );
}
