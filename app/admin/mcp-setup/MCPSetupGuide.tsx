'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Copy,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Cpu,
  Users,
  TrendingUp,
  Sparkles,
  Package,
  Terminal,
  Globe,
  Shield,
  Rocket,
  Target,
  Lightbulb,
  Star,
} from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
  copyText?: string;
  copyLabel?: string;
  externalLink?: string;
  linkLabel?: string;
  codeBlock?: string;
}

interface Section {
  id: string;
  title: string;
  description: string;
  steps: Step[];
}

const SECTIONS: Section[] = [
  {
    id: 'npm-setup',
    title: '1. Publish to npm Registry',
    description: 'Make the MCP server installable via npx for Claude Desktop users',
    steps: [
      {
        id: '1.1',
        title: 'Create an npm account (if needed)',
        description: 'You need an npm account to publish packages. Create one at npmjs.com if you don\'t have one.',
        externalLink: 'https://www.npmjs.com/signup',
        linkLabel: 'Create npm Account',
      },
      {
        id: '1.2',
        title: 'Create the @teed organization on npm',
        description: 'The package is scoped to @teed, so you need to create this organization. Go to npm and create a new organization named "teed".',
        externalLink: 'https://www.npmjs.com/org/create',
        linkLabel: 'Create Organization',
      },
      {
        id: '1.3',
        title: 'Log into npm from terminal',
        description: 'Open a terminal and run this command, then follow the prompts to log in:',
        copyText: 'npm login',
        copyLabel: 'Copy Command',
      },
      {
        id: '1.4',
        title: 'Navigate to the MCP server package',
        description: 'Change to the MCP server directory:',
        copyText: 'cd packages/mcp-server',
        copyLabel: 'Copy Command',
      },
      {
        id: '1.5',
        title: 'Publish the package',
        description: 'Run this command to publish. The --access public flag is required for scoped packages:',
        copyText: 'npm publish --access public',
        copyLabel: 'Copy Command',
      },
      {
        id: '1.6',
        title: 'Verify the package is live',
        description: 'Check that your package appears on npm. It may take a minute to show up.',
        externalLink: 'https://www.npmjs.com/package/@teed/mcp-server',
        linkLabel: 'View on npm',
      },
    ],
  },
  {
    id: 'env-setup',
    title: '2. Configure Production Environment',
    description: 'Ensure the required environment variables are set in production',
    steps: [
      {
        id: '2.1',
        title: 'Add SUPABASE_SERVICE_ROLE_KEY to Vercel',
        description: 'The MCP server needs this key to validate tokens. Go to your Vercel project settings and add this environment variable. Get the value from Supabase Dashboard → Settings → API.',
        externalLink: 'https://vercel.com/dashboard',
        linkLabel: 'Open Vercel',
      },
      {
        id: '2.2',
        title: 'Verify AUTH_CODE_SECRET is set',
        description: 'This secret is used for OAuth code encryption. If not set, generate a random 32-byte hex string and add it to your environment.',
        copyText: 'openssl rand -hex 32',
        copyLabel: 'Generate Secret',
      },
      {
        id: '2.3',
        title: 'Deploy the latest code',
        description: 'Push your changes to trigger a new deployment with the MCP API endpoints.',
        copyText: 'git push origin main',
        copyLabel: 'Copy Command',
      },
    ],
  },
  {
    id: 'test-endpoints',
    title: '3. Test the MCP Endpoints',
    description: 'Verify all MCP-related endpoints are working correctly',
    steps: [
      {
        id: '3.1',
        title: 'Test the MCP HTTP endpoint',
        description: 'This endpoint lists available tools. You should see a JSON response with tools listed.',
        externalLink: 'https://teed.club/api/mcp',
        linkLabel: 'Test Endpoint',
      },
      {
        id: '3.2',
        title: 'Test the token generation page',
        description: 'Log into Teed first, then visit this endpoint to see your MCP configuration. You should see a JSON response with your user info and Claude Desktop config.',
        externalLink: 'https://teed.club/api/auth/mcp/token',
        linkLabel: 'Get MCP Token',
      },
      {
        id: '3.3',
        title: 'Test a tool call via HTTP',
        description: 'Use curl or a REST client to test a tool call. This searches public bags for "golf":',
        codeBlock: `curl -X POST https://teed.club/api/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "method": "tools/call",
    "params": {
      "name": "search_bags",
      "arguments": { "query": "golf" }
    }
  }'`,
      },
    ],
  },
  {
    id: 'claude-desktop',
    title: '4. Test with Claude Desktop',
    description: 'Verify the MCP server works with Claude Desktop locally',
    steps: [
      {
        id: '4.1',
        title: 'Install Claude Desktop',
        description: 'Download and install Claude Desktop if you haven\'t already.',
        externalLink: 'https://claude.ai/download',
        linkLabel: 'Download Claude Desktop',
      },
      {
        id: '4.2',
        title: 'Get your MCP configuration',
        description: 'Visit the token endpoint while logged into Teed to get your personalized configuration.',
        externalLink: 'https://teed.club/api/auth/mcp/token',
        linkLabel: 'Get Config',
      },
      {
        id: '4.3',
        title: 'Open Claude Desktop config file',
        description: 'The config file location depends on your OS. Open it in a text editor:',
        codeBlock: `# macOS / Linux:
~/.config/claude/claude_desktop_config.json

# Windows:
%APPDATA%\\Claude\\claude_desktop_config.json`,
      },
      {
        id: '4.4',
        title: 'Add the Teed MCP server config',
        description: 'Copy the configuration from step 4.2 and add it to the config file. The structure should look like:',
        codeBlock: `{
  "mcpServers": {
    "teed": {
      "command": "npx",
      "args": ["-y", "@teed/mcp-server"],
      "env": {
        "TEED_SUPABASE_URL": "...",
        "TEED_SUPABASE_ANON_KEY": "...",
        "TEED_USER_ID": "your-user-id",
        "TEED_ACCESS_TOKEN": "teed_mcp_..."
      }
    }
  }
}`,
      },
      {
        id: '4.5',
        title: 'Restart Claude Desktop',
        description: 'Fully quit and reopen Claude Desktop for the changes to take effect.',
      },
      {
        id: '4.6',
        title: 'Test the integration',
        description: 'In Claude Desktop, try these commands to verify everything works:',
        codeBlock: `"What bags do I have on Teed?"
"Search for golf bags on Teed"
"Show me featured bags on Teed"`,
      },
    ],
  },
  {
    id: 'user-docs',
    title: '5. Create User Documentation',
    description: 'Help users discover and set up the MCP integration',
    steps: [
      {
        id: '5.1',
        title: 'Add MCP setup to user settings',
        description: 'Consider adding a "Claude Desktop" or "AI Integrations" section to the user settings page that shows their MCP configuration.',
      },
      {
        id: '5.2',
        title: 'Create a help page',
        description: 'Create a /help/claude-desktop page explaining what MCP is and how to set it up with step-by-step instructions.',
      },
      {
        id: '5.3',
        title: 'Add to the homepage or onboarding',
        description: 'Mention the Claude Desktop integration as a feature on the homepage or during user onboarding.',
      },
    ],
  },
  {
    id: 'monitoring',
    title: '6. Set Up Monitoring',
    description: 'Track usage and catch issues early',
    steps: [
      {
        id: '6.1',
        title: 'Review oauth_sessions table',
        description: 'Check the oauth_sessions table in Supabase to see MCP token usage. Look for client_id = "mcp".',
        externalLink: 'https://supabase.com/dashboard',
        linkLabel: 'Open Supabase',
      },
      {
        id: '6.2',
        title: 'Monitor API logs',
        description: 'Check Vercel logs for /api/mcp and /api/auth/mcp/token endpoints to track usage and errors.',
        externalLink: 'https://vercel.com/dashboard',
        linkLabel: 'View Logs',
      },
      {
        id: '6.3',
        title: 'Set up error alerts (optional)',
        description: 'Consider adding Sentry or similar error tracking to catch issues with the MCP endpoints.',
      },
    ],
  },
];

