'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Copy,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Loader2,
  RefreshCw,
  FileJson,
} from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
  copyText?: string;
  copyLabel?: string;
  externalLink?: string;
  linkLabel?: string;
}

interface Section {
  id: string;
  title: string;
  description: string;
  steps: Step[];
}

interface StepProgress {
  step_id: string;
  is_completed: boolean;
  notes: string;
}

const SECTIONS: Section[] = [
  {
    id: 'prerequisites',
    title: '1. Prerequisites',
    description: 'Ensure you have everything needed to get started',
    steps: [
      {
        id: '1.1',
        title: 'Have ChatGPT Plus subscription',
        description: '$20/month required for GPT builder access',
        externalLink: 'https://chat.openai.com/subscribe',
        linkLabel: 'Subscribe to ChatGPT Plus',
      },
      {
        id: '1.2',
        title: 'Verify teed.club is deployed and accessible',
        description: 'Ensure the site is live and API routes are working',
        externalLink: 'https://teed.club',
        linkLabel: 'Check teed.club',
      },
      {
        id: '1.3',
        title: 'Confirm Supabase project is accessible',
        description: 'You need access to the Supabase dashboard for OAuth configuration',
        externalLink: 'https://supabase.com/dashboard',
        linkLabel: 'Open Supabase Dashboard',
      },
    ],
  },
  {
    id: 'supabase-oauth',
    title: '2. Enable Supabase OAuth Server',
    description: 'Configure Supabase as an OAuth provider',
    steps: [
      {
        id: '2.1',
        title: 'Go to Supabase Dashboard → Authentication → OAuth Server',
        description: 'Navigate to the OAuth Server settings in your project',
      },
      {
        id: '2.2',
        title: 'Enable OAuth 2.1/OIDC beta',
        description: 'Toggle the switch to enable the OAuth server feature',
      },
      {
        id: '2.3',
        title: 'Set Authorization UI Path',
        description: 'Configure the consent screen URL',
        copyText: '/oauth/consent',
        copyLabel: 'Consent Path',
      },
      {
        id: '2.4',
        title: '(Optional) Migrate JWT algorithm to RS256',
        description: 'Recommended for better security with OAuth clients',
      },
    ],
  },
  {
    id: 'deploy-code',
    title: '3. Deploy Code Changes',
    description: 'Ensure all new code is deployed to production',
    steps: [
      {
        id: '3.1',
        title: 'Deploy OAuth consent screen page',
        description: 'The /oauth/consent page must be live',
        externalLink: 'https://teed.club/oauth/consent?test=1',
        linkLabel: 'Test Consent Page',
      },
      {
        id: '3.2',
        title: 'Deploy GPT API routes',
        description: 'The /api/gpt/* routes must be accessible',
      },
      {
        id: '3.3',
        title: 'Deploy privacy policy page',
        description: 'Required for public GPT Store listing',
        externalLink: 'https://teed.club/legal/gpt-privacy',
        linkLabel: 'View Privacy Policy',
      },
      {
        id: '3.4',
        title: 'Deploy database migration',
        description: 'Run the admin_setup_progress migration',
      },
      {
        id: '3.5',
        title: 'Test API routes work locally',
        description: 'Verify endpoints return expected data',
      },
    ],
  },
  {
    id: 'create-gpt',
    title: '4. Create Custom GPT in ChatGPT',
    description: 'Build the custom GPT in the ChatGPT interface',
    steps: [
      {
        id: '4.1',
        title: 'Go to ChatGPT → Explore GPTs → Create',
        externalLink: 'https://chat.openai.com/gpts/editor',
        linkLabel: 'Open GPT Editor',
      },
      {
        id: '4.2',
        title: 'Set GPT name',
        copyText: 'Teed - Gear & Collection Assistant',
        copyLabel: 'GPT Name',
      },
      {
        id: '4.3',
        title: 'Set GPT description',
        copyText: 'Manage your gear bags and collections on Teed. Create bags, add items, browse what others are using, and organize your gear all through conversation.',
        copyLabel: 'Description',
      },
      {
        id: '4.4',
        title: 'Add custom instructions',
        description: 'Paste the system prompt in the Instructions field',
        copyText: `You are Teed Assistant, a personal gear curator helping users manage their collections on Teed (teed.club).

## Your Capabilities:
- View and manage the authenticated user's bags and items
- Create new bags to organize gear collections
- Add, update, and remove items from bags
- Browse public/featured bags from other users
- Search across the platform for inspiration

## Authentication:
Users must sign in with their Teed account. When authenticated, you can:
- Access their private and public bags
- Create, edit, and delete their content
- Never modify another user's content

## Action Guidelines:
1. **View bags**: Use listMyBags to show user's own bags
2. **Create bag**: Use createBag with a title, optional description/category
3. **View bag contents**: Use getBag with the bag code
4. **Add item**: Use addItemToBag with name, brand, description
5. **Update item**: Use updateItem to modify existing items
6. **Delete**: Use deleteItem or deleteBag (confirm first!)
7. **Discover**: Use discoverBags to browse public/featured content
8. **Search**: Use searchBagsAndItems to find specific gear

## Response Style:
- Confirm destructive actions before executing
- Present lists in clean, organized format with brands
- Provide links: teed.club/u/{handle}/{code}
- Be helpful and enthusiastic about gear organization
- When creating, suggest sensible defaults for category

## Example Interactions:
- "Create a new bag for my golf clubs" → createBag with category: golf
- "Add my Titleist TSR3 driver" → addItemToBag with brand and name
- "Show me what's trending" → discoverBags with featured: true`,
        copyLabel: 'Instructions',
      },
      {
        id: '4.5',
        title: 'Upload logo/icon',
        description: 'Use the Teed logo or create a custom GPT icon',
      },
    ],
  },
  {
    id: 'configure-actions',
    title: '5. Configure GPT Actions (Schema)',
    description: 'Set up the OpenAPI schema for API access',
    steps: [
      {
        id: '5.1',
        title: 'Click "Create new action"',
        description: 'In the GPT editor, go to Configure → Actions → Create new action',
      },
      {
        id: '5.2',
        title: 'Paste OpenAPI schema',
        description: 'Copy the full schema and paste it in the Schema field',
        externalLink: 'https://teed.club/api/gpt/openapi.json',
        linkLabel: 'View OpenAPI Schema',
      },
      {
        id: '5.3',
        title: 'Verify all endpoints show as available',
        description: 'You should see all 14 operations listed after pasting the schema',
      },
    ],
  },
  {
    id: 'configure-oauth',
    title: '6. Configure OAuth Authentication',
    description: 'Set up OAuth in the ChatGPT Actions editor',
    steps: [
      {
        id: '6.1',
        title: 'Set Authentication to "OAuth"',
        description: 'In the Actions editor, click Authentication → OAuth',
      },
      {
        id: '6.2',
        title: 'Copy Callback URL from ChatGPT',
        description: 'IMPORTANT: This URL changes when you save! Copy it after setting OAuth.',
      },
      {
        id: '6.3',
        title: 'Add Callback URL to Supabase OAuth client',
        description: 'Paste the callback URL as a redirect URI in your Supabase OAuth client',
      },
      {
        id: '6.4',
        title: 'Enter OAuth settings in ChatGPT',
        description: 'Fill in Client ID, Client Secret, Authorization URL, Token URL, and Scope',
      },
    ],
  },
  {
    id: 'supabase-client',
    title: '7. Register OAuth Client in Supabase',
    description: 'Create the OAuth client that ChatGPT will use',
    steps: [
      {
        id: '7.1',
        title: 'Go to Supabase → Authentication → OAuth Server → Clients',
        description: 'Navigate to the OAuth clients section',
      },
      {
        id: '7.2',
        title: 'Create new client named "ChatGPT"',
        copyText: 'ChatGPT - Teed Assistant',
        copyLabel: 'Client Name',
      },
      {
        id: '7.3',
        title: 'Copy Client ID',
        description: 'Paste this into the ChatGPT OAuth settings',
      },
      {
        id: '7.4',
        title: 'Copy Client Secret',
        description: 'Paste this into the ChatGPT OAuth settings',
      },
      {
        id: '7.5',
        title: 'Add both ChatGPT callback URLs as redirect URIs',
        description: 'Add both chat.openai.com and chatgpt.com callback URLs',
      },
    ],
  },
  {
    id: 'oauth-settings',
    title: '8. OAuth Configuration Values',
    description: 'Values to enter in the ChatGPT OAuth settings',
    steps: [
      {
        id: '8.1',
        title: 'Authorization URL',
        copyText: 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/oauth/authorize',
        copyLabel: 'Auth URL',
        description: 'Replace YOUR_PROJECT_REF with your Supabase project reference',
      },
      {
        id: '8.2',
        title: 'Token URL',
        copyText: 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/oauth/token',
        copyLabel: 'Token URL',
        description: 'Replace YOUR_PROJECT_REF with your Supabase project reference',
      },
      {
        id: '8.3',
        title: 'Scope',
        copyText: 'openid email profile',
        copyLabel: 'Scope',
      },
      {
        id: '8.4',
        title: 'Token Exchange Method: POST',
        description: 'Select POST as the token exchange method',
      },
    ],
  },
  {
    id: 'privacy-publish',
    title: '9. Privacy & Initial Testing',
    description: 'Add privacy policy and test the integration',
    steps: [
      {
        id: '9.1',
        title: 'Add privacy policy URL',
        copyText: 'https://teed.club/legal/gpt-privacy',
        copyLabel: 'Privacy URL',
      },
      {
        id: '9.2',
        title: 'Save GPT as "Private" first',
        description: 'Keep it private while testing',
      },
      {
        id: '9.3',
        title: 'Test OAuth login flow',
        description: 'Try using the GPT and verify it redirects to consent screen',
      },
      {
        id: '9.4',
        title: 'Test sample queries',
        description: 'Try the test queries listed below',
      },
    ],
  },
  {
    id: 'testing',
    title: '10. Testing & Debugging',
    description: 'Verify all functionality works correctly',
    steps: [
      {
        id: '10.1',
        title: 'Test: "What bags do I have?"',
        copyText: 'What bags do I have?',
        copyLabel: 'Test Query',
      },
      {
        id: '10.2',
        title: 'Test: "Create a new bag called \'My Golf Setup\'"',
        copyText: "Create a new bag called 'My Golf Setup' for my golf gear",
        copyLabel: 'Test Query',
      },
      {
        id: '10.3',
        title: 'Test: "Add a Titleist driver to my golf bag"',
        copyText: 'Add a Titleist TSR3 driver to my golf setup bag',
        copyLabel: 'Test Query',
      },
      {
        id: '10.4',
        title: 'Test: "Show me featured public bags"',
        copyText: 'Show me some featured bags for inspiration',
        copyLabel: 'Test Query',
      },
      {
        id: '10.5',
        title: 'Test: "Delete the item I just added"',
        copyText: 'Delete that driver I just added',
        copyLabel: 'Test Query',
      },
    ],
  },
  {
    id: 'publish',
    title: '11. Publish to GPT Store',
    description: 'Make the GPT public when ready',
    steps: [
      {
        id: '11.1',
        title: 'Review all settings',
        description: 'Verify name, description, instructions, and actions are correct',
      },
      {
        id: '11.2',
        title: 'Change visibility to "Public"',
        description: 'In the GPT settings, change visibility from Private to Public',
      },
      {
        id: '11.3',
        title: 'Submit for review (if required)',
        description: 'OpenAI may require review before public listing',
      },
      {
        id: '11.4',
        title: 'Monitor usage in ChatGPT analytics',
        description: 'Track usage and user feedback after launch',
      },
    ],
  },
];

