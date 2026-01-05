'use client';

/**
 * Profile Grid Layout System
 *
 * This component manages a 12-column grid for profile blocks.
 * See GRID_LAYOUT.md in this directory for:
 * - Grid calculation formulas
 * - CSS requirements for blocks to fill their cells
 * - Common mistakes to avoid
 *
 * IMPORTANT: All block components must use `h-full` to fill their grid cell height.
 */

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import GridLayout, { Layout, LayoutItem, verticalCompactor } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { ProfileBlock, GRID_BREAKPOINTS, GRID_COLS, DEFAULT_BLOCK_GRID } from '@/lib/blocks/types';

// Mutable layout item for our internal use
type MutableLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
};

interface ProfileGridLayoutProps {
  blocks: ProfileBlock[];
  isEditMode: boolean;
  onLayoutChange?: (layouts: MutableLayoutItem[]) => void;
  renderBlock: (block: ProfileBlock, isDragging: boolean) => React.ReactNode;
}

// Get current breakpoint based on width
function getBreakpoint(width: number): keyof typeof GRID_COLS {
  if (width >= GRID_BREAKPOINTS.lg) return 'lg';
  if (width >= GRID_BREAKPOINTS.md) return 'md';
  if (width >= GRID_BREAKPOINTS.sm) return 'sm';
  if (width >= GRID_BREAKPOINTS.xs) return 'xs';
  return 'xxs';
}

