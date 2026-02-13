'use client';

import { useState } from 'react';
import {
  Check,
  X,
  Minus,
  ExternalLink,
  Info,
  AlertTriangle,
} from 'lucide-react';

interface Competitor {
  name: string;
  tagline: string;
  pricing: string;
  strengths: string[];
  weaknesses: string[];
  features: {
    customDomain: boolean | 'paid';
    unlimitedLinks: boolean;
    affiliateTracking: boolean | 'basic';
    richContext: boolean;
    permanence: boolean;
    noFeed: boolean;
    transparentEconomics: boolean;
  };
}

const competitors: Competitor[] = [
  {
    name: 'Linktree',
    tagline: 'Market leader, simple link aggregation',
    pricing: 'Free - $24/mo',
    strengths: ['Brand recognition', 'Easy setup', 'Large user base'],
    weaknesses: [
      'No custom domains',
      'Instagram marks as spam',
      'Limited customization on free',
      'Account suspensions',
    ],
    features: {
      customDomain: false,
      unlimitedLinks: true,
      affiliateTracking: 'basic',
      richContext: false,
      permanence: false,
      noFeed: true,
      transparentEconomics: false,
    },
  },
  {
    name: 'Beacons',
    tagline: 'AI-powered customization',
    pricing: 'Free - $8/mo+',
    strengths: ['AI design tools', 'High customization', 'Integrations'],
    weaknesses: ['9% transaction fees on free', 'Complex for simple use'],
    features: {
      customDomain: 'paid',
      unlimitedLinks: true,
      affiliateTracking: true,
      richContext: false,
      permanence: false,
      noFeed: false,
      transparentEconomics: false,
    },
  },
  {
    name: 'Stan Store',
    tagline: 'All-in-one monetization storefront',
    pricing: 'No free, 14-day trial',
    strengths: ['One-tap checkout', 'Full storefront', 'Course hosting'],
    weaknesses: ['No free plan', 'Overkill for simple curation'],
    features: {
      customDomain: 'paid',
      unlimitedLinks: true,
      affiliateTracking: true,
      richContext: false,
      permanence: false,
      noFeed: true,
      transparentEconomics: false,
    },
  },
  {
    name: 'Koji',
    tagline: 'Interactive mini-apps',
    pricing: 'Free with app fees',
    strengths: ['Interactive experiences', 'Unique mini-apps'],
    weaknesses: ['Acquired by Linktree', 'Complex for simple links'],
    features: {
      customDomain: false,
      unlimitedLinks: true,
      affiliateTracking: 'basic',
      richContext: false,
      permanence: false,
      noFeed: false,
      transparentEconomics: false,
    },
  },
  {
    name: 'Carrd',
    tagline: 'Budget one-page sites',
    pricing: 'Free - $19/year',
    strengths: ['Extremely affordable', 'Versatile', 'Custom domains'],
    weaknesses: ['Limited e-commerce', 'No affiliate tools', 'Manual setup'],
    features: {
      customDomain: true,
      unlimitedLinks: true,
      affiliateTracking: false,
      richContext: false,
      permanence: false,
      noFeed: true,
      transparentEconomics: false,
    },
  },
  {
    name: 'Shorby',
    tagline: 'Custom domains + retargeting',
    pricing: '$24/mo (no free)',
    strengths: ['Custom domains', 'Retargeting pixels', 'Clean design'],
    weaknesses: ['Expensive', 'No free plan'],
    features: {
      customDomain: true,
      unlimitedLinks: true,
      affiliateTracking: true,
      richContext: false,
      permanence: false,
      noFeed: true,
      transparentEconomics: false,
    },
  },
  {
    name: 'Lnk.bio',
    tagline: 'Auto-updating RSS feeds',
    pricing: 'Free tier available',
    strengths: ['Unlimited free links', 'RSS auto-updates', 'Simple'],
    weaknesses: ['Limited customization', 'Basic analytics'],
    features: {
      customDomain: 'paid',
      unlimitedLinks: true,
      affiliateTracking: false,
      richContext: false,
      permanence: false,
      noFeed: true,
      transparentEconomics: false,
    },
  },
  {
    name: 'Linkin.bio (Later)',
    tagline: 'Shopify-focused e-commerce',
    pricing: 'Free - $33/mo',
    strengths: ['Shopify integration', 'Social media suite', 'ROI tracking'],
    weaknesses: ['Expensive for full features', 'E-commerce focused'],
    features: {
      customDomain: false,
      unlimitedLinks: true,
      affiliateTracking: true,
      richContext: false,
      permanence: false,
      noFeed: false,
      transparentEconomics: false,
    },
  },
];

