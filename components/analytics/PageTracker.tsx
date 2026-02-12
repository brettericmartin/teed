'use client';

import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';

/**
 * Lightweight client component that fires a pageViewed event on mount.
 * Use this in server-rendered pages where you can't call useEffect directly.
 */
export function PageTracker({ page, metadata }: { page: string; metadata?: Record<string, unknown> }) {
  useEffect(() => {
    analytics.pageViewed(page, metadata);
  }, [page]);

  return null;
}
