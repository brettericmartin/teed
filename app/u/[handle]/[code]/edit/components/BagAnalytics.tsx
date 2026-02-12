'use client';

import { useState, useEffect } from 'react';
import { Eye, MousePointer, Users, TrendingUp, Smartphone, Monitor, Tablet, Loader2, Globe, Percent, Bookmark, Copy, Share2 } from 'lucide-react';

type AnalyticsData = {
  bagId: string;
  bagTitle: string;
  period: { days: number; startDate: string };
  metrics: {
    totalViews: number;
    uniqueVisitors: number;
    linkClicks: number;
    saves?: number;
    clones?: number;
    shares?: number;
    averageViewsPerDay: number;
    engagementRate?: number;
  };
  breakdown: {
    dailyViews: Record<string, number>;
    devices: Record<string, number>;
    topReferrers?: Array<{ domain: string; count: number }>;
    topClickedItems?: Array<{ id: string; name: string; clicks: number }>;
  };
};

type BagAnalyticsProps = {
  bagId: string;
};

/** Mini sparkline rendered with SVG — no external deps */
function MiniSparkline({ data, color = 'var(--teed-green-9)' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 200;
  const h = 40;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BagAnalytics({ bagId }: BagAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
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
      setAnalyticsData(data);
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

  if (error || !analyticsData) {
    return (
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6">
        <p className="text-sm text-[var(--text-secondary)] text-center">
          {error || 'No analytics available yet'}
        </p>
      </div>
    );
  }

  const { metrics, breakdown } = analyticsData;
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

  // Build sparkline data from dailyViews (ordered by date)
  const sortedDates = Object.keys(breakdown.dailyViews).sort();
  const sparklineData = sortedDates.map(d => breakdown.dailyViews[d]);

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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Total Views */}
          <div className="bg-[var(--sky-2)] rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[var(--sky-11)] mb-1">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Views</span>
            </div>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {metrics.totalViews.toLocaleString()}
            </p>
          </div>

          {/* Unique Visitors */}
          <div className="bg-[var(--teed-green-2)] rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[var(--teed-green-11)] mb-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Visitors</span>
            </div>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {metrics.uniqueVisitors.toLocaleString()}
            </p>
          </div>

          {/* Link Clicks */}
          <div className="bg-[var(--copper-2)] rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[var(--copper-11)] mb-1">
              <MousePointer className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Clicks</span>
            </div>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {metrics.linkClicks.toLocaleString()}
            </p>
          </div>

          {/* Avg Views/Day */}
          <div className="bg-[var(--sand-2)] rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[var(--sand-11)] mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Avg/Day</span>
            </div>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {metrics.averageViewsPerDay}
            </p>
          </div>

          {/* Engagement Rate */}
          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 mb-1">
              <Percent className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">CTR</span>
            </div>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {metrics.engagementRate ?? (metrics.totalViews > 0 ? Math.round((metrics.linkClicks / metrics.totalViews) * 1000) / 10 : 0)}%
            </p>
          </div>
        </div>

        {/* Saves / Clones / Shares row */}
        {((metrics.saves ?? 0) > 0 || (metrics.clones ?? 0) > 0 || (metrics.shares ?? 0) > 0) && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-[var(--amber-2)] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[var(--amber-11)] mb-1">
                <Bookmark className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Saves</span>
              </div>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {(metrics.saves ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-[var(--copper-2)] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[var(--copper-11)] mb-1">
                <Copy className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Clones</span>
              </div>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {(metrics.clones ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-[var(--teed-green-2)] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[var(--teed-green-11)] mb-1">
                <Share2 className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Shares</span>
              </div>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {(metrics.shares ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Mini Sparkline */}
        {sparklineData.length >= 2 && (
          <div className="mt-4 bg-[var(--surface-elevated)] rounded-lg p-3">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Daily Views</p>
            <MiniSparkline data={sparklineData} />
          </div>
        )}

        {/* Traffic Sources */}
        {breakdown.topReferrers && breakdown.topReferrers.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Traffic Sources
            </h4>
            <div className="space-y-1.5">
              {breakdown.topReferrers.slice(0, 3).map((ref) => (
                <div key={ref.domain} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)] truncate">{ref.domain}</span>
                  <span className="text-[var(--text-primary)] font-medium ml-2">{ref.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Clicked Items */}
        {breakdown.topClickedItems && breakdown.topClickedItems.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
              <MousePointer className="w-3.5 h-3.5" />
              Top Clicked Items
            </h4>
            <div className="space-y-1.5">
              {breakdown.topClickedItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)] truncate">{item.name}</span>
                  <span className="text-[var(--text-primary)] font-medium ml-2">{item.clicks} clicks</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Device Breakdown */}
        {totalDeviceViews > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Device Breakdown</h4>
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
