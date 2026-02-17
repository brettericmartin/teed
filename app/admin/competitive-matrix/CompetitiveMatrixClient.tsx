'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  X,
  Minus,
  Target,
  Users,
  Zap,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Crown,
} from 'lucide-react';

type TabId = 'matrix' | 'gaps' | 'playbook';

interface FeatureRow {
  feature: string;
  category: string;
  teed: 'yes' | 'no' | 'partial' | 'planned';
  linktree: 'yes' | 'no' | 'partial' | 'planned';
  beacons: 'yes' | 'no' | 'partial' | 'planned';
  stan: 'yes' | 'no' | 'partial' | 'planned';
  kit: 'yes' | 'no' | 'partial' | 'planned';
  amazon: 'yes' | 'no' | 'partial' | 'planned';
  note?: string;
}

const FEATURES: FeatureRow[] = [
  // Product Intelligence
  { feature: 'AI product identification (text)', category: 'Product Intelligence', teed: 'yes', linktree: 'no', beacons: 'no', stan: 'no', kit: 'no', amazon: 'partial', note: 'Amazon matches to own catalog only' },
  { feature: 'AI product identification (vision)', category: 'Product Intelligence', teed: 'yes', linktree: 'no', beacons: 'no', stan: 'no', kit: 'no', amazon: 'no' },
  { feature: 'Video-to-collection pipeline', category: 'Product Intelligence', teed: 'yes', linktree: 'no', beacons: 'no', stan: 'no', kit: 'no', amazon: 'no', note: 'Nobody else offers this' },
  { feature: 'Brand/model database (680+)', category: 'Product Intelligence', teed: 'yes', linktree: 'no', beacons: 'no', stan: 'no', kit: 'no', amazon: 'yes', note: 'Amazon has product catalog, not brand intelligence' },
  { feature: 'Product categorization', category: 'Product Intelligence', teed: 'yes', linktree: 'no', beacons: 'no', stan: 'no', kit: 'no', amazon: 'yes' },
  { feature: 'Structured product data (JSON-LD ready)', category: 'Product Intelligence', teed: 'partial', linktree: 'no', beacons: 'no', stan: 'no', kit: 'no', amazon: 'yes', note: 'P0 priority to add' },
  // Curation & Display
  { feature: 'Organized product collections', category: 'Curation & Display', teed: 'yes', linktree: 'partial', beacons: 'partial', stan: 'partial', kit: 'no', amazon: 'yes', note: 'Linktree/Beacons have links, not product-aware collections' },
  { feature: '"Why I chose this" context', category: 'Curation & Display', teed: 'yes', linktree: 'no', beacons: 'no', stan: 'no', kit: 'no', amazon: 'partial', note: 'Amazon has video reviews, not per-product context' },
  { feature: 'Section-based organization', category: 'Curation & Display', teed: 'yes', linktree: 'partial', beacons: 'partial', stan: 'no', kit: 'no', amazon: 'yes' },
  { feature: 'Cover photos / visual collections', category: 'Curation & Display', teed: 'yes', linktree: 'yes', beacons: 'yes', stan: 'yes', kit: 'no', amazon: 'yes' },
  { feature: 'Mobile-responsive design', category: 'Curation & Display', teed: 'yes', linktree: 'yes', beacons: 'yes', stan: 'yes', kit: 'yes', amazon: 'yes' },
  // Monetization
  { feature: 'Multi-retailer affiliate links', category: 'Monetization', teed: 'yes', linktree: 'partial', beacons: 'partial', stan: 'no', kit: 'no', amazon: 'no', note: 'Linktree/Beacons support links but no auto-conversion' },
  { feature: 'Auto affiliate tag insertion', category: 'Monetization', teed: 'yes', linktree: 'no', beacons: 'no', stan: 'no', kit: 'no', amazon: 'yes' },
  { feature: 'Digital product sales', category: 'Monetization', teed: 'no', linktree: 'partial', beacons: 'yes', stan: 'yes', kit: 'yes', amazon: 'no' },
  { feature: 'Paid subscriptions', category: 'Monetization', teed: 'no', linktree: 'no', beacons: 'yes', stan: 'yes', kit: 'yes', amazon: 'no' },
  { feature: 'Built-in FTC disclosure', category: 'Monetization', teed: 'yes', linktree: 'no', beacons: 'no', stan: 'no', kit: 'no', amazon: 'yes' },
  { feature: '0% transaction fee (free tier)', category: 'Monetization', teed: 'yes', linktree: 'yes', beacons: 'no', stan: 'no', kit: 'yes', amazon: 'yes', note: 'Beacons charges 9% on free tier' },
  // Distribution
  { feature: 'Embeddable on external sites', category: 'Distribution', teed: 'yes', linktree: 'no', beacons: 'no', stan: 'no', kit: 'no', amazon: 'no', note: 'Major differentiator' },
  { feature: 'Permanent shareable URLs', category: 'Distribution', teed: 'yes', linktree: 'yes', beacons: 'yes', stan: 'yes', kit: 'no', amazon: 'yes' },
  { feature: 'Custom domains', category: 'Distribution', teed: 'no', linktree: 'yes', beacons: 'yes', stan: 'no', kit: 'no', amazon: 'no' },
  { feature: 'SEO-optimized pages', category: 'Distribution', teed: 'yes', linktree: 'partial', beacons: 'partial', stan: 'partial', kit: 'no', amazon: 'yes' },
  { feature: 'RSS / API access', category: 'Distribution', teed: 'partial', linktree: 'no', beacons: 'no', stan: 'no', kit: 'yes', amazon: 'partial' },
  // Platform
  { feature: 'Free tier', category: 'Platform', teed: 'yes', linktree: 'yes', beacons: 'yes', stan: 'no', kit: 'yes', amazon: 'yes', note: 'Stan starts at $29/mo' },
  { feature: 'Email marketing', category: 'Platform', teed: 'no', linktree: 'no', beacons: 'yes', stan: 'partial', kit: 'yes', amazon: 'no' },
  { feature: 'Analytics dashboard', category: 'Platform', teed: 'yes', linktree: 'yes', beacons: 'yes', stan: 'yes', kit: 'yes', amazon: 'yes' },
  { feature: 'AI content generation', category: 'Platform', teed: 'no', linktree: 'planned', beacons: 'yes', stan: 'no', kit: 'yes', amazon: 'no' },
  { feature: 'Cross-creator discovery', category: 'Platform', teed: 'yes', linktree: 'no', beacons: 'no', stan: 'no', kit: 'no', amazon: 'yes', note: 'Amazon discovers across storefronts; Teed across bags' },
];

