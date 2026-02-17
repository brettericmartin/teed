'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Zap,
  ShoppingCart,
  Eye,
  Brain,
  Shield,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Users,
  Sparkles,
  Globe,
} from 'lucide-react';

type TabId = 'landscape' | 'moat' | 'capture' | 'timeline';

const PLAYERS = [
  {
    name: 'Amazon "Buy for Me"',
    description: 'AI agent that scrapes third-party sites and purchases on behalf of shoppers. Powered by Amazon Nova + Anthropic Claude.',
    threat: 'high' as const,
    status: 'Live, expanding rapidly',
    impact: 'Disintermediates brands — retailers found products listed without consent. Shopify/WooCommerce stores auto-opted in.',
    teedAngle: 'Creator bags become a TRUST signal that counters Amazon\'s anonymous scraping. When a creator says "I use this," it carries weight that algorithmic product matching cannot replicate.',
  },
  {
    name: 'ChatGPT Shopping Research',
    description: 'Personalized buyer\'s guides built from internet-wide product research. Instant Checkout with Walmart, Target, Etsy, Shopify.',
    threat: 'high' as const,
    status: 'Live on all ChatGPT tiers',
    impact: '40-55% of consumers now use AI search for purchasing decisions (McKinsey). Brand sites only appear in 5-10% of AI sources — affiliates and UGC do 90-95%.',
    teedAngle: 'Teed bags ARE the UGC that ChatGPT sources. Structured product data + creator context makes bags ideal training/citation material for AI shopping agents.',
  },
  {
    name: 'Google Lens + AI Mode',
    description: '20B visual searches/month, 4B shopping-related. AI Mode inserts product panels into conversational search.',
    threat: 'medium' as const,
    status: 'Live, Agentic Checkout at NRF 2026',
    impact: 'Visual search market growing from $40B to $150B by 2032. Product panels show price, images, merchant names before touching a product page.',
    teedAngle: 'Teed\'s vision AI pipeline (text parsing, image identification, video extraction) mirrors what Lens does — but for CREATORS instead of SHOPPERS. Same tech, opposite direction.',
  },
  {
    name: 'Criteo Agentic Commerce',
    description: 'B2B recommendation service powering third-party AI shopping assistants. 60% improvement in relevancy vs generic approaches.',
    threat: 'low' as const,
    status: 'Launched Jan 2026',
    impact: 'Infrastructure play — powers other agents, not consumer-facing. Sets quality bar for product recommendations.',
    teedAngle: 'Validates that structured product data + context dramatically improves recommendations. Teed\'s product library is exactly this kind of structured intelligence.',
  },
  {
    name: 'TikTok Shop',
    description: 'Algorithm-driven commerce inside the feed. Growing fastest among social commerce platforms.',
    threat: 'medium' as const,
    status: 'Projected to surpass major retailers in 2026',
    impact: 'U.S. social commerce to surpass $100B in 2026. Excels at impulse purchases for low-price, trend-driven items.',
    teedAngle: 'TikTok Shop is ephemeral — products surface and disappear in the feed. Teed bags are permanent. Creators can link their TikTok content to a lasting gear page.',
  },
];

