'use client';

import { useState, useCallback } from 'react';
import { WaveProgress } from './WaveProgress';
import type {
  StreamEvent,
  TeamGenerationOutput,
  AgentName,
  AgentStatus,
  MergedHook,
  BagQAOutput,
} from '@/lib/types/teamGeneration';

interface AgentState {
  name: AgentName;
  displayName: string;
  status: AgentStatus;
  wave: 1 | 2 | 3;
}

interface TeamGenerationPanelProps {
  contentIdeaId: string;
  hasBag: boolean;
  existingGeneration?: {
    id: string;
    status: string;
    final_output?: TeamGenerationOutput;
    created_at: string;
  } | null;
  onGenerationComplete?: (output: TeamGenerationOutput) => void;
}

type TabType = 'hooks' | 'tiktok' | 'reels' | 'shorts' | 'bagqa' | 'research';

export function TeamGenerationPanel({
  contentIdeaId,
  hasBag,
  existingGeneration,
  onGenerationComplete,
}: TeamGenerationPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [currentWave, setCurrentWave] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [output, setOutput] = useState<TeamGenerationOutput | null>(
    existingGeneration?.final_output || null
  );
  const [activeTab, setActiveTab] = useState<TabType>('hooks');

  const [agentStates, setAgentStates] = useState<Map<AgentName, AgentState>>(
    new Map([
      ['productDetailsExpert', { name: 'productDetailsExpert', displayName: 'Product Details Expert', status: 'pending', wave: 1 }],
      ['funFactsExpert', { name: 'funFactsExpert', displayName: 'Fun Facts Expert', status: 'pending', wave: 1 }],
      ['viralityManager', { name: 'viralityManager', displayName: 'Virality Manager', status: 'pending', wave: 2 }],
      ['tiktokSpecialist', { name: 'tiktokSpecialist', displayName: 'TikTok Specialist', status: 'pending', wave: 3 }],
      ['reelsSpecialist', { name: 'reelsSpecialist', displayName: 'Reels Specialist', status: 'pending', wave: 3 }],
      ['shortsSpecialist', { name: 'shortsSpecialist', displayName: 'Shorts Specialist', status: 'pending', wave: 3 }],
      ['bagQAAgent', { name: 'bagQAAgent', displayName: 'Bag QA Agent', status: 'pending', wave: 3 }],
    ])
  );

  const updateAgentState = useCallback((name: AgentName, status: AgentStatus) => {
    setAgentStates(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(name);
      if (existing) {
        newMap.set(name, { ...existing, status });
      }
      return newMap;
    });
  }, []);

  const startGeneration = async (withFeedback?: string) => {
    setIsGenerating(true);
    setError(null);
    setApplySuccess(null);
    setCurrentWave(0);
    setProgressPercent(0);
    setOutput(null);
    setShowFeedbackInput(false);

    // Reset agent states
    setAgentStates(prev => {
      const newMap = new Map(prev);
      for (const [key, value] of newMap) {
        newMap.set(key, { ...value, status: 'pending' });
      }
      return newMap;
    });

    try {
      // Cookie-based auth is handled automatically
      const response = await fetch(`/api/admin/content-ideas/${contentIdeaId}/team-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: withFeedback || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));
              handleStreamEvent(event);
            } catch (e) {
              console.error('Failed to parse event:', e);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStreamEvent = (event: StreamEvent) => {
    switch (event.type) {
      case 'generation_start':
        setProgressPercent(event.progress);
        break;

      case 'wave_start':
        setCurrentWave(event.wave);
        setProgressPercent(event.progress);
        break;

      case 'wave_complete':
        setProgressPercent(event.progress);
        break;

      case 'agent_start':
        updateAgentState(event.agent, 'running');
        setProgressPercent(event.progress);
        break;

      case 'agent_complete':
        updateAgentState(event.agent, 'completed');
        setProgressPercent(event.progress);
        break;

      case 'agent_failed':
        updateAgentState(event.agent, 'failed');
        setProgressPercent(event.progress);
        break;

      case 'agent_skipped':
        updateAgentState(event.agent, 'skipped');
        setProgressPercent(event.progress);
        break;

      case 'final':
        setOutput(event.data);
        setProgressPercent(100);
        onGenerationComplete?.(event.data);
        break;

      case 'error':
        setError(event.error);
        break;
    }
  };

  const applyRecommendations = async () => {
    if (!output) return;

    setIsApplying(true);
    setError(null);
    setApplySuccess(null);

    try {
      const response = await fetch(`/api/admin/content-ideas/${contentIdeaId}/team-generate?action=apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          output,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply recommendations');
      }

      const result = await response.json();
      setApplySuccess(`Updated: ${result.fieldsUpdated.join(', ')}`);
      onGenerationComplete?.(output); // Trigger refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply');
    } finally {
      setIsApplying(false);
    }
  };

  const renderHooksTab = () => {
    if (!output?.topHooks?.length) {
      return <p className="text-gray-500 text-sm">No hooks generated yet.</p>;
    }

    return (
      <div className="space-y-3">
        {output.topHooks.map((hook, index) => (
          <div key={index} className="p-3 bg-white rounded-lg border">
            <div className="flex items-start justify-between gap-4">
              <p className="font-medium text-gray-900">&ldquo;{hook.hook}&rdquo;</p>
              <span
                className={`shrink-0 text-sm font-semibold px-2 py-0.5 rounded ${
                  hook.viralityScore >= 70
                    ? 'bg-green-100 text-green-700'
                    : hook.viralityScore >= 50
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                }`}
              >
                {hook.viralityScore}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {hook.platforms.map(platform => (
                <span
                  key={platform}
                  className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"
                >
                  {platform}
                </span>
              ))}
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {hook.style}
              </span>
            </div>
            {hook.reasoning && (
              <p className="mt-2 text-sm text-gray-600">{hook.reasoning}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPlatformTab = (platform: 'tiktok' | 'reels' | 'shorts') => {
    const content = output?.platformContent?.[platform];
    if (!content) {
      return <p className="text-gray-500 text-sm">No {platform} content generated yet.</p>;
    }

    return (
      <div className="space-y-4">
        {/* Hooks */}
        {content.hooks?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Platform-Specific Hooks</h4>
            <div className="space-y-2">
              {content.hooks.map((hook: { text: string; viralityScore: number }, i: number) => (
                <div key={i} className="p-2 bg-white rounded border text-sm">
                  <div className="flex justify-between">
                    <span>&ldquo;{hook.text}&rdquo;</span>
                    <span className="text-gray-500">{hook.viralityScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Script Outline */}
        {content.scriptOutline?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Script Outline</h4>
            <div className="space-y-2">
              {content.scriptOutline.map((section: { section: string; duration: string; content: string }, i: number) => (
                <div key={i} className="p-2 bg-white rounded border text-sm">
                  <div className="flex justify-between text-gray-500 text-xs mb-1">
                    <span className="font-medium">{section.section}</span>
                    <span>{section.duration}</span>
                  </div>
                  <p>{section.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hashtags (TikTok and Reels only) */}
        {'hashtags' in content && content.hashtags?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Hashtags</h4>
            <div className="flex flex-wrap gap-2">
              {content.hashtags.map((tag: string, i: number) => (
                <span key={i} className="text-sm px-2 py-1 bg-gray-100 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SEO Keywords (Shorts only) */}
        {'seoKeywords' in content && content.seoKeywords?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">SEO Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {content.seoKeywords.map((keyword: string, i: number) => (
                <span key={i} className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBagQATab = () => {
    const bagQA = output?.bagQA;
    if (!bagQA) {
      return <p className="text-gray-500 text-sm">No bag QA data available.</p>;
    }

    return (
      <div className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
          <div
            className={`text-3xl font-bold ${
              bagQA.overallScore >= 70
                ? 'text-green-600'
                : bagQA.overallScore >= 50
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}
          >
            {bagQA.overallScore}
          </div>
          <div>
            <h4 className="font-medium">Bag Quality Score</h4>
            <p className="text-sm text-gray-500">
              {bagQA.bagSummary.itemsWithPhotos}/{bagQA.bagSummary.totalItems} photos •{' '}
              {bagQA.bagSummary.itemsWithAffiliateLinks}/{bagQA.bagSummary.totalItems} links
            </p>
          </div>
        </div>

        {/* Prioritized Actions */}
        {bagQA.prioritizedActions?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Prioritized Actions</h4>
            <div className="space-y-2">
              {bagQA.prioritizedActions.map((action: { priority: string; action: string; impact: string }, i: number) => (
                <div key={i} className="p-2 bg-white rounded border text-sm flex gap-2">
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded ${
                      action.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : action.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {action.priority}
                  </span>
                  <div>
                    <p className="font-medium">{action.action}</p>
                    <p className="text-gray-500">{action.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Item Suggestions */}
        {bagQA.itemSuggestions?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Suggested Items to Add</h4>
            <div className="space-y-2">
              {bagQA.itemSuggestions.map((item: { productName: string; brand: string; reasoning: string }, i: number) => (
                <div key={i} className="p-2 bg-white rounded border text-sm">
                  <p className="font-medium">{item.brand} {item.productName}</p>
                  <p className="text-gray-500">{item.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResearchTab = () => {
    if (!output?.productInsights && !output?.funFacts) {
      return <p className="text-gray-500 text-sm">No research data available.</p>;
    }

    return (
      <div className="space-y-4">
        {/* Fun Facts */}
        {output.funFacts?.emotionalHooks?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Emotional Hooks</h4>
            <div className="space-y-2">
              {output.funFacts.emotionalHooks.map((hook, i) => (
                <div key={i} className="p-2 bg-yellow-50 rounded border border-yellow-200 text-sm">
                  {hook}
                </div>
              ))}
            </div>
          </div>
        )}

        {output.funFacts?.didYouKnow?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Did You Know?</h4>
            <div className="space-y-2">
              {output.funFacts.didYouKnow.map((fact, i) => (
                <div key={i} className="p-2 bg-blue-50 rounded border border-blue-200 text-sm">
                  {fact}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Highlights */}
        {output.productInsights?.technicalHighlights?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Technical Highlights</h4>
            <ul className="space-y-1 text-sm">
              {output.productInsights.technicalHighlights.map((highlight, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const tabs: { id: TabType; label: string; show: boolean }[] = [
    { id: 'hooks', label: 'Top Hooks', show: true },
    { id: 'tiktok', label: 'TikTok', show: true },
    { id: 'reels', label: 'Reels', show: true },
    { id: 'shorts', label: 'Shorts', show: true },
    { id: 'bagqa', label: 'Bag QA', show: hasBag },
    { id: 'research', label: 'Research', show: true },
  ];

  return (
    <div className="bg-gray-50 rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">AI Content Team</h3>
          <p className="text-sm text-gray-500">
            {existingGeneration
              ? `Last generated ${new Date(existingGeneration.created_at).toLocaleString()}`
              : 'Generate content with specialized AI agents'}
          </p>
        </div>
        <button
          onClick={() => startGeneration()}
          disabled={isGenerating}
          className={`px-4 py-2 rounded-lg font-medium text-sm ${
            isGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isGenerating ? 'Generating...' : output ? 'Regenerate' : 'Generate with Team'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Progress UI during generation */}
      {isGenerating && (
        <div className="mb-4">
          <WaveProgress
            agentStates={agentStates}
            currentWave={currentWave}
            progressPercent={progressPercent}
            hasBag={hasBag}
          />
        </div>
      )}

      {/* Success message */}
      {applySuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {applySuccess}
        </div>
      )}

      {/* Output tabs */}
      {output && !isGenerating && (
        <div>
          {/* Recommendations panel */}
          {(output.recommendedTitle || output.recommendedSummary) && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3">Team Recommendations</h4>
              {output.recommendedTitle && (
                <div className="mb-2">
                  <label className="text-xs text-blue-700 font-medium">Recommended Title</label>
                  <p className="text-sm text-blue-900 bg-white p-2 rounded mt-1">{output.recommendedTitle}</p>
                </div>
              )}
              {output.recommendedSummary && (
                <div className="mb-3">
                  <label className="text-xs text-blue-700 font-medium">Recommended Summary</label>
                  <p className="text-sm text-blue-900 bg-white p-2 rounded mt-1">{output.recommendedSummary}</p>
                </div>
              )}
              <button
                onClick={applyRecommendations}
                disabled={isApplying}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  isApplying
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isApplying ? 'Applying...' : 'Apply Recommendations'}
              </button>
            </div>
          )}

          {/* Feedback input for revisions */}
          <div className="mb-4">
            {showFeedbackInput ? (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-2">Request Revisions</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Provide feedback for the AI team to consider when regenerating content.
                </p>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g., Focus more on the luxury angle, make hooks shorter and punchier, emphasize the creator's background..."
                  className="w-full p-3 border rounded-lg text-sm resize-none"
                  rows={3}
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => startGeneration(feedback)}
                    disabled={!feedback.trim()}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      !feedback.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-yellow-600 text-white hover:bg-yellow-700'
                    }`}
                  >
                    Regenerate with Feedback
                  </button>
                  <button
                    onClick={() => {
                      setShowFeedbackInput(false);
                      setFeedback('');
                    }}
                    className="px-4 py-2 rounded-lg font-medium text-sm bg-white border hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowFeedbackInput(true)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Request revisions with feedback
              </button>
            )}
          </div>

          <div className="flex gap-1 border-b mb-4 overflow-x-auto">
            {tabs
              .filter(tab => tab.show)
              .map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
          </div>

          <div className="min-h-[200px]">
            {activeTab === 'hooks' && renderHooksTab()}
            {activeTab === 'tiktok' && renderPlatformTab('tiktok')}
            {activeTab === 'reels' && renderPlatformTab('reels')}
            {activeTab === 'shorts' && renderPlatformTab('shorts')}
            {activeTab === 'bagqa' && renderBagQATab()}
            {activeTab === 'research' && renderResearchTab()}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!output && !isGenerating && !existingGeneration && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">Click &ldquo;Generate with Team&rdquo; to start the AI content generation process.</p>
          <p className="text-sm">
            7 specialized agents will work together to create hooks, platform content, and QA your bag.
          </p>
        </div>
      )}
    </div>
  );
}
