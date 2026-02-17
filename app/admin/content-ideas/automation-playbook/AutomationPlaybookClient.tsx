'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Search,
  Eye,
  Package,
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Shield,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

type StepStatus = 'built' | 'partial' | 'not-built';

interface PipelineStep {
  num: number;
  title: string;
  status: StepStatus;
  icon: React.ReactNode;
  description: string;
  details: string[];
  techNotes?: string[];
}

// ─── Data ────────────────────────────────────────────────────────

const STATUS_BADGE: Record<StepStatus, { label: string; className: string; icon: React.ReactNode }> = {
  built: {
    label: 'Built',
    className: 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)]',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  partial: {
    label: 'Partially Built',
    className: 'bg-[var(--amber-4)] text-[var(--amber-11)]',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  'not-built': {
    label: 'Not Built',
    className: 'bg-[var(--grey-4)] text-[var(--grey-11)]',
    icon: <Circle className="w-3.5 h-3.5" />,
  },
};

const PIPELINE_STEPS: PipelineStep[] = [
  {
    num: 1,
    title: 'Discovery',
    status: 'built',
    icon: <Search className="w-5 h-5" />,
    description:
      'Surface fresh, product-centric content from Reddit, YouTube, and TikTok.',
    details: [
      'Reddit: Public JSON API (~60 req/min unauthenticated). Fetches /rising, /new, /hot from 25+ subreddits across 10 categories.',
      'YouTube: Data API v3 with search + video detail calls. 10,000 units/day quota allows 5-10 full scans.',
      'TikTok: No public API. Curated hashtag links for manual browsing.',
      'Scoring algorithm: engagement base + freshness bonus + keyword hits + flair bonus + early comment opportunity.',
    ],
    techNotes: [
      'Implemented in Rising Posts page + /api/admin/rising-posts route.',
      'Python script (teed-rising-posts.py) available for CLI usage.',
    ],
  },
  {
    num: 2,
    title: 'Product Identification',
    status: 'partial',
    icon: <Eye className="w-5 h-5" />,
    description:
      'Extract specific products from post titles, descriptions, images, and video frames.',
    details: [
      'Text parsing pipeline: normalize, dictionary match (680+ brands), pattern extract, product inference.',
      'Image analysis: GPT-4o vision for product identification from photos.',
      'Video pipeline: transcript extraction (yt-dlp), frame sampling, gap resolver for unresolved categories.',
      'Confidence scoring: 90%+ identified, 75-89% best match, <75% possible match.',
    ],
    techNotes: [
      'Text parsing: lib/textParsing/index.ts',
      'Link identification: lib/linkIdentification/index.ts',
      'Video pipeline: lib/videoPipeline/',
      'Gap: Reddit posts need a "read post + comments" step to extract product mentions from flat-lay images and comment threads.',
    ],
  },
  {
    num: 3,
    title: 'Bag Creation',
    status: 'partial',
    icon: <Package className="w-5 h-5" />,
    description:
      'Create a Teed bag from identified products with verified links and images.',
    details: [
      'Existing bag creation scripts (npx tsx scripts/create-*-bag.ts) handle insert + item creation.',
      'MCP server (packages/mcp-server/) provides programmatic bag management.',
      'Link verification protocol: WebSearch for URL discovery, curl for HTTP validation, never fabricate URLs.',
      'Video-to-Bag tool (/admin/tools) handles YouTube/TikTok URL to bag pipeline.',
    ],
    techNotes: [
      'Gap: Automated link finding (Amazon product search, manufacturer lookup) is not reliable enough yet.',
      'Gap: Image sourcing (product photos) still requires manual selection or proxy-image fallback.',
    ],
  },
  {
    num: 4,
    title: 'Comment Composition',
    status: 'not-built',
    icon: <MessageSquare className="w-5 h-5" />,
    description:
      'Generate personalized, helpful comments that reference the original post and link to the Teed bag.',
    details: [
      'Template approach: "Nice [category]! I put together a list of everything here: [link]" with 10+ variants.',
      'LLM-personalized: Read the post, identify 1-2 specific products to compliment, weave in the bag link naturally.',
      'Tone guidelines: Helpful, not salesy. Ask questions. Reference specific items. Never use "check out my..."',
      'Platform-specific: Reddit comments vs YouTube comments vs TikTok reply conventions.',
    ],
    techNotes: [
      'Could use GPT-4o-mini for cost-effective generation (~$0.001/comment).',
      'Need a tone calibration dataset of 50+ hand-written example comments.',
      'A/B testing framework for comment variants needed.',
    ],
  },
  {
    num: 5,
    title: 'Posting',
    status: 'not-built',
    icon: <Send className="w-5 h-5" />,
    description:
      'Post the comment to the original thread using platform APIs.',
    details: [
      'Reddit: OAuth2 app (script type), POST to /api/comment. Rate limit: 10 comments per account per 10 minutes.',
      'YouTube: Comments API with OAuth2. 10,000 unit daily quota (50 units per comment insert).',
      'TikTok: No public comment API. Would require browser automation (high ban risk).',
      'Account management: Multiple accounts for different niches, warming period, karma building.',
    ],
    techNotes: [
      'Reddit API requires account age > 30 days and positive karma.',
      'Bot detection: vary comment timing, never post identical text, mix organic activity.',
      'Human-in-the-loop approval gate strongly recommended before any automated posting.',
    ],
  },
];

