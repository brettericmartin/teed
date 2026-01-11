'use client';

import { useState, useEffect } from 'react';
import { Heart, Users, Eye, TrendingUp, Sparkles, Copy, ExternalLink, Loader2, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

type CreatorStats = {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  impact: {
    peopleReached: number;
    itemsExplored: number;
    peopleHelped: number;
    curationsInspired: number;
    curationsBookmarked: number;
  };
  engagement: {
    totalViews: number;
    totalClicks: number;
    totalAffiliateClicks: number;
    overallEngagementRate: number;
  };
  bags: {
    total: number;
    public: number;
    breakdown: Array<{
      id: string;
      code: string;
      title: string;
      isPublic: boolean;
      itemCount: number;
      views: number;
      itemViews: number;
      linkClicks: number;
      saves: number;
      clones: number;
      affiliateClicks: number;
      engagementRate: number;
    }>;
  };
  topItems: Array<{
    id: string;
    name: string;
    clicks: number;
  }>;
  trends: {
    daily: Array<{
      date: string;
      views: number;
      clicks: number;
      helped: number;
    }>;
  };
  insights: string[];
};

interface CreatorEconomicsDashboardProps {
  ownerHandle: string;
}

export default function CreatorEconomicsDashboard({ ownerHandle }: CreatorEconomicsDashboardProps) {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [showBagBreakdown, setShowBagBreakdown] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [selectedDays]);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/creator/stats?days=${selectedDays}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('Unable to load your creator stats');
      console.error('[CreatorEconomics] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-[var(--teed-green-2)] to-[var(--sky-2)] rounded-2xl border border-[var(--teed-green-6)] p-8">
        <div className="flex items-center justify-center gap-3 text-[var(--text-secondary)]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading your impact...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-8 text-center">
        <p className="text-[var(--text-secondary)]">{error || 'No data available'}</p>
      </div>
    );
  }

  const { impact, engagement, bags, topItems, insights } = stats;

  return (
    <div className="space-y-6">
      {/* Hero Impact Section */}
      <div className="bg-gradient-to-br from-[var(--teed-green-2)] via-[var(--sky-1)] to-[var(--sand-2)] rounded-2xl border border-[var(--teed-green-6)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--teed-green-6)]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--teed-green-9)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">Your Impact</h2>
              <p className="text-sm text-[var(--text-secondary)]">How your curations are helping others</p>
            </div>
          </div>
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(parseInt(e.target.value))}
            className="text-sm bg-white/80 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>This year</option>
          </select>
        </div>

        {/* Main Impact Metrics */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* People Helped - Primary Metric */}
            <div className="col-span-2 md:col-span-1 bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-[var(--teed-green-6)]/20">
              <div className="flex items-center gap-2 text-[var(--teed-green-11)] mb-2">
                <Heart className="w-5 h-5" />
                <span className="text-sm font-medium">People Helped</span>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {impact.peopleHelped.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Found what they were looking for
              </p>
            </div>

            {/* People Reached */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-[var(--teed-green-6)]/20">
              <div className="flex items-center gap-2 text-[var(--sky-11)] mb-2">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">Reached</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {impact.peopleReached.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">views</p>
            </div>

            {/* Curations Inspired */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-[var(--teed-green-6)]/20">
              <div className="flex items-center gap-2 text-[var(--copper-11)] mb-2">
                <Copy className="w-4 h-4" />
                <span className="text-sm font-medium">Inspired</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {impact.curationsInspired.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">cloned your bags</p>
            </div>

            {/* Bookmarked */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-[var(--teed-green-6)]/20">
              <div className="flex items-center gap-2 text-[var(--amber-11)] mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Bookmarked</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {impact.curationsBookmarked.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">saved for later</p>
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="mt-6 p-4 bg-white/40 rounded-xl border border-[var(--teed-green-6)]/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--teed-green-3)] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-[var(--teed-green-11)]" />
                </div>
                <div className="space-y-2">
                  {insights.slice(0, 2).map((insight, index) => (
                    <p key={index} className="text-sm text-[var(--text-primary)]">
                      {insight}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Engagement Details */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--teed-green-9)]" />
            <h3 className="font-semibold text-[var(--text-primary)]">Engagement Breakdown</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span>{engagement.overallEngagementRate}% engagement rate</span>
            <button
              className="p-1 hover:bg-[var(--surface-hover)] rounded"
              title="Engagement rate = (clicks + saves + clones) / views"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* Bags Overview */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[var(--text-secondary)]">
              {bags.public} public {bags.public === 1 ? 'bag' : 'bags'} of {bags.total} total
            </div>
            <button
              onClick={() => setShowBagBreakdown(!showBagBreakdown)}
              className="flex items-center gap-1 text-sm text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)]"
            >
              {showBagBreakdown ? 'Hide details' : 'View by bag'}
              {showBagBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Per-Bag Breakdown */}
          {showBagBreakdown && bags.breakdown.length > 0 && (
            <div className="space-y-3 mb-6">
              {bags.breakdown.filter(b => b.isPublic).map((bag) => (
                <div
                  key={bag.id}
                  className="flex items-center justify-between p-3 bg-[var(--surface-alt)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/u/${ownerHandle}/${bag.code}/edit`}
                      className="font-medium text-[var(--text-primary)] hover:text-[var(--teed-green-9)] truncate block"
                    >
                      {bag.title}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] mt-0.5">
                      <span>{bag.itemCount} items</span>
                      <span>{bag.views} views</span>
                      <span>{bag.linkClicks} clicks</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-[var(--teed-green-11)]">
                      {bag.engagementRate}%
                    </span>
                    <p className="text-xs text-[var(--text-tertiary)]">engagement</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Top Performing Items */}
          {topItems.length > 0 && (
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                Your Most Helpful Recommendations
              </h4>
              <div className="space-y-2">
                {topItems.slice(0, 3).map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[var(--sky-3)] flex items-center justify-center text-xs font-medium text-[var(--sky-11)]">
                        {index + 1}
                      </span>
                      <span className="text-sm text-[var(--text-primary)]">{item.name}</span>
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {item.clicks} {item.clicks === 1 ? 'click' : 'clicks'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affiliate Revenue Section - Only show if there are affiliate clicks */}
          {engagement.totalAffiliateClicks > 0 && (
            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 mb-3">
                <ExternalLink className="w-4 h-4 text-[var(--teed-green-9)]" />
                <h4 className="text-sm font-medium text-[var(--text-primary)]">
                  Recommendation Revenue
                </h4>
              </div>
              <div className="bg-[var(--teed-green-2)] rounded-lg p-4">
                <p className="text-sm text-[var(--teed-green-12)]">
                  <strong>{engagement.totalAffiliateClicks}</strong> people clicked your affiliate links this period.
                </p>
                <p className="text-xs text-[var(--teed-green-11)] mt-2">
                  Check your affiliate dashboard (Amazon Associates, etc.) for actual earnings.
                  Teed takes no cut of your affiliate revenue.
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {impact.peopleReached === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-[var(--sky-2)] flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-[var(--sky-9)]" />
              </div>
              <p className="text-[var(--text-secondary)] mb-2">
                No views yet in this period
              </p>
              <p className="text-sm text-[var(--text-tertiary)]">
                Share your curations to start building your audience
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Philosophy Note */}
      <div className="text-center text-xs text-[var(--text-tertiary)] px-4">
        <p>
          Teed believes in transparent economics. We show you how your curations help others,
          not just clicks and metrics. Your expertise creates real value.
        </p>
      </div>
    </div>
  );
}
