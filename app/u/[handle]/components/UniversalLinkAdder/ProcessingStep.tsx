'use client';

import { Check, Video, User, ShoppingBag, Loader2 } from 'lucide-react';
import type { ClassificationResult } from '@/lib/links/classifyUrl';

interface ProcessingStepProps {
  classifications: ClassificationResult[];
  embedCount: number;
  socialCount: number;
  productProgress: { completed: number; total: number };
  isProcessing: boolean;
}

export default function ProcessingStep({
  classifications,
  embedCount,
  socialCount,
  productProgress,
  isProcessing,
}: ProcessingStepProps) {
  return (
    <div className="p-5 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Video className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-[var(--text-secondary)]">Embeds</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[var(--text-primary)]">{embedCount}</span>
            <Check className="w-5 h-5 text-[var(--teed-green-9)]" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-[var(--text-secondary)]">Social</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[var(--text-primary)]">{socialCount}</span>
            <Check className="w-5 h-5 text-[var(--teed-green-9)]" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-[var(--text-secondary)]">Products</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              {productProgress.completed}/{productProgress.total}
            </span>
            {isProcessing && productProgress.total > 0 ? (
              <Loader2 className="w-5 h-5 text-[var(--teed-green-9)] animate-spin" />
            ) : productProgress.total > 0 ? (
              <Check className="w-5 h-5 text-[var(--teed-green-9)]" />
            ) : null}
          </div>
        </div>
      </div>

      {/* Progress bar for products */}
      {productProgress.total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">
              {isProcessing ? 'Analyzing products...' : 'Analysis complete'}
            </span>
            <span className="text-[var(--text-tertiary)]">
              {Math.round((productProgress.completed / productProgress.total) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-[var(--surface-hover)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--teed-green-9)] rounded-full transition-all duration-500"
              style={{
                width: `${(productProgress.completed / productProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* URL list */}
      <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)]">
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            Processing {classifications.length} links
          </span>
        </div>
        <ul className="divide-y divide-[var(--border-subtle)] max-h-64 overflow-y-auto">
          {classifications.map((result, i) => {
            const { classification } = result;
            let icon = <ShoppingBag className="w-4 h-4" />;
            let color = 'text-orange-600 bg-orange-100';
            let label = 'Product';
            let status: 'done' | 'processing' | 'pending' = 'pending';

            if (classification.type === 'embed') {
              icon = <Video className="w-4 h-4" />;
              color = 'text-purple-600 bg-purple-100';
              label = classification.platform.charAt(0).toUpperCase() + classification.platform.slice(1);
              status = 'done';
            } else if (classification.type === 'social') {
              icon = <User className="w-4 h-4" />;
              color = 'text-blue-600 bg-blue-100';
              label = classification.displayName;
              status = 'done';
            } else {
              // Product
              if (i < productProgress.completed + embedCount + socialCount) {
                status = 'done';
              } else if (i === productProgress.completed + embedCount + socialCount) {
                status = 'processing';
              }
            }

            return (
              <li
                key={i}
                className="px-4 py-3 flex items-center gap-3"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {result.originalUrl}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">{label}</div>
                </div>
                <div className="flex-shrink-0">
                  {status === 'done' && (
                    <Check className="w-5 h-5 text-[var(--teed-green-9)]" />
                  )}
                  {status === 'processing' && (
                    <Loader2 className="w-5 h-5 text-[var(--teed-green-9)] animate-spin" />
                  )}
                  {status === 'pending' && (
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--border-subtle)]" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