export default function ProfileGridLayout({
  blocks,
  isEditMode,
  onLayoutChange,
  renderBlock,
}: ProfileGridLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [width, setWidth] = useState(1200);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeWidth, setResizeWidth] = useState<number | null>(null);

  // Handle SSR - only render grid on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track container width - re-run when edit mode changes since the DOM element changes
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.offsetWidth;
        console.log('[ProfileGridLayout] Width updated:', newWidth);
        setWidth(newWidth);
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [mounted, isEditMode]);

  // Current breakpoint and column count
  const breakpoint = getBreakpoint(width);
  const cols = GRID_COLS[breakpoint];

  // Generate layout for current breakpoint
  const layout = useMemo(() => {
    const visibleBlocks = blocks.filter(b => b.is_visible);

    return visibleBlocks.map(b => {
      const defaults = DEFAULT_BLOCK_GRID[b.block_type];
      let x = b.gridX ?? 0;
      let w = b.gridW ?? defaults.w;

      // Adjust for smaller breakpoints
      if (breakpoint === 'sm') {
        x = Math.min(x, 5);
        w = Math.min(w, 6);
      } else if (breakpoint === 'xs') {
        x = 0;
        w = Math.min(w, 4);
      } else if (breakpoint === 'xxs') {
        x = 0;
        w = 2;
      }

      return {
        i: b.id,
        x,
        y: b.gridY ?? 0,
        w,
        h: b.gridH ?? defaults.h,
        minW: 2,
        maxW: cols,
        minH: defaults.minH ?? 1,
        maxH: defaults.maxH ?? 10,
        static: !isEditMode,
      };
    });
  }, [blocks, isEditMode, breakpoint, cols]);

  // Save layout changes - always save in edit mode
  // Even if previewing at smaller breakpoints, we save the full-size coordinates
  const saveLayout = useCallback(
    (newLayout: Layout) => {
      console.log('[ProfileGridLayout] saveLayout called', {
        breakpoint,
        isEditMode,
        hasOnLayoutChange: !!onLayoutChange,
        layoutLength: newLayout.length,
        width,
      });
      if (onLayoutChange && isEditMode) {
        console.log('[ProfileGridLayout] Calling onLayoutChange with:', newLayout.map(item => ({
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        })));
        // Convert readonly Layout to mutable array
        onLayoutChange(newLayout.map(item => ({ ...item })));
      } else {
        console.log('[ProfileGridLayout] NOT saving:', {
          reason: !onLayoutChange ? 'no onLayoutChange' : !isEditMode ? 'not in edit mode' : 'unknown',
        });
      }
    },
    [onLayoutChange, isEditMode, breakpoint, width]
  );

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      saveLayout(newLayout);
    },
    [saveLayout]
  );

  const handleDragStart = useCallback(
    (currentLayout: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null) => {
      if (newItem) {
        setDraggingId(newItem.i);
      }
    },
    []
  );

  const handleDragStop = useCallback(
    (currentLayout: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null) => {
      setDraggingId(null);
      // Also save on drag stop to ensure changes are captured
      saveLayout(currentLayout);
    },
    [saveLayout]
  );

  const handleResizeStart = useCallback(
    (currentLayout: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null) => {
      setIsResizing(true);
      if (newItem) {
        setResizeWidth(newItem.w);
      }
    },
    []
  );

  const handleResize = useCallback(
    (currentLayout: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null) => {
      if (newItem) {
        setResizeWidth(newItem.w);
      }
    },
    []
  );

  const handleResizeStop = useCallback(
    (currentLayout: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null) => {
      setDraggingId(null);
      setIsResizing(false);
      setResizeWidth(null);
      // Also save on resize stop to ensure changes are captured
      saveLayout(currentLayout);
    },
    [saveLayout]
  );

  const visibleBlocks = blocks.filter(b => b.is_visible);

  // Sort blocks by grid position for consistent ordering
  const sortedBlocks = [...visibleBlocks].sort((a, b) => {
    const aY = a.gridY ?? a.sort_order;
    const bY = b.gridY ?? b.sort_order;
    if (aY !== bY) return aY - bY;
    return (a.gridX ?? 0) - (b.gridX ?? 0);
  });

  // SSR fallback only - simple mobile-style stack
  if (!mounted) {
    return (
      <div ref={containerRef}>
        <div className="flex flex-col gap-4">
          {sortedBlocks.map(block => (
            <div key={block.id}>
              {renderBlock(block, false)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Mobile view - simple stack (both edit and view mode)
  if (width < 768) {
    return (
      <div ref={containerRef}>
        <div className="flex flex-col gap-4">
          {sortedBlocks.map(block => (
            <div key={block.id}>
              {renderBlock(block, false)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grid configuration for react-grid-layout v2
  const gridConfig = {
    cols,
    rowHeight: 80,
    margin: [16, 16] as const,
    containerPadding: [0, 0] as const,
  };

  const dragConfig = {
    enabled: isEditMode,
    handle: '.drag-handle',
  };

  const resizeConfig = {
    enabled: isEditMode,
  };

  // Log render state for debugging
  console.log('[ProfileGridLayout] Rendering with react-grid-layout', {
    width,
    breakpoint,
    cols,
    layoutCount: layout.length,
    blocksCount: sortedBlocks.length,
    isEditMode,
    dragEnabled: dragConfig.enabled,
    resizeEnabled: resizeConfig.enabled,
  });

  // Desktop: use react-grid-layout for BOTH edit and view modes
  // This ensures identical rendering - only difference is drag/resize enabled
  const gridWidth = width;

  return (
    <div
      ref={containerRef}
      className={`relative ${isEditMode ? 'pt-4' : ''}`}
    >
      {/* Grid lines overlay - shows column structure */}
      {isEditMode && (() => {
        const gapX = 16;  // margin[0]
        const gapY = 16;  // margin[1]
        const rowHeightPx = 80;

        const colWidth = (gridWidth - gapX * (cols - 1)) / cols;

        // Column LEFT edge: where a block at column i starts
        const getColLeft = (i: number) => i * (colWidth + gapX);
        // Row TOP edge: where a block at row i starts
        const getRowTop = (i: number) => i * (rowHeightPx + gapY);

        // Key column positions (0=start, 6=half, 12=end)
        const keyColumns = [0, 6];

        return (
          <div
            className="absolute inset-0 pointer-events-none z-0"
          >
            {/* Emphasized line at Half point (column 6 start) */}
            <div
              className="absolute top-0 bottom-0 w-px bg-[var(--teed-green-7)]/70"
              style={{ left: getColLeft(6) }}
            />

            {/* Subtle lines at each column start */}
            {Array.from({ length: cols }).map((_, i) => (
              <div
                key={`col-${i}`}
                className="absolute top-0 bottom-0 w-px bg-[var(--border-subtle)]/25"
                style={{ left: getColLeft(i) }}
              />
            ))}

            {/* Right edge line */}
            <div
              className="absolute top-0 bottom-0 w-px bg-[var(--border-subtle)]/25"
              style={{ left: gridWidth }}
            />

            {/* Horizontal row lines */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`row-${i}`}
                className="absolute left-0 right-0 h-px bg-[var(--border-subtle)]/25"
                style={{ top: getRowTop(i) }}
              />
            ))}
          </div>
        );
      })()}

      <GridLayout
        className="layout relative z-10"
        layout={layout}
        width={gridWidth}
        gridConfig={gridConfig}
        dragConfig={dragConfig}
        resizeConfig={resizeConfig}
        compactor={verticalCompactor}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStart={handleResizeStart}
        onResize={handleResize}
        onResizeStop={handleResizeStop}
      >
        {sortedBlocks.map(block => (
          <div key={block.id} className="w-full h-full">
            {renderBlock(block, draggingId === block.id)}
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
