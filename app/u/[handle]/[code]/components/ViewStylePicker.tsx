'use client';

import { LayoutGrid, List, Columns, Newspaper, GalleryHorizontalEnd } from 'lucide-react';

export type ViewStyle = 'grid' | 'list' | 'masonry' | 'editorial' | 'carousel';

interface ViewStylePickerProps {
  currentStyle: ViewStyle;
  onStyleChange: (style: ViewStyle) => void;
}

const VIEW_OPTIONS: { value: ViewStyle; icon: typeof LayoutGrid; label: string; description: string }[] = [
  {
    value: 'grid',
    icon: LayoutGrid,
    label: 'Grid',
    description: 'Clean uniform grid',
  },
  {
    value: 'masonry',
    icon: Columns,
    label: 'Flow',
    description: 'Pinterest-style layout',
  },
  {
    value: 'editorial',
    icon: Newspaper,
    label: 'Editorial',
    description: 'Magazine spread',
  },
  {
    value: 'list',
    icon: List,
    label: 'List',
    description: 'Compact list view',
  },
  {
    value: 'carousel',
    icon: GalleryHorizontalEnd,
    label: 'Slides',
    description: 'Full-screen slideshow',
  },
];

export function ViewStylePicker({ currentStyle, onStyleChange }: ViewStylePickerProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border-subtle)]">
      {VIEW_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = currentStyle === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onStyleChange(option.value)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              isActive
                ? 'bg-[var(--teed-green-9)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
            }`}
            title={option.description}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Compact version for mobile - dropdown style
export function ViewStylePickerCompact({
  currentStyle,
  onStyleChange,
}: ViewStylePickerProps) {
  const currentOption = VIEW_OPTIONS.find((o) => o.value === currentStyle) || VIEW_OPTIONS[0];
  const CurrentIcon = currentOption.icon;

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-lg text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors">
        <CurrentIcon className="w-4 h-4" />
        <span>{currentOption.label}</span>
        <svg className="w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {VIEW_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = currentStyle === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onStyleChange(option.value)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors first:rounded-t-lg last:rounded-b-lg ${
                isActive
                  ? 'bg-[var(--teed-green-2)] text-[var(--teed-green-11)]'
                  : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <div>
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{option.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
