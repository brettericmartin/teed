'use client';

import { CheckCircle2, Circle, Loader2, XCircle, SkipForward } from 'lucide-react';
import type { PipelineStage, StageStatus, StageProgress } from '@/lib/videoPipeline/types';

const STAGE_CONFIG: Record<PipelineStage, { label: string; description: string }> = {
  metadata: { label: 'Video Metadata', description: 'Fetching video info' },
  transcript: { label: 'Transcript Analysis', description: 'AI extraction of every product mentioned' },
  description: { label: 'Description Links', description: 'Full identification of product links' },
  vision: { label: 'Frame Analysis', description: 'AI vision on video screenshots' },
  fusion: { label: 'Product Fusion', description: 'Merging, deduplicating, and scoring' },
  images: { label: 'Image Search', description: 'Finding product photos' },
  assembly: { label: 'Draft Assembly', description: 'Building your draft bag' },
};

const STAGE_ORDER: PipelineStage[] = ['metadata', 'transcript', 'description', 'vision', 'fusion', 'images', 'assembly'];

function StatusIcon({ status }: { status: StageStatus }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'running':
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'skipped':
      return <SkipForward className="w-5 h-5 text-gray-400" />;
    default:
      return <Circle className="w-5 h-5 text-gray-300" />;
  }
}

interface PipelineProgressProps {
  stages: Map<PipelineStage, StageProgress>;
  currentStage?: PipelineStage;
}

export default function PipelineProgress({ stages, currentStage }: PipelineProgressProps) {
  const completedCount = STAGE_ORDER.filter(s => stages.get(s)?.status === 'completed').length;
  const progress = Math.round((completedCount / STAGE_ORDER.length) * 100);

  return (
    <div className="space-y-1">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-deep-evergreen)] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 tabular-nums w-10 text-right">{progress}%</span>
      </div>

      {/* Stage list */}
      {STAGE_ORDER.map((stageKey) => {
        const stage = stages.get(stageKey);
        const config = STAGE_CONFIG[stageKey];
        const status: StageStatus = stage?.status || 'pending';
        const isActive = stageKey === currentStage;

        return (
          <div
            key={stageKey}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive ? 'bg-blue-50' : status === 'completed' ? 'bg-gray-50/50' : ''
            }`}
          >
            <StatusIcon status={status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {config.label}
                </span>
                {stage?.itemCount != null && stage.itemCount > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {stage.itemCount} found
                  </span>
                )}
                {stage?.durationMs != null && (
                  <span className="text-xs text-gray-400">
                    {(stage.durationMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
              {stage?.message && status !== 'pending' && (
                <p className="text-xs text-gray-500 truncate">{stage.message}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