const teed = {
  name: 'Teed.club',
  tagline: 'Canonical reference + springboard utility',
  pricing: 'TBD',
  strengths: [
    'Optimized for permanence',
    'Rich item context',
    'Transparent economics',
    'No engagement anxiety',
    'Bags > Links hierarchy',
  ],
  weaknesses: ['New to market', 'Building brand awareness'],
  features: {
    customDomain: false, // Future consideration
    unlimitedLinks: true,
    affiliateTracking: true,
    richContext: true,
    permanence: true,
    noFeed: true,
    transparentEconomics: true,
  },
};

export default function CompetitorMatrix() {
  const [showDetails, setShowDetails] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Summary */}
      <section className="bg-gradient-to-br from-[var(--teed-green-4)] to-[var(--evergreen-4)] rounded-xl p-6">
        <h2 className="text-xl font-bold text-[var(--evergreen-12)] mb-3">
          Competitive Landscape Analysis
        </h2>
        <p className="text-sm text-[var(--evergreen-11)] leading-relaxed">
          Analysis of 10+ link-in-bio and curation platforms reveals consistent gaps that Teed
          is uniquely positioned to fill. No existing platform optimizes for permanence,
          provides rich curation context, or offers transparent economics.
        </p>
      </section>

      {/* Feature Comparison Matrix */}
      <section className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
          <h3 className="font-semibold text-[var(--text-primary)]">Feature Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--surface-elevated)]">
                <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">
                  Platform
                </th>
                <th className="text-center px-3 py-3 font-medium text-[var(--text-secondary)]">
                  Custom Domain
                </th>
                <th className="text-center px-3 py-3 font-medium text-[var(--text-secondary)]">
                  Unlimited Links
                </th>
                <th className="text-center px-3 py-3 font-medium text-[var(--text-secondary)]">
                  Affiliate Tracking
                </th>
                <th className="text-center px-3 py-3 font-medium text-[var(--text-secondary)]">
                  Rich Context
                </th>
                <th className="text-center px-3 py-3 font-medium text-[var(--text-secondary)]">
                  Permanence
                </th>
                <th className="text-center px-3 py-3 font-medium text-[var(--text-secondary)]">
                  No Feed
                </th>
                <th className="text-center px-3 py-3 font-medium text-[var(--text-secondary)]">
                  Transparent $
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Teed Row (highlighted) */}
              <tr className="bg-[var(--teed-green-4)] border-y-2 border-[var(--teed-green-6)]">
                <td className="px-4 py-3">
                  <span className="font-bold text-[var(--teed-green-11)]">Teed</span>
                </td>
                <td className="text-center px-3 py-3">
                  <FeatureIcon value={teed.features.customDomain} />
                </td>
                <td className="text-center px-3 py-3">
                  <FeatureIcon value={teed.features.unlimitedLinks} />
                </td>
                <td className="text-center px-3 py-3">
                  <FeatureIcon value={teed.features.affiliateTracking} />
                </td>
                <td className="text-center px-3 py-3">
                  <FeatureIcon value={teed.features.richContext} />
                </td>
                <td className="text-center px-3 py-3">
                  <FeatureIcon value={teed.features.permanence} />
                </td>
                <td className="text-center px-3 py-3">
                  <FeatureIcon value={teed.features.noFeed} />
                </td>
                <td className="text-center px-3 py-3">
                  <FeatureIcon value={teed.features.transparentEconomics} />
                </td>
              </tr>
              {/* Competitor Rows */}
              {competitors.map((comp) => (
                <tr
                  key={comp.name}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--grey-3)]"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        setShowDetails(showDetails === comp.name ? null : comp.name)
                      }
                      className="text-left"
                    >
                      <span className="font-medium text-[var(--text-primary)]">
                        {comp.name}
                      </span>
                      <span className="block text-xs text-[var(--text-tertiary)]">
                        {comp.pricing}
                      </span>
                    </button>
                  </td>
                  <td className="text-center px-3 py-3">
                    <FeatureIcon value={comp.features.customDomain} />
                  </td>
                  <td className="text-center px-3 py-3">
                    <FeatureIcon value={comp.features.unlimitedLinks} />
                  </td>
                  <td className="text-center px-3 py-3">
                    <FeatureIcon value={comp.features.affiliateTracking} />
                  </td>
                  <td className="text-center px-3 py-3">
                    <FeatureIcon value={comp.features.richContext} />
                  </td>
                  <td className="text-center px-3 py-3">
                    <FeatureIcon value={comp.features.permanence} />
                  </td>
                  <td className="text-center px-3 py-3">
                    <FeatureIcon value={comp.features.noFeed} />
                  </td>
                  <td className="text-center px-3 py-3">
                    <FeatureIcon value={comp.features.transparentEconomics} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Market Gaps */}
      <section className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">
          Key Market Gaps Teed Fills
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GapCard
            gap="No platform optimizes for permanence"
            problem="All emphasize recency, freshness, and activity"
            solution="Celebrates timeless curation, '3 years strong' badges"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <GapCard
            gap="All extract engagement"
            problem="Feeds, metrics, notifications create anxiety"
            solution="Constructive dopamine only, pride of craft"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <GapCard
            gap="Limited curation depth"
            problem="Links without context, no 'why'"
            solution="Rich item context, narratives, comparisons"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <GapCard
            gap="Creator anxiety universal"
            problem="Algorithm dependency, metrics pressure"
            solution="Pride of the archive, no stale language"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <GapCard
            gap="Affiliate systems opaque"
            problem="Hidden cuts, unclear economics"
            solution="Radical transparency, 'recommendation revenue'"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <GapCard
            gap="Feed-first discovery"
            problem="Algorithmic surfaces, trending, popularity"
            solution="Item-centric discovery, 'who else uses this?'"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
        </div>
      </section>

      {/* Detailed Competitor Cards */}
      <section>
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">
          Competitor Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map((comp) => (
            <CompetitorCard key={comp.name} competitor={comp} />
          ))}
        </div>
      </section>

      {/* Teed Positioning Statement */}
      <section className="bg-[var(--evergreen-4)] rounded-xl p-6">
        <h3 className="font-semibold text-[var(--evergreen-12)] mb-3">
          Teed&apos;s Competitive Positioning
        </h3>
        <blockquote className="text-lg text-[var(--evergreen-11)] italic leading-relaxed border-l-4 border-[var(--evergreen-8)] pl-4">
          &quot;The platform that respects your work. Where others extract, Teed preserves.
          Where others pressure, Teed patience. Not competing on features—competing on values.&quot;
        </blockquote>
        <p className="mt-4 text-sm text-[var(--evergreen-11)]">
          — Emily Heyward positioning framework
        </p>
      </section>
    </div>
  );
}

