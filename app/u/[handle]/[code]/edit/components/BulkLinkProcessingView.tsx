'use client';

import { Check, X, AlertCircle, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { GolfLoader } from '@/components/ui/GolfLoader';
import { GolfCourseProgress } from '@/components/ui/GolfCourseProgress';
import { ProcessingStage, STAGE_CONFIG, getStageOrder, StreamingItem } from '@/lib/types/bulkLinkStream';

// ============================================================
// STREAMING ITEM ROW
// ============================================================

interface StreamingItemRowProps {
  index: number;
  item: StreamingItem;
  currentStage?: ProcessingStage;
}

function StreamingItemRow({ index, item, currentStage }: StreamingItemRowProps) {
  let domain = '';
  try {
    domain = new URL(item.url).hostname.replace('www.', '');
  } catch {
    domain = item.url;
  }

  const stages: ProcessingStage[] = ['parsing', 'fetching', 'detecting', 'scraping', 'analyzing', 'imaging'];
  const currentStageOrder = currentStage ? getStageOrder(currentStage) : -1;

  return (
    <div
      className={`
        rounded-lg border p-3 transition-all duration-300
        ${item.status === 'completed' && item.result?.status !== 'failed'
          ? 'border-[var(--teed-green-6)] bg-[var(--teed-green-1)] animate-item-appear'
          : item.status === 'processing'
          ? 'border-[var(--sky-6)] bg-[var(--sky-1)]'
          : item.status === 'failed' || item.result?.status === 'failed'
          ? 'border-red-200 bg-red-50'
          : 'border-gray-200 bg-gray-50'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* Status Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
          {item.status === 'pending' && (
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          )}
          {item.status === 'processing' && (
            <GolfLoader size="sm" variant="roll" />
          )}
          {item.status === 'completed' && item.result?.status === 'success' && (
            <div className="animate-check-pop">
              <Check className="w-5 h-5 text-[var(--teed-green-9)]" />
            </div>
          )}
          {item.status === 'completed' && item.result?.status === 'partial' && (
            <AlertCircle className="w-5 h-5 text-[var(--sand-9)]" />
          )}
          {(item.status === 'failed' || item.result?.status === 'failed') && (
            <X className="w-5 h-5 text-red-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {item.status === 'completed' && item.result && item.result.status !== 'failed' ? (
            <>
              <p className="font-medium text-gray-900 truncate">
                {item.result.suggestedItem.brand
                  ? `${item.result.suggestedItem.brand} ${item.result.suggestedItem.custom_name}`
                  : item.result.suggestedItem.custom_name}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                {domain}
              </p>
            </>
          ) : item.status === 'failed' || item.result?.status === 'failed' ? (
            <>
              <p className="text-sm text-red-700 truncate">Failed to identify</p>
              <p className="text-xs text-red-500">{domain}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700 truncate">{domain}</p>
              {currentStage && (
                <p className="text-xs text-[var(--sky-11)] flex items-center gap-1.5 mt-0.5">
                  <span className="animate-stage-pulse">{STAGE_CONFIG[currentStage].icon}</span>
                  <span>{STAGE_CONFIG[currentStage].label}...</span>
                </p>
              )}
            </>
          )}
        </div>

        {/* Thumbnail (if completed with image) */}
        {item.status === 'completed' && item.result?.photoOptions?.[0] && (
          <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
            <img
              src={`/api/proxy-image?url=${encodeURIComponent(item.result.photoOptions[0].url)}`}
              alt=""
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
        )}
        {item.status === 'completed' && (!item.result?.photoOptions || item.result.photoOptions.length === 0) && item.result?.status !== 'failed' && (
          <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Mini Stage Progress (for processing items) */}
      {item.status === 'processing' && currentStage && (
        <div className="mt-2.5 flex gap-1">
          {stages.map((stage) => (
            <div
              key={stage}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                currentStageOrder >= getStageOrder(stage)
                  ? 'bg-[var(--sky-9)]'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN PROCESSING VIEW
// ============================================================

interface BulkLinkProcessingViewProps {
  totalUrls: number;
  completedCount: number;
  streamingResults: Map<number, StreamingItem>;
  currentStages: Map<number, ProcessingStage>;
}

export function BulkLinkProcessingView({
  totalUrls,
  completedCount,
  streamingResults,
  currentStages,
}: BulkLinkProcessingViewProps) {
  const isComplete = completedCount >= totalUrls && totalUrls > 0;

  return (
    <div className="flex flex-col h-full min-h-[300px]">
      {/* Overall Progress Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <GolfCourseProgress current={completedCount} total={totalUrls} />
        <p className="text-sm text-gray-600 mt-3 text-center font-medium">
          {isComplete ? (
            <span className="text-[var(--teed-green-9)]">
              All {totalUrls} links analyzed!
            </span>
          ) : (
            <>
              <span className="text-[var(--sky-11)]">{completedCount}</span>
              {' '}of{' '}
              <span>{totalUrls}</span>
              {' '}links analyzed
            </>
          )}
        </p>
      </div>

      {/* Streaming Results List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {Array.from(streamingResults.entries())
          .sort(([a], [b]) => a - b)
          .map(([index, item]) => (
            <StreamingItemRow
              key={index}
              index={index}
              item={item}
              currentStage={currentStages.get(index)}
            />
          ))}
      </div>

      {/* Golf Ball Animation Footer (while processing) */}
      {!isComplete && (
        <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-3">
          <GolfLoader size="md" variant="bounce" label="Processing links..." />
          <span className="text-sm text-gray-500">Processing...</span>
        </div>
      )}
    </div>
  );
}

export default BulkLinkProcessingView;