const MOAT_LAYERS = [
  {
    title: 'Product Intelligence Pipeline',
    description: 'Multi-stage AI identification: text parsing (680+ brand dictionary) → library lookup → AI enrichment → vision AI → graceful fallback. No other creator tool understands WHAT a product is.',
    strength: 'strong' as const,
    competitors: 'Linktree/Beacons treat products as opaque URLs. They don\'t know a Sony A7IV from a Titleist TSR3.',
  },
  {
    title: 'Structured Product Graph',
    description: 'Every item has brand, model, category, specs — not just a URL. Enables cross-creator discovery, category analytics, and AI-readable collections.',
    strength: 'strong' as const,
    competitors: 'Amazon has a product graph for THEIR catalog. Teed has one for CREATOR recommendations across all retailers.',
  },
  {
    title: 'Video-to-Bag Pipeline',
    description: 'Extract products from YouTube/TikTok videos using transcripts + vision AI + gap resolver. Turn a 20-minute video into a curated collection.',
    strength: 'strong' as const,
    competitors: 'No competitor offers this. Closest is Google Lens identifying individual products from video frames — but that\'s for shoppers, not creators.',
  },
  {
    title: 'Creator Context Layer',
    description: '"Why I chose this" fields, personal stories, usage notes. The human layer that AI shopping agents cannot generate.',
    strength: 'unique' as const,
    competitors: 'AI agents optimize for relevancy. Teed optimizes for trust. These are complementary — Teed provides what AI cites.',
  },
  {
    title: 'Permanent, Embeddable Collections',
    description: 'Stable URLs that work in YouTube descriptions for years. Embeddable on any site. Not a feed that scrolls past.',
    strength: 'moderate' as const,
    competitors: 'Linktree has stable URLs but no product intelligence. Stan Store has commerce but no embeds. Beacons has both but treats products as links.',
  },
];

const CAPTURE_STRATEGIES = [
  {
    priority: 'P0' as const,
    title: 'AI-Readable Bag Schema',
    description: 'Add structured data (JSON-LD, Open Graph product markup) to every public bag so ChatGPT, Perplexity, and Google AI Mode can cite and recommend from Teed bags directly.',
    metric: 'Bags appearing in AI shopping results',
    effort: 'Medium (2-3 weeks)',
    rationale: 'Brand sites show up in 5-10% of AI sources; UGC does 90-95%. Make Teed bags the highest-quality UGC for AI agents to consume.',
  },
  {
    priority: 'P0' as const,
    title: '"Paste a Video, Get a Bag" Public Launch',
    description: 'Make the video-to-bag pipeline available to creators (not just admin). Drop a YouTube/TikTok URL, get a pre-populated gear collection in 60 seconds.',
    metric: 'Bags created from video URLs per week',
    effort: 'Medium (pipeline exists, need UI + auth)',
    rationale: 'No competitor can do this. It\'s the single most differentiated onboarding flow possible. Turns a 2-hour manual process into 60 seconds.',
  },
  {
    priority: 'P1' as const,
    title: 'Creator Import from Existing Gear Pages',
    description: 'Build an importer that scrapes a creator\'s existing gear page (blog, Linktree, Amazon storefront) and pre-populates a Teed bag with identified products.',
    metric: 'Imported bags per week, conversion to active users',
    effort: 'High (3-4 weeks)',
    rationale: 'Reduces switching cost to near zero. "Your gear page, but it actually understands your products."',
  },
  {
    priority: 'P1' as const,
    title: 'Perplexity / ChatGPT Citation Partnership',
    description: 'Reach out to AI shopping teams about Teed bags as a structured source for creator product recommendations. Provide API access to bag data.',
    metric: 'Partnership conversations started, API access granted',
    effort: 'Low effort, high leverage',
    rationale: 'If ChatGPT Shopping cites a Teed bag instead of a random blog post, that\'s massive distribution for zero cost.',
  },
  {
    priority: 'P2' as const,
    title: 'Visual Product Scanner for Creators',
    description: 'Mobile-first: snap a photo of your desk/bag/setup, AI identifies all visible products and creates a draft collection.',
    metric: 'Items identified per scan, scan-to-bag conversion rate',
    effort: 'High (4-6 weeks, mobile camera integration)',
    rationale: 'Google Lens does this for shoppers. Nobody does it for creators. "Photograph your setup, share it in 30 seconds."',
  },
  {
    priority: 'P2' as const,
    title: 'Embeddable Bag Widgets for Newsletters',
    description: 'One-click embed for Substack, beehiiv, Kit, Ghost. Creator recommends a product in their newsletter → inline Teed card with affiliate link.',
    metric: 'Embed installations, click-through rate from embeds',
    effort: 'Medium (embed system exists, need newsletter-optimized format)',
    rationale: 'Newsletters are the fastest-growing creator channel. beehiiv just built link-in-bio into their platform — meet them where they are.',
  },
  {
    priority: 'P2' as const,
    title: 'Anti-Amazon Positioning Campaign',
    description: 'Content campaign highlighting Amazon\'s Buy for Me controversy: "Your recommendations, not Amazon\'s AI." Target creators who are angry about unauthorized scraping.',
    metric: 'Signups from campaign landing page',
    effort: 'Low (content + landing page)',
    rationale: 'Amazon\'s backlash is real (CNBC, TechCrunch coverage). Creators who care about owning their recommendations are the exact Teed audience.',
  },
];

