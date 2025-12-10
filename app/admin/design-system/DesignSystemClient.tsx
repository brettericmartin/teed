'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

// Color scales based on globals.css
const colorScales = [
  {
    name: 'Teed Green',
    prefix: 'teed-green',
    description: 'Primary brand color - vibrant green for CTAs and highlights',
  },
  {
    name: 'Evergreen',
    prefix: 'evergreen',
    description: 'Secondary green - deeper, more muted for backgrounds',
  },
  {
    name: 'Sand',
    prefix: 'sand',
    description: 'Warm neutral for backgrounds and subtle accents',
  },
  {
    name: 'Grey',
    prefix: 'grey',
    description: 'Cool neutral for text and borders',
  },
  {
    name: 'Sky',
    prefix: 'sky',
    description: 'Blue accent for links and informational elements',
  },
  {
    name: 'Copper',
    prefix: 'copper',
    description: 'Warm accent for special highlights and alerts',
  },
  {
    name: 'Amber',
    prefix: 'amber',
    description: 'Warning and admin-related highlights',
  },
];

const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const typographySizes = [
  { name: 'text-xs', size: '0.75rem (12px)', lineHeight: '1rem' },
  { name: 'text-sm', size: '0.875rem (14px)', lineHeight: '1.25rem' },
  { name: 'text-base', size: '1rem (16px)', lineHeight: '1.5rem' },
  { name: 'text-lg', size: '1.125rem (18px)', lineHeight: '1.75rem' },
  { name: 'text-xl', size: '1.25rem (20px)', lineHeight: '1.75rem' },
  { name: 'text-2xl', size: '1.5rem (24px)', lineHeight: '2rem' },
  { name: 'text-3xl', size: '1.875rem (30px)', lineHeight: '2.25rem' },
  { name: 'text-4xl', size: '2.25rem (36px)', lineHeight: '2.5rem' },
];

const spacingScale = [
  { name: '--space-1', value: '0.25rem (4px)' },
  { name: '--space-2', value: '0.5rem (8px)' },
  { name: '--space-3', value: '0.75rem (12px)' },
  { name: '--space-4', value: '1rem (16px)' },
  { name: '--space-5', value: '1.25rem (20px)' },
  { name: '--space-6', value: '1.5rem (24px)' },
  { name: '--space-7', value: '1.75rem (28px)' },
  { name: '--space-8', value: '2rem (32px)' },
  { name: '--space-9', value: '2.25rem (36px)' },
  { name: '--space-10', value: '2.5rem (40px)' },
  { name: '--space-11', value: '2.75rem (44px)' },
  { name: '--space-12', value: '3rem (48px)' },
];

const shadowScale = [
  { name: '--shadow-1', description: 'Subtle elevation' },
  { name: '--shadow-2', description: 'Cards, dropdowns' },
  { name: '--shadow-3', description: 'Hover states' },
  { name: '--shadow-4', description: 'Modals' },
  { name: '--shadow-5', description: 'Dialogs, overlays' },
  { name: '--shadow-6', description: 'Maximum elevation' },
];

const radiusScale = [
  { name: '--radius-sm', value: '0.25rem (4px)' },
  { name: '--radius-md', value: '0.375rem (6px)' },
  { name: '--radius-lg', value: '0.5rem (8px)' },
  { name: '--radius-xl', value: '0.75rem (12px)' },
  { name: '--radius-2xl', value: '1rem (16px)' },
  { name: '--radius-full', value: '9999px' },
];

type Tab = 'colors' | 'typography' | 'spacing' | 'components';

