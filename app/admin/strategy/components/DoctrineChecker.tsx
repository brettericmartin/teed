'use client';

import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Shield,
  BookOpen,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  question: string;
  description: string;
  category: 'hierarchy' | 'dopamine' | 'obligation' | 'permanence';
}

const checklist: ChecklistItem[] = [
  // Hierarchy
  {
    id: 'bags-first',
    question: 'Does it keep Bags as the primary unit of value?',
    description: 'Bags > Items > Links > Profile. Any inversion is invalid.',
    category: 'hierarchy',
  },
  {
    id: 'items-context',
    question: 'Do Items carry meaningful context, not just links?',
    description: 'Items should have product metadata AND personal context.',
    category: 'hierarchy',
  },
  {
    id: 'links-utility',
    question: 'Are Links treated as utilities, not the point?',
    description: 'Links route users to destinations with explanation.',
    category: 'hierarchy',
  },
  {
    id: 'profile-map',
    question: 'Is the Profile a map to Bags, not a feed?',
    description: 'Profile answers: Who? What did they curate? Where next?',
    category: 'hierarchy',
  },

  // Dopamine
  {
    id: 'constructive-dopamine',
    question: 'Is the dopamine constructive, not extractive?',
    description: 'Pride of ownership, completion satisfaction, visual craft.',
    category: 'dopamine',
  },
  {
    id: 'no-feed',
    question: 'Does it avoid creating feeds or infinite scroll?',
    description: 'No chronological or algorithmic content streams.',
    category: 'dopamine',
  },
  {
    id: 'no-trending',
    question: 'Does it avoid trending, popular, or ranking systems?',
    description: 'No FOMO-inducing features.',
    category: 'dopamine',
  },
  {
    id: 'no-engagement-notifications',
    question: 'Does it avoid engagement-pulling notifications?',
    description: 'No "Someone viewed your bag" or similar.',
    category: 'dopamine',
  },

  // Obligation
  {
    id: 'no-pressure',
    question: 'Does it avoid any sense of obligation?',
    description: 'No posting cadence, no "you should update this."',
    category: 'obligation',
  },
  {
    id: 'no-freshness',
    question: 'Does it avoid freshness indicators as pressure?',
    description: 'No "Updated 3 days ago" guilt trips.',
    category: 'obligation',
  },
  {
    id: 'no-streaks',
    question: 'Does it avoid streak counters or gamification?',
    description: 'No activity gamification that creates anxiety.',
    category: 'obligation',
  },

  // Permanence
  {
    id: 'stale-test',
    question: 'Does it pass the "stale" test?',
    description: 'Would a bag from 2 years ago still feel valid and respected?',
    category: 'permanence',
  },
  {
    id: 'snapshot-valid',
    question: 'Can a bag be a valid snapshot frozen in time?',
    description: 'Bags can be snapshots, living setups, or versioned chapters.',
    category: 'permanence',
  },
  {
    id: 'no-recency-penalty',
    question: 'Does it avoid penalizing old content?',
    description: 'No forced recency or sorting that penalizes age.',
    category: 'permanence',
  },
];

const antiPatterns = [
  {
    pattern: 'Activity feeds',
    example: '"X just cloned this bag"',
    why: 'Creates FOMO and engagement anxiety',
  },
  {
    pattern: 'Follower counts as primary metric',
    example: 'Prominently displaying follower numbers',
    why: 'Encourages comparison and validation-seeking',
  },
  {
    pattern: 'Urgency language',
    example: '"Don\'t miss out", "Trending now", "Hot"',
    why: 'Creates artificial pressure and anxiety',
  },
  {
    pattern: 'Activity dashboards',
    example: 'Engagement metrics for creators',
    why: 'Encourages checking behavior and metrics anxiety',
  },
  {
    pattern: 'Auto-playing content',
    example: 'Videos that play on hover or page load',
    why: 'User should initiate all media',
  },
  {
    pattern: 'Stale indicators',
    example: '"Last updated 6 months ago"',
    why: 'Implies content has an expiration date',
  },
];

const goodExamples = [
  {
    pattern: 'Completion satisfaction',
    example: '"Your bag is complete" visual celebration',
    why: 'Rewards the act of building, not returning',
  },
  {
    pattern: 'Quiet social proof',
    example: 'Saved/copied counts (not rankings)',
    why: 'Validates without creating competition',
  },
  {
    pattern: '"3 years strong" badges',
    example: 'Celebrating permanence over freshness',
    why: 'Honors longevity as a virtue',
  },
  {
    pattern: '"Your curations helped X people"',
    example: 'Focus on impact, not earnings',
    why: 'Constructive framing of monetization',
  },
  {
    pattern: 'Item-centric discovery',
    example: '"Who else uses this?"',
    why: 'Discovery serves understanding, not engagement',
  },
  {
    pattern: 'Version history as archive',
    example: 'Changelog showing gear evolution',
    why: 'Celebrates the journey, not just current state',
  },
];

type Category = 'all' | 'hierarchy' | 'dopamine' | 'obligation' | 'permanence';

