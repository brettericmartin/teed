'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './Button';

type Area = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type AvatarCropperProps = {
  imageSrc: string;
  onComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
};

// Helper function to create a cropped image from the original
// Handles negative space when user zooms out
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  console.log('[AvatarCropper] Creating cropped image:', pixelCrop);

  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = imageSrc;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  console.log('[AvatarCropper] Image loaded:', { width: image.width, height: image.height });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas size to the cropped area (256x256 for avatars)
  const outputSize = 256;
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Fill with a background color for negative space (transparent or neutral)
  ctx.fillStyle = '#1a1a1a'; // Dark background for negative space
  ctx.fillRect(0, 0, outputSize, outputSize);

  // Calculate scale factor
  const scaleX = outputSize / pixelCrop.width;
  const scaleY = outputSize / pixelCrop.height;

  // Calculate where to draw the image on the canvas
  // When zoomed out, pixelCrop might have negative x/y or extend beyond image
  const sourceX = Math.max(0, pixelCrop.x);
  const sourceY = Math.max(0, pixelCrop.y);
  const sourceWidth = Math.min(image.width - sourceX, pixelCrop.width - Math.max(0, -pixelCrop.x));
  const sourceHeight = Math.min(image.height - sourceY, pixelCrop.height - Math.max(0, -pixelCrop.y));

  // Calculate destination position (where on canvas to draw)
  const destX = pixelCrop.x < 0 ? -pixelCrop.x * scaleX : 0;
  const destY = pixelCrop.y < 0 ? -pixelCrop.y * scaleY : 0;
  const destWidth = sourceWidth * scaleX;
  const destHeight = sourceHeight * scaleY;

  console.log('[AvatarCropper] Draw params:', {
    source: { x: sourceX, y: sourceY, w: sourceWidth, h: sourceHeight },
    dest: { x: destX, y: destY, w: destWidth, h: destHeight }
  });

  // Draw the image portion onto the canvas
  if (sourceWidth > 0 && sourceHeight > 0) {
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      destX,
      destY,
      destWidth,
      destHeight
    );
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          console.log('[AvatarCropper] Blob created:', { size: blob.size, type: blob.type });
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
}

export default function AvatarCropper({
  imageSrc,
  onComplete,
  onCancel,
}: AvatarCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.5); // Allow zooming out
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    console.log('[AvatarCropper] Crop complete:', croppedAreaPixels);
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      console.log('[AvatarCropper] No crop area set');
      return;
    }

    setIsProcessing(true);
    console.log('[AvatarCropper] Processing crop...');

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      console.log('[AvatarCropper] Crop successful, calling onComplete');
      onComplete(croppedBlob);
    } catch (error) {
      console.error('[AvatarCropper] Error cropping image:', error);
      alert('Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(Math.max(1, minZoom)); // Reset to 1 or minZoom if minZoom is larger
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-lg mx-4 bg-[var(--surface)] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Crop Profile Picture
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-[var(--surface-hover)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative h-[350px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            minZoom={minZoom}
            maxZoom={3}
            aspect={1}
            cropShape="round"
            showGrid={false}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onMediaLoaded={(mediaSize) => {
              // Calculate min zoom to allow fitting entire image with space
              // Start at a reasonable zoom that shows most of the image
              const calculatedMinZoom = 0.3;
              setMinZoom(calculatedMinZoom);
              console.log('[AvatarCropper] Media loaded:', mediaSize, 'minZoom:', calculatedMinZoom);
            }}
            style={{
              containerStyle: {
                backgroundColor: '#000',
              },
              cropAreaStyle: {
                border: '3px solid var(--teed-green-8)',
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="px-4 py-4 border-t border-[var(--border-subtle)]">
          {/* Zoom Control */}
          <div className="flex items-center gap-4 mb-4">
            <ZoomOut className="w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="range"
              min={minZoom}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-[var(--grey-4)] rounded-lg appearance-none cursor-pointer accent-[var(--teed-green-8)]"
            />
            <ZoomIn className="w-4 h-4 text-[var(--text-secondary)]" />
            <button
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              variant="secondary"
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="create"
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Apply
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-4 pb-4">
          <p className="text-xs text-[var(--text-tertiary)] text-center">
            Drag to reposition • Pinch or use slider to zoom • Square crop for profile picture
          </p>
        </div>
      </div>
    </div>
  );
}
