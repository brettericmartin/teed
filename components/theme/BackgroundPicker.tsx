'use client';

import { useState } from 'react';
import { Check, Upload, X } from 'lucide-react';
import ColorPicker from './ColorPicker';
import { BackgroundType, GradientDirection } from '@/lib/blocks/types';

interface BackgroundPickerProps {
  type: BackgroundType;
  solidColor: string;
  gradientStart?: string;
  gradientEnd?: string;
  gradientDirection?: GradientDirection;
  imageUrl?: string;
  onChange: (value: {
    type: BackgroundType;
    solidColor?: string;
    gradientStart?: string;
    gradientEnd?: string;
    gradientDirection?: GradientDirection;
    imageUrl?: string;
  }) => void;
}

const GRADIENT_DIRECTIONS: { value: GradientDirection; label: string }[] = [
  { value: 'to-bottom', label: 'Top to Bottom' },
  { value: 'to-top', label: 'Bottom to Top' },
  { value: 'to-right', label: 'Left to Right' },
  { value: 'to-left', label: 'Right to Left' },
  { value: 'to-br', label: 'Diagonal (↘)' },
  { value: 'to-bl', label: 'Diagonal (↙)' },
  { value: 'to-tr', label: 'Diagonal (↗)' },
  { value: 'to-tl', label: 'Diagonal (↖)' },
];

const PRESET_GRADIENTS = [
  { start: '#7A9770', end: '#CFE3E8', dir: 'to-br' as GradientDirection },
  { start: '#1F3A2E', end: '#7A9770', dir: 'to-bottom' as GradientDirection },
  { start: '#D4A574', end: '#E8DFD0', dir: 'to-br' as GradientDirection },
  { start: '#CFE3E8', end: '#F9F5EE', dir: 'to-bottom' as GradientDirection },
  { start: '#4A90A4', end: '#9B6B9E', dir: 'to-br' as GradientDirection },
  { start: '#1A1A1A', end: '#4A90A4', dir: 'to-br' as GradientDirection },
];

export default function BackgroundPicker({
  type,
  solidColor,
  gradientStart = '#7A9770',
  gradientEnd = '#CFE3E8',
  gradientDirection = 'to-bottom',
  imageUrl,
  onChange,
}: BackgroundPickerProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleTypeChange = (newType: BackgroundType) => {
    onChange({
      type: newType,
      solidColor,
      gradientStart,
      gradientEnd,
      gradientDirection,
      imageUrl,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'profile_background');

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();
      onChange({
        type: 'image',
        solidColor,
        gradientStart,
        gradientEnd,
        gradientDirection,
        imageUrl: url,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onChange({
      type: 'solid',
      solidColor,
      gradientStart,
      gradientEnd,
      gradientDirection,
      imageUrl: undefined,
    });
  };

  const getGradientStyle = (start: string, end: string, dir: GradientDirection) => {
    const directionMap: Record<GradientDirection, string> = {
      'to-bottom': 'to bottom',
      'to-top': 'to top',
      'to-right': 'to right',
      'to-left': 'to left',
      'to-br': 'to bottom right',
      'to-bl': 'to bottom left',
      'to-tr': 'to top right',
      'to-tl': 'to top left',
    };
    return `linear-gradient(${directionMap[dir]}, ${start}, ${end})`;
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-[var(--text-secondary)]">
        Background Style
      </label>

      {/* Type selector */}
      <div className="flex gap-2">
        {(['solid', 'gradient', 'image'] as BackgroundType[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTypeChange(t)}
            className={`
              flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all
              ${type === t
                ? 'bg-[var(--teed-green-9)] text-white'
                : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
              }
            `}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Solid color options */}
      {type === 'solid' && (
        <ColorPicker
          label="Background Color"
          value={solidColor}
          onChange={(color) =>
            onChange({
              type: 'solid',
              solidColor: color,
              gradientStart,
              gradientEnd,
              gradientDirection,
              imageUrl,
            })
          }
        />
      )}

      {/* Gradient options */}
      {type === 'gradient' && (
        <div className="space-y-4">
          {/* Preset gradients */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Preset Gradients
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_GRADIENTS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() =>
                    onChange({
                      type: 'gradient',
                      solidColor,
                      gradientStart: preset.start,
                      gradientEnd: preset.end,
                      gradientDirection: preset.dir,
                      imageUrl,
                    })
                  }
                  className={`
                    w-12 h-12 rounded-lg border-2 transition-all
                    ${gradientStart === preset.start && gradientEnd === preset.end
                      ? 'border-[var(--teed-green-9)] scale-110'
                      : 'border-transparent hover:border-[var(--border-subtle)]'
                    }
                  `}
                  style={{ background: getGradientStyle(preset.start, preset.end, preset.dir) }}
                />
              ))}
            </div>
          </div>

          {/* Custom gradient colors */}
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              label="Start Color"
              value={gradientStart}
              onChange={(color) =>
                onChange({
                  type: 'gradient',
                  solidColor,
                  gradientStart: color,
                  gradientEnd,
                  gradientDirection,
                  imageUrl,
                })
              }
            />
            <ColorPicker
              label="End Color"
              value={gradientEnd}
              onChange={(color) =>
                onChange({
                  type: 'gradient',
                  solidColor,
                  gradientStart,
                  gradientEnd: color,
                  gradientDirection,
                  imageUrl,
                })
              }
            />
          </div>

          {/* Direction */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Direction
            </label>
            <select
              value={gradientDirection}
              onChange={(e) =>
                onChange({
                  type: 'gradient',
                  solidColor,
                  gradientStart,
                  gradientEnd,
                  gradientDirection: e.target.value as GradientDirection,
                  imageUrl,
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)]"
            >
              {GRADIENT_DIRECTIONS.map((dir) => (
                <option key={dir.value} value={dir.value}>
                  {dir.label}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Preview
            </label>
            <div
              className="h-20 rounded-xl"
              style={{ background: getGradientStyle(gradientStart, gradientEnd, gradientDirection) }}
            />
          </div>
        </div>
      )}

      {/* Image options */}
      {type === 'image' && (
        <div className="space-y-4">
          {imageUrl ? (
            <div className="relative">
              <img
                src={imageUrl}
                alt="Background preview"
                className="w-full h-32 object-cover rounded-xl"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[var(--border-subtle)] rounded-xl cursor-pointer hover:border-[var(--teed-green-7)] hover:bg-[var(--surface-hover)] transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
              />
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-[var(--border-subtle)] border-t-[var(--teed-green-9)] rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-[var(--text-tertiary)] mb-2" />
                  <span className="text-sm text-[var(--text-tertiary)]">
                    Click to upload image
                  </span>
                </>
              )}
            </label>
          )}
        </div>
      )}
    </div>
  );
}
