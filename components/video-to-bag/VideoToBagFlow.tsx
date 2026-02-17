'use client';

import { useState, useCallback, useRef } from 'react';
import { Video, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import PipelineProgress from './PipelineProgress';
import DraftReview from './DraftReview';
import type {
  PipelineEvent,
  PipelineStage,
  StageProgress,
  DraftBag,
  PipelineResult,
  VideoMetadata,
} from '@/lib/videoPipeline/types';

type FlowStep = 'input' | 'processing' | 'review' | 'done';

export default function VideoToBagFlow() {
  const [step, setStep] = useState<FlowStep>('input');
  const [videoUrl, setVideoUrl] = useState('');
  const [pipelineVersion, setPipelineVersion] = useState<'v1' | 'v2'>('v2');
  const [error, setError] = useState<string | null>(null);
  const [stages, setStages] = useState<Map<PipelineStage, StageProgress>>(new Map());
  const [currentStage, setCurrentStage] = useState<PipelineStage | undefined>();
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdBagCode, setCreatedBagCode] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startPipeline = useCallback(async () => {
    if (!videoUrl.trim()) return;

    setError(null);
    setStep('processing');
    setStages(new Map());
    setCurrentStage(undefined);
    setMetadata(null);
    setPipelineResult(null);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const response = await fetch('/api/video-to-bag/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ videoUrl, pipelineVersion }),
        signal: abort.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            const event: PipelineEvent = JSON.parse(line.slice(6));
            handleEvent(event);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Pipeline failed';
      setError(message);
      setStep('input');
    }
  }, [videoUrl, pipelineVersion]);

  const handleEvent = useCallback((event: PipelineEvent) => {
    switch (event.type) {
      case 'stage_started':
        setCurrentStage(event.stage);
        setStages(prev => {
          const next = new Map(prev);
          next.set(event.stage, { stage: event.stage, status: 'running', message: event.message });
          return next;
        });
        break;

      case 'stage_completed':
        setStages(prev => {
          const next = new Map(prev);
          next.set(event.stage, {
            stage: event.stage,
            status: 'completed',
            message: event.message,
            itemCount: event.itemCount,
            durationMs: event.durationMs,
          });
          return next;
        });
        break;

      case 'stage_failed':
        setStages(prev => {
          const next = new Map(prev);
          next.set(event.stage, { stage: event.stage, status: 'failed', message: event.error });
          return next;
        });
        break;

      case 'stage_skipped':
        setStages(prev => {
          const next = new Map(prev);
          next.set(event.stage, { stage: event.stage, status: 'skipped', message: event.reason });
          return next;
        });
        break;

      case 'metadata_ready':
        setMetadata(event.metadata);
        break;

      case 'pipeline_complete':
        setPipelineResult(event.result);
        setCurrentStage(undefined);
        setStep('review');
        break;

      case 'pipeline_error':
        setError(event.error);
        setStep('input');
        break;
    }
  }, []);

  const handleCreateBag = useCallback(async (data: {
    selectedProductIds: string[];
    editedProducts: Record<string, { name?: string; brand?: string; imageUrl?: string }>;
    bagTitle: string;
    bagDescription: string;
  }) => {
    if (!pipelineResult) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/video-to-bag/assemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftBag: pipelineResult.draftBag,
          ...data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create bag' }));
        throw new Error(errorData.error);
      }

      const result = await response.json();
      setCreatedBagCode(result.bagCode);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bag');
    } finally {
      setIsCreating(false);
    }
  }, [pipelineResult]);

  const reset = () => {
    abortRef.current?.abort();
    setStep('input');
    setVideoUrl('');
    setError(null);
    setStages(new Map());
    setMetadata(null);
    setPipelineResult(null);
    setCreatedBagCode(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
          <Video className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Video to Bag</h2>
          <p className="text-sm text-gray-500">Extract products from a video and create a draft bag</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step: Input */}
      {step === 'input' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startPipeline()}
                placeholder="Paste a YouTube or TikTok URL..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-evergreen)]/20 focus:border-[var(--color-deep-evergreen)]"
              />
              <Button
                variant="ai"
                onClick={startPipeline}
                disabled={!videoUrl.trim()}
              >
                Process
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-400">Pipeline:</span>
              <button
                onClick={() => setPipelineVersion('v2')}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  pipelineVersion === 'v2'
                    ? 'bg-[var(--color-deep-evergreen)] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                V2 (Dense)
              </button>
              <button
                onClick={() => setPipelineVersion('v1')}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  pipelineVersion === 'v1'
                    ? 'bg-[var(--color-deep-evergreen)] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                V1 (Legacy)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <div className="space-y-4">
          {/* Video preview card */}
          {metadata && (
            <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
              {metadata.thumbnailUrl && (
                <img
                  src={metadata.thumbnailUrl}
                  alt={metadata.title}
                  className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{metadata.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{metadata.channelName}</p>
                {metadata.viewCount && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {metadata.viewCount.toLocaleString()} views
                  </p>
                )}
              </div>
            </div>
          )}

          <PipelineProgress stages={stages} currentStage={currentStage} />

          <Button variant="ghost" size="sm" onClick={reset}>
            Cancel
          </Button>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && pipelineResult && (
        <div className="space-y-4">
          {/* Stats summary */}
          <div className="flex flex-wrap gap-3 text-sm">
            <Stat label="Products" value={pipelineResult.stats.totalProducts} />
            <Stat label="From Description" value={pipelineResult.stats.fromDescription} />
            <Stat label="From Transcript" value={pipelineResult.stats.fromTranscript} />
            <Stat label="From Vision" value={pipelineResult.stats.fromVision} />
            <Stat label="Multi-source" value={pipelineResult.stats.multiSource} />
            <Stat label="With Images" value={pipelineResult.stats.withImages} />
            <Stat label="With Links" value={pipelineResult.stats.withLinks} />
            <Stat
              label="Time"
              value={`${(pipelineResult.stats.totalDurationMs / 1000).toFixed(1)}s`}
              isText
            />
          </div>

          <DraftReview
            draftBag={pipelineResult.draftBag}
            onCreateBag={handleCreateBag}
            isCreating={isCreating}
          />

          <button onClick={reset} className="text-sm text-gray-500 hover:underline">
            Start over
          </button>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && createdBagCode && (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bag Created!</h3>
            <p className="text-sm text-gray-500 mt-1">Your bag has been created successfully.</p>
          </div>
          <div className="flex justify-center gap-3">
            <a
              href={`/b/${createdBagCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-deep-evergreen)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              View Bag <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Button variant="secondary" onClick={reset}>
              Process Another Video
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, isText }: { label: string; value: number | string; isText?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-1.5">
      <span className="text-gray-500">{label}: </span>
      <span className="font-medium text-gray-900">
        {isText ? value : value}
      </span>
    </div>
  );
}
