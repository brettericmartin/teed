'use client';

import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Area = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// Aspect ratio presets - from widest/skinniest to tallest/thickest
export const ASPECT_RATIO_PRESETS = [
  { id: '4/1', label: 'Ultra Wide', ratio: 4 / 1, description: 'Skinny banner' },
  { id: '21/9', label: 'Cinematic', ratio: 21 / 9, description: 'Wide banner' },
  { id: '16/9', label: 'Standard', ratio: 16 / 9, description: 'HD format' },
  { id: '3/2', label: 'Classic', ratio: 3 / 2, description: 'Photo format' },
  { id: '4/3', label: 'Tall', ratio: 4 / 3, description: 'Thick banner' },
] as const;

export type AspectRatioId = typeof ASPECT_RATIO_PRESETS[number]['id'];

type CoverPhotoCropperProps = {
  imageSrc: string;
  onComplete: (croppedBlob: Blob, aspectRatio: AspectRatioId) => void;
  onCancel: () => void;
  initialAspectRatio?: AspectRatioId;
};

// Helper function to create a cropped image from the original
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas size to the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
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

export default function CoverPhotoCropper({
  imageSrc,
  onComplete,
  onCancel,
  initialAspectRatio = '21/9',
}: CoverPhotoCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatioId>(initialAspectRatio);

  const currentPreset = ASPECT_RATIO_PRESETS.find(p => p.id === selectedAspectRatio) || ASPECT_RATIO_PRESETS[1];

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Reset crop when aspect ratio changes
  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, [selectedAspectRatio]);

  // Generate preview when crop changes
  useEffect(() => {
    if (!croppedAreaPixels) return;

    const generatePreview = async () => {
      try {
        const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (e) {
        // Ignore preview errors
      }
    };

    // Debounce preview generation
    const timeout = setTimeout(generatePreview, 150);
    return () => clearTimeout(timeout);
  }, [croppedAreaPixels, imageSrc]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onComplete(croppedBlob, selectedAspectRatio);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-4xl bg-[var(--surface)] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] flex-shrink-0">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Crop Cover Photo
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-[var(--surface-hover)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Aspect Ratio Selector */}
          <div className="px-4 py-3 bg-[var(--grey-1)] border-b border-[var(--border-subtle)]">
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
              Choose cover height:
            </p>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedAspectRatio(preset.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    selectedAspectRatio === preset.id
                      ? 'bg-[var(--teed-green-3)] border-[var(--teed-green-8)] text-[var(--teed-green-11)]'
                      : 'bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {/* Visual ratio indicator */}
                  <div
                    className={`h-3 rounded-sm ${
                      selectedAspectRatio === preset.id
                        ? 'bg-[var(--teed-green-9)]'
                        : 'bg-[var(--grey-6)]'
                    }`}
                    style={{ width: `${Math.min(preset.ratio * 12, 48)}px` }}
                  />
                  <div className="text-left">
                    <span className="text-sm font-medium">{preset.label}</span>
                    <span className="text-xs opacity-70 ml-1">({preset.description})</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cropper Area */}
          <div className="relative h-[300px] md:h-[350px] bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={currentPreset.ratio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid={true}
              style={{
                containerStyle: {
                  backgroundColor: '#000',
                },
                cropAreaStyle: {
                  border: '2px solid var(--teed-green-8)',
                },
              }}
            />
          </div>

          {/* Preview Section */}
          <div className="px-4 py-4 bg-[var(--grey-1)] border-t border-[var(--border-subtle)]">
            <p className="text-sm font-medium text-[var(--text-primary)] mb-3">
              Preview:
            </p>

            <div className="max-w-md mx-auto">
              <div
                className="relative w-full rounded-lg overflow-hidden bg-[var(--grey-3)] border border-[var(--border-subtle)]"
                style={{ aspectRatio: selectedAspectRatio.replace('/', ' / ') }}
              >
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Cover preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>
            </div>

            <p className="text-xs text-[var(--text-tertiary)] mt-3 text-center">
              This is how your cover photo will appear on your bag page
            </p>
          </div>
        </div>

        {/* Controls - Fixed at bottom */}
        <div className="px-4 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface)] flex-shrink-0">
          {/* Zoom Control */}
          <div className="flex items-center gap-4 mb-4">
            <ZoomOut className="w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
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
                  Apply Crop
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
