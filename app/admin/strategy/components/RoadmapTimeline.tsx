'use client';

import { useState } from 'react';
import {
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Users,
  Target,
  Search,
} from 'lucide-react';

interface Feature {
  name: string;
  description: string;
  files?: string[];
  status: 'done' | 'in-progress' | 'planned';
}

interface Phase {
  id: string;
  number: number;
  title: string;
  theme: string;
  weeks: string;
  color: string;
  icon: React.ReactNode;
  features: Feature[];
  successMetrics: string[];
}

const existingFeatures: Feature[] = [
  { name: 'Bags with items and links', description: 'Core container system', status: 'done' },
  {
    name: 'Profile blocks',
    description: 'Header, bio, social, embeds, destinations',
    status: 'done',
  },
  { name: 'Affiliate link integration', description: 'Click tracking and analytics', status: 'done' },
  { name: 'QR code generation', description: 'Shareable QR codes', status: 'done' },
  { name: 'Public/private visibility', description: 'Bag access controls', status: 'done' },
  { name: 'Item notes and custom photos', description: 'Personal context per item', status: 'done' },
  { name: 'Featured items system', description: 'Hero items in bags', status: 'done' },
  { name: 'Beta/waitlist system', description: 'Application and invite flow', status: 'done' },
  { name: 'Admin dashboard', description: 'Platform administration', status: 'done' },
  { name: 'Creator analytics', description: 'Clicks and earnings tracking', status: 'done' },
];

const phases: Phase[] = [
  {
    id: 'phase1',
    number: 1,
    title: 'Foundation Enhancement',
    theme: 'Make existing features world-class',
    weeks: 'Weeks 1-4',
    color: 'teed-green',
    icon: <Layers className="w-5 h-5" />,
    features: [
      {
        name: 'Rich Item Context System',
        description:
          '"Why I chose this" narrative field, specs database, comparison notes, alternatives per item',
        files: ['app/u/[handle]/[code]/edit/', 'lib/types/', 'scripts/migrations/'],
        status: 'planned',
      },
      {
        name: 'Enhanced Sharing Experience',
        description:
          'Premium share modal with preview, "share as gift" mode, occasion templates, embed snippets',
        files: ['components/ShareButton.tsx'],
        status: 'planned',
      },
      {
        name: 'Bag Organization',
        description: 'Categories/sections within bags, price range filtering, sort options',
        files: ['app/u/[handle]/[code]/'],
        status: 'planned',
      },
    ],
    successMetrics: [
      'Average items per bag increases 40%',
      'Share completion rate increases 25%',
      'Time on bag page increases',
    ],
  },
  {
    id: 'phase2',
    number: 2,
    title: 'Creator Empowerment',
    theme: 'Help creators build sustainable businesses',
    weeks: 'Weeks 5-8',
    color: 'amber',
    icon: <Users className="w-5 h-5" />,
    features: [
      {
        name: 'Transparent Economics Dashboard',
        description:
          '"Your curations helped X people" messaging, clear earnings display, recommendation revenue breakdown',
        files: ['app/dashboard/'],
        status: 'planned',
      },
      {
        name: 'Version History & Changelogs',
        description:
          'Automatic item change tracking, "Updated March 2026" badges, gear timeline visualization',
        files: ['lib/versioning/', 'scripts/migrations/'],
        status: 'planned',
      },
      {
        name: 'Multi-Bag Profiles',
        description:
          'Bag grouping/collections, profile-level navigation, "related bags" linking',
        files: ['app/u/[handle]/'],
        status: 'planned',
      },
    ],
    successMetrics: [
      'Creator retention improves 30%',
      'Affiliate transparency rated positively',
      'Version history adoption >50%',
    ],
  },
  {
    id: 'phase3',
    number: 3,
    title: 'Use Case Specialization',
    theme: 'Purpose-built experiences for each archetype',
    weeks: 'Weeks 9-12',
    color: 'sky',
    icon: <Target className="w-5 h-5" />,
    features: [
      {
        name: 'Wishlist/Registry Mode',
        description:
          'Gift-optimized layout, privacy controls, price categories, "claimed" tracking, occasion templates',
        files: ['lib/wishlist/'],
        status: 'planned',
      },
      {
        name: 'Brand/Product Launch Features',
        description:
          'Brand verification, product variants, launch scheduling, UTM generation, brand templates',
        files: ['lib/brands/'],
        status: 'planned',
      },
      {
        name: 'Content Creator Integration',
        description:
          'YouTube video linking, Substack RSS integration, "As featured in" badges, content-to-bag deep linking',
        files: ['lib/integrations/'],
        status: 'planned',
      },
    ],
    successMetrics: [
      'Wishlist bags created for occasions',
      'Brand accounts onboarded',
      'Content creator integrations active',
    ],
  },
  {
    id: 'phase4',
    number: 4,
    title: 'Item-Centric Discovery',
    theme: 'Discovery through items, not feeds',
    weeks: 'Weeks 13-16',
    color: 'copper',
    icon: <Search className="w-5 h-5" />,
    features: [
      {
        name: 'Item-Centric Discovery',
        description:
          '"Who else uses this?" → other bags with item. "What do people pair with this?" → related items. Item pages showing all bags.',
        files: ['app/items/[id]/'],
        status: 'planned',
      },
      {
        name: 'Collaboration Features',
        description:
          'Co-created bags (influencer + brand), guest item additions with approval, attribution system',
        files: ['lib/collaboration/'],
        status: 'planned',
      },
      {
        name: 'Product Intelligence',
        description:
          'Item detail pages with aggregated context, "why people choose this" from multiple curators, price tracking',
        files: ['lib/products/'],
        status: 'planned',
      },
    ],
    successMetrics: [
      'Item discovery drives 15% of bag views',
      'Product pages have multiple curator context',
      'Collaboration features used',
    ],
  },
];