export default function GPTSetupWizard() {
  const [progress, setProgress] = useState<Record<string, StepProgress>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['prerequisites']));
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load progress from API
  const loadProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/gpt-setup');
      if (res.ok) {
        const data = await res.json();
        const progressMap: Record<string, StepProgress> = {};
        (data.progress || []).forEach((p: any) => {
          progressMap[p.step_id] = {
            step_id: p.step_id,
            is_completed: p.is_completed,
            notes: p.notes || '',
          };
        });
        setProgress(progressMap);
      }
    } catch (err) {
      console.error('Failed to load progress:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Save progress to API
  const saveProgress = async (stepId: string, updates: Partial<StepProgress>) => {
    setSaving(true);
    try {
      const currentProgress = progress[stepId] || { step_id: stepId, is_completed: false, notes: '' };
      const newProgress = { ...currentProgress, ...updates };

      await fetch('/api/admin/gpt-setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_id: stepId,
          is_completed: newProgress.is_completed,
          notes: newProgress.notes,
        }),
      });

      setProgress(prev => ({
        ...prev,
        [stepId]: newProgress,
      }));
    } catch (err) {
      console.error('Failed to save progress:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleStep = (stepId: string) => {
    const current = progress[stepId]?.is_completed || false;
    saveProgress(stepId, { is_completed: !current });
  };

  const updateNotes = (stepId: string, notes: string) => {
    setProgress(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        step_id: stepId,
        notes,
        is_completed: prev[stepId]?.is_completed || false,
      },
    }));
  };

  const saveNotes = (stepId: string) => {
    const notes = progress[stepId]?.notes || '';
    saveProgress(stepId, { notes });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const toggleNotes = (stepId: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Calculate overall progress
  const totalSteps = SECTIONS.reduce((sum, s) => sum + s.steps.length, 0);
  const completedSteps = Object.values(progress).filter(p => p.is_completed).length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  // Calculate section progress
  const getSectionProgress = (section: Section) => {
    const completed = section.steps.filter(s => progress[s.id]?.is_completed).length;
    return { completed, total: section.steps.length };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-elevated)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--teed-green-9)]" />
          <p className="text-[var(--text-secondary)]">Loading setup progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-[var(--surface-elevated)]">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Dashboard
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--teed-green-9)] to-[var(--teed-green-11)] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  ChatGPT GPT Setup Guide
                </h1>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Step-by-step instructions to create and configure the Teed custom GPT
              </p>
            </div>

            <button
              onClick={loadProgress}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-elevated)] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[var(--text-secondary)]">
                Overall Progress
              </span>
              <span className="font-medium text-[var(--text-primary)]">
                {completedSteps} of {totalSteps} steps ({progressPercent}%)
              </span>
            </div>
            <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--teed-green-8)] to-[var(--teed-green-9)] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {/* Quick Links */}
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)] flex flex-wrap gap-3">
          <a
            href="https://chat.openai.com/gpts/editor"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--surface-elevated)] rounded-lg hover:bg-[var(--teed-green-2)] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            GPT Editor
          </a>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--surface-elevated)] rounded-lg hover:bg-[var(--teed-green-2)] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Supabase Dashboard
          </a>
          <a
            href="/api/gpt/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--surface-elevated)] rounded-lg hover:bg-[var(--teed-green-2)] transition-colors"
          >
            <FileJson className="w-3.5 h-3.5" />
            OpenAPI Schema
          </a>
          <a
            href="/legal/gpt-privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--surface-elevated)] rounded-lg hover:bg-[var(--teed-green-2)] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Privacy Policy
          </a>
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => {
          const sectionProgress = getSectionProgress(section);
          const isExpanded = expandedSections.has(section.id);
          const isComplete = sectionProgress.completed === sectionProgress.total;

          return (
            <div
              key={section.id}
              className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--surface-elevated)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isComplete
                      ? 'bg-[var(--teed-green-3)]'
                      : 'bg-[var(--surface-elevated)]'
                  }`}>
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-[var(--teed-green-9)]" />
                    ) : (
                      <span className="text-sm font-medium text-[var(--text-secondary)]">
                        {sectionProgress.completed}/{sectionProgress.total}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <h2 className="font-semibold text-[var(--text-primary)]">{section.title}</h2>
                    <p className="text-sm text-[var(--text-secondary)]">{section.description}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-[var(--text-tertiary)]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)]" />
                )}
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className="px-6 pb-6 space-y-3">
                  {section.steps.map((step) => {
                    const stepProgress = progress[step.id];
                    const isStepComplete = stepProgress?.is_completed || false;
                    const hasNotes = expandedNotes.has(step.id);
                    const notes = stepProgress?.notes || '';

                    return (
                      <div
                        key={step.id}
                        className="border border-[var(--border-subtle)] rounded-lg overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <button
                              onClick={() => toggleStep(step.id)}
                              className="mt-0.5 flex-shrink-0"
                            >
                              {isStepComplete ? (
                                <CheckCircle2 className="w-5 h-5 text-[var(--teed-green-9)]" />
                              ) : (
                                <Circle className="w-5 h-5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]" />
                              )}
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className={`font-medium ${
                                    isStepComplete
                                      ? 'text-[var(--text-secondary)] line-through'
                                      : 'text-[var(--text-primary)]'
                                  }`}>
                                    <span className="text-[var(--text-tertiary)] mr-2">{step.id}</span>
                                    {step.title}
                                  </p>
                                  {step.description && (
                                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                                      {step.description}
                                    </p>
                                  )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {step.copyText && (
                                    <button
                                      onClick={() => copyToClipboard(step.copyText!, step.id)}
                                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[var(--surface-elevated)] rounded hover:bg-[var(--teed-green-2)] transition-colors"
                                    >
                                      {copiedField === step.id ? (
                                        <>
                                          <CheckCircle2 className="w-3 h-3 text-[var(--teed-green-9)]" />
                                          Copied!
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          {step.copyLabel || 'Copy'}
                                        </>
                                      )}
                                    </button>
                                  )}
                                  {step.externalLink && (
                                    <a
                                      href={step.externalLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[var(--surface-elevated)] rounded hover:bg-[var(--teed-green-2)] transition-colors"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      {step.linkLabel || 'Open'}
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Notes toggle */}
                              <button
                                onClick={() => toggleNotes(step.id)}
                                className="mt-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] flex items-center gap-1"
                              >
                                {hasNotes ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                {notes ? 'View notes' : 'Add notes'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Notes section */}
                        {hasNotes && (
                          <div className="px-4 pb-4 pt-0 ml-8">
                            <textarea
                              value={notes}
                              onChange={(e) => updateNotes(step.id, e.target.value)}
                              onBlur={() => saveNotes(step.id)}
                              placeholder="Add notes, questions, or context about this step..."
                              className="w-full px-3 py-2 text-sm bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)] min-h-[80px]"
                            />
                            {saving && (
                              <p className="text-xs text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Saving...
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
