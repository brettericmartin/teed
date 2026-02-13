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
    description: 'Make sure you have these things ready before starting',
    steps: [
      {
        id: '1.1',
        title: 'ChatGPT Plus Subscription',
        description: 'You need a ChatGPT Plus account ($20/month) to create custom GPTs. Click the link to subscribe if you don\'t have it yet.',
        externalLink: 'https://chat.openai.com/subscribe',
        linkLabel: 'Get ChatGPT Plus',
      },
      {
        id: '1.2',
        title: 'Verify teed.club is working',
        description: 'Click the link to make sure the Teed website loads properly. If you see the homepage, you\'re good!',
        externalLink: 'https://teed.club',
        linkLabel: 'Check teed.club',
      },
      {
        id: '1.3',
        title: 'Log into Supabase Dashboard',
        description: 'Click the link and sign in to the Supabase dashboard. This is where we\'ll set up the login system for the GPT.',
        externalLink: 'https://supabase.com/dashboard',
        linkLabel: 'Open Supabase',
      },
    ],
  },
  {
    id: 'supabase-oauth',
    title: '2. Turn On Supabase OAuth',
    description: 'OAuth lets ChatGPT users log into their Teed accounts',
    steps: [
      {
        id: '2.1',
        title: 'Find the OAuth Server settings',
        description: 'In Supabase: Click your project → Look for "Authentication" in the left sidebar → Click it → Look for "OAuth Server" (might be near the bottom of the list) → Click it.',
      },
      {
        id: '2.2',
        title: 'Enable OAuth',
        description: 'You\'ll see a toggle switch at the top. Turn it ON. It might say "Enable OAuth 2.1/OIDC" or similar. The switch should turn green when enabled.',
      },
      {
        id: '2.3',
        title: 'Set the Authorization UI Path',
        description: 'Look for a field called "Authorization UI Path" or similar. Copy the text below and paste it into that field. This tells Supabase where to show the login screen.',
        copyText: '/oauth/consent',
        copyLabel: 'Copy Path',
      },
      {
        id: '2.4',
        title: '(Optional) Skip this step',
        description: 'There might be an option to "Migrate JWT to RS256" - you can ignore this for now. It\'s optional and the GPT will work without it.',
      },
    ],
  },
  {
    id: 'deploy-code',
    title: '3. Verify Everything is Live',
    description: 'These pages should already be deployed - just verify they work',
    steps: [
      {
        id: '3.1',
        title: 'Check the consent page',
        description: 'Click the link. You might see an error message (that\'s OK!) - the important thing is the page loads and doesn\'t show "404 Not Found".',
        externalLink: 'https://teed.club/oauth/consent',
        linkLabel: 'Test Consent Page',
      },
      {
        id: '3.2',
        title: 'Check the API is working',
        description: 'Click the link. You should see some JSON text like {"error":"Unauthorized..."}. That means the API is working! (The error is expected because you\'re not logged in.)',
        externalLink: 'https://teed.club/api/gpt/me',
        linkLabel: 'Test API',
      },
      {
        id: '3.3',
        title: 'Check the privacy policy page',
        description: 'Click the link. You should see a nice privacy policy page. This is required by OpenAI to make your GPT public.',
        externalLink: 'https://teed.club/legal/gpt-privacy',
        linkLabel: 'View Privacy Policy',
      },
      {
        id: '3.4',
        title: 'Check the OpenAPI schema',
        description: 'Click the link. You should see a big block of JSON text describing all the API endpoints. This is what ChatGPT uses to understand what actions it can take.',
        externalLink: 'https://teed.club/api/gpt/schema',
        linkLabel: 'View Schema',
      },
    ],
  },
  {
    id: 'create-gpt',
    title: '4. Create Your GPT in ChatGPT',
    description: 'Now we\'ll create the actual GPT in ChatGPT\'s website',
    steps: [
      {
        id: '4.1',
        title: 'Open the GPT Editor',
        description: 'Click the link to go to ChatGPT\'s GPT creation page. You\'ll need to be logged into ChatGPT Plus.',
        externalLink: 'https://chat.openai.com/gpts/editor',
        linkLabel: 'Open GPT Editor',
      },
      {
        id: '4.2',
        title: 'Enter the GPT name',
        description: 'Look for a field labeled "Name" at the top. Copy the text below and paste it there.',
        copyText: 'Teed - Gear & Collection Assistant',
        copyLabel: 'Copy Name',
      },
      {
        id: '4.3',
        title: 'Enter the description',
        description: 'Look for a "Description" field. Copy this text and paste it there. This is what people see when they find your GPT.',
        copyText: 'Manage your gear bags and collections on Teed. Create bags, add items, browse what others are using, and organize your gear all through conversation.',
        copyLabel: 'Copy Description',
      },
      {
        id: '4.4',
        title: 'Add the instructions',
        description: 'Find the "Instructions" box (it\'s usually a larger text area). Copy ALL of this text and paste it there. This tells the GPT how to behave.',
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
        copyLabel: 'Copy Instructions',
      },
      {
        id: '4.5',
        title: 'Upload a logo (optional)',
        description: 'You can click the circle icon at the top to upload a logo. You can use the Teed logo from the website or create something new. This is optional - you can skip it for now.',
      },
    ],
  },
  {
    id: 'configure-actions',
    title: '5. Add the API Connection',
    description: 'This connects ChatGPT to Teed\'s API so it can manage bags and items',
    steps: [
      {
        id: '5.1',
        title: 'Click on "Configure" tab',
        description: 'At the top of the GPT editor, you\'ll see tabs like "Create" and "Configure". Click on "Configure".',
      },
      {
        id: '5.2',
        title: 'Scroll down to "Actions"',
        description: 'Scroll down on the Configure page until you see a section called "Actions". Click the "Create new action" button.',
      },
      {
        id: '5.3',
        title: 'Get the API schema',
        description: 'First, click this link to open the schema in a new tab. Select ALL the text on that page (Ctrl+A or Cmd+A), then copy it (Ctrl+C or Cmd+C).',
        externalLink: 'https://teed.club/api/gpt/schema',
        linkLabel: 'Open Schema',
      },
      {
        id: '5.4',
        title: 'Paste the schema',
        description: 'Back in the ChatGPT Actions editor, find the big text box labeled "Schema". Click in it and paste (Ctrl+V or Cmd+V). You should see a list of "Available actions" appear below.',
      },
    ],
  },
  {
    id: 'supabase-client',
    title: '6. Create OAuth Client in Supabase',
    description: 'This creates the security credentials ChatGPT will use',
    steps: [
      {
        id: '6.1',
        title: 'Go back to Supabase OAuth settings',
        description: 'In Supabase Dashboard: Go to Authentication → OAuth Server. Look for a "Clients" tab or section.',
        externalLink: 'https://supabase.com/dashboard',
        linkLabel: 'Open Supabase',
      },
      {
        id: '6.2',
        title: 'Create a new client',
        description: 'Click "Add Client" or "Create Client" button. For the name, copy and paste this:',
        copyText: 'ChatGPT - Teed Assistant',
        copyLabel: 'Copy Name',
      },
      {
        id: '6.3',
        title: 'Save the Client ID',
        description: 'After creating the client, you\'ll see a "Client ID" (a long string of letters and numbers). Write this down or copy it somewhere - you\'ll need it soon!',
      },
      {
        id: '6.4',
        title: 'Save the Client Secret',
        description: 'You\'ll also see a "Client Secret" (another long string). IMPORTANT: You might only see this once! Copy it and save it somewhere safe.',
      },
    ],
  },
  {
    id: 'configure-oauth',
    title: '7. Connect ChatGPT to Supabase',
    description: 'Now we connect the two systems together',
    steps: [
      {
        id: '7.1',
        title: 'Set authentication to OAuth',
        description: 'In the ChatGPT Actions editor (where you pasted the schema), look for "Authentication" section. Click on it and select "OAuth".',
      },
      {
        id: '7.2',
        title: 'Enter the Client ID',
        description: 'Paste the Client ID you copied from Supabase into the "Client ID" field.',
      },
      {
        id: '7.3',
        title: 'Enter the Client Secret',
        description: 'Paste the Client Secret you copied from Supabase into the "Client Secret" field.',
      },
      {
        id: '7.4',
        title: 'Enter Authorization URL',
        description: 'Copy this URL. You need to replace "YOUR_PROJECT_REF" with your Supabase project reference (found in your Supabase URL, like "abc123xyz").',
        copyText: 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/oauth/authorize',
        copyLabel: 'Copy Auth URL',
      },
      {
        id: '7.5',
        title: 'Enter Token URL',
        description: 'Copy this URL. Again, replace "YOUR_PROJECT_REF" with your actual project reference.',
        copyText: 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/oauth/token',
        copyLabel: 'Copy Token URL',
      },
      {
        id: '7.6',
        title: 'Enter the Scope',
        description: 'Copy this exact text and paste it into the "Scope" field.',
        copyText: 'openid email profile',
        copyLabel: 'Copy Scope',
      },
      {
        id: '7.7',
        title: 'Set Token Exchange to POST',
        description: 'Look for "Token Exchange Method" or similar. Select "POST" (not "GET").',
      },
    ],
  },
  {
    id: 'callback-url',
    title: '8. Add Callback URL to Supabase',
    description: 'This is the trickiest part - pay close attention!',
    steps: [
      {
        id: '8.1',
        title: 'Find the Callback URL in ChatGPT',
        description: 'In the ChatGPT OAuth settings, look for a "Callback URL" (sometimes called "Redirect URI"). It will look something like: https://chat.openai.com/aip/.../oauth/callback. Copy this entire URL.',
      },
      {
        id: '8.2',
        title: 'Add it to Supabase',
        description: 'Go back to Supabase → Authentication → OAuth Server → Clients. Find your "ChatGPT - Teed Assistant" client and click to edit it. Look for "Redirect URIs" or "Callback URLs" and paste the URL from ChatGPT there.',
      },
      {
        id: '8.3',
        title: 'IMPORTANT: Save the ChatGPT GPT first!',
        description: 'The callback URL might CHANGE after you save in ChatGPT! After saving your GPT, check if the callback URL changed. If it did, update it in Supabase.',
      },
    ],
  },
  {
    id: 'privacy-publish',
    title: '9. Add Privacy Policy & Save',
    description: 'Almost done! Just need to add the privacy policy',
    steps: [
      {
        id: '9.1',
        title: 'Add the privacy policy URL',
        description: 'In the GPT editor\'s Configure tab, scroll down to find "Privacy Policy" field. Copy and paste this URL:',
        copyText: 'https://teed.club/legal/gpt-privacy',
        copyLabel: 'Copy Privacy URL',
      },
      {
        id: '9.2',
        title: 'Save as "Only me" first',
        description: 'At the top right, click "Save" or "Update". When asked about visibility, choose "Only me" for now. We\'ll test before making it public.',
      },
    ],
  },
  {
    id: 'testing',
    title: '10. Test Your GPT',
    description: 'Let\'s make sure everything works!',
    steps: [
      {
        id: '10.1',
        title: 'Open your GPT',
        description: 'After saving, click "View GPT" or find it in your GPT list. Click on it to start chatting.',
      },
      {
        id: '10.2',
        title: 'Try logging in',
        description: 'Type "What bags do I have?" and press Enter. The GPT should ask you to sign in. Click the sign-in link and log into your Teed account.',
        copyText: 'What bags do I have?',
        copyLabel: 'Copy Test Query',
      },
      {
        id: '10.3',
        title: 'Test creating a bag',
        description: 'After logging in, try asking it to create a bag. If this works, the GPT is connected properly!',
        copyText: 'Create a new bag called "My Golf Clubs" for golf gear',
        copyLabel: 'Copy Test Query',
      },
      {
        id: '10.4',
        title: 'Test adding an item',
        description: 'Try adding an item to your new bag.',
        copyText: 'Add a Titleist TSR3 driver to my golf bag',
        copyLabel: 'Copy Test Query',
      },
      {
        id: '10.5',
        title: 'Verify on teed.club',
        description: 'Go to teed.club and check your profile. You should see the new bag and item that the GPT created!',
        externalLink: 'https://teed.club',
        linkLabel: 'Open Teed.club',
      },
    ],
  },
  {
    id: 'publish',
    title: '11. Make It Public (Optional)',
    description: 'When you\'re ready, you can share your GPT with the world',
    steps: [
      {
        id: '11.1',
        title: 'Test thoroughly first',
        description: 'Before making it public, test all the features: viewing bags, creating bags, adding items, deleting items, searching, and discovering other bags.',
      },
      {
        id: '11.2',
        title: 'Change visibility',
        description: 'Go to your GPT settings and change visibility from "Only me" to "Public" (or "Anyone with the link" if you want to share it more privately first).',
      },
      {
        id: '11.3',
        title: 'Wait for review (if required)',
        description: 'OpenAI may review your GPT before listing it in the GPT Store. This can take a few days.',
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
