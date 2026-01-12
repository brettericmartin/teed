'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Target,
  Lightbulb,
  Map,
  CheckCircle,
  BookOpen,
  TrendingUp,
  Shield,
  Sparkles,
  Quote,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Rocket,
} from 'lucide-react';
import { type AdminRole } from '@/lib/types/admin';
import AdvisoryPanel from './components/AdvisoryPanel';
import CompetitorMatrix from './components/CompetitorMatrix';
import UserPersonas from './components/UserPersonas';
import RoadmapTimeline from './components/RoadmapTimeline';
import DoctrineChecker from './components/DoctrineChecker';
import InitiativesPanel from './components/InitiativesPanel';

interface Props {
  adminRole: AdminRole;
}

type TabId = 'overview' | 'initiatives' | 'panel' | 'competitors' | 'personas' | 'roadmap' | 'doctrine';

export default function StrategyDashboardClient({ adminRole }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'initiatives', label: 'Initiatives', icon: <Rocket className="w-4 h-4" /> },
    { id: 'panel', label: 'Advisory Panel', icon: <Users className="w-4 h-4" /> },
    { id: 'competitors', label: 'Competitors', icon: <Target className="w-4 h-4" /> },
    { id: 'personas', label: 'User Personas', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'roadmap', label: 'Roadmap', icon: <Map className="w-4 h-4" /> },
    { id: 'doctrine', label: 'Doctrine Check', icon: <Shield className="w-4 h-4" /> },
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
                Strategic Roadmap
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Advisory panel insights, competitive analysis, and product direction
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
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'initiatives' && <InitiativesPanel />}
        {activeTab === 'panel' && <AdvisoryPanel />}
        {activeTab === 'competitors' && <CompetitorMatrix />}
        {activeTab === 'personas' && <UserPersonas />}
        {activeTab === 'roadmap' && <RoadmapTimeline />}
        {activeTab === 'doctrine' && <DoctrineChecker />}
      </main>
    </div>
  );
}

