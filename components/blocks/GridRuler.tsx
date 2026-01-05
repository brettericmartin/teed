'use client';

interface GridRulerProps {
  cols: number;
  isResizing: boolean;
  currentWidth: number | null;
}

// Size presets as consecutive zones
// Each zone spans from previous preset's cols to this preset's cols
const SIZE_PRESETS = [
  { cols: 3, label: 'Quarter', fraction: '¼', prevCols: 0 },
  { cols: 4, label: 'Third', fraction: '⅓', prevCols: 3 },
  { cols: 6, label: 'Half', fraction: '½', prevCols: 4 },
  { cols: 12, label: 'Full', fraction: '', prevCols: 6 },
];

export default function GridRuler({ cols, isResizing, currentWidth }: GridRulerProps) {
  // Find which preset the current width matches or is closest to
  const getActivePreset = (width: number | null) => {
    if (width === null) return null;
    for (const preset of SIZE_PRESETS) {
      if (width <= preset.cols) return preset.cols;
    }
    return 12;
  };

  const activePreset = isResizing ? getActivePreset(currentWidth) : null;

  return (
    <div className="flex h-7 mb-3 rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface)]">
      {SIZE_PRESETS.map((preset) => {
        const isActive = activePreset === preset.cols;
        // Width is the DIFFERENCE from previous preset (consecutive zones)
        const zoneWidth = preset.cols - preset.prevCols;
        const widthPercent = (zoneWidth / cols) * 100;

        return (
          <div
            key={preset.cols}
            className={`
              flex items-center justify-center text-xs font-medium transition-all duration-150
              border-r border-[var(--border-subtle)] last:border-r-0
              ${isActive
                ? 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)]'
                : 'bg-[var(--surface-elevated)] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)]'
              }
            `}
            style={{ width: `${widthPercent}%` }}
          >
            <span className="flex items-center gap-1">
              {preset.fraction && <span className="text-sm">{preset.fraction}</span>}
              <span>{preset.label}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