export default function DesignSystemClient() {
  const [activeTab, setActiveTab] = useState<Tab>('colors');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'colors', label: 'Colors' },
    { id: 'typography', label: 'Typography' },
    { id: 'spacing', label: 'Spacing & Shadows' },
    { id: 'components', label: 'Components' },
  ];

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Design System
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Colors, typography, spacing, and component reference
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[var(--teed-green-9)] text-[var(--teed-green-11)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="space-y-12">
            {/* Semantic Tokens */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Semantic Tokens
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Use these for consistent UI elements across light and dark modes.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: '--surface', label: 'Surface' },
                  { name: '--surface-elevated', label: 'Surface Elevated' },
                  { name: '--background', label: 'Background' },
                  { name: '--border-subtle', label: 'Border Subtle' },
                  { name: '--text-primary', label: 'Text Primary' },
                  { name: '--text-secondary', label: 'Text Secondary' },
                  { name: '--text-tertiary', label: 'Text Tertiary' },
                  { name: '--text-inverse', label: 'Text Inverse' },
                ].map((token) => (
                  <button
                    key={token.name}
                    onClick={() => copyToken(`var(${token.name})`)}
                    className="group p-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--teed-green-6)] transition-colors text-left"
                  >
                    <div
                      className="w-full h-12 rounded-md mb-3 border border-[var(--border-subtle)]"
                      style={{ backgroundColor: `var(${token.name})` }}
                    />
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {token.label}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] font-mono">
                      {token.name}
                    </p>
                    {copiedToken === `var(${token.name})` && (
                      <span className="text-xs text-[var(--teed-green-11)]">
                        Copied!
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Color Scales */}
            {colorScales.map((scale) => (
              <section key={scale.prefix}>
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                      {scale.name}
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {scale.description}
                    </p>
                  </div>
                  <code className="text-xs text-[var(--text-tertiary)] bg-[var(--grey-3)] px-2 py-1 rounded">
                    --{scale.prefix}-[1-12]
                  </code>
                </div>
                <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                  {steps.map((step) => {
                    const token = `--${scale.prefix}-${step}`;
                    return (
                      <button
                        key={step}
                        onClick={() => copyToken(`var(${token})`)}
                        className="group relative"
                        title={token}
                      >
                        <div
                          className="aspect-square rounded-lg border border-[var(--border-subtle)] group-hover:ring-2 ring-[var(--teed-green-9)] transition-all"
                          style={{ backgroundColor: `var(${token})` }}
                        />
                        <span className="block text-center text-xs text-[var(--text-tertiary)] mt-1">
                          {step}
                        </span>
                        {copiedToken === `var(${token})` && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--grey-12)] text-[var(--grey-1)] text-xs px-2 py-1 rounded">
                            Copied
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* Usage Guide */}
            <section className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                Color Step Usage Guide
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    Steps 1-2: Backgrounds
                  </p>
                  <p>Subtle backgrounds, page backgrounds</p>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    Steps 3-4: UI Elements
                  </p>
                  <p>Subtle borders, separators, disabled states</p>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    Steps 5-6: Borders & Hover
                  </p>
                  <p>Borders, hover states, subtle indicators</p>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    Steps 7-8: Solid Backgrounds
                  </p>
                  <p>Solid backgrounds for UI elements</p>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    Steps 9-10: Primary Actions
                  </p>
                  <p>Buttons, links, primary accents</p>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    Steps 11-12: Text
                  </p>
                  <p>High contrast text, icons</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <div className="space-y-12">
            {/* Font Families */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Font Families
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                  <p className="text-3xl font-medium text-[var(--text-primary)] mb-2">
                    Inter
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Primary font for body text and UI elements
                  </p>
                  <p className="font-sans text-[var(--text-primary)]">
                    The quick brown fox jumps over the lazy dog.
                  </p>
                </div>
                <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                  <p className="text-3xl font-medium text-[var(--text-primary)] mb-2 font-heading">
                    System UI
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Headings use system fonts for performance
                  </p>
                  <p className="font-heading text-[var(--text-primary)]">
                    The quick brown fox jumps over the lazy dog.
                  </p>
                </div>
              </div>
            </section>

            {/* Type Scale */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Type Scale
              </h2>
              <div className="space-y-4">
                {typographySizes.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-baseline gap-6 p-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg"
                  >
                    <code className="text-xs text-[var(--text-tertiary)] bg-[var(--grey-3)] px-2 py-1 rounded w-24 text-center">
                      {item.name}
                    </code>
                    <span
                      className={`${item.name} text-[var(--text-primary)] flex-1`}
                    >
                      The quick brown fox
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {item.size}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Font Weights */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Font Weights
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { class: 'font-normal', weight: '400', name: 'Normal' },
                  { class: 'font-medium', weight: '500', name: 'Medium' },
                  { class: 'font-semibold', weight: '600', name: 'Semibold' },
                  { class: 'font-bold', weight: '700', name: 'Bold' },
                ].map((item) => (
                  <div
                    key={item.class}
                    className="p-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg"
                  >
                    <p
                      className={`text-2xl ${item.class} text-[var(--text-primary)] mb-2`}
                    >
                      {item.name}
                    </p>
                    <code className="text-xs text-[var(--text-tertiary)]">
                      {item.class} ({item.weight})
                    </code>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Spacing & Shadows Tab */}
        {activeTab === 'spacing' && (
          <div className="space-y-12">
            {/* Spacing */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Spacing Scale (8pt Grid)
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                All spacing follows an 8pt base grid for visual harmony.
              </p>
              <div className="space-y-3">
                {spacingScale.map((item, index) => (
                  <button
                    key={item.name}
                    onClick={() => copyToken(`var(${item.name})`)}
                    className="flex items-center gap-4 w-full p-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--teed-green-6)] transition-colors"
                  >
                    <code className="text-xs text-[var(--text-tertiary)] bg-[var(--grey-3)] px-2 py-1 rounded w-28 text-center">
                      {item.name}
                    </code>
                    <div
                      className="h-4 bg-[var(--teed-green-9)] rounded"
                      style={{ width: `${(index + 1) * 16}px` }}
                    />
                    <span className="text-sm text-[var(--text-secondary)]">
                      {item.value}
                    </span>
                    {copiedToken === `var(${item.name})` && (
                      <Check className="w-4 h-4 text-[var(--teed-green-11)] ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Shadows */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Shadow Scale
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Elevation shadows for depth and hierarchy.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                {shadowScale.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => copyToken(`var(${item.name})`)}
                    className="p-6 bg-[var(--surface)] rounded-xl text-left transition-all hover:scale-105"
                    style={{ boxShadow: `var(${item.name})` }}
                  >
                    <code className="text-xs text-[var(--text-tertiary)] bg-[var(--grey-3)] px-2 py-1 rounded">
                      {item.name}
                    </code>
                    <p className="text-sm text-[var(--text-secondary)] mt-3">
                      {item.description}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            {/* Border Radius */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Border Radius
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {radiusScale.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => copyToken(`var(${item.name})`)}
                    className="p-4 bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--teed-green-6)] transition-colors text-center"
                    style={{ borderRadius: `var(${item.name})` }}
                  >
                    <div
                      className="w-16 h-16 mx-auto bg-[var(--teed-green-4)] border-2 border-[var(--teed-green-9)] mb-3"
                      style={{ borderRadius: `var(${item.name})` }}
                    />
                    <code className="text-xs text-[var(--text-tertiary)]">
                      {item.name.replace('--radius-', '')}
                    </code>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {item.value}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Components Tab */}
        {activeTab === 'components' && (
          <div className="space-y-12">
            {/* Buttons */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Buttons
              </h2>
              <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
                  Primary Buttons
                </h3>
                <div className="flex flex-wrap gap-4 mb-8">
                  <button className="px-4 py-2 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white rounded-lg font-medium transition-colors">
                    Primary Action
                  </button>
                  <button className="px-4 py-2 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white rounded-lg font-medium transition-colors opacity-50 cursor-not-allowed">
                    Disabled
                  </button>
                  <button className="px-3 py-1.5 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white rounded-md text-sm font-medium transition-colors">
                    Small
                  </button>
                </div>

                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
                  Secondary Buttons
                </h3>
                <div className="flex flex-wrap gap-4 mb-8">
                  <button className="px-4 py-2 bg-[var(--grey-4)] hover:bg-[var(--grey-5)] text-[var(--text-primary)] rounded-lg font-medium transition-colors">
                    Secondary
                  </button>
                  <button className="px-4 py-2 border border-[var(--border-subtle)] hover:bg-[var(--grey-3)] text-[var(--text-primary)] rounded-lg font-medium transition-colors">
                    Outline
                  </button>
                  <button className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--grey-3)] rounded-lg font-medium transition-colors">
                    Ghost
                  </button>
                </div>

                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
                  Semantic Buttons
                </h3>
                <div className="flex flex-wrap gap-4">
                  <button className="px-4 py-2 bg-[var(--sky-9)] hover:bg-[var(--sky-10)] text-white rounded-lg font-medium transition-colors">
                    Info
                  </button>
                  <button className="px-4 py-2 bg-[var(--amber-9)] hover:bg-[var(--amber-10)] text-white rounded-lg font-medium transition-colors">
                    Warning
                  </button>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                    Danger
                  </button>
                </div>
              </div>
            </section>

            {/* Badges */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Badges & Pills
              </h2>
              <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-[var(--teed-green-4)] text-[var(--teed-green-11)] rounded-full text-sm font-medium">
                    Success
                  </span>
                  <span className="px-3 py-1 bg-[var(--sky-4)] text-[var(--sky-11)] rounded-full text-sm font-medium">
                    Info
                  </span>
                  <span className="px-3 py-1 bg-[var(--amber-4)] text-[var(--amber-11)] rounded-full text-sm font-medium">
                    Warning
                  </span>
                  <span className="px-3 py-1 bg-[var(--copper-4)] text-[var(--copper-11)] rounded-full text-sm font-medium">
                    Highlight
                  </span>
                  <span className="px-3 py-1 bg-[var(--grey-4)] text-[var(--grey-11)] rounded-full text-sm font-medium">
                    Neutral
                  </span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    Error
                  </span>
                </div>
              </div>
            </section>

            {/* Cards */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Cards
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    Basic Card
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Standard card with subtle border.
                  </p>
                </div>
                <div className="p-6 bg-[var(--surface-elevated)] rounded-xl shadow-[var(--shadow-2)]">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    Elevated Card
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Card with shadow elevation.
                  </p>
                </div>
                <div className="p-6 bg-gradient-to-br from-[var(--teed-green-4)] to-[var(--teed-green-6)] border border-[var(--teed-green-6)] rounded-xl">
                  <h3 className="text-lg font-semibold text-[var(--teed-green-12)] mb-2">
                    Gradient Card
                  </h3>
                  <p className="text-sm text-[var(--teed-green-11)]">
                    Card with brand gradient.
                  </p>
                </div>
              </div>
            </section>

            {/* Form Elements */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Form Elements
              </h2>
              <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Text Input
                    </label>
                    <input
                      type="text"
                      placeholder="Enter text..."
                      className="w-full px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--teed-green-9)] focus:ring-2 focus:ring-[var(--teed-green-4)] outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Select
                    </label>
                    <select className="w-full px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:border-[var(--teed-green-9)] focus:ring-2 focus:ring-[var(--teed-green-4)] outline-none transition-colors">
                      <option>Option 1</option>
                      <option>Option 2</option>
                      <option>Option 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Textarea
                    </label>
                    <textarea
                      placeholder="Enter message..."
                      rows={3}
                      className="w-full px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--teed-green-9)] focus:ring-2 focus:ring-[var(--teed-green-4)] outline-none transition-colors resize-none"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-[var(--text-primary)]">
                      Checkbox & Radio
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--teed-green-9)] focus:ring-[var(--teed-green-9)]"
                      />
                      <span className="text-sm text-[var(--text-primary)]">
                        Checkbox option
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="radio-demo"
                        className="w-4 h-4 border-[var(--border-subtle)] text-[var(--teed-green-9)] focus:ring-[var(--teed-green-9)]"
                      />
                      <span className="text-sm text-[var(--text-primary)]">
                        Radio option
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* States */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Interactive States
              </h2>
              <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-4 bg-[var(--grey-3)] rounded-lg text-center">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Default
                    </p>
                    <code className="text-xs text-[var(--text-tertiary)]">
                      grey-3
                    </code>
                  </div>
                  <div className="p-4 bg-[var(--grey-4)] rounded-lg text-center">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Hover
                    </p>
                    <code className="text-xs text-[var(--text-tertiary)]">
                      grey-4
                    </code>
                  </div>
                  <div className="p-4 bg-[var(--grey-5)] rounded-lg text-center">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Active
                    </p>
                    <code className="text-xs text-[var(--text-tertiary)]">
                      grey-5
                    </code>
                  </div>
                  <div className="p-4 bg-[var(--teed-green-4)] border-2 border-[var(--teed-green-9)] rounded-lg text-center">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Selected
                    </p>
                    <code className="text-xs text-[var(--text-tertiary)]">
                      teed-green-4
                    </code>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