export default function DoctrineChecker() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});

  const categories: { id: Category; label: string; color: string }[] = [
    { id: 'all', label: 'All Checks', color: 'grey' },
    { id: 'hierarchy', label: 'Sacred Hierarchy', color: 'evergreen' },
    { id: 'dopamine', label: 'Dopamine Policy', color: 'amber' },
    { id: 'obligation', label: 'No Obligation', color: 'sky' },
    { id: 'permanence', label: 'Permanence', color: 'teed-green' },
  ];

  const filteredChecklist =
    selectedCategory === 'all'
      ? checklist
      : checklist.filter((item) => item.category === selectedCategory);

  const answeredCount = Object.values(answers).filter((v) => v !== null).length;
  const passedCount = Object.values(answers).filter((v) => v === true).length;
  const failedCount = Object.values(answers).filter((v) => v === false).length;

  const toggleAnswer = (id: string) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: prev[id] === null ? true : prev[id] === true ? false : null,
    }));
  };

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <section className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--evergreen-4)] flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-[var(--evergreen-11)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              Doctrine Compliance Checker
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Use this tool to validate new features against Teed&apos;s core doctrine. Every
              feature must align with the sacred hierarchy, dopamine policy, non-obligation
              principle, and permanence values.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? `bg-[var(--${cat.color}-4)] text-[var(--${cat.color}-11)] border border-[var(--${cat.color}-6)]`
                : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </section>

      {/* Progress */}
      {answeredCount > 0 && (
        <section className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Compliance Check Progress
            </span>
            <span className="text-sm text-[var(--text-secondary)]">
              {answeredCount}/{checklist.length} checked
            </span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[var(--teed-green-11)]" />
              <span className="text-sm text-[var(--teed-green-11)]">{passedCount} passed</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-[var(--copper-11)]" />
              <span className="text-sm text-[var(--copper-11)]">{failedCount} failed</span>
            </div>
          </div>
          {failedCount > 0 && (
            <div className="mt-3 p-3 bg-[var(--copper-4)] rounded-lg">
              <div className="flex items-center gap-2 text-[var(--copper-11)]">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Feature needs redesign before implementation
                </span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Checklist */}
      <section className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
          <h3 className="font-semibold text-[var(--text-primary)]">Feature Checklist</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Click each item to mark as pass/fail/unchecked
          </p>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {filteredChecklist.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleAnswer(item.id)}
              className="w-full p-4 text-left hover:bg-[var(--grey-3)] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {answers[item.id] === true && (
                    <CheckCircle className="w-5 h-5 text-[var(--teed-green-11)]" />
                  )}
                  {answers[item.id] === false && (
                    <XCircle className="w-5 h-5 text-[var(--copper-11)]" />
                  )}
                  {answers[item.id] === null ||
                    (answers[item.id] === undefined && (
                      <div className="w-5 h-5 rounded-full border-2 border-[var(--border-default)]" />
                    ))}
                </div>
                <div>
                  <div className="font-medium text-sm text-[var(--text-primary)]">
                    {item.question}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    {item.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Anti-Patterns */}
      <section className="bg-[var(--copper-4)] rounded-xl p-6">
        <h3 className="font-semibold text-[var(--copper-12)] mb-4 flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          Anti-Patterns to Avoid
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {antiPatterns.map((item) => (
            <div
              key={item.pattern}
              className="bg-white/50 rounded-lg p-3"
            >
              <div className="font-medium text-sm text-[var(--copper-12)]">
                {item.pattern}
              </div>
              <div className="text-xs text-[var(--copper-11)] mt-1">
                Example: &quot;{item.example}&quot;
              </div>
              <div className="text-xs text-[var(--copper-11)] mt-1 italic">
                Why: {item.why}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Good Examples */}
      <section className="bg-[var(--teed-green-4)] rounded-xl p-6">
        <h3 className="font-semibold text-[var(--teed-green-12)] mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Doctrine-Aligned Patterns
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goodExamples.map((item) => (
            <div
              key={item.pattern}
              className="bg-white/50 rounded-lg p-3"
            >
              <div className="font-medium text-sm text-[var(--teed-green-12)]">
                {item.pattern}
              </div>
              <div className="text-xs text-[var(--teed-green-11)] mt-1">
                Example: &quot;{item.example}&quot;
              </div>
              <div className="text-xs text-[var(--teed-green-11)] mt-1 italic">
                Why: {item.why}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Doctrine Reminder */}
      <section className="bg-[var(--evergreen-4)] rounded-xl p-6">
        <h3 className="font-semibold text-[var(--evergreen-12)] mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          The Ultimate Test
        </h3>
        <blockquote className="text-lg text-[var(--evergreen-11)] italic leading-relaxed border-l-4 border-[var(--evergreen-8)] pl-4">
          &quot;Does this make Teed feel more like a calm, permanent reference utility—or
          more like a social engagement platform? If the answer is the latter, do not ship
          it.&quot;
        </blockquote>
        <p className="mt-4 text-sm text-[var(--evergreen-11)]">
          — From claude.md Anti-Drift Reminder
        </p>
      </section>
    </div>
  );
}
