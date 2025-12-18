'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { SelectionRegion, IdentifiedCanvasItem } from '@/lib/apis/types';
import { calculateTapRegion, calculateRectangleRegion } from '@/lib/apis/cropImage';

interface ImageSelectionCanvasProps {
  imageSource: string;                    // Base64 or URL
  onRegionSelected: (region: SelectionRegion) => void;
  identifiedItems?: IdentifiedCanvasItem[];
  onItemClick?: (item: IdentifiedCanvasItem) => void;
  mode: 'tap' | 'draw';
  disabled?: boolean;
  className?: string;
}

/**
 * Interactive canvas for selecting regions on an image
 *
 * Supports two modes:
 * - Tap: Single tap creates an auto-sized region around the tap point
 * - Draw: Click and drag to draw a rectangle
 *
 * Also displays pins for already-identified items.
 */
export function ImageSelectionCanvas({
  imageSource,
  onRegionSelected,
  identifiedItems = [],
  onItemClick,
  mode,
  disabled = false,
  className = ''
}: ImageSelectionCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  // Image dimensions
  const [imageDimensions, setImageDimensions] = useState({
    display: { width: 0, height: 0 },
    natural: { width: 0, height: 0 }
  });

  // Tap animation
  const [tapRipple, setTapRipple] = useState<{ x: number; y: number } | null>(null);

  // Update dimensions when image loads
  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      setImageDimensions({
        display: { width: img.clientWidth, height: img.clientHeight },
        natural: { width: img.naturalWidth, height: img.naturalHeight }
      });
    }
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current) {
        const img = imageRef.current;
        setImageDimensions(prev => ({
          ...prev,
          display: { width: img.clientWidth, height: img.clientHeight }
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get coordinates relative to image
  const getRelativeCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !imageRef.current) return null;

    const rect = imageRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Clamp to image bounds
    return {
      x: Math.max(0, Math.min(x, rect.width)),
      y: Math.max(0, Math.min(y, rect.height))
    };
  }, []);

  // Handle tap
  const handleTap = useCallback((x: number, y: number) => {
    if (disabled) return;

    const { display, natural } = imageDimensions;
    if (display.width === 0 || natural.width === 0) return;

    // Show ripple animation
    setTapRipple({ x, y });
    setTimeout(() => setTapRipple(null), 600);

    // Calculate region
    const region = calculateTapRegion(
      x, y,
      display.width, display.height,
      natural.width, natural.height
    );

    onRegionSelected(region);
  }, [disabled, imageDimensions, onRegionSelected]);

  // Handle rectangle drawing
  const handleDrawEnd = useCallback(() => {
    if (!isDrawing || !drawStart || !drawCurrent) {
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }

    const { display, natural } = imageDimensions;
    if (display.width === 0 || natural.width === 0) {
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }

    // Only create region if it's meaningful (at least 10px in both dimensions)
    const width = Math.abs(drawCurrent.x - drawStart.x);
    const height = Math.abs(drawCurrent.y - drawStart.y);

    if (width > 10 && height > 10) {
      const region = calculateRectangleRegion(
        drawStart.x, drawStart.y,
        drawCurrent.x, drawCurrent.y,
        display.width, display.height,
        natural.width, natural.height
      );

      onRegionSelected(region);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  }, [isDrawing, drawStart, drawCurrent, imageDimensions, onRegionSelected]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;

    const coords = getRelativeCoords(e.clientX, e.clientY);
    if (!coords) return;

    if (mode === 'tap') {
      handleTap(coords.x, coords.y);
    } else {
      setIsDrawing(true);
      setDrawStart(coords);
      setDrawCurrent(coords);
    }
  }, [disabled, mode, getRelativeCoords, handleTap]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || mode !== 'draw') return;

    const coords = getRelativeCoords(e.clientX, e.clientY);
    if (coords) {
      setDrawCurrent(coords);
    }
  }, [isDrawing, mode, getRelativeCoords]);

  const handleMouseUp = useCallback(() => {
    if (mode === 'draw') {
      handleDrawEnd();
    }
  }, [mode, handleDrawEnd]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();

    const touch = e.touches[0];
    const coords = getRelativeCoords(touch.clientX, touch.clientY);
    if (!coords) return;

    if (mode === 'tap') {
      handleTap(coords.x, coords.y);
    } else {
      setIsDrawing(true);
      setDrawStart(coords);
      setDrawCurrent(coords);
    }
  }, [disabled, mode, getRelativeCoords, handleTap]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDrawing || mode !== 'draw') return;
    e.preventDefault();

    const touch = e.touches[0];
    const coords = getRelativeCoords(touch.clientX, touch.clientY);
    if (coords) {
      setDrawCurrent(coords);
    }
  }, [isDrawing, mode, getRelativeCoords]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (mode === 'draw') {
      handleDrawEnd();
    }
  }, [mode, handleDrawEnd]);

  // Calculate drawing preview rectangle
  const getDrawPreviewStyle = (): React.CSSProperties | null => {
    if (!isDrawing || !drawStart || !drawCurrent) return null;

    const left = Math.min(drawStart.x, drawCurrent.x);
    const top = Math.min(drawStart.y, drawCurrent.y);
    const width = Math.abs(drawCurrent.x - drawStart.x);
    const height = Math.abs(drawCurrent.y - drawStart.y);

    return {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      border: '2px dashed #3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      pointerEvents: 'none',
      borderRadius: '4px'
    };
  };

  const drawPreviewStyle = getDrawPreviewStyle();

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      style={{ touchAction: 'none' }} // Prevent scroll during interaction
    >
      {/* Image */}
      <img
        ref={imageRef}
        src={imageSource}
        alt="Select item to identify"
        onLoad={handleImageLoad}
        className="w-full h-auto block rounded-lg"
        draggable={false}
      />

      {/* Interaction overlay */}
      <div
        className={`absolute inset-0 ${disabled ? 'cursor-not-allowed' : mode === 'tap' ? 'cursor-crosshair' : 'cursor-crosshair'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Tap ripple animation */}
        {tapRipple && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: tapRipple.x,
              top: tapRipple.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="w-16 h-16 rounded-full border-2 border-blue-500 animate-ping" />
            <div className="absolute inset-0 w-16 h-16 rounded-full bg-blue-500/20 animate-pulse" />
          </div>
        )}

        {/* Draw preview rectangle */}
        {drawPreviewStyle && <div style={drawPreviewStyle} />}

        {/* Identified item pins - 44px touch target for mobile */}
        {identifiedItems.map((item, index) => (
          <button
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              onItemClick?.(item);
            }}
            className="absolute transform -translate-x-1/2 -translate-y-full group min-w-[44px] min-h-[44px] flex items-end justify-center"
            style={{
              left: `${item.region.centerX * 100}%`,
              top: `${item.region.centerY * 100}%`
            }}
          >
            {/* Pin */}
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shadow-lg group-hover:bg-green-600 active:bg-green-700 transition-colors">
                {index + 1}
              </div>
              {/* Pin point */}
              <div
                className="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[10px] border-l-transparent border-r-transparent border-t-green-500"
                style={{ top: '100%' }}
              />
            </div>
            {/* Tooltip - hidden on mobile, shown on hover for desktop */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
              {item.result.guesses[item.selectedGuessIndex]?.name || 'Identified item'}
            </div>
          </button>
        ))}
      </div>

      {/* Instructions overlay (when no items identified) */}
      {identifiedItems.length === 0 && !disabled && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 text-white text-sm rounded-full pointer-events-none">
          {mode === 'tap' ? 'Tap on an item to identify it' : 'Draw a box around an item'}
        </div>
      )}

      {/* Disabled overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
