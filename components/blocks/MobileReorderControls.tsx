'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';

interface MobileReorderControlsProps {
  blockIndex: number;
  totalBlocks: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function MobileReorderControls({
  blockIndex,
  totalBlocks,
  onMoveUp,
  onMoveDown,
}: MobileReorderControlsProps) {
  const isFirst = blockIndex === 0;
  const isLast = blockIndex === totalBlocks - 1;

  return (
    <div className="flex gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
        disabled={isFirst}
        className="mobile-reorder-btn flex items-center justify-center rounded-full
                   bg-[var(--surface-elevated)] border border-[var(--border-subtle)]
                   text-[var(--text-secondary)] shadow-md
                   disabled:opacity-40 disabled:cursor-not-allowed
                   active:scale-95 transition-transform"
        aria-label="Move up"
      >
        <ChevronUp className="w-5 h-5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
        disabled={isLast}
        className="mobile-reorder-btn flex items-center justify-center rounded-full
                   bg-[var(--surface-elevated)] border border-[var(--border-subtle)]
                   text-[var(--text-secondary)] shadow-md
                   disabled:opacity-40 disabled:cursor-not-allowed
                   active:scale-95 transition-transform"
        aria-label="Move down"
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  );
}
