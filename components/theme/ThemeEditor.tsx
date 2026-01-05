'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Palette, Loader2, RotateCcw, Check } from 'lucide-react';
import ColorPicker from './ColorPicker';
import BackgroundPicker from './BackgroundPicker';
import {
  ProfileTheme,
  DEFAULT_THEME,
} from '@/lib/blocks/types';

interface ThemeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  currentTheme: ProfileTheme | null;
  onPreviewChange?: (theme: ProfileTheme) => void;  // Live preview callback
  onThemeChange?: (theme: ProfileTheme) => void;
}

// Preset themes
const PRESET_THEMES: Array<{ name: string; theme: Partial<ProfileTheme> }> = [
  {
    name: 'Default',
    theme: DEFAULT_THEME,
  },
  {
    name: 'Dark',
    theme: {
      primary_color: '#7A9770',
      accent_color: '#4A90A4',
      background_color: '#1A1A1A',
      text_color: '#F9F5EE',
      background_type: 'solid',
      card_style: 'elevated',
    },
  },
  {
    name: 'Ocean',
    theme: {
      primary_color: '#4A90A4',
      accent_color: '#CFE3E8',
      background_color: '#F0F7FA',
      text_color: '#1A3A4A',
      background_type: 'solid',
      card_style: 'elevated',
    },
  },
  {
    name: 'Earth',
    theme: {
      primary_color: '#8B7355',
      accent_color: '#D4A574',
      background_color: '#F5F0E8',
      text_color: '#3D3028',
      background_type: 'solid',
      card_style: 'flat',
    },
  },
  {
    name: 'Sunset',
    theme: {
      primary_color: '#C75B5B',
      accent_color: '#D4A574',
      background_type: 'gradient',
      background_gradient_start: '#FFF5F0',
      background_gradient_end: '#FFE8DC',
      background_gradient_direction: 'to-br',
      text_color: '#3D2828',
      card_style: 'elevated',
    },
  },
  {
    name: 'Forest',
    theme: {
      primary_color: '#5B8C5A',
      accent_color: '#7A9770',
      background_type: 'gradient',
      background_gradient_start: '#1F3A2E',
      background_gradient_end: '#2D5040',
      background_gradient_direction: 'to-br',
      text_color: '#F9F5EE',
      card_style: 'outlined',
    },
  },
];

export default function ThemeEditor({
  isOpen,
  onClose,
  profileId,
  currentTheme,
  onPreviewChange,
  onThemeChange,
}: ThemeEditorProps) {
  const [theme, setTheme] = useState<Partial<ProfileTheme>>(
    currentTheme || DEFAULT_THEME
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset local state when currentTheme changes (e.g. on panel open)
  useEffect(() => {
    if (currentTheme) {
      setTheme(currentTheme);
      setIsDirty(false);
    }
  }, [currentTheme]);

  // Wrapper function: updates local state + sends to preview immediately
  const updateTheme = useCallback((updates: Partial<ProfileTheme>) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);
    setIsDirty(true);
    onPreviewChange?.(newTheme as ProfileTheme);  // Immediate preview
  }, [theme, onPreviewChange]);

  // Debounced auto-save: save 1.5s after last change
  useEffect(() => {
    if (!isDirty || isSaving) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const response = await fetch('/api/profile/theme', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(theme),
        });

        if (!response.ok) throw new Error('Failed to save theme');

        const savedTheme = await response.json();
        onThemeChange?.(savedTheme);
        setIsDirty(false);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      } catch (error) {
        console.error('Error saving theme:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, theme, isSaving, onThemeChange]);

  const handleReset = () => {
    updateTheme(DEFAULT_THEME);
  };

  const handlePresetSelect = (preset: Partial<ProfileTheme>) => {
    updateTheme(preset);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Panel - slides in from right */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[var(--surface)] z-50 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[var(--teed-green-9)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Theme Editor
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Preset Themes */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
              Quick Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_THEMES.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset.theme)}
                  className="p-2 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--teed-green-7)] transition-colors text-center"
                >
                  <div
                    className="w-full h-8 rounded-md mb-1.5"
                    style={{
                      background:
                        preset.theme.background_type === 'gradient'
                          ? `linear-gradient(to bottom right, ${preset.theme.background_gradient_start}, ${preset.theme.background_gradient_end})`
                          : preset.theme.background_color,
                    }}
                  />
                  <span className="text-xs text-[var(--text-secondary)]">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--border-subtle)]" />

          {/* Primary Color */}
          <ColorPicker
            label="Primary Color"
            value={theme.primary_color || DEFAULT_THEME.primary_color}
            onChange={(color) => updateTheme({ primary_color: color })}
          />

          {/* Accent Color */}
          <ColorPicker
            label="Accent Color"
            value={theme.accent_color || DEFAULT_THEME.accent_color}
            onChange={(color) => updateTheme({ accent_color: color })}
          />

          {/* Text Color */}
          <ColorPicker
            label="Text Color"
            value={theme.text_color || DEFAULT_THEME.text_color}
            onChange={(color) => updateTheme({ text_color: color })}
          />

          {/* Divider */}
          <div className="border-t border-[var(--border-subtle)]" />

          {/* Background */}
          <BackgroundPicker
            type={theme.background_type || 'solid'}
            solidColor={theme.background_color || DEFAULT_THEME.background_color}
            gradientStart={theme.background_gradient_start || '#7A9770'}
            gradientEnd={theme.background_gradient_end || '#CFE3E8'}
            gradientDirection={theme.background_gradient_direction || 'to-bottom'}
            imageUrl={theme.background_image_url || undefined}
            onChange={(value) =>
              updateTheme({
                background_type: value.type,
                background_color: value.solidColor,
                background_gradient_start: value.gradientStart,
                background_gradient_end: value.gradientEnd,
                background_gradient_direction: value.gradientDirection,
                background_image_url: value.imageUrl,
              })
            }
          />

          {/* Card Style and Corner Roundness removed - not yet implemented */}
        </div>

        {/* Footer - auto-save, so just show status + Done */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <div className="flex items-center gap-3">
            {/* Auto-save status */}
            {isSaving ? (
              <div className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </div>
            ) : showSaved ? (
              <div className="flex items-center gap-1.5 text-sm text-[var(--teed-green-9)]">
                <Check className="w-4 h-4" />
                Saved
              </div>
            ) : isDirty ? (
              <span className="text-xs text-[var(--text-tertiary)]">
                Auto-saving...
              </span>
            ) : (
              <span className="text-xs text-[var(--text-tertiary)]">
                Changes save automatically
              </span>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--teed-green-9)] text-white rounded-lg font-medium hover:bg-[var(--teed-green-10)] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
