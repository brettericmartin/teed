'use client';

import { useState, useEffect } from 'react';
import { Eye, MousePointer, Users, TrendingUp, Smartphone, Monitor, Tablet, Loader2 } from 'lucide-react';

type AnalyticsData = {
  bagId: string;
  bagTitle: string;
  period: { days: number; startDate: string };
  metrics: {
    totalViews: number;
    uniqueVisitors: number;
    linkClicks: number;
    averageViewsPerDay: number;
  };
  breakdown: {
    dailyViews: Record<string, number>;
    devices: Record<string, number>;
  };
};

type BagAnalyticsProps = {
  bagId: string;
};

export default function BagAnalytics({ bagId }: BagAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [bagId, selectedDays]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analytics/bags/${bagId}?days=${selectedDays}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError('Unable to load analytics');
      console.error('[BagAnalytics] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6">
        <div className="flex items-center justify-center gap-2 text-[var(--text-secondary)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6">
        <p className="text-sm text-[var(--text-secondary)] text-center">
          {error || 'No analytics available yet'}
        </p>
      </div>
    );
  }

  const { metrics, breakdown } = analytics;
  const totalDeviceViews = Object.values(breakdown.devices).reduce((a, b) => a + b, 0);

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getDevicePercent = (count: number) => {
    if (totalDeviceViews === 0) return 0;
    return Math.round((count / totalDeviceViews) * 100);
  };

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[var(--teed-green-9)]" />
          <h3 className="font-semibold text-[var(--text-primary)]">Analytics</h3>
        </div>
        <select
          value={selectedDays}
          onChange={(e) => setSelectedDays(parseInt(e.target.value))}
          className="text-sm bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-[var(--text-primary)]"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Metrics Grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Views */}
          <div className="bg-[var(--sky-2)] rounded-lg p-4">
            <div className="flex items-center gap-2 text-[var(--sky-11)] mb-2">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium">Views</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {metrics.totalViews.toLocaleString()}
            </p>
          </div>

          {/* Unique Visitors */}
          <div className="bg-[var(--teed-green-2)] rounded-lg p-4">
            <div className="flex items-center gap-2 text-[var(--teed-green-11)] mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Visitors</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {metrics.uniqueVisitors.toLocaleString()}
            </p>
          </div>

          {/* Link Clicks */}
          <div className="bg-[var(--copper-2)] rounded-lg p-4">
            <div className="flex items-center gap-2 text-[var(--copper-11)] mb-2">
              <MousePointer className="w-4 h-4" />
              <span className="text-xs font-medium">Clicks</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {metrics.linkClicks.toLocaleString()}
            </p>
          </div>

          {/* Avg Views/Day */}
          <div className="bg-[var(--sand-2)] rounded-lg p-4">
            <div className="flex items-center gap-2 text-[var(--sand-11)] mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Avg/Day</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {metrics.averageViewsPerDay}
            </p>
          </div>
        </div>

        {/* Device Breakdown */}
        {totalDeviceViews > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Device Breakdown</h4>
            <div className="flex gap-4">
              {['desktop', 'mobile', 'tablet'].map((device) => {
                const count = breakdown.devices[device] || 0;
                const percent = getDevicePercent(count);
                return (
                  <div key={device} className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--text-secondary)]">{getDeviceIcon(device)}</span>
                    <span className="text-[var(--text-primary)] capitalize">{device}</span>
                    <span className="text-[var(--text-tertiary)]">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {metrics.totalViews === 0 && (
          <div className="mt-4 text-center text-sm text-[var(--text-secondary)]">
            <p>No views yet. Share your bag to start tracking analytics!</p>
          </div>
        )}
      </div>
    </div>
  );
}
