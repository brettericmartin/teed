'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Heart,
  Bookmark,
  Sparkles,
  Package,
  ExternalLink,
  Clock,
  Trophy,
  Star,
  Zap,
  Crown,
  Target,
  Link2,
  Store,
  TrendingUp,
  Globe,
  Download,
  Calendar,
  MapPin,
} from 'lucide-react';
import { PageContainer, ContentContainer } from '@/components/layout/PageContainer';
import { useCelebration } from '@/lib/celebrations';
import type { CreatorStats } from '@/lib/stats/creatorStats';
import type { AwardedBadge } from '@/lib/badges/types';
import { BadgeShowcase } from '@/components/badges/BadgeIcon';

type Profile = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
};

interface StatsPageClientProps {
  profile: Profile;
  stats: CreatorStats | null;
  selectedDays: number;
  badges?: AwardedBadge[];
}

// Milestone definitions - only show earned ones
const MILESTONES = [
  { threshold: 10, label: 'First Ten', icon: Star, color: 'amber' },
  { threshold: 50, label: 'Growing', icon: Zap, color: 'sky' },
  { threshold: 100, label: 'Century', icon: Trophy, color: 'teed-green' },
  { threshold: 500, label: 'Community', icon: Crown, color: 'copper' },
  { threshold: 1000, label: 'Thousand', icon: Target, color: 'amber' },
] as const;

// Get the hero stat to celebrate
function getHeroStat(stats: CreatorStats) {
  const { impact, overview } = stats;

  if (impact.peopleReached >= 100) {
    return {
      value: impact.peopleReached,
      message: "You've reached {n} people!",
      subtitle: "Your curations are making a real difference",
      icon: Users,
      intensity: 'major' as const,
    };
  }
  if (impact.curationsInspired >= 1) {
    return {
      value: impact.curationsInspired,
      message: "You've inspired {n} new collection" + (impact.curationsInspired > 1 ? 's' : '') + "!",
      subtitle: "People are building on your great taste",
      icon: Sparkles,
      intensity: 'medium' as const,
    };
  }
  if (impact.curationsBookmarked >= 1) {
    return {
      value: impact.curationsBookmarked,
      message: "{n} people saved your picks!",
      subtitle: "They're coming back for your recommendations",
      icon: Bookmark,
      intensity: 'medium' as const,
    };
  }
  if (impact.peopleReached >= 1) {
    return {
      value: impact.peopleReached,
      message: "{n} " + (impact.peopleReached === 1 ? 'person has' : 'people have') + " discovered your curations",
      subtitle: "Every journey starts somewhere",
      icon: Users,
      intensity: 'micro' as const,
    };
  }
  // Fallback: celebrate their bags
  return {
    value: overview.totalBags,
    message: "You've curated {n} collection" + (overview.totalBags > 1 ? 's' : '') + "!",
    subtitle: "Ready to help people discover great gear",
    icon: Package,
    intensity: 'micro' as const,
  };
}

// Get highest milestone reached
function getHighestMilestone(peopleReached: number): number | null {
  const earned = MILESTONES.filter(m => peopleReached >= m.threshold);
  if (earned.length === 0) return null;
  return earned[earned.length - 1].threshold;
}