const GAPS = [
  {
    gap: 'No creator tool understands what products ARE',
    severity: 'critical' as const,
    opportunity: 'Teed\'s product intelligence pipeline is the only system that knows a "Titleist TSR3" is a golf driver vs a "Sony A7IV" is a camera. This enables cross-creator discovery, category analytics, and AI-readable structured data.',
    captureAction: 'Lean hard into "smart bags" messaging. Every competitor shows "links." Teed shows "products with context."',
  },
  {
    gap: 'Video content cannot be converted to product pages',
    severity: 'critical' as const,
    opportunity: '"What\'s in my bag" is one of the most popular YouTube formats. Creators spend hours manually building gear lists from their own videos. Teed\'s video-to-bag pipeline does this in 60 seconds.',
    captureAction: 'Target YouTubers with gear-heavy content. DM with their own video turned into a Teed bag. Show, don\'t tell.',
  },
  {
    gap: 'Link-in-bio tools cannot be embedded elsewhere',
    severity: 'high' as const,
    opportunity: 'Creators use their gear lists in YouTube descriptions, blog posts, newsletters, and social bios. Linktree/Beacons only work as standalone pages. Teed embeds work everywhere.',
    captureAction: 'Target newsletter creators (Substack, beehiiv, Kit). "Embed your gear recommendations directly in your newsletter."',
  },
  {
    gap: 'No automatic affiliate tag conversion across retailers',
    severity: 'high' as const,
    opportunity: 'Creators manually construct affiliate URLs for every product. Teed auto-inserts platform affiliate tags for Amazon, Impact, CJ, and more.',
    captureAction: 'Show revenue calculators: "You\'re leaving $X/month on the table by not auto-converting your product links."',
  },
  {
    gap: 'No "why I chose this" layer on any competitor',
    severity: 'medium' as const,
    opportunity: 'Personal context is the trust signal AI cannot generate. McKinsey data shows UGC dominates AI shopping sources. Contextual recommendations are more valuable than generic ones.',
    captureAction: 'Position Teed as "the platform that makes your expertise visible to AI shopping agents."',
  },
  {
    gap: 'Amazon scraping creates creator backlash — no trusted alternative',
    severity: 'high' as const,
    opportunity: 'Amazon\'s Buy for Me auto-lists products without creator consent. Creators angry about losing control. Teed gives creators OWNERSHIP of how their recommendations appear.',
    captureAction: 'Run anti-Amazon content campaign: "Own your recommendations. Don\'t let AI scrape them." Target the backlash moment.',
  },
];