const RISKS = [
  {
    title: 'Platform Terms of Service',
    level: 'high' as const,
    description:
      'Reddit and YouTube ToS prohibit automated promotional posting. Violation leads to account suspension.',
    mitigation:
      'Human approval gate, authentic engagement style, comply with self-promotion rules (Reddit: 10% rule).',
  },
  {
    title: 'Ban Risk',
    level: 'high' as const,
    description:
      'Subreddit-level bans for perceived spam. Some subs (r/battlestations, r/EDC) have strict self-promo rules.',
    mitigation:
      'Start with permissive subs. Build genuine karma. Mix promotional and non-promotional comments 1:9 ratio.',
  },
  {
    title: 'Rate Limits',
    level: 'medium' as const,
    description:
      'Reddit: ~100 API calls/min. YouTube: 10K units/day. Exceeding limits causes 429 errors or temp bans.',
    mitigation:
      'Batch requests, respect rate limits, queue comments with jitter, monitor quota usage.',
  },
  {
    title: 'Quality Degradation',
    level: 'medium' as const,
    description:
      'LLM-generated comments may feel generic or "off" to communities that value authenticity.',
    mitigation:
      'Always review first 100 comments manually. Establish quality rubric. Kill switch for automation.',
  },
];

const ROADMAP = [
  {
    phase: 'Phase 1: Manual + Tooling',
    status: 'current' as const,
    items: [
      'Rising Posts discovery page (built)',
      'Video-to-Bag pipeline (built)',
      'Manual comment posting using discovered posts',
      'Track which posts were engaged and measure response',
    ],
  },
  {
    phase: 'Phase 2: Semi-Automated',
    status: 'future' as const,
    items: [
      'One-click bag creation from Rising Posts cards',
      'LLM-drafted comments with human approval',
      'Queue system: draft, review, approve, post',
      'Analytics: track comment performance, bag visits from comments',
    ],
  },
  {
    phase: 'Phase 3: Fully Automated',
    status: 'future' as const,
    items: [
      'End-to-end: discover, identify, create bag, compose comment, post',
      'Confidence thresholds: auto-post if score > X, else queue for review',
      'Multi-account rotation with warming schedules',
      'Real-time monitoring dashboard with kill switch',
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────

export default function AutomationPlaybookClient() {
  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/admin/content-ideas"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Rising Posts
          </Link>

          <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-[var(--evergreen-11)]" />
            Automation Playbook
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 max-w-2xl">
            Analysis of what it takes to fully automate the pipeline from content
            discovery to bag creation to comment posting. Each step details
            what&apos;s built, what&apos;s missing, and the risks involved.
          </p>
        </div>

        {/* Pipeline Overview */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            Pipeline Overview
          </h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.num} className="flex items-center gap-2">
                <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-secondary)]">
                    {step.icon}
                  </span>
                  <div>
                    <div className="text-xs font-medium text-[var(--text-primary)] whitespace-nowrap">
                      {step.title}
                    </div>
                    <div
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${STATUS_BADGE[step.status].className}`}
                    >
                      {STATUS_BADGE[step.status].icon}
                      {STATUS_BADGE[step.status].label}
                    </div>
                  </div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Pipeline Steps Detail */}
        <section className="space-y-8 mb-12">
          {PIPELINE_STEPS.map((step) => {
            const badge = STATUS_BADGE[step.status];
            return (
              <div
                key={step.num}
                className="p-6 rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border-subtle)]"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--text-secondary)]">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        Step {step.num}: {step.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 ml-14">
                  {step.details.map((detail, i) => (
                    <li
                      key={i}
                      className="text-sm text-[var(--text-secondary)] leading-relaxed"
                    >
                      {detail}
                    </li>
                  ))}
                </ul>

                {step.techNotes && step.techNotes.length > 0 && (
                  <div className="mt-4 ml-14 p-3 rounded-lg bg-[var(--surface-elevated)] text-xs text-[var(--text-secondary)]">
                    <p className="font-medium text-[var(--text-primary)] mb-1">
                      Technical notes:
                    </p>
                    <ul className="space-y-1">
                      {step.techNotes.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Risk Assessment */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[var(--amber-11)]" />
            Risk Assessment
          </h2>
          <div className="space-y-4">
            {RISKS.map((risk) => (
              <div
                key={risk.title}
                className="p-4 rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border-subtle)]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      risk.level === 'high'
                        ? 'text-red-500'
                        : 'text-[var(--amber-11)]'
                    }`}
                  />
                  <h3 className="font-medium text-[var(--text-primary)]">
                    {risk.title}
                  </h3>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      risk.level === 'high'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-[var(--amber-4)] text-[var(--amber-11)]'
                    }`}
                  >
                    {risk.level}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  {risk.description}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">
                    Mitigation:
                  </span>{' '}
                  {risk.mitigation}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Roadmap */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            Roadmap
          </h2>
          <div className="space-y-6">
            {ROADMAP.map((phase) => (
              <div
                key={phase.phase}
                className="p-4 rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border-subtle)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-medium text-[var(--text-primary)]">
                    {phase.phase}
                  </h3>
                  {phase.status === 'current' && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--teed-green-4)] text-[var(--teed-green-11)]">
                      Current
                    </span>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {phase.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                    >
                      {phase.status === 'current' ? (
                        <CheckCircle2 className="w-4 h-4 text-[var(--teed-green-11)] shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-[var(--grey-8)] shrink-0 mt-0.5" />
                      )}
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