function FeatureIcon({ value }: { value: boolean | 'paid' | 'basic' }) {
  if (value === true) {
    return <Check className="w-5 h-5 text-[var(--teed-green-11)] mx-auto" />;
  }
  if (value === false) {
    return <X className="w-5 h-5 text-[var(--copper-11)] mx-auto" />;
  }
  if (value === 'paid') {
    return (
      <span className="text-xs text-[var(--amber-11)] bg-[var(--amber-4)] px-2 py-0.5 rounded">
        Paid
      </span>
    );
  }
  if (value === 'basic') {
    return (
      <span className="text-xs text-[var(--grey-11)] bg-[var(--grey-4)] px-2 py-0.5 rounded">
        Basic
      </span>
    );
  }
  return <Minus className="w-5 h-5 text-[var(--grey-8)] mx-auto" />;
}

function GapCard({
  gap,
  problem,
  solution,
  icon,
}: {
  gap: string;
  problem: string;
  solution: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--surface-elevated)] rounded-lg p-4 border border-[var(--border-subtle)]">
      <div className="flex items-start gap-3">
        <div className="text-[var(--copper-11)]">{icon}</div>
        <div>
          <h4 className="font-medium text-[var(--text-primary)] text-sm mb-2">{gap}</h4>
          <div className="text-xs text-[var(--copper-11)] mb-1">
            <strong>Problem:</strong> {problem}
          </div>
          <div className="text-xs text-[var(--teed-green-11)]">
            <strong>Teed:</strong> {solution}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompetitorCard({ competitor }: { competitor: Competitor }) {
  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-[var(--text-primary)]">{competitor.name}</h4>
          <p className="text-xs text-[var(--text-tertiary)]">{competitor.pricing}</p>
        </div>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mb-3">{competitor.tagline}</p>
      <div className="space-y-2">
        <div>
          <span className="text-xs font-medium text-[var(--teed-green-11)]">Strengths:</span>
          <ul className="text-xs text-[var(--text-secondary)] mt-1">
            {competitor.strengths.slice(0, 2).map((s) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
        </div>
        <div>
          <span className="text-xs font-medium text-[var(--copper-11)]">Weaknesses:</span>
          <ul className="text-xs text-[var(--text-secondary)] mt-1">
            {competitor.weaknesses.slice(0, 2).map((w) => (
              <li key={w}>• {w}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
