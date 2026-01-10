'use client';

import { useState, useEffect } from 'react';

interface FeatureBadgeProps {
  /** Unique identifier for tracking this feature (e.g., 'share-embed-tab') */
  featureId: string;
  /** Release date of the feature - badge auto-expires 30 days after */
  releaseDate: string;
  /** Badge style variant */
  variant?: 'dot' | 'pill' | 'subtle';
  /** Additional className */
  className?: string;
  /** Whether to mark as seen on click (default: true) */
  markSeenOnClick?: boolean;
}

const STORAGE_KEY = 'teed-feature-discovery';
const EXPIRY_DAYS = 30;

/**
 * Feature discovery badge that appears next to new features.
 * Auto-expires after 30 days or when the user interacts with it.
 *
 * Usage:
 * <FeatureBadge featureId="share-embed-tab" releaseDate="2024-01-15" />
 */
export function FeatureBadge({
  featureId,
  releaseDate,
  variant = 'pill',
  className = '',
  markSeenOnClick = true,
}: FeatureBadgeProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if feature is still within the discovery window
    const release = new Date(releaseDate);
    const expiryDate = new Date(release.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now > expiryDate) {
      // Feature is too old to show badge
      return;
    }

    // Check if user has already seen this feature
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const seenFeatures: Record<string, string> = stored ? JSON.parse(stored) : {};

      if (!seenFeatures[featureId]) {
        setIsVisible(true);
      }
    } catch {
      // localStorage unavailable, show the badge
      setIsVisible(true);
    }
  }, [featureId, releaseDate]);

  const markAsSeen = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const seenFeatures: Record<string, string> = stored ? JSON.parse(stored) : {};
      seenFeatures[featureId] = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seenFeatures));
      setIsVisible(false);
    } catch {
      // localStorage unavailable
    }
  };

  if (!isVisible) return null;

  const handleClick = () => {
    if (markSeenOnClick) {
      markAsSeen();
    }
  };

  if (variant === 'dot') {
    return (
      <span
        onClick={handleClick}
        className={`inline-block w-2 h-2 bg-[var(--teed-green-9)] rounded-full animate-pulse ${className}`}
        aria-label="New feature"
      />
    );
  }

  if (variant === 'subtle') {
    return (
      <span
        onClick={handleClick}
        className={`inline-flex items-center justify-center w-1.5 h-1.5 bg-[var(--teed-green-9)] rounded-full ${className}`}
        aria-label="New feature"
      />
    );
  }

  // Default: pill variant
  return (
    <span
      onClick={handleClick}
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[var(--teed-green-3)] text-[var(--teed-green-11)] rounded-full ${className}`}
    >
      New
    </span>
  );
}

/**
 * Hook to check if a feature badge should be shown
 */
export function useFeatureDiscovery(featureId: string, releaseDate: string) {
  const [shouldShow, setShouldShow] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);

  useEffect(() => {
    const release = new Date(releaseDate);
    const expiryDate = new Date(release.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now > expiryDate) {
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const seenFeatures: Record<string, string> = stored ? JSON.parse(stored) : {};

      if (seenFeatures[featureId]) {
        setHasSeen(true);
      } else {
        setShouldShow(true);
      }
    } catch {
      setShouldShow(true);
    }
  }, [featureId, releaseDate]);

  const markAsSeen = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const seenFeatures: Record<string, string> = stored ? JSON.parse(stored) : {};
      seenFeatures[featureId] = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seenFeatures));
      setShouldShow(false);
      setHasSeen(true);
    } catch {
      // localStorage unavailable
    }
  };

  return { shouldShow, hasSeen, markAsSeen };
}

/**
 * Export the feature release date constant for patch notes
 */
export const FEATURE_RELEASES = {
  'share-embed-tab': '2026-01-10',
  'share-export-tab': '2026-01-10',
  'rss-feeds': '2026-01-10',
  'oembed-support': '2026-01-10',
} as const;
