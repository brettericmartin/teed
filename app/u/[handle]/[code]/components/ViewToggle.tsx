'use client';

import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

export default function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--grey-2)] rounded-lg">
      <button
        onClick={() => onViewChange('grid')}
        className={`p-2 rounded-md transition-all ${
          viewMode === 'grid'
            ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
            : 'bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
        }`}
        title="Grid view"
        aria-label="Switch to grid view"
        aria-pressed={viewMode === 'grid'}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`p-2 rounded-md transition-all ${
          viewMode === 'list'
            ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
            : 'bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
        }`}
        title="List view"
        aria-label="Switch to list view"
        aria-pressed={viewMode === 'list'}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
