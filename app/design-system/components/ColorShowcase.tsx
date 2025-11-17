'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface ColorScale {
  name: string;
  description: string;
  steps: { step: number; value: string; usage: string }[];
}

export function ColorShowcase() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedColor(value);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const brandColors = [
    { name: 'Earthy Sage', value: '#8BAA7E', variable: '--teed-green-8', usage: 'AI actions, intelligent features' },
    { name: 'Deep Evergreen', value: '#1F3A2E', variable: '--evergreen-12', usage: 'Primary text, create actions' },
    { name: 'Warm Sand', value: '#D9B47C', variable: '--sand-8', usage: 'Warm accents, highlights' },
    { name: 'Stone Grey', value: '#868996', variable: '--grey-8', usage: 'Secondary text, labels' },
    { name: 'Sky Tint', value: '#CFE8E1', variable: '--sky-8', usage: 'Backgrounds, subtle accents' },
    { name: 'Copper', value: '#C2784A', variable: '--copper-8', usage: 'Destructive actions, warnings' },
  ];

  const colorScales: ColorScale[] = [
    {
      name: 'Teed Green (Earthy Sage)',
      description: 'Primary brand color for AI features and intelligent actions',
      steps: [
        { step: 1, value: '#F8FBF8', usage: 'Subtle backgrounds' },
        { step: 2, value: '#F0F6F0', usage: 'App backgrounds' },
        { step: 3, value: '#E3EFE4', usage: 'Hover backgrounds' },
        { step: 4, value: '#D4E7D6', usage: 'Active backgrounds' },
        { step: 5, value: '#C3DEC5', usage: 'Borders (subtle)' },
        { step: 6, value: '#B0D4B3', usage: 'Borders (hover)' },
        { step: 7, value: '#9BBF9E', usage: 'Borders (strong)' },
        { step: 8, value: '#8BAA7E', usage: 'Primary - Solid backgrounds' },
        { step: 9, value: '#7A9770', usage: 'Hover states' },
        { step: 10, value: '#688561', usage: 'Active states' },
        { step: 11, value: '#567352', usage: 'Text (low contrast)' },
        { step: 12, value: '#3D5240', usage: 'Text (high contrast)' },
      ],
    },
    {
      name: 'Deep Evergreen',
      description: 'Primary text color and create/add actions',
      steps: [
        { step: 1, value: '#FAFBFA', usage: 'Subtle backgrounds' },
        { step: 2, value: '#F4F6F5', usage: 'App backgrounds' },
        { step: 3, value: '#E8EEEA', usage: 'Hover backgrounds' },
        { step: 4, value: '#D9E3DC', usage: 'Active backgrounds' },
        { step: 5, value: '#C7D6CB', usage: 'Borders (subtle)' },
        { step: 6, value: '#B1C5B7', usage: 'Borders (hover)' },
        { step: 7, value: '#96B09D', usage: 'Borders (strong)' },
        { step: 8, value: '#73937E', usage: 'Solid backgrounds' },
        { step: 9, value: '#4F7159', usage: 'Hover states' },
        { step: 10, value: '#3D5947', usage: 'Active states' },
        { step: 11, value: '#2A4434', usage: 'Text (low contrast)' },
        { step: 12, value: '#1F3A2E', usage: 'Primary - Text (high contrast)' },
      ],
    },
    {
      name: 'Copper',
      description: 'Destructive actions and warning states',
      steps: [
        { step: 1, value: '#FEF8F5', usage: 'Subtle backgrounds' },
        { step: 2, value: '#FDF2EB', usage: 'Error backgrounds' },
        { step: 3, value: '#FAE7D9', usage: 'Hover backgrounds' },
        { step: 4, value: '#F7DAC4', usage: 'Active backgrounds' },
        { step: 5, value: '#F3CBA9', usage: 'Borders (subtle)' },
        { step: 6, value: '#EDB889', usage: 'Borders (hover)' },
        { step: 7, value: '#E49F63', usage: 'Borders (strong)' },
        { step: 8, value: '#C2784A', usage: 'Primary - Solid backgrounds' },
        { step: 9, value: '#B46A3F', usage: 'Hover states' },
        { step: 10, value: '#A55C35', usage: 'Active states' },
        { step: 11, value: '#8B4D2C', usage: 'Text (low contrast)' },
        { step: 12, value: '#6E3D23', usage: 'Text (high contrast)' },
      ],
    },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold text-[var(--text-primary)] mb-3">Color System</h2>
        <p className="text-[var(--text-secondary)] text-lg">
          Teed uses a systematic color scale approach with 12 steps per color family, ensuring
          consistent contrast and semantic meaning across the design system.
        </p>
      </div>

      {/* Brand Colors Overview */}
      <div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Brand Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brandColors.map((color) => (
            <button
              key={color.value}
              onClick={() => copyToClipboard(color.value)}
              className="bg-white border border-[var(--border-subtle)] rounded-xl p-6 hover:border-[var(--border-strong)] transition-all text-left group"
            >
              <div
                className="w-full h-24 rounded-lg mb-4 shadow-sm relative overflow-hidden"
                style={{ backgroundColor: color.value }}
              >
                {copiedColor === color.value && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--teed-green-8)] transition-colors">
                {color.name}
              </h4>
              <p className="text-sm font-mono text-[var(--text-secondary)] mb-2">{color.value}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{color.usage}</p>
              <p className="text-xs font-mono text-[var(--text-tertiary)] mt-2">{color.variable}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Color Scales */}
      {colorScales.map((scale) => (
        <div key={scale.name}>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{scale.name}</h3>
          <p className="text-[var(--text-secondary)] mb-6">{scale.description}</p>

          <div className="bg-white border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            {scale.steps.map((step, index) => (
              <button
                key={step.step}
                onClick={() => copyToClipboard(step.value)}
                className={`w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--surface-hover)] transition-colors ${
                  index !== scale.steps.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-16 h-10 rounded-lg shadow-sm border border-[var(--border-subtle)] flex-shrink-0"
                    style={{ backgroundColor: step.value }}
                  />
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                        Step {step.step}
                      </span>
                      <span className="font-mono text-sm text-[var(--text-secondary)]">
                        {step.value}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-tertiary)]">{step.usage}</p>
                  </div>
                </div>
                {copiedColor === step.value && (
                  <Check className="w-5 h-5 text-[var(--teed-green-8)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Accessibility Guidelines */}
      <div className="bg-[var(--sky-2)] border border-[var(--border-subtle)] rounded-xl p-8">
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          Accessibility Guidelines
        </h3>
        <div className="space-y-4 text-[var(--text-secondary)]">
          <div>
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">Contrast Requirements</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Normal text (16px): 4.5:1 contrast ratio (WCAG AA)</li>
              <li>Large text (18px+, 14px+ bold): 3:1 contrast ratio (WCAG AA)</li>
              <li>UI components (borders, icons): 3:1 minimum</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">Color Usage Rules</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Never use color alone to convey meaning - always pair with text, icons, or patterns</li>
              <li>Test all combinations with a contrast checker before use</li>
              <li>Use steps 8-12 for text on light backgrounds</li>
              <li>Use steps 1-5 for backgrounds and subtle UI elements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