const TIMELINE_EVENTS = [
  { date: 'Nov 2025', event: 'ChatGPT Shopping Research launches', category: 'ai' as const },
  { date: 'Nov 2025', event: 'Linktree acquires Fingertip', category: 'competitor' as const },
  { date: 'Jan 2026', event: 'Criteo launches Agentic Commerce Service', category: 'ai' as const },
  { date: 'Jan 2026', event: 'Amazon Buy for Me backlash goes mainstream (CNBC)', category: 'ai' as const },
  { date: 'Jan 2026', event: 'NRF 2026: Google unveils Agentic Checkout in Gemini', category: 'ai' as const },
  { date: 'Jan 2026', event: 'Fanvue hits $100M run rate, raises $22M Series A', category: 'market' as const },
  { date: 'Feb 2026', event: 'OpenAI signs Instant Checkout deals with Walmart, Target, Etsy', category: 'ai' as const },
  { date: 'Feb 2026', event: 'Creator monetization platform market report: $13.94B (GlobeNewsWire)', category: 'market' as const },
  { date: 'Feb 2026', event: 'r/SaaS: "link-in-bio tools are a scam and here\'s why"', category: 'competitor' as const },
];

export default function AgenticCommerceClient() {
  const [activeTab, setActiveTab] = useState<TabId>('landscape');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'landscape', label: 'AI Landscape', icon: <Globe className="w-4 h-4" /> },
    { id: 'moat', label: 'Teed\'s Moat', icon: <Shield className="w-4 h-4" /> },
    { id: 'capture', label: 'Capture Playbook', icon: <Target className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <TrendingUp className="w-4 h-4" /> },
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
                Agentic Commerce Deep Dive
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                AI shopping landscape, competitive moat, and user capture strategies
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
        {activeTab === 'landscape' && <LandscapeTab />}
        {activeTab === 'moat' && <MoatTab />}
        {activeTab === 'capture' && <CaptureTab />}
        {activeTab === 'timeline' && <TimelineTab />}
      </main>
    </div>
  );
}

