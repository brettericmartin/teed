'use client';

import { useState, useRef } from 'react';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
}

// Default color presets based on Teed's design system
const DEFAULT_PRESETS = [
  '#7A9770', // teed-green
  '#1F3A2E', // evergreen
  '#D4A574', // copper
  '#CFE3E8', // sky
  '#E8DFD0', // sand
  '#F9F5EE', // cream
  '#FFFFFF', // white
  '#1A1A1A', // near-black
  '#4A90A4', // ocean blue
  '#9B6B9E', // lavender
  '#C75B5B', // coral
  '#5B8C5A', // forest
];

export default function ColorPicker({
  label,
  value,
  onChange,
  presets = DEFAULT_PRESETS,
}: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (color: string) => {
    onChange(color);
  };

  const handleCustomClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--text-secondary)]">
        {label}
      </label>

      {/* Current color display + custom picker trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCustomClick}
          className="relative w-10 h-10 rounded-lg border-2 border-[var(--border-subtle)] overflow-hidden hover:border-[var(--teed-green-7)] transition-colors"
          style={{ backgroundColor: value }}
          title="Choose custom color"
        >
          <input
            ref={inputRef}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </button>
        <span className="text-sm text-[var(--text-tertiary)] font-mono uppercase">
          {value}
        </span>
      </div>

      {/* Preset colors */}
      <div className="flex flex-wrap gap-2 mt-2">
        {presets.map((color) => (
          <button
            key={color}
            onClick={() => handlePresetClick(color)}
            className={`
              relative w-8 h-8 rounded-lg border-2 transition-all
              ${value.toLowerCase() === color.toLowerCase()
                ? 'border-[var(--teed-green-9)] scale-110'
                : 'border-transparent hover:border-[var(--border-subtle)]'
              }
            `}
            style={{ backgroundColor: color }}
            title={color}
          >
            {value.toLowerCase() === color.toLowerCase() && (
              <Check
                className={`absolute inset-0 m-auto w-4 h-4 ${
                  isLightColor(color) ? 'text-gray-800' : 'text-white'
                }`}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Helper to determine if a color is light (for contrast)
function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}