export default function StatsPageClient({ profile, stats, selectedDays, badges = [] }: StatsPageClientProps) {
  const router = useRouter();
  const { celebrateMilestone } = useCelebration();
  const [hasTriggeredCelebration, setHasTriggeredCelebration] = useState(false);

  const handlePeriodChange = (days: number) => {
    router.push(`/u/${profile.handle}/stats?days=${days}`);
  };

  // Trigger celebration for new milestones
  useEffect(() => {
    if (!stats || hasTriggeredCelebration) return;

    const storageKey = `stats_milestone_${profile.id}`;
    const lastCelebrated = localStorage.getItem(storageKey);
    const currentMilestone = getHighestMilestone(stats.impact.peopleReached);

    if (currentMilestone && String(currentMilestone) !== lastCelebrated) {
      // Small delay so page renders first
      setTimeout(() => {
        celebrateMilestone(currentMilestone);
        localStorage.setItem(storageKey, String(currentMilestone));
      }, 500);
    }
    setHasTriggeredCelebration(true);
  }, [stats, profile.id, celebrateMilestone, hasTriggeredCelebration]);

  // Celebrate newly discovered badges (gifts you discover, not pressure to check)
  useEffect(() => {
    if (!badges || badges.length === 0) return;

    const storageKey = `badges_seen_${profile.id}`;
    const seenBadgesStr = localStorage.getItem(storageKey);
    const seenBadges = seenBadgesStr ? JSON.parse(seenBadgesStr) as string[] : [];

    const currentBadgeIds = badges.map(b => b.id);
    const newBadges = currentBadgeIds.filter(id => !seenBadges.includes(id));

    if (newBadges.length > 0) {
      // Celebrate new badges with a slight delay
      setTimeout(() => {
        celebrateMilestone(100); // Use major celebration for new badges
      }, 800);

      // Update localStorage with all current badges
      localStorage.setItem(storageKey, JSON.stringify(currentBadgeIds));
    }
  }, [badges, profile.id, celebrateMilestone]);

  if (!stats) {
    return (
      <PageContainer variant="warm">
        <ContentContainer size="md" className="py-16 text-center">
          <p className="text-[var(--text-secondary)]">Unable to load your impact. Please try again.</p>
          <Link
            href={`/u/${profile.handle}`}
            className="mt-4 inline-block text-[var(--teed-green-9)] hover:underline"
          >
            Back to profile
          </Link>
        </ContentContainer>
      </PageContainer>
    );
  }

  const {
    overview, impact, bags, topItems, clicksByRetailer, topLinks, recentActivity,
    impactStory, highlights, geography, trafficSources
  } = stats;
  const heroStat = getHeroStat(stats);
  const earnedMilestones = MILESTONES.filter(m => impact.peopleReached >= m.threshold);

  // Smart visibility: only show engagement when it looks good
  const showEngagement = overview.engagementRate >= 5 && overview.totalViews >= 10;

  // Smart visibility: only show click-through rate when meaningful
  const showClickThrough = overview.clickThroughRate >= 1 && overview.totalClicks >= 3;

  // Filter out bags with no views
  const bagsWithViews = bags.filter(b => b.views > 0);

  // Filter out unknown items
  const validItems = topItems.filter(item =>
    item.name &&
    item.name !== 'Unknown Item' &&
    item.name !== 'unknown'
  );

  // Filter out unknown links
  const validLinks = topLinks.filter(link =>
    link.itemName &&
    link.itemName !== 'Unknown Item' &&
    link.url
  );

  // Export CSV handler
  const handleExportCSV = (stats: CreatorStats, profile: Profile) => {
    const rows: string[][] = [
      ['Teed Impact Report'],
      [`Creator: ${profile.display_name} (@${profile.handle})`],
      [`Period: Last ${selectedDays} days`],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [],
      ['Overview'],
      ['Total Bags', String(stats.overview.totalBags)],
      ['Total Views', String(stats.overview.totalViews)],
      ['Total Clicks', String(stats.overview.totalClicks)],
      ['Engagement Rate', `${stats.overview.engagementRate}%`],
      [],
      ['Impact'],
      ['People Reached', String(stats.impact.peopleReached)],
      ['People Helped (clicked)', String(stats.impact.peopleHelped)],
      ['Collections Bookmarked', String(stats.impact.curationsBookmarked)],
      ['Collections Inspired', String(stats.impact.curationsInspired)],
      [],
      ['Collections'],
      ['Title', 'Views', 'Clicks', 'Items'],
      ...stats.bags.map(b => [b.title, String(b.views), String(b.clicks), String(b.itemCount)]),
      [],
      ['Top Retailers'],
      ['Retailer', 'Clicks', 'Percentage'],
      ...stats.clicksByRetailer.map(r => [r.displayName, String(r.clicks), `${r.percentage}%`]),
      [],
      ['Top Links'],
      ['Item', 'Domain', 'Clicks'],
      ...stats.topLinks.map(l => [l.itemName, l.domain, String(l.clicks)]),
    ];

    // Add geography if available
    if (stats.geography.countriesReached > 0) {
      rows.push([], ['Geography']);
      rows.push(['Countries Reached', String(stats.geography.countriesReached)]);
      stats.geography.topCountries.forEach(c => {
        rows.push([c.country, String(c.views)]);
      });
    }

    // Add traffic sources if available
    if (stats.trafficSources.length > 0) {
      rows.push([], ['Traffic Sources']);
      rows.push(['Source', 'Visits']);
      stats.trafficSources.forEach(s => {
        rows.push([s.displayName, String(s.views)]);
      });
    }

    const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teed-impact-${profile.handle}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer variant="warm">
      {/* Header */}
      <div className="bg-[var(--surface)]/95 backdrop-blur-sm border-b border-[var(--border-subtle)] sticky top-0 z-10">
        <ContentContainer size="lg" className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/u/${profile.handle}`}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">
                  Your Impact
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  See how you're helping people
                </p>
              </div>
            </div>

            {/* Period Selector */}
            <select
              value={selectedDays}
              onChange={(e) => handlePeriodChange(parseInt(e.target.value))}
              className="text-sm bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>This year</option>
            </select>
          </div>
        </ContentContainer>
      </div>

      <ContentContainer size="lg" className="py-8 space-y-8">
        {/* Hero Celebration Card */}
        <HeroCard heroStat={heroStat} />

        {/* AI Impact Story - natural language summary */}
        {impactStory && (
          <div className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border-subtle)]">
            <p className="text-[var(--text-primary)] leading-relaxed text-lg">
              {impactStory}
            </p>
          </div>
        )}

        {/* Milestone Badges - only show if any earned */}
        {earnedMilestones.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {earnedMilestones.map((milestone) => (
              <MilestoneBadge key={milestone.threshold} milestone={milestone} />
            ))}
          </div>
        )}

        {/* Earned Badges - persisted achievements */}
        {badges.length > 0 && (
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-5">
            <BadgeShowcase
              badges={badges}
              title="Your Achievements"
              emptyMessage="Keep curating to earn badges!"
            />
          </div>
        )}

        {/* Impact Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ImpactCard
            icon={<Users className="w-5 h-5" />}
            label="People Reached"
            value={impact.peopleReached}
            color="sky"
          />
          <ImpactCard
            icon={<Heart className="w-5 h-5" />}
            label="Found Value"
            value={impact.peopleHelped}
            color="teed-green"
          />
          <ImpactCard
            icon={<Bookmark className="w-5 h-5" />}
            label="Saved for Later"
            value={impact.curationsBookmarked}
            color="amber"
          />
          <ImpactCard
            icon={<Sparkles className="w-5 h-5" />}
            label="Inspired Collections"
            value={impact.curationsInspired}
            color="copper"
          />
        </div>

        {/* Highlight Reel - Best Moments */}
        {highlights.length > 0 && (
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--amber-9)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">Your Best Moments</h2>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {highlights.slice(0, 3).map((highlight, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-[var(--amber-2)] to-[var(--surface)] rounded-lg p-4 border border-[var(--amber-4)]"
                >
                  <p className="font-medium text-[var(--text-primary)]">{highlight.title}</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{highlight.subtitle}</p>
                  {highlight.date && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-2">{highlight.date}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Geographic Reach - celebrate global impact */}
        {geography.countriesReached > 1 && (
          <div className="bg-gradient-to-r from-[var(--sky-2)] to-[var(--teed-green-2)] rounded-xl p-6 border border-[var(--sky-6)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[var(--sky-9)] flex items-center justify-center">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--text-primary)]">
                    Discovered in {geography.countriesReached} countries
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    Your taste has gone global
                  </p>
                </div>
              </div>
              {geography.topCountries.length > 0 && (
                <div className="hidden md:flex items-center gap-2">
                  {geography.topCountries.slice(0, 5).map((c) => (
                    <span
                      key={c.countryCode}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/60 rounded-full text-sm text-[var(--text-secondary)]"
                    >
                      <MapPin className="w-3 h-3" />
                      {c.country}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Traffic Sources - where people discover you */}
        {trafficSources.length > 0 && (
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--teed-green-9)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">How People Find You</h2>
            </div>
            <div className="p-4 space-y-3">
              {trafficSources.slice(0, 4).map((source) => (
                <div key={source.source} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--teed-green-2)] flex items-center justify-center">
                    <Globe className="w-5 h-5 text-[var(--teed-green-9)]" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-[var(--text-primary)]">{source.displayName}</span>
                    <span className="text-[var(--text-secondary)]"> {source.description}</span>
                  </div>
                  <span className="text-sm text-[var(--text-tertiary)]">
                    {source.views} {source.views === 1 ? 'visit' : 'visits'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Engagement Rate - only when it looks good */}
        {showEngagement && (
          <div className="bg-gradient-to-r from-[var(--teed-green-2)] to-[var(--sky-2)] rounded-xl p-6 border border-[var(--teed-green-6)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--teed-green-9)] flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Engagement</p>
                  <p className="text-3xl font-bold text-[var(--text-primary)]">{overview.engagementRate}%</p>
                </div>
              </div>
              <p className="text-sm text-[var(--text-tertiary)] max-w-xs text-right">
                of visitors clicked, saved, or were inspired by your curations
              </p>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Collections Making an Impact */}
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
              <Package className="w-5 h-5 text-[var(--teed-green-9)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">Collections Making an Impact</h2>
            </div>

            {bagsWithViews.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--sky-2)] flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-[var(--sky-9)]" />
                </div>
                <p className="text-[var(--text-secondary)] font-medium">Your collections are ready</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  Share them to start helping people discover great gear
                </p>
                <Link
                  href={`/u/${profile.handle}`}
                  className="mt-3 inline-block text-sm text-[var(--teed-green-9)] hover:underline"
                >
                  View your profile
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {bagsWithViews.slice(0, 5).map((bag) => (
                  <Link
                    key={bag.id}
                    href={`/u/${profile.handle}/${bag.code}`}
                    className="flex items-center justify-between p-4 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--text-primary)] truncate">{bag.title}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {bag.itemCount} items {!bag.isPublic && '(private)'}
                      </p>
                    </div>
                    <div className="text-sm text-[var(--teed-green-10)] font-medium">
                      {bag.views} {bag.views === 1 ? 'person' : 'people'} reached
                    </div>
                  </Link>
                ))}
                {bagsWithViews.length > 5 && (
                  <div className="p-3 text-center">
                    <span className="text-sm text-[var(--text-tertiary)]">
                      +{bagsWithViews.length - 5} more collections
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items People Love - only show if valid items exist */}
          {validItems.length > 0 ? (
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
                <Heart className="w-5 h-5 text-[var(--copper-9)]" />
                <h2 className="font-semibold text-[var(--text-primary)]">Items People Love</h2>
              </div>

              <div className="divide-y divide-[var(--border-subtle)]">
                {validItems.slice(0, 5).map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-4"
                  >
                    <span className="w-6 h-6 rounded-full bg-[var(--copper-3)] flex items-center justify-center text-xs font-medium text-[var(--copper-11)]">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">{item.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">in {item.bagTitle}</p>
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {item.clicks} {item.clicks === 1 ? 'person' : 'people'} explored
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Show encouraging message instead of "no clicks"
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
                <Heart className="w-5 h-5 text-[var(--copper-9)]" />
                <h2 className="font-semibold text-[var(--text-primary)]">Items People Love</h2>
              </div>
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--copper-2)] flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-[var(--copper-9)]" />
                </div>
                <p className="text-[var(--text-secondary)] font-medium">Your picks are waiting</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  When people click your recommendations, they'll appear here
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Affiliate Tracking Section - Click-through rate banner */}
        {showClickThrough && (
          <div className="bg-gradient-to-r from-[var(--copper-2)] to-[var(--amber-2)] rounded-xl p-6 border border-[var(--copper-6)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--copper-9)] flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Click-through Rate</p>
                  <p className="text-3xl font-bold text-[var(--text-primary)]">{overview.clickThroughRate}%</p>
                </div>
              </div>
              <p className="text-sm text-[var(--text-tertiary)] max-w-xs text-right">
                of visitors clicked through to explore your recommendations
              </p>
            </div>
          </div>
        )}

        {/* Clicks by Retailer - for affiliate tracking */}
        {clicksByRetailer.length > 0 && (
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
              <Store className="w-5 h-5 text-[var(--copper-9)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">Where People Shop</h2>
              <span className="ml-auto text-xs text-[var(--text-tertiary)] bg-[var(--surface-elevated)] px-2 py-1 rounded-full">
                {overview.totalClicks} total clicks
              </span>
            </div>

            <div className="p-4">
              <div className="space-y-3">
                {clicksByRetailer.slice(0, 6).map((retailer) => (
                  <div key={retailer.domain} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {retailer.displayName}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {retailer.clicks} clicks ({retailer.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--copper-8)] to-[var(--copper-9)] rounded-full transition-all"
                          style={{ width: `${retailer.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Links - for affiliate tracking */}
        {validLinks.length > 0 && (
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[var(--sky-9)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">Top Clicked Links</h2>
            </div>

            <div className="divide-y divide-[var(--border-subtle)]">
              {validLinks.slice(0, 5).map((link, index) => (
                <div key={link.id} className="flex items-center gap-3 p-4">
                  <span className="w-6 h-6 rounded-full bg-[var(--sky-3)] flex items-center justify-center text-xs font-medium text-[var(--sky-11)]">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">{link.itemName}</p>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">
                      {link.domain} · in {link.bagTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {link.clicks} {link.clicks === 1 ? 'click' : 'clicks'}
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--sky-9)] hover:bg-[var(--sky-2)] rounded-lg transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Appreciation */}
        {recentActivity.length > 0 && (
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--text-secondary)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">Recent Appreciation</h2>
            </div>

            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {recentActivity.map((activity, index) => (
                  <AppreciationPill key={index} activity={activity} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Warm Empty State - only when truly no activity */}
        {overview.totalViews === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--teed-green-3)] to-[var(--sky-3)] flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[var(--teed-green-9)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              Your curations are ready to shine
            </h3>
            <p className="text-[var(--text-secondary)] mb-4 max-w-md mx-auto">
              Share your profile to start helping people discover great gear. Every expert curator started somewhere!
            </p>
            <Link
              href={`/u/${profile.handle}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--teed-green-9)] text-white rounded-lg hover:bg-[var(--teed-green-10)] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View your profile
            </Link>
          </div>
        )}

        {/* Export Your Impact */}
        {overview.totalViews > 0 && (
          <div className="flex flex-col items-center gap-4 pt-4">
            <p className="text-sm text-[var(--text-tertiary)]">Your data. Take it anywhere.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleExportCSV(stats, profile)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Data (CSV)
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-[var(--text-tertiary)] pt-4">
          <p>Your impact is private and only visible to you.</p>
        </div>
      </ContentContainer>
    </PageContainer>
  );
}

// Hero Card - celebrates the most impressive stat
function HeroCard({ heroStat }: { heroStat: ReturnType<typeof getHeroStat> }) {
  const Icon = heroStat.icon;

  const intensityClasses = {
    major: 'from-[var(--teed-green-3)] via-[var(--sky-2)] to-[var(--amber-2)]',
    medium: 'from-[var(--teed-green-2)] to-[var(--sky-2)]',
    micro: 'from-[var(--surface-elevated)] to-[var(--surface)]',
  };

  return (
    <div className={`bg-gradient-to-r ${intensityClasses[heroStat.intensity]} rounded-2xl p-8 border border-[var(--teed-green-6)]`}>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--teed-green-9)] flex items-center justify-center shadow-lg">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <p className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
            {heroStat.message.replace('{n}', heroStat.value.toLocaleString())}
          </p>
          <p className="text-[var(--text-secondary)] mt-1">
            {heroStat.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

// Milestone Badge
function MilestoneBadge({ milestone }: { milestone: typeof MILESTONES[number] }) {
  const Icon = milestone.icon;

  const colorClasses = {
    amber: 'bg-[var(--amber-3)] text-[var(--amber-11)] border-[var(--amber-6)]',
    sky: 'bg-[var(--sky-3)] text-[var(--sky-11)] border-[var(--sky-6)]',
    'teed-green': 'bg-[var(--teed-green-3)] text-[var(--teed-green-11)] border-[var(--teed-green-6)]',
    copper: 'bg-[var(--copper-3)] text-[var(--copper-11)] border-[var(--copper-6)]',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${colorClasses[milestone.color]}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{milestone.label}</span>
    </div>
  );
}

// Impact Card with human language
function ImpactCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'sky' | 'teed-green' | 'amber' | 'copper';
}) {
  const colorClasses = {
    'sky': 'bg-[var(--sky-2)] text-[var(--sky-11)]',
    'teed-green': 'bg-[var(--teed-green-2)] text-[var(--teed-green-11)]',
    'amber': 'bg-[var(--amber-2)] text-[var(--amber-11)]',
    'copper': 'bg-[var(--copper-2)] text-[var(--copper-11)]',
  };

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-4">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value.toLocaleString()}</p>
      <p className="text-sm text-[var(--text-tertiary)]">{label}</p>
    </div>
  );
}

// Activity pill with human verbs
function AppreciationPill({ activity }: { activity: { type: 'view' | 'click' | 'save' | 'clone'; bagTitle: string; date: string } }) {
  const typeConfig = {
    view: { label: 'discovered', color: 'bg-[var(--sky-3)] text-[var(--sky-11)]' },
    click: { label: 'explored', color: 'bg-[var(--teed-green-3)] text-[var(--teed-green-11)]' },
    save: { label: 'saved', color: 'bg-[var(--amber-3)] text-[var(--amber-11)]' },
    clone: { label: 'was inspired by', color: 'bg-[var(--copper-3)] text-[var(--copper-11)]' },
  };

  const config = typeConfig[activity.type];
  const timeAgo = getTimeAgo(new Date(activity.date));

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${config.color}`}>
      Someone {config.label} {activity.bagTitle} <span className="opacity-60">{timeAgo}</span>
    </span>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