const PERSONAS = [
  {
    name: 'The YouTuber with a Gear Page',
    description: 'Has 10K-500K subscribers. Maintains a manual gear list on their website or in video descriptions. Spends 1-2 hours per video updating links.',
    currentTools: 'Personal website, Amazon Storefront, sometimes Linktree',
    painPoints: ['Manual product link management', 'Broken links over time', 'No analytics on which gear people actually check', 'Hours spent building gear pages from video content'],
    captureHook: 'Paste your latest video URL. Get a gear page in 60 seconds.',
    channel: 'YouTube comment outreach, creator Discord communities, Twitter/X',
  },
  {
    name: 'The Instagram Influencer',
    description: 'Has 5K-100K followers. Uses Linktree or Beacons. Links to products but can\'t organize by category or add context.',
    currentTools: 'Linktree, Beacons, LTK',
    painPoints: ['Products are just links with no context', 'Can\'t organize gear by category', 'Linktree doesn\'t understand what they\'re linking to', 'No "why I chose this" for building trust'],
    captureHook: 'Import your Linktree in one click. Get product cards with context instead of plain links.',
    channel: 'Instagram DMs, influencer marketing communities, r/CreatorsAdvice',
  },
  {
    name: 'The Niche Expert',
    description: 'Golfer, photographer, audiophile, home office enthusiast. Deep knowledge in one category. Wants to share their setup with credibility.',
    currentTools: 'Blog posts, Reddit, Amazon Storefront, spreadsheets',
    painPoints: ['No platform designed for product expertise', 'Blog posts are hard to update', 'Spreadsheets aren\'t shareable', 'Amazon locks them to one retailer'],
    captureHook: 'Build the definitive gear page for your hobby. AI fills in the product details, you add the expertise.',
    channel: 'Niche subreddits, Facebook groups, niche forums, golf/photo/tech communities',
  },
  {
    name: 'The Newsletter Creator',
    description: 'Writes on Substack, beehiiv, or Kit. Recommends products in every issue. Links are plain text with no visual appeal.',
    currentTools: 'beehiiv, Substack, Kit (ConvertKit)',
    painPoints: ['Product recommendations are just text links in emails', 'No embeddable product cards for newsletters', 'Can\'t track which product recommendations drive clicks', 'beehiiv just built link-in-bio but it\'s basic'],
    captureHook: 'Embed a beautiful product card in your next newsletter. One line of HTML.',
    channel: 'beehiiv community, Substack creator groups, newsletter Twitter',
  },
];

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'yes':
      return <Check className="w-4 h-4 text-[var(--teed-green-11)]" />;
    case 'no':
      return <X className="w-4 h-4 text-[var(--grey-8)]" />;
    case 'partial':
      return <Minus className="w-4 h-4 text-[var(--amber-11)]" />;
    case 'planned':
      return <span className="text-xs text-[var(--sky-11)]">Soon</span>;
    default:
      return null;
  }
}

export default function CompetitiveMatrixClient() {
  const [activeTab, setActiveTab] = useState<TabId>('matrix');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'matrix', label: 'Feature Matrix', icon: <Target className="w-4 h-4" /> },
    { id: 'gaps', label: 'Gap Analysis', icon: <Zap className="w-4 h-4" /> },
    { id: 'playbook', label: 'Persona Playbook', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen pt-16 bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 hover:bg-[var(--grey-4)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                Competitive Matrix
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Feature comparison, gap analysis, and persona-based capture strategies
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-[var(--surface)] border-b border-[var(--border-subtle)] sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[var(--evergreen-4)] text-[var(--evergreen-11)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--grey-4)]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'matrix' && <MatrixTab filterCategory={filterCategory} setFilterCategory={setFilterCategory} />}
        {activeTab === 'gaps' && <GapsTab />}
        {activeTab === 'playbook' && <PlaybookTab />}
      </main>
    </div>
  );
}

