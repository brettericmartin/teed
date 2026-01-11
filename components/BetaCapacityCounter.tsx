'use client';

import { useState, useEffect } from 'react';
import type { BetaCapacity, BetaCapacityCounterProps } from '@/lib/types/beta';

/**
 * Get informational message based on capacity
 * DOCTRINE: Informational only, no urgency or FOMO language
 */
function getCapacityMessage(percentFull: number, available: number): string | null {
  if (percentFull < 50) return null;
  if (available <= 0) return 'Founding cohort complete';
  return `${available} spots available`;
}

/**
 * BetaCapacityCounter
 *
 * Displays a live counter of beta slots: "43 of 50 founding spots filled"
 * Auto-refreshes every 30 seconds to show near-real-time updates.
 *
 * Visual features:
 * - Progress bar that changes color based on capacity (green → amber → red)
 * - Pulse animation when near capacity (< 10 spots left)
 * - "FULL" state when capacity reached
 */
export default function BetaCapacityCounter({
  className = '',
  showDetails = false,
  refreshInterval = 30000,
}: BetaCapacityCounterProps) {
  const [capacity, setCapacity] = useState<BetaCapacity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapacity = async () => {
    try {
      const response = await fetch('/api/beta/capacity');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setCapacity(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching capacity:', err);
      setError('Unable to load');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCapacity();

    // Auto-refresh
    const interval = setInterval(fetchCapacity, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-48 mb-2" />
        <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-full" />
      </div>
    );
  }

  if (error || !capacity) {
    return null; // Silently hide if there's an error
  }

  const { total, used, available, percent_full, is_at_capacity } = capacity;

  // Determine color based on capacity
  const getProgressColor = () => {
    if (percent_full >= 95) return 'bg-red-500';
    if (percent_full >= 80) return 'bg-amber-500';
    return 'bg-[var(--teed-green-9)]';
  };

  const getTextColor = () => {
    if (percent_full >= 95) return 'text-red-600 dark:text-red-400';
    if (percent_full >= 80) return 'text-amber-600 dark:text-amber-400';
    return 'text-[var(--teed-green-9)]';
  };

  // Informational message only - no urgency
  const capacityMessage = getCapacityMessage(percent_full, available);

  return (
    <div className={className}>
      {/* Main counter text */}
      <div className="flex items-center justify-center gap-2 mb-3">
        {is_at_capacity ? (
          <span className="text-lg font-medium text-[var(--text-secondary)]">
            Founding cohort complete
          </span>
        ) : (
          <>
            <span className={`text-3xl font-bold ${getTextColor()}`}>
              {used}
            </span>
            <span className="text-lg text-[var(--text-secondary)]">
              of {total}
            </span>
            <span className="text-lg font-medium text-[var(--text-primary)]">
              founding spots filled
            </span>
          </>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
          style={{ width: `${Math.min(percent_full, 100)}%` }}
        />
      </div>

      {/* Informational capacity message - no urgency */}
      {!is_at_capacity && capacityMessage && (
        <div className="mt-3 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            {capacityMessage}
          </p>
        </div>
      )}

      {/* Extended details (optional) */}
      {showDetails && (
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {capacity.pending_applications}
            </p>
            <p className="text-[var(--text-tertiary)]">applications pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {capacity.approved_this_week}
            </p>
            <p className="text-[var(--text-tertiary)]">approved this week</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for use in navigation or smaller spaces
 */
export function BetaCapacityBadge({ className = '' }: { className?: string }) {
  const [capacity, setCapacity] = useState<BetaCapacity | null>(null);

  useEffect(() => {
    fetch('/api/beta/capacity')
      .then((res) => res.json())
      .then(setCapacity)
      .catch(console.error);
  }, []);

  if (!capacity) return null;

  const { used, total, available, is_at_capacity } = capacity;

  if (is_at_capacity) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ${className}`}
      >
        Beta Full
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-[var(--teed-green-2)] text-[var(--teed-green-11)] ${className}`}
    >
      {used}/{total} spots
    </span>
  );
}
