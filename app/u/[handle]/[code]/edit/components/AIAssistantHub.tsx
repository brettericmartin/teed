'use client';

import { Camera, Images, Sparkles, ChevronRight, Loader2, Bot, FileText, Link } from 'lucide-react';

type AIAction = {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  count?: number;
  countLabel?: string;
  onClick: () => void;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  hidden?: boolean;
};

type AIAssistantHubProps = {
  itemCount: number;
  itemsWithoutPhotos: number;
  onAddFromPhoto: () => void;
  onAddFromTranscript: () => void;
  onAddFromLinks: () => void;
  onFindPhotos: () => void;
  onFillProductInfo: () => void;
  isIdentifying?: boolean;
  isFillingInfo?: boolean;
  isImportingLinks?: boolean;
};

function AIActionRow({
  icon,
  title,
  description,
  count,
  countLabel,
  onClick,
  isLoading,
  loadingText,
  disabled,
  delay = 0,
}: AIAction & { delay?: number }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="ai-action-row w-full p-4 rounded-xl bg-white/80 hover:bg-white border border-[var(--sky-4)] hover:border-[var(--sky-5)] text-left group disabled:opacity-60 disabled:cursor-not-allowed animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        {/* Icon with shimmer accent */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-[var(--sky-3)] flex items-center justify-center text-[var(--sky-11)] group-hover:bg-[var(--sky-4)] transition-colors">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              icon
            )}
          </div>
          {/* Shimmer accent line */}
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full ai-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--sky-11)] transition-colors">
              {isLoading ? loadingText : title}
            </span>
            {count !== undefined && count > 0 && !isLoading && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[var(--sky-4)] text-[var(--sky-11)] rounded-full">
                {count} {countLabel || 'items'}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5 truncate">
            {description}
          </p>
        </div>

        {/* Arrow indicator */}
        <ChevronRight
          className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--sky-11)] group-hover:translate-x-1 transition-all flex-shrink-0"
        />
      </div>
    </button>
  );
}

export default function AIAssistantHub({
  itemCount,
  itemsWithoutPhotos,
  onAddFromPhoto,
  onAddFromTranscript,
  onAddFromLinks,
  onFindPhotos,
  onFillProductInfo,
  isIdentifying = false,
  isFillingInfo = false,
  isImportingLinks = false,
}: AIAssistantHubProps) {
  const actions: (AIAction & { delay: number })[] = [
    {
      id: 'add-from-photo',
      icon: <Camera className="w-5 h-5" />,
      title: 'Add from Photo',
      description: 'Upload a photo, AI extracts products',
      onClick: onAddFromPhoto,
      isLoading: isIdentifying,
      loadingText: 'Identifying...',
      disabled: isIdentifying,
      delay: 100,
    },
    {
      id: 'add-from-transcript',
      icon: <FileText className="w-5 h-5" />,
      title: 'Add from Transcript',
      description: 'Paste a video/podcast transcript',
      onClick: onAddFromTranscript,
      delay: 150,
    },
    {
      id: 'add-from-links',
      icon: <Link className="w-5 h-5" />,
      title: 'Add from Links',
      description: 'Bulk import from product URLs',
      onClick: onAddFromLinks,
      isLoading: isImportingLinks,
      loadingText: 'Importing...',
      disabled: isImportingLinks,
      delay: 175,
    },
    {
      id: 'find-photos',
      icon: <Images className="w-5 h-5" />,
      title: 'Smart Photo Match',
      description: 'Find better product photos',
      count: itemsWithoutPhotos > 0 ? itemsWithoutPhotos : itemCount,
      countLabel: itemsWithoutPhotos > 0 ? 'need photos' : 'items',
      onClick: onFindPhotos,
      hidden: itemCount === 0,
      delay: 225,
    },
    {
      id: 'fill-info',
      icon: <Sparkles className="w-5 h-5" />,
      title: 'Auto-Fill Details',
      description: 'Complete missing product info',
      count: itemCount,
      onClick: () => onFillProductInfo(),
      isLoading: isFillingInfo,
      loadingText: 'Filling info...',
      disabled: isFillingInfo,
      hidden: itemCount === 0,
      delay: 275,
    },
  ];

  const visibleActions = actions.filter(a => !a.hidden);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[var(--sky-2)] to-[var(--sky-3)] p-1 animate-glow">
      <div className="rounded-xl bg-white/60 backdrop-blur-sm p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[var(--sky-5)] flex items-center justify-center">
            <Bot className="w-4 h-4 text-[var(--sky-11)] animate-sparkle" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                Curator
                <Sparkles className="w-3.5 h-3.5 text-[var(--sky-9)]" />
              </h3>
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[var(--sky-4)] text-[var(--sky-11)] rounded uppercase tracking-wide">
                Beta
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Your smart assistant for building bags
            </p>
          </div>
        </div>

        {/* Action Rows */}
        <div className="space-y-2">
          {visibleActions.map((action) => (
            <AIActionRow key={action.id} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
}
