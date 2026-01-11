'use client';

import { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCelebration } from '@/lib/celebrations';
import { useToast } from '@/components/ui/Toast';

interface BagCompletionButtonProps {
  bagCode: string;
  isComplete: boolean;
  onCompletionChange?: (isComplete: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/**
 * DOCTRINE: Core constructive dopamine - rewards "having built something"
 *
 * This button lets creators mark their bag as "complete", triggering
 * a celebration animation. This is pure pride-in-craft satisfaction,
 * not gamification or pressure.
 */
export default function BagCompletionButton({
  bagCode,
  isComplete: initialIsComplete,
  onCompletionChange,
  size = 'sm',
  showLabel = true,
}: BagCompletionButtonProps) {
  const [isComplete, setIsComplete] = useState(initialIsComplete);
  const [isLoading, setIsLoading] = useState(false);
  const { celebrateComplete } = useCelebration();
  const toast = useToast();

  const handleToggleComplete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/bags/${bagCode}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to update completion status');
      }

      const data = await response.json();
      const newIsComplete = data.is_complete;

      setIsComplete(newIsComplete);
      onCompletionChange?.(newIsComplete);

      if (newIsComplete) {
        // Trigger celebration!
        celebrateComplete();
        toast.showSuccess('Bag marked as complete!');
      } else {
        toast.showSuccess('Bag marked as in progress');
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      toast.showError('Failed to update completion status');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'min-h-[44px] min-w-[44px] p-2.5',
    md: 'min-h-[48px] min-w-[48px] p-3',
    lg: 'min-h-[52px] min-w-[52px] p-3.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <Button
      onClick={handleToggleComplete}
      disabled={isLoading}
      variant={isComplete ? 'create' : 'secondary'}
      size={size}
      className={`${sizeClasses[size]} transition-all duration-200 ${
        isComplete
          ? 'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white'
          : ''
      }`}
    >
      {isComplete ? (
        <CheckCircle2 className={`${iconSizes[size]} ${showLabel ? 'sm:mr-2' : ''}`} />
      ) : (
        <Circle className={`${iconSizes[size]} ${showLabel ? 'sm:mr-2' : ''}`} />
      )}
      {showLabel && (
        <span className="hidden sm:inline">
          {isComplete ? 'Complete' : 'Mark Complete'}
        </span>
      )}
    </Button>
  );
}

/**
 * Simple badge to show completion status on public bag views
 */
export function CompletionBadge({ isComplete }: { isComplete: boolean }) {
  if (!isComplete) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--teed-green-3)] border border-[var(--teed-green-6)]">
      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--teed-green-9)]" />
      <span className="text-xs font-medium text-[var(--teed-green-11)]">Complete</span>
    </div>
  );
}