function MatrixTab({ filterCategory, setFilterCategory }: { filterCategory: string; setFilterCategory: (c: string) => void }) {
  const categories = ['all', ...Array.from(new Set(FEATURES.map(f => f.category)))];
  const filtered = filterCategory === 'all' ? FEATURES : FEATURES.filter(f => f.category === filterCategory);

  // Count wins per platform
  const platforms = ['teed', 'linktree', 'beacons', 'stan', 'kit', 'amazon'] as const;
  const wins = Object.fromEntries(
    platforms.map(p => [p, FEATURES.filter(f => f[p] === 'yes').length])
  );

  return (
    <div className="space-y-8">
      {/* Scoreboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {([
          { key: 'teed', label: 'Teed', highlight: true },
          { key: 'linktree', label: 'Linktree', highlight: false },
          { key: 'beacons', label: 'Beacons', highlight: false },
          { key: 'stan', label: 'Stan Store', highlight: false },
          { key: 'kit', label: 'Kit', highlight: false },
          { key: 'amazon', label: 'Amazon', highlight: false },
        ] as const).map(({ key, label, highlight }) => (
          <div
            key={key}
            className={`rounded-xl p-4 text-center ${
              highlight
                ? 'bg-gradient-to-br from-[var(--teed-green-4)] to-[var(--evergreen-4)] border-2 border-[var(--teed-green-6)]'
                : 'bg-[var(--surface)] border border-[var(--border-subtle)]'
            }`}
          >
            <div className={`text-2xl font-bold ${highlight ? 'text-[var(--teed-green-11)]' : 'text-[var(--text-primary)]'}`}>
              {wins[key]}/{FEATURES.length}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">{label}</div>
            {highlight && <Crown className="w-4 h-4 text-[var(--teed-green-11)] mx-auto mt-1" />}
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterCategory === cat
                ? 'bg-[var(--evergreen-4)] text-[var(--evergreen-11)]'
                : 'bg-[var(--grey-4)] text-[var(--text-secondary)] hover:bg-[var(--grey-5)]'
            }`}
          >
            {cat === 'all' ? 'All Features' : cat}
          </button>
        ))}
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="text-left py-3 pr-4 text-[var(--text-secondary)] font-medium min-w-[200px]">Feature</th>
              <th className="text-center py-3 px-2 text-[var(--teed-green-11)] font-bold">Teed</th>
              <th className="text-center py-3 px-2 text-[var(--text-secondary)] font-medium">Linktree</th>
              <th className="text-center py-3 px-2 text-[var(--text-secondary)] font-medium">Beacons</th>
              <th className="text-center py-3 px-2 text-[var(--text-secondary)] font-medium">Stan</th>
              <th className="text-center py-3 px-2 text-[var(--text-secondary)] font-medium">Kit</th>
              <th className="text-center py-3 px-2 text-[var(--text-secondary)] font-medium">Amazon</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const prevCategory = i > 0 ? filtered[i - 1].category : null;
              const showCategoryHeader = row.category !== prevCategory;

              return (
                <>
                  {showCategoryHeader && (
                    <tr key={`cat-${row.category}`}>
                      <td colSpan={7} className="pt-6 pb-2">
                        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                          {row.category}
                        </span>
                      </td>
                    </tr>
                  )}
                  <tr
                    key={row.feature}
                    className="border-b border-[var(--border-subtle)] hover:bg-[var(--grey-3)] transition-colors"
                  >
                    <td className="py-2.5 pr-4">
                      <span className="text-[var(--text-primary)]">{row.feature}</span>
                      {row.note && (
                        <span className="block text-xs text-[var(--text-secondary)] mt-0.5">{row.note}</span>
                      )}
                    </td>
                    <td className="text-center py-2.5 px-2 bg-[var(--teed-green-3)]/30">
                      <div className="flex justify-center"><StatusIcon status={row.teed} /></div>
                    </td>
                    <td className="text-center py-2.5 px-2">
                      <div className="flex justify-center"><StatusIcon status={row.linktree} /></div>
                    </td>
                    <td className="text-center py-2.5 px-2">
                      <div className="flex justify-center"><StatusIcon status={row.beacons} /></div>
                    </td>
                    <td className="text-center py-2.5 px-2">
                      <div className="flex justify-center"><StatusIcon status={row.stan} /></div>
                    </td>
                    <td className="text-center py-2.5 px-2">
                      <div className="flex justify-center"><StatusIcon status={row.kit} /></div>
                    </td>
                    <td className="text-center py-2.5 px-2">
                      <div className="flex justify-center"><StatusIcon status={row.amazon} /></div>
                    </td>
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-[var(--teed-green-11)]" />
          <span>Full support</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Minus className="w-3.5 h-3.5 text-[var(--amber-11)]" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <X className="w-3.5 h-3.5 text-[var(--grey-8)]" />
          <span>Not supported</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--sky-11)]">Soon</span>
          <span>Planned</span>
        </div>
      </div>
    </div>
  );
}

function GapsTab() {
  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-[var(--amber-4)] to-[var(--copper-4)] rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          Competitive Gaps Teed Fills
        </h2>
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
          Each gap represents a real user pain point that no existing platform addresses.
          These aren&apos;t theoretical — they&apos;re validated by the research, Reddit discussions, and market data.
        </p>
      </section>

      <div className="space-y-4">
        {GAPS.map((gap) => (
          <div
            key={gap.gap}
            className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                gap.severity === 'critical'
                  ? 'text-red-500'
                  : gap.severity === 'high'
                    ? 'text-[var(--amber-11)]'
                    : 'text-[var(--sky-11)]'
              }`} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{gap.gap}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    gap.severity === 'critical'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : gap.severity === 'high'
                        ? 'bg-[var(--amber-4)] text-[var(--amber-11)]'
                        : 'bg-[var(--sky-4)] text-[var(--sky-11)]'
                  }`}>
                    {gap.severity}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[var(--grey-3)] rounded-lg p-4">
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Opportunity</span>
                <p className="text-sm text-[var(--text-primary)] mt-2">{gap.opportunity}</p>
              </div>
              <div className="bg-[var(--teed-green-4)] rounded-lg p-4">
                <span className="text-xs font-medium text-[var(--teed-green-11)] uppercase tracking-wider">Capture Action</span>
                <p className="text-sm text-[var(--teed-green-12)] mt-2">{gap.captureAction}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaybookTab() {
  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-[var(--evergreen-4)] to-[var(--teed-green-4)] rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-[var(--evergreen-11)] mb-4">
          Persona-Based Capture Playbook
        </h2>
        <p className="text-lg text-[var(--evergreen-12)] leading-relaxed">
          Four creator personas, their current tools, pain points, and exactly how to convert them.
          Each persona represents a distinct acquisition channel.
        </p>
      </section>

      <div className="space-y-6">
        {PERSONAS.map((persona) => (
          <div
            key={persona.name}
            className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{persona.name}</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">{persona.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Current Tools</span>
                  <p className="text-sm text-[var(--text-primary)] mt-1">{persona.currentTools}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Acquisition Channel</span>
                  <p className="text-sm text-[var(--text-primary)] mt-1">{persona.channel}</p>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Pain Points</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {persona.painPoints.map((pain) => (
                    <span
                      key={pain}
                      className="text-xs bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 px-2.5 py-1 rounded-full"
                    >
                      {pain}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--teed-green-4)] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-[var(--teed-green-11)]" />
                  <span className="text-xs font-medium text-[var(--teed-green-11)] uppercase tracking-wider">Capture Hook</span>
                </div>
                <p className="text-sm font-medium text-[var(--teed-green-12)]">&ldquo;{persona.captureHook}&rdquo;</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-3">Acquisition Priority Order</h3>
        <ol className="space-y-2 text-sm text-[var(--text-secondary)]">
          <li className="flex items-start gap-2">
            <span className="font-bold text-[var(--teed-green-11)]">1.</span>
            <span><strong>YouTubers with gear pages</strong> — Highest intent, most pain, video-to-bag pipeline is the killer demo.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-[var(--teed-green-11)]">2.</span>
            <span><strong>Niche experts</strong> — Deep product knowledge, will create the highest-quality bags, best for SEO.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-[var(--teed-green-11)]">3.</span>
            <span><strong>Newsletter creators</strong> — Embed widgets solve a real gap. Growing fastest as a creator channel.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-[var(--teed-green-11)]">4.</span>
            <span><strong>Instagram influencers</strong> — Largest pool but lowest product depth. Import-from-Linktree lowers switching cost.</span>
          </li>
        </ol>
      </div>

      {/* Research Date */}
      <div className="bg-[var(--grey-3)] rounded-lg p-4 text-sm text-[var(--text-secondary)]">
        Research compiled February 16, 2026. Based on: 8 Reddit threads, 40+ web sources,
        market reports from eMarketer, Digiday, GlobeNewsWire, McKinsey, and MarTech.
      </div>
    </div>
  );
}