export default function MCPSetupGuide() {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['npm-setup']));
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
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

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const totalSteps = SECTIONS.reduce((sum, s) => sum + s.steps.length, 0);
  const progressPercent = Math.round((completedSteps.size / totalSteps) * 100);

  const getSectionProgress = (section: Section) => {
    const completed = section.steps.filter(s => completedSteps.has(s.id)).length;
    return { completed, total: section.steps.length };
  };

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

          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                MCP Server Setup Guide
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Enable AI assistants like Claude Desktop to manage gear bags through the Model Context Protocol
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[var(--text-secondary)]">Setup Progress</span>
              <span className="font-medium text-[var(--text-primary)]">
                {completedSteps.size} of {totalSteps} steps ({progressPercent}%)
              </span>
            </div>
            <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Strategic Context */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Why This Initiative</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                Advisory Board Decision
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                The MCP Server received <strong>unanimous 5/5 board approval</strong> with a score of 44/50,
                making it our top priority initiative. The board recognized its potential to position Teed
                as "the AI-native gear platform."
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                  Priority: 100
                </span>
                <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                  5/5 Board Approval
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-purple-600" />
                Strategic Rationale
              </h3>
              <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                <li>• <strong>First-mover advantage</strong> in AI-native gear management</li>
                <li>• <strong>Network effects</strong> as more AI tools integrate</li>
                <li>• <strong>Low effort, high impact</strong> - builds on existing infrastructure</li>
                <li>• <strong>Creator differentiation</strong> - AI-powered bag curation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* What's Built */}
        <div className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-[var(--teed-green-9)]" />
            What's Already Built
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
              <div className="text-2xl font-bold text-[var(--text-primary)]">18</div>
              <div className="text-sm text-[var(--text-secondary)]">MCP Tools</div>
              <div className="text-xs text-[var(--text-tertiary)] mt-1">
                Bags, Items, Search, Export
              </div>
            </div>
            <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
              <div className="text-2xl font-bold text-[var(--text-primary)]">3</div>
              <div className="text-sm text-[var(--text-secondary)]">Resources</div>
              <div className="text-xs text-[var(--text-tertiary)] mt-1">
                Profile, Bags, Bag Contents
              </div>
            </div>
            <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
              <div className="text-2xl font-bold text-[var(--text-primary)]">2</div>
              <div className="text-sm text-[var(--text-secondary)]">Transports</div>
              <div className="text-xs text-[var(--text-tertiary)] mt-1">
                stdio + HTTP
              </div>
            </div>
            <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
              <div className="text-2xl font-bold text-[var(--text-primary)]">4</div>
              <div className="text-sm text-[var(--text-secondary)]">Export Formats</div>
              <div className="text-xs text-[var(--text-tertiary)] mt-1">
                YouTube, Newsletter, MD, Text
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-[var(--surface-elevated)] rounded-lg">
            <h3 className="font-medium text-[var(--text-primary)] mb-2">Key Files</h3>
            <div className="grid sm:grid-cols-2 gap-2 text-sm font-mono text-[var(--text-secondary)]">
              <div>packages/mcp-server/</div>
              <div>app/api/mcp/route.ts</div>
              <div>app/api/auth/mcp/token/route.ts</div>
              <div>packages/mcp-server/README.md</div>
            </div>
          </div>
        </div>

        {/* Future Vision */}
        <div className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-orange-500" />
            Future Vision
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-orange-600">1</span>
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">Multi-Platform AI Integration</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Expand beyond Claude Desktop to support ChatGPT plugins, Gemini, and other AI assistants
                  as they adopt MCP or similar protocols.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-orange-600">2</span>
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">AI-Powered Bag Curation</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Let AI assistants help users curate bags based on their needs, budget, and preferences.
                  "Build me a golf bag for under $2000" becomes possible.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-orange-600">3</span>
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">Voice-First Gear Management</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  As AI voice interfaces improve, users can manage their gear hands-free.
                  "Add the driver I just bought to my tournament bag."
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-orange-600">4</span>
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">Creator Content Automation</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Creators can use AI to generate YouTube descriptions, newsletter content, and social posts
                  directly from their Teed bags - all through conversation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Setup Steps
          </h2>

          {SECTIONS.map((section) => {
            const sectionProgress = getSectionProgress(section);
            const isExpanded = expandedSections.has(section.id);
            const isComplete = sectionProgress.completed === sectionProgress.total;

            return (
              <div
                key={section.id}
                className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden"
              >
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
                      <h3 className="font-semibold text-[var(--text-primary)]">{section.title}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">{section.description}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-[var(--text-tertiary)]" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)]" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 space-y-3">
                    {section.steps.map((step) => {
                      const isStepComplete = completedSteps.has(step.id);

                      return (
                        <div
                          key={step.id}
                          className="border border-[var(--border-subtle)] rounded-lg p-4"
                        >
                          <div className="flex items-start gap-3">
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

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
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

                              {step.codeBlock && (
                                <div className="mt-3 relative">
                                  <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
                                    <code>{step.codeBlock}</code>
                                  </pre>
                                  <button
                                    onClick={() => copyToClipboard(step.codeBlock!, `${step.id}-code`)}
                                    className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                                  >
                                    {copiedField === `${step.id}-code` ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-gray-300" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Quick Links
          </h2>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] rounded-lg hover:bg-[var(--teed-green-2)] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              MCP Documentation
            </a>
            <a
              href="https://claude.ai/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] rounded-lg hover:bg-[var(--teed-green-2)] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Claude Desktop
            </a>
            <a
              href="https://www.npmjs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] rounded-lg hover:bg-[var(--teed-green-2)] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              npm Registry
            </a>
            <Link
              href="/admin/strategy"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] rounded-lg hover:bg-[var(--teed-green-2)] transition-colors"
            >
              <Target className="w-4 h-4" />
              View Strategy Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
