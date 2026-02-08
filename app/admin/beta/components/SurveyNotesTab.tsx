'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface SurveyQuestion {
  key: string;
  question: string;
  type: 'single-select' | 'multi-select' | 'free-text';
  options?: { id: string; label: string }[];
}

interface SurveyStep {
  title: string;
  subtitle: string;
  questions: SurveyQuestion[];
}

const SURVEY_STEPS: SurveyStep[] = [
  {
    title: 'Step 2: Who You Are',
    subtitle: '4 questions about the applicant',
    questions: [
      {
        key: 'creator_type',
        question: 'What best describes you?',
        type: 'single-select',
        options: [
          { id: 'professional_creator', label: 'Professional Creator' },
          { id: 'serious_hobbyist', label: 'Serious Hobbyist' },
          { id: 'brand_ambassador', label: 'Brand Ambassador' },
          { id: 'building_audience', label: 'Building My Audience' },
          { id: 'purely_casual', label: 'Purely Casual' },
        ],
      },
      {
        key: 'primary_niche',
        question: "What's your primary niche?",
        type: 'single-select',
        options: [
          { id: 'golf', label: 'Golf' },
          { id: 'tech_gadgets', label: 'Tech & Gadgets' },
          { id: 'fashion', label: 'Fashion & Style' },
          { id: 'outdoor_adventure', label: 'Outdoor & Adventure' },
          { id: 'home_office', label: 'Home & Office' },
          { id: 'fitness', label: 'Fitness & Wellness' },
          { id: 'other', label: 'Something Else' },
        ],
      },
      {
        key: 'audience_size',
        question: 'Total audience size (across all platforms)',
        type: 'single-select',
        options: [
          { id: 'friends_family', label: 'Just Friends & Family' },
          { id: 'under_1k', label: 'Under 1,000' },
          { id: '1k_10k', label: '1,000 - 10,000' },
          { id: '10k_50k', label: '10,000 - 50,000' },
          { id: '50k_plus', label: '50,000+' },
        ],
      },
      {
        key: 'primary_platform',
        question: 'Primary platform',
        type: 'single-select',
        options: [
          { id: 'instagram', label: 'Instagram' },
          { id: 'tiktok', label: 'TikTok' },
          { id: 'youtube', label: 'YouTube' },
          { id: 'twitter', label: 'X (Twitter)' },
          { id: 'blog', label: 'Blog / Website' },
          { id: 'other', label: 'Other' },
        ],
      },
    ],
  },
  {
    title: 'Step 3: Monetization',
    subtitle: '3 questions about revenue goals',
    questions: [
      {
        key: 'affiliate_status',
        question: 'Do you currently use affiliate links?',
        type: 'single-select',
        options: [
          { id: 'actively', label: 'Yes, actively' },
          { id: 'sometimes', label: 'Sometimes' },
          { id: 'want_to_start', label: 'Want to start' },
          { id: 'not_interested', label: 'Not really' },
        ],
      },
      {
        key: 'revenue_goals',
        question: 'What would successful monetization look like?',
        type: 'single-select',
        options: [
          { id: 'side_income', label: '$100-500/month' },
          { id: 'meaningful_income', label: '$500-2,000/month' },
          { id: 'significant_income', label: '$2,000+/month' },
          { id: 'not_priority', label: "Money isn't the goal" },
        ],
      },
      {
        key: 'current_tools',
        question: 'What do you currently use to share products?',
        type: 'multi-select',
        options: [
          { id: 'linktree', label: 'Linktree' },
          { id: 'amazon_storefront', label: 'Amazon Storefront' },
          { id: 'ltk', label: 'LTK (Like to Know)' },
          { id: 'notion', label: 'Notion / Docs' },
          { id: 'instagram_guides', label: 'Instagram Guides' },
          { id: 'nothing', label: 'Nothing yet' },
          { id: 'other', label: 'Something else' },
        ],
      },
    ],
  },
  {
    title: 'Step 4: Your Needs',
    subtitle: '4 questions about pain points and intent',
    questions: [
      {
        key: 'biggest_frustrations',
        question: 'What frustrates you about sharing product recommendations?',
        type: 'multi-select',
        options: [
          { id: 'time_consuming', label: 'Too time-consuming' },
          { id: 'looks_bad', label: "Doesn't look good" },
          { id: 'no_analytics', label: 'No good analytics' },
          { id: 'affiliate_complexity', label: 'Affiliate links are complicated' },
          { id: 'repeated_questions', label: 'Audience keeps asking' },
        ],
      },
      {
        key: 'documentation_habits',
        question: 'How do you currently track your gear and recommendations?',
        type: 'single-select',
        options: [
          { id: 'detailed_notes', label: 'I keep detailed notes' },
          { id: 'basic_tracking', label: 'Basic tracking' },
          { id: 'scattered_info', label: 'Info is scattered' },
          { id: 'nothing_organized', label: 'Nothing organized' },
        ],
      },
      {
        key: 'magic_wand_feature',
        question: 'If you could wave a magic wand and have one feature, what would it be?',
        type: 'free-text',
      },
      {
        key: 'usage_intent',
        question: 'If accepted, when would you create your first bag?',
        type: 'single-select',
        options: [
          { id: 'immediately', label: 'Within 24 hours' },
          { id: 'this_week', label: 'This week' },
          { id: 'explore_first', label: "I'd explore first" },
          { id: 'not_sure', label: 'Not sure' },
        ],
      },
    ],
  },
];

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  'single-select': { label: 'Single Select', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  'multi-select': { label: 'Multi Select', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  'free-text': { label: 'Free Text', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

export default function SurveyNotesTab() {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/admin/beta/settings');
      const data = await res.json();
      if (res.ok) {
        const saved = data.settings?.survey_question_notes;
        if (saved && typeof saved === 'object') {
          setNotes(saved);
        }
      }
    } catch (err) {
      console.error('Failed to fetch survey notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveAllNotes = async () => {
    setSaveState('saving');
    setError('');
    try {
      const res = await fetch('/api/admin/beta/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'survey_question_notes', value: notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save notes');
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (err: any) {
      setError(err.message);
      setSaveState('error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  let questionNumber = 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {SURVEY_STEPS.map((step) => (
        <div key={step.title}>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{step.title}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{step.subtitle}</p>
          </div>
          <div className="space-y-4">
            {step.questions.map((q) => {
              questionNumber++;
              const badge = TYPE_BADGES[q.type];
              return (
                <div
                  key={q.key}
                  className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--sand-4)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                        {questionNumber}
                      </span>
                      <p className="text-sm font-medium text-[var(--text-primary)] pt-0.5">{q.question}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Options display */}
                  {q.options && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {q.options.map((opt) => (
                        <span
                          key={opt.id}
                          className="px-2.5 py-1 bg-[var(--sand-3)] rounded-full text-xs text-[var(--text-secondary)]"
                        >
                          {opt.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Admin notes */}
                  <textarea
                    value={notes[q.key] || ''}
                    onChange={(e) => setNotes(prev => ({ ...prev, [q.key]: e.target.value }))}
                    rows={2}
                    placeholder="Admin notes for this question..."
                    className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg bg-white dark:bg-zinc-800 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-6)] resize-y"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Save All */}
      <div className="sticky bottom-4 flex justify-end">
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-[var(--border-subtle)] rounded-xl shadow-lg px-4 py-3">
          {error && (
            <div className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
          <Button
            variant="create"
            size="sm"
            onClick={saveAllNotes}
            disabled={saveState === 'saving'}
          >
            {saveState === 'saving' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                Saving...
              </>
            ) : saveState === 'saved' ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                All Notes Saved
              </>
            ) : (
              'Save All Notes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