export default function RoadmapTimeline() {
  const [expandedPhase, setExpandedPhase] = useState<string>('phase1');
  const [showExisting, setShowExisting] = useState(false);

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <section className="bg-gradient-to-br from-[var(--evergreen-4)] to-[var(--teed-green-4)] rounded-xl p-6">
        <h2 className="text-xl font-bold text-[var(--evergreen-12)] mb-3">
          Product Roadmap
        </h2>
        <p className="text-sm text-[var(--evergreen-11)] leading-relaxed">
          A 16-week roadmap building from strong foundations through creator empowerment to
          specialized use cases and item-centric discovery. Each phase delivers incremental
          value while building toward the complete vision.
        </p>
      </section>

      {/* Existing Features */}
      <section className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)]">
        <button
          onClick={() => setShowExisting(!showExisting)}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[var(--teed-green-11)]" />
            <div className="text-left">
              <span className="font-medium text-[var(--text-primary)]">
                Already Built ({existingFeatures.length} features)
              </span>
              <span className="block text-xs text-[var(--text-secondary)]">
                Core platform functionality
              </span>
            </div>
          </div>
          {showExisting ? (
            <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
          )}
        </button>
        {showExisting && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {existingFeatures.map((feature) => (
                <div
                  key={feature.name}
                  className="flex items-center gap-2 p-2 bg-[var(--teed-green-4)] rounded-lg"
                >
                  <CheckCircle className="w-4 h-4 text-[var(--teed-green-11)] flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-[var(--teed-green-12)]">
                      {feature.name}
                    </span>
                    <span className="block text-xs text-[var(--teed-green-11)]">
                      {feature.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Timeline */}
      <section className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[var(--border-subtle)]" />

        <div className="space-y-4">
          {phases.map((phase, index) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              isExpanded={expandedPhase === phase.id}
              onToggle={() =>
                setExpandedPhase(expandedPhase === phase.id ? '' : phase.id)
              }
              isFirst={index === 0}
              isLast={index === phases.length - 1}
            />
          ))}
        </div>
      </section>

      {/* Summary Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {phases.map((phase) => (
          <div
            key={phase.id}
            className={`p-4 rounded-xl bg-[var(--${phase.color}-4)] border border-[var(--${phase.color}-6)]`}
          >
            <div className={`text-[var(--${phase.color}-11)] mb-2`}>{phase.icon}</div>
            <div className={`font-bold text-lg text-[var(--${phase.color}-12)]`}>
              Phase {phase.number}
            </div>
            <div className={`text-xs text-[var(--${phase.color}-11)]`}>{phase.theme}</div>
            <div className={`text-xs text-[var(--${phase.color}-11)] mt-2`}>
              {phase.features.length} features
            </div>
          </div>
        ))}
      </section>

      {/* Doctrine Note */}
      <section className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-3">
          Discovery Approach (Doctrine-Aligned)
        </h3>
        <div className="bg-[var(--teed-green-4)] rounded-lg p-4">
          <p className="text-sm text-[var(--teed-green-12)] mb-3">
            <strong>Item-Centric Discovery</strong> replaces feed-based discovery:
          </p>
          <ul className="space-y-2 text-sm text-[var(--teed-green-11)]">
            <li>
              <strong>&quot;Who else uses this?&quot;</strong> → See other bags containing the
              same item
            </li>
            <li>
              <strong>&quot;What do people pair with this?&quot;</strong> → Related items from
              same bags
            </li>
            <li>
              <strong>&quot;Other bags by this curator&quot;</strong> → Profile navigation
            </li>
          </ul>
          <p className="text-xs text-[var(--teed-green-11)] mt-3 italic">
            Discovery serves understanding, not engagement. No trending, popular, or
            algorithmic surfaces.
          </p>
        </div>
      </section>
    </div>
  );
}

function PhaseCard({
  phase,
  isExpanded,
  onToggle,
  isFirst,
  isLast,
}: {
  phase: Phase;
  isExpanded: boolean;
  onToggle: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="relative pl-12">
      {/* Timeline dot */}
      <div
        className={`absolute left-4 top-4 w-5 h-5 rounded-full border-2 bg-[var(--surface)] flex items-center justify-center ${
          isExpanded
            ? `border-[var(--${phase.color}-9)]`
            : 'border-[var(--border-default)]'
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            isExpanded ? `bg-[var(--${phase.color}-9)]` : 'bg-[var(--grey-8)]'
          }`}
        />
      </div>

      <div
        className={`bg-[var(--surface)] rounded-xl border transition-all ${
          isExpanded
            ? `border-[var(--${phase.color}-6)] shadow-lg`
            : 'border-[var(--border-subtle)]'
        }`}
      >
        {/* Header */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg bg-[var(--${phase.color}-4)] flex items-center justify-center`}
            >
              <span className={`text-[var(--${phase.color}-11)]`}>{phase.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--text-primary)]">
                  Phase {phase.number}: {phase.title}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full bg-[var(--${phase.color}-4)] text-[var(--${phase.color}-11)]`}
                >
                  {phase.weeks}
                </span>
              </div>
              <span className="text-sm text-[var(--text-secondary)]">{phase.theme}</span>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
          )}
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4">
            {/* Features */}
            <div className="space-y-3">
              {phase.features.map((feature, index) => (
                <div
                  key={feature.name}
                  className="bg-[var(--surface-elevated)] rounded-lg p-4 border border-[var(--border-subtle)]"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full bg-[var(--${phase.color}-4)] flex items-center justify-center flex-shrink-0`}
                    >
                      <span
                        className={`text-xs font-bold text-[var(--${phase.color}-11)]`}
                      >
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-[var(--text-primary)]">
                        {feature.name}
                      </h4>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {feature.description}
                      </p>
                      {feature.files && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {feature.files.map((file) => (
                            <span
                              key={file}
                              className="text-xs px-2 py-0.5 bg-[var(--grey-4)] text-[var(--text-tertiary)] rounded font-mono"
                            >
                              {file}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Success Metrics */}
            <div className={`bg-[var(--${phase.color}-4)] rounded-lg p-4`}>
              <h4
                className={`text-sm font-medium text-[var(--${phase.color}-12)] mb-2`}
              >
                Success Metrics
              </h4>
              <ul className="space-y-1">
                {phase.successMetrics.map((metric) => (
                  <li
                    key={metric}
                    className={`text-sm text-[var(--${phase.color}-11)] flex items-center gap-2`}
                  >
                    <Circle className="w-3 h-3" />
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