function LandscapeTab() {
  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <section className="bg-gradient-to-br from-[var(--sky-4)] to-[var(--evergreen-4)] rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          The AI Shopping Wars — February 2026
        </h2>
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-6">
          Three trillion-dollar companies are racing to become the default interface between people and products.
          Amazon, OpenAI, and Google are all building AI agents that discover, recommend, and purchase products
          autonomously. This fundamentally changes how creator recommendations flow to consumers.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white/50 dark:bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-bold text-[var(--text-primary)]">$100B+</div>
            <div className="text-sm text-[var(--text-secondary)]">U.S. social commerce 2026</div>
          </div>
          <div className="bg-white/50 dark:bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-bold text-[var(--text-primary)]">20B</div>
            <div className="text-sm text-[var(--text-secondary)]">Google Lens searches/month</div>
          </div>
          <div className="bg-white/50 dark:bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-bold text-[var(--text-primary)]">40-55%</div>
            <div className="text-sm text-[var(--text-secondary)]">Consumers using AI for purchases</div>
          </div>
          <div className="bg-white/50 dark:bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-bold text-[var(--text-primary)]">$235B</div>
            <div className="text-sm text-[var(--text-secondary)]">Creator economy 2026</div>
          </div>
        </div>
      </section>

      {/* Key Insight */}
      <div className="bg-[var(--amber-4)] border border-[var(--amber-6)] rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[var(--amber-11)] mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-[var(--amber-11)]">Critical Insight</h3>
            <p className="text-sm text-[var(--amber-12)] mt-1">
              Brand websites only appear in 5-10% of AI shopping agent sources. Affiliates and user-generated content
              do 90-95% of the lifting (MarTech/McKinsey). Creator bags with structured product data are exactly
              what AI agents need — and nobody else is building this.
            </p>
          </div>
        </div>
      </div>

      {/* Player Cards */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Major Players</h3>
        <div className="space-y-4">
          {PLAYERS.map((player) => (
            <div
              key={player.name}
              className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-semibold text-[var(--text-primary)]">{player.name}</h4>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    player.threat === 'high'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : player.threat === 'medium'
                        ? 'bg-[var(--amber-4)] text-[var(--amber-11)]'
                        : 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)]'
                  }`}
                >
                  {player.threat === 'high' ? 'High Impact' : player.threat === 'medium' ? 'Medium Impact' : 'Low Impact'}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-3">{player.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-[var(--text-primary)]">Status:</span>
                  <span className="text-[var(--text-secondary)] ml-1">{player.status}</span>
                </div>
                <div>
                  <span className="font-medium text-[var(--text-primary)]">Impact:</span>
                  <span className="text-[var(--text-secondary)] ml-1">{player.impact}</span>
                </div>
                <div className="bg-[var(--teed-green-4)] rounded-lg p-3">
                  <span className="font-medium text-[var(--teed-green-11)]">Teed&apos;s Angle:</span>
                  <span className="text-[var(--teed-green-12)] ml-1">{player.teedAngle}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MoatTab() {
  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-[var(--evergreen-4)] to-[var(--teed-green-4)] rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-[var(--evergreen-11)] mb-4">
          Why Teed Can&apos;t Be Easily Replicated
        </h2>
        <p className="text-lg text-[var(--evergreen-12)] leading-relaxed">
          Link-in-bio tools are feature sets. Teed is a product intelligence layer.
          The difference: Linktree can add AI features to their link pages.
          They cannot retrofit product understanding into an architecture designed around URLs.
        </p>
      </section>

      <div className="space-y-4">
        {MOAT_LAYERS.map((layer, i) => (
          <div
            key={layer.title}
            className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6"
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                layer.strength === 'unique'
                  ? 'bg-purple-100 dark:bg-purple-900/30'
                  : layer.strength === 'strong'
                    ? 'bg-[var(--teed-green-4)]'
                    : 'bg-[var(--amber-4)]'
              }`}>
                <span className="text-lg font-bold text-[var(--text-primary)]">{i + 1}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{layer.title}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    layer.strength === 'unique'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : layer.strength === 'strong'
                        ? 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)]'
                        : 'bg-[var(--amber-4)] text-[var(--amber-11)]'
                  }`}>
                    {layer.strength === 'unique' ? 'Unique to Teed' : layer.strength === 'strong' ? 'Strong Moat' : 'Moderate Moat'}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">{layer.description}</p>
                <div className="bg-[var(--grey-3)] rounded-lg p-3">
                  <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">vs. Competitors:</span>
                  <p className="text-sm text-[var(--text-primary)] mt-1">{layer.competitors}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-3">Moat Summary</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Linktree is using Devin (AI agent) to fix bugs and ship features faster — but that&apos;s
          engineering velocity, not product intelligence. Beacons has AI content generation — but that
          generates marketing copy, not product understanding. Neither can retrofit what Teed has built:
          a pipeline that knows what products ARE, not just where they link TO. This is the difference
          between adding AI features to a link page and building a product intelligence platform from scratch.
        </p>
      </div>
    </div>
  );
}

function CaptureTab() {
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const filtered = filterPriority === 'all'
    ? CAPTURE_STRATEGIES
    : CAPTURE_STRATEGIES.filter(s => s.priority === filterPriority);

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-[var(--amber-4)] to-[var(--copper-4)] rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          User Capture Playbook
        </h2>
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
          Actionable strategies for capturing users based on the agentic commerce landscape.
          Ordered by priority: P0 = do now, P1 = do next, P2 = plan for.
        </p>
      </section>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'P0', 'P1', 'P2'].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterPriority === p
                ? 'bg-[var(--evergreen-4)] text-[var(--evergreen-11)]'
                : 'bg-[var(--grey-4)] text-[var(--text-secondary)] hover:bg-[var(--grey-5)]'
            }`}
          >
            {p === 'all' ? 'All' : p}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((strategy, i) => (
          <div
            key={strategy.title}
            className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  strategy.priority === 'P0'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : strategy.priority === 'P1'
                      ? 'bg-[var(--amber-4)] text-[var(--amber-11)]'
                      : 'bg-[var(--sky-4)] text-[var(--sky-11)]'
                }`}>
                  {strategy.priority}
                </span>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{strategy.title}</h3>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">{strategy.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[var(--grey-3)] rounded-lg p-3">
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Metric</span>
                <p className="text-sm text-[var(--text-primary)] mt-1">{strategy.metric}</p>
              </div>
              <div className="bg-[var(--grey-3)] rounded-lg p-3">
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Effort</span>
                <p className="text-sm text-[var(--text-primary)] mt-1">{strategy.effort}</p>
              </div>
              <div className="bg-[var(--teed-green-4)] rounded-lg p-3">
                <span className="text-xs font-medium text-[var(--teed-green-11)] uppercase tracking-wider">Why Now</span>
                <p className="text-sm text-[var(--teed-green-12)] mt-1">{strategy.rationale}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineTab() {
  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-[var(--sky-4)] to-purple-100 dark:to-purple-900/20 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          Agentic Commerce Timeline
        </h2>
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
          Key events from the last 90 days shaping the AI shopping landscape.
        </p>
      </section>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-[var(--border-subtle)]" />
        <div className="space-y-6">
          {TIMELINE_EVENTS.map((event, i) => (
            <div key={i} className="flex items-start gap-4 ml-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                event.category === 'ai'
                  ? 'bg-[var(--sky-4)]'
                  : event.category === 'competitor'
                    ? 'bg-[var(--amber-4)]'
                    : 'bg-[var(--teed-green-4)]'
              }`}>
                {event.category === 'ai' ? (
                  <Brain className="w-4 h-4 text-[var(--sky-11)]" />
                ) : event.category === 'competitor' ? (
                  <Target className="w-4 h-4 text-[var(--amber-11)]" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-[var(--teed-green-11)]" />
                )}
              </div>
              <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{event.date}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    event.category === 'ai'
                      ? 'bg-[var(--sky-4)] text-[var(--sky-11)]'
                      : event.category === 'competitor'
                        ? 'bg-[var(--amber-4)] text-[var(--amber-11)]'
                        : 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)]'
                  }`}>
                    {event.category === 'ai' ? 'AI Shopping' : event.category === 'competitor' ? 'Competitor' : 'Market'}
                  </span>
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{event.event}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[var(--sky-4)]" />
          <span>AI Shopping</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[var(--amber-4)]" />
          <span>Competitor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[var(--teed-green-4)]" />
          <span>Market</span>
        </div>
      </div>

      {/* Research Date */}
      <div className="bg-[var(--grey-3)] rounded-lg p-4 text-sm text-[var(--text-secondary)]">
        Research compiled February 16, 2026. Sources: MarTech, Modern Retail, eMarketer, Digiday,
        CNBC, TechCrunch, GlobeNewsWire, Morningstar, r/SaaS, r/CreatorsAdvice.
      </div>
    </div>
  );
}
