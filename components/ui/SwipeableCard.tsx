'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Bookmark, Plus, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
  onAction: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  className?: string;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 80; // pixels to trigger action
const MAX_SWIPE = 120; // max swipe distance

export function SwipeableCard({
  children,
  leftAction,
  rightAction,
  className,
  disabled = false,
}: SwipeableCardProps) {
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);

  // Transform for action backgrounds
  const leftOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const rightOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const leftScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.8, 1]);
  const rightScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0.8]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;

    // Check if swipe was fast enough or far enough
    const swipeThreshold = Math.abs(velocity.x) > 500 || Math.abs(offset.x) > SWIPE_THRESHOLD;

    if (swipeThreshold) {
      if (offset.x > 0 && leftAction) {
        // Swiped right - trigger left action
        triggerHaptic();
        leftAction.onAction();
        setIsRevealed('left');
        // Reset after action
        setTimeout(() => setIsRevealed(null), 300);
      } else if (offset.x < 0 && rightAction) {
        // Swiped left - trigger right action
        triggerHaptic();
        rightAction.onAction();
        setIsRevealed('right');
        // Reset after action
        setTimeout(() => setIsRevealed(null), 300);
      }
    }
  };

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch {
        // Haptics not supported
      }
    }
  };

  if (disabled || (!leftAction && !rightAction)) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={constraintsRef} className={cn('relative overflow-hidden', className)}>
      {/* Left action background (revealed on swipe right) */}
      {leftAction && (
        <motion.div
          style={{ opacity: leftOpacity }}
          className={cn(
            'absolute inset-y-0 left-0 w-24 flex items-center justify-center',
            leftAction.bgColor
          )}
        >
          <motion.div
            style={{ scale: leftScale }}
            className="flex flex-col items-center gap-1"
          >
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', leftAction.color)}>
              {leftAction.icon}
            </div>
            <span className="text-xs font-medium text-white">{leftAction.label}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Right action background (revealed on swipe left) */}
      {rightAction && (
        <motion.div
          style={{ opacity: rightOpacity }}
          className={cn(
            'absolute inset-y-0 right-0 w-24 flex items-center justify-center',
            rightAction.bgColor
          )}
        >
          <motion.div
            style={{ scale: rightScale }}
            className="flex flex-col items-center gap-1"
          >
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', rightAction.color)}>
              {rightAction.icon}
            </div>
            <span className="text-xs font-medium text-white">{rightAction.label}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: rightAction ? -MAX_SWIPE : 0, right: leftAction ? MAX_SWIPE : 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="relative bg-[var(--surface)] touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}

// Pre-configured swipe actions for common use cases
export const swipeActions = {
  save: (onSave: () => void, isSaved: boolean): SwipeAction => ({
    icon: <Bookmark className={cn('w-5 h-5 text-white', isSaved && 'fill-current')} />,
    label: isSaved ? 'Saved' : 'Save',
    color: 'bg-[var(--amber-9)]',
    bgColor: 'bg-[var(--amber-9)]',
    onAction: onSave,
  }),

  addToBag: (onAdd: () => void): SwipeAction => ({
    icon: <Plus className="w-5 h-5 text-white" />,
    label: 'Add',
    color: 'bg-[var(--teed-green-9)]',
    bgColor: 'bg-[var(--teed-green-9)]',
    onAction: onAdd,
  }),

  viewLink: (onView: () => void): SwipeAction => ({
    icon: <ExternalLink className="w-5 h-5 text-white" />,
    label: 'View',
    color: 'bg-[var(--sky-9)]',
    bgColor: 'bg-[var(--sky-9)]',
    onAction: onView,
  }),
};

export default SwipeableCard;