function OverviewTab() {
  const [expandedSection, setExpandedSection] = useState<string | null>('positioning');

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <section className="bg-gradient-to-br from-[var(--evergreen-4)] to-[var(--teed-green-4)] rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-[var(--evergreen-11)] mb-4">
          Teed&apos;s Strategic Positioning
        </h2>
        <p className="text-lg text-[var(--evergreen-12)] leading-relaxed mb-6">
          Where competitors create anxiety through engagement metrics, Teed creates{' '}
          <strong>pride through permanence</strong>. Where competitors route users to endless
          scrolling, Teed provides <strong>understanding and intentional exits</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/50 rounded-xl p-4">
            <div className="text-3xl font-bold text-[var(--evergreen-11)]">10+</div>
            <div className="text-sm text-[var(--evergreen-12)]">Competitors analyzed</div>
          </div>
          <div className="bg-white/50 rounded-xl p-4">
            <div className="text-3xl font-bold text-[var(--evergreen-11)]">5</div>
            <div className="text-sm text-[var(--evergreen-12)]">User archetypes defined</div>
          </div>
          <div className="bg-white/50 rounded-xl p-4">
            <div className="text-3xl font-bold text-[var(--evergreen-11)]">4</div>
            <div className="text-sm text-[var(--evergreen-12)]">Advisory panel members</div>
          </div>
        </div>
      </section>

      {/* Key Insights */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Key Strategic Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InsightCard
            icon={<Quote className="w-5 h-5" />}
            author="Daniel Priestley"
            insight="Each bag is a trust-building asset that works 24/7. Help users become the 'go-to' person in their micro-niche."
            color="amber"
          />
          <InsightCard
            icon={<Quote className="w-5 h-5" />}
            author="Julie Zhuo"
            insight="Optimize for completion satisfaction, not engagement metrics. Pride of craft, not anxiety of performance."
            color="sky"
          />
          <InsightCard
            icon={<Quote className="w-5 h-5" />}
            author="Li Jin"
            insight="Build for the creator middle class—people earning $50K-$200K from expertise, not just mega-influencers."
            color="teed-green"
          />
          <InsightCard
            icon={<Quote className="w-5 h-5" />}
            author="Emily Heyward"
            insight="The positioning: 'The platform that respects your work.' Where others extract, Teed preserves."
            color="copper"
          />
        </div>
      </section>

      {/* Market Gaps */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Market Gaps Teed Fills
        </h3>
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          <GapItem
            gap="No platform optimizes for permanence"
            others="All emphasize recency/freshness"
            teed="Celebrates timeless curation"
          />
          <GapItem
            gap="All extract engagement"
            others="Feeds, metrics, notifications"
            teed="Constructive dopamine only"
          />
          <GapItem
            gap="Limited curation depth"
            others="Links without context"
            teed="Rich item context & narratives"
          />
          <GapItem
            gap="Creator anxiety universal"
            others="Algorithm dependency, metrics pressure"
            teed="Pride of the archive"
          />
          <GapItem
            gap="Affiliate systems opaque"
            others="Hidden cuts, unclear economics"
            teed="Radical transparency"
          />
        </div>
      </section>

      {/* Core Differentiation */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Core Differentiation Strategy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ExpandableSection
            id="positioning"
            title="Brand Positioning"
            expanded={expandedSection === 'positioning'}
            onToggle={() =>
              setExpandedSection(expandedSection === 'positioning' ? null : 'positioning')
            }
          >
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li>• <strong>Not</strong> competing on features (Meta/TikTok always win)</li>
              <li>• Competing on <strong>values</strong>: permanence, respect, transparency</li>
              <li>• Position as &quot;The platform that respects your work&quot;</li>
              <li>• Premium feeling from intentionality, not decoration</li>
            </ul>
          </ExpandableSection>

          <ExpandableSection
            id="economics"
            title="Creator Economics"
            expanded={expandedSection === 'economics'}
            onToggle={() =>
              setExpandedSection(expandedSection === 'economics' ? null : 'economics')
            }
          >
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li>• 100 True Fans model: 100 people × $1K/year = viable business</li>
              <li>• Radical transparency on affiliate economics</li>
              <li>• &quot;Recommendation revenue&quot; not &quot;affiliate income&quot;</li>
              <li>• &quot;Your curations helped X people&quot; messaging</li>
            </ul>
          </ExpandableSection>

          <ExpandableSection
            id="discovery"
            title="Item-Centric Discovery"
            expanded={expandedSection === 'discovery'}
            onToggle={() =>
              setExpandedSection(expandedSection === 'discovery' ? null : 'discovery')
            }
          >
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li>• &quot;Who else uses this?&quot; → See other bags with same item</li>
              <li>• &quot;What do people pair with this?&quot; → Related items</li>
              <li>• Discovery serves understanding, not engagement</li>
              <li>• <strong>Never:</strong> trending, popular, algorithmic feeds</li>
            </ul>
          </ExpandableSection>

          <ExpandableSection
            id="permanence"
            title="Pride of Permanence"
            expanded={expandedSection === 'permanence'}
            onToggle={() =>
              setExpandedSection(expandedSection === 'permanence' ? null : 'permanence')
            }
          >
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li>• Every other platform penalizes old content</li>
              <li>• Teed celebrates it: &quot;3 years strong&quot; badges</li>
              <li>• No &quot;stale&quot; language or freshness pressure</li>
              <li>• A 2-year-old bag feels like a well-organized library</li>
            </ul>
          </ExpandableSection>
        </div>
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickLinkCard
          icon={<Users className="w-6 h-6" />}
          title="Advisory Panel"
          description="4 expert perspectives"
          tab="panel"
        />
        <QuickLinkCard
          icon={<Target className="w-6 h-6" />}
          title="Competitors"
          description="10+ analyzed"
          tab="competitors"
        />
        <QuickLinkCard
          icon={<Lightbulb className="w-6 h-6" />}
          title="User Personas"
          description="5 archetypes"
          tab="personas"
        />
        <QuickLinkCard
          icon={<Map className="w-6 h-6" />}
          title="Roadmap"
          description="4 phases"
          tab="roadmap"
        />
      </section>
    </div>
  );
}

function InsightCard({
  icon,
  author,
  insight,
  color,
}: {
  icon: React.ReactNode;
  author: string;
  insight: string;
  color: string;
}) {
  return (
    <div
      className={`bg-[var(--surface)] rounded-xl p-5 border border-[var(--border-subtle)] hover:border-[var(--${color}-6)] transition-colors`}
    >
      <div className={`flex items-center gap-2 text-[var(--${color}-11)] mb-3`}>
        {icon}
        <span className="font-medium text-sm">{author}</span>
      </div>
      <p className="text-sm text-[var(--text-primary)] leading-relaxed">&quot;{insight}&quot;</p>
    </div>
  );
}

function GapItem({ gap, others, teed }: { gap: string; others: string; teed: string }) {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
          Market Gap
        </div>
        <div className="text-sm font-medium text-[var(--text-primary)]">{gap}</div>
      </div>
      <div>
        <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
          Competitors
        </div>
        <div className="text-sm text-[var(--copper-11)]">{others}</div>
      </div>
      <div>
        <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
          Teed&apos;s Approach
        </div>
        <div className="text-sm text-[var(--teed-green-11)] font-medium">{teed}</div>
      </div>
    </div>
  );
}

function ExpandableSection({
  id,
  title,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="font-medium text-[var(--text-primary)]">{title}</span>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
        )}
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function QuickLinkCard({
  icon,
  title,
  description,
  tab,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tab: string;
}) {
  return (
    <button
      onClick={() => {
        // Scroll to top and switch tab
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)] hover:border-[var(--evergreen-6)] hover:shadow-lg transition-all text-left"
    >
      <div className="text-[var(--evergreen-11)] mb-2">{icon}</div>
      <div className="font-medium text-[var(--text-primary)]">{title}</div>
      <div className="text-xs text-[var(--text-secondary)]">{description}</div>
    </button>
  );
}
