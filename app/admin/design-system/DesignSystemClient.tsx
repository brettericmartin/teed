'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';

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

type Tab = 'colors' | 'typography' | 'spacing' | 'components' | 'animations';

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
    { id: 'animations', label: 'Animations' },
  ];

  // Animation demo states
  const [dotsKey, setDotsKey] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [buttonSuccess, setButtonSuccess] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);

  // Golf tee animation states
  const [teeBounceKey, setTeeBounceKey] = useState(0);
  const [showTeeOff, setShowTeeOff] = useState(false);
  const [teeRollKey, setTeeRollKey] = useState(0);
  const [teePlacementKey, setTeePlacementKey] = useState(0);
  const [showPlacementSuccess, setShowPlacementSuccess] = useState(false);

  // Reset skeleton periodically for demo
  useEffect(() => {
    if (activeTab === 'animations') {
      const interval = setInterval(() => {
        setSkeletonLoading(true);
        setTimeout(() => setSkeletonLoading(false), 2000);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const triggerButtonDemo = () => {
    setButtonLoading(true);
    setButtonSuccess(false);
    setTimeout(() => {
      setButtonLoading(false);
      setButtonSuccess(true);
      setTimeout(() => setButtonSuccess(false), 2000);
    }, 1500);
  };

  const triggerSuccessDemo = () => {
    setShowSuccess(false);
    setTimeout(() => setShowSuccess(true), 50);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const triggerPlacementDemo = () => {
    setShowPlacementSuccess(false);
    setTeePlacementKey(k => k + 1);
    setTimeout(() => setShowPlacementSuccess(true), 600);
    setTimeout(() => {
      setShowPlacementSuccess(false);
    }, 3000);
  };

  const triggerBounceDemo = () => {
    setShowTeeOff(false);
    setTeeBounceKey(k => k + 1);
    // After bounce settles (1.5s), trigger tee off
    setTimeout(() => setShowTeeOff(true), 2500);
    setTimeout(() => {
      setShowTeeOff(false);
      setTeeBounceKey(k => k + 1);
    }, 3500);
  };

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

        {/* Animations Tab */}
        {activeTab === 'animations' && (
          <div className="space-y-12">
            {/* Introduction */}
            <section className="p-6 bg-gradient-to-br from-[var(--sky-2)] to-[var(--teed-green-2)] border border-[var(--border-subtle)] rounded-xl">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                Animation Library (Proposed)
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                A collection of premium, satisfying animations to replace generic spinners.
                Research shows skeleton loaders increase perceived acceptable wait time by 3x,
                and success animations can reduce support queries by 10% (Stripe).
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-[var(--sky-4)] text-[var(--sky-11)] rounded text-xs font-medium">CSS-only</span>
                <span className="px-2 py-1 bg-[var(--teed-green-4)] text-[var(--teed-green-11)] rounded text-xs font-medium">GPU Accelerated</span>
                <span className="px-2 py-1 bg-[var(--grey-4)] text-[var(--grey-11)] rounded text-xs font-medium">Reduced Motion Support</span>
              </div>
            </section>

            {/* Brand Animations - Golf Tee */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                Brand Animations - Ball on Tee
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Signature animations that embody the Teed brand. Golf-themed loaders and success states.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Bounce & Tee Off */}
                <div className="p-6 bg-[var(--surface)] border-2 border-[var(--teed-green-6)] rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Bounce & Tee Off</h3>
                    <button
                      onClick={triggerBounceDemo}
                      className="text-xs text-[var(--teed-green-11)] hover:text-[var(--teed-green-12)] font-medium"
                    >
                      Play
                    </button>
                  </div>
                  <div className="h-32 flex items-end justify-center bg-[var(--teed-green-2)] rounded-lg mb-4 pb-4 overflow-hidden">
                    <div key={teeBounceKey} className="relative">
                      {/* Golf Tee - like Teed logo: concave inward taper */}
                      <div style={{
                        width: '18px',
                        height: '16px',
                        background: 'var(--sand-9)',
                        clipPath: 'polygon(0% 0%, 100% 0%, 75% 50%, 65% 100%, 35% 100%, 25% 50%)',
                      }} />
                      {/* Ball with bounce animation, then tee off */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '-18px',
                          left: '50%',
                          width: '18px',
                          height: '18px',
                          background: 'radial-gradient(circle at 30% 30%, white, var(--grey-3))',
                          borderRadius: '50%',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                          animation: showTeeOff
                            ? 'ball-tee-off 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
                            : 'ball-bounce-settle 1.5s ease-out forwards',
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-2">
                    Ball drops, bounces, settles. When loading completes, ball tees off to the right.
                  </p>
                  <p className="text-xs text-[var(--teed-green-11)]">
                    <strong>Best for:</strong> Page loads with completion state (2-5s)
                  </p>
                </div>

                {/* Rolling Ball */}
                <div className="p-6 bg-[var(--surface)] border-2 border-[var(--teed-green-6)] rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Rolling Ball</h3>
                    <button
                      onClick={() => setTeeRollKey(k => k + 1)}
                      className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="h-32 flex items-center justify-center bg-[var(--teed-green-2)] rounded-lg mb-4">
                    <div key={teeRollKey} className="relative">
                      {/* Rolling ball with dimple pattern */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'radial-gradient(circle at 30% 30%, white, var(--grey-3))',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          position: 'relative',
                          animation: 'ball-roll 1s linear infinite',
                        }}
                      >
                        {/* Dimple pattern to show rotation */}
                        <div style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: 'var(--grey-4)',
                        }} />
                        <div style={{
                          position: 'absolute',
                          top: '14px',
                          left: '22px',
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: 'var(--grey-4)',
                        }} />
                        <div style={{
                          position: 'absolute',
                          top: '22px',
                          left: '10px',
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: 'var(--grey-4)',
                        }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-2">
                    Simple rolling ball animation. Clean spinner alternative with brand flavor.
                  </p>
                  <p className="text-xs text-[var(--teed-green-11)]">
                    <strong>Best for:</strong> Quick loading states, inline spinners
                  </p>
                </div>

                {/* Tee Off Success */}
                <div className="p-6 bg-[var(--surface)] border-2 border-[var(--teed-green-6)] rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Tee Off Success</h3>
                    <button
                      onClick={triggerPlacementDemo}
                      className="text-xs text-[var(--teed-green-11)] hover:text-[var(--teed-green-12)] font-medium"
                    >
                      Play
                    </button>
                  </div>
                  <div className="h-32 flex items-end justify-center bg-[var(--teed-green-2)] rounded-lg mb-4 pb-4 overflow-hidden">
                    <div key={`brand-${teePlacementKey}`} className="relative">
                      {/* Golf Tee - like Teed logo: concave inward taper */}
                      <div style={{
                        width: '18px',
                        height: '16px',
                        background: 'var(--sand-9)',
                        clipPath: 'polygon(0% 0%, 100% 0%, 75% 50%, 65% 100%, 35% 100%, 25% 50%)',
                        animation: 'tee-fade-in 0.2s ease-out forwards',
                      }} />
                      {/* Ball - drops then shoots off on success */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '-18px',
                          left: '50%',
                          width: '18px',
                          height: '18px',
                          background: 'radial-gradient(circle at 30% 30%, white, var(--grey-3))',
                          borderRadius: '50%',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                          animation: showPlacementSuccess
                            ? 'ball-tee-off 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
                            : 'ball-drop-precise 0.35s ease-out 0.2s forwards',
                          opacity: showPlacementSuccess ? 1 : 0,
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-2">
                    Ball lands on tee, then shoots up and right on completion. Clean success signal.
                  </p>
                  <p className="text-xs text-[var(--teed-green-11)]">
                    <strong>Best for:</strong> Form submissions, saves, confirmations
                  </p>
                </div>
              </div>
            </section>

            {/* Timing Guidelines */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Timing Guidelines
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { context: 'Button feedback', duration: '100-150ms', easing: 'ease-out' },
                  { context: 'State changes', duration: '200-300ms', easing: 'ease-out' },
                  { context: 'Modal enter', duration: '300ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
                  { context: 'Modal exit', duration: '200ms', easing: 'ease-in' },
                  { context: 'Success animation', duration: '400-600ms', easing: 'spring' },
                  { context: 'Loader cycles', duration: '1.2-1.5s', easing: 'ease-in-out' },
                ].map((item) => (
                  <div key={item.context} className="p-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{item.context}</p>
                    <div className="flex gap-4 mt-2">
                      <code className="text-xs text-[var(--teed-green-11)] bg-[var(--teed-green-3)] px-2 py-0.5 rounded">{item.duration}</code>
                      <code className="text-xs text-[var(--text-tertiary)]">{item.easing}</code>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Loaders Section */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Loading Animations
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Replace generic Loader2 spinners with contextual, branded loaders.
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Dots Loader */}
                <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Teed Dots</h3>
                    <button
                      onClick={() => setDotsKey(k => k + 1)}
                      className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="h-24 flex items-center justify-center bg-[var(--grey-2)] rounded-lg mb-4">
                    <div key={dotsKey} className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 bg-[var(--teed-green-9)] rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
                      <span className="w-2.5 h-2.5 bg-[var(--teed-green-9)] rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ animationDelay: '150ms' }} />
                      <span className="w-2.5 h-2.5 bg-[var(--teed-green-9)] rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    <strong>Use for:</strong> Quick operations (1-3s), button loading states, inline fetching
                  </p>
                </div>

                {/* Pulse Ring */}
                <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Pulse Ring</h3>
                    <button
                      onClick={() => setPulseKey(k => k + 1)}
                      className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="h-24 flex items-center justify-center bg-[var(--grey-2)] rounded-lg mb-4">
                    <div key={pulseKey} className="relative w-12 h-12">
                      <span className="absolute inset-0 rounded-full border-2 border-[var(--sky-9)] animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
                      <span className="absolute inset-2 rounded-full border-2 border-[var(--sky-9)] animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" style={{ animationDelay: '300ms' }} />
                      <span className="absolute inset-4 rounded-full bg-[var(--sky-9)]" />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    <strong>Use for:</strong> AI operations, image analysis, URL scraping - suggests "scanning"
                  </p>
                </div>

                {/* Gradient Glow */}
                <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Gradient Glow</h3>
                    <span className="text-xs text-[var(--amber-11)] bg-[var(--amber-3)] px-2 py-0.5 rounded">Premium</span>
                  </div>
                  <div className="h-24 flex items-center justify-center bg-[var(--grey-2)] rounded-lg mb-4">
                    <div className="relative w-16 h-16">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'conic-gradient(from 0deg, var(--teed-green-9), var(--sky-9), var(--copper-9), var(--teed-green-9))',
                          animation: 'spin 2s linear infinite',
                        }}
                      />
                      <div className="absolute inset-1 rounded-full bg-[var(--grey-2)]" />
                      <div className="absolute inset-3 rounded-full bg-[var(--teed-green-9)] animate-pulse" />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    <strong>Use for:</strong> Full-page loading, onboarding, important operations
                  </p>
                </div>

                {/* Breathing Pulse */}
                <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Breathing Pulse</h3>
                  </div>
                  <div className="h-24 flex items-center justify-center bg-[var(--grey-2)] rounded-lg mb-4">
                    <div
                      className="w-12 h-12 rounded-full bg-[var(--teed-green-9)]"
                      style={{
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    <strong>Use for:</strong> Calm waiting states, AI thinking, subtle background activity
                  </p>
                </div>

                {/* Dots Elastic */}
                <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Dots Elastic</h3>
                  </div>
                  <div className="h-24 flex items-center justify-center bg-[var(--grey-2)] rounded-lg mb-4">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 bg-[var(--teed-green-9)] rounded-full"
                        style={{ animation: 'bounce 0.6s ease-in-out infinite alternate' }}
                      />
                      <span
                        className="w-2 h-2 bg-[var(--teed-green-9)] rounded-full"
                        style={{ animation: 'bounce 0.6s ease-in-out 0.2s infinite alternate' }}
                      />
                      <span
                        className="w-2 h-2 bg-[var(--teed-green-9)] rounded-full"
                        style={{ animation: 'bounce 0.6s ease-in-out 0.4s infinite alternate' }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    <strong>Use for:</strong> Chat "typing" indicators, playful contexts
                  </p>
                </div>

                {/* Bar Loader */}
                <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Progress Bar</h3>
                  </div>
                  <div className="h-24 flex items-center justify-center bg-[var(--grey-2)] rounded-lg mb-4 px-4">
                    <div className="w-full h-2 bg-[var(--grey-4)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--teed-green-9)] rounded-full"
                        style={{
                          animation: 'progress-indeterminate 1.5s ease-in-out infinite',
                          width: '40%',
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    <strong>Use for:</strong> File uploads, multi-step processes (determinate when possible)
                  </p>
                </div>
              </div>
            </section>

            {/* Skeleton Loaders */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Skeleton Loaders
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Content placeholders with shimmer effect. Users tolerate 3x longer waits with skeletons vs spinners.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Card Skeleton */}
                <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Card Skeleton</h3>
                  <div className="space-y-3">
                    <div className="skeleton-shimmer h-32 rounded-lg" />
                    <div className="skeleton-shimmer h-4 w-3/4 rounded" />
                    <div className="skeleton-shimmer h-4 w-1/2 rounded" />
                  </div>
                </div>

                {/* List Skeleton */}
                <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">List Skeleton</h3>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <div className="skeleton-shimmer w-10 h-10 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="skeleton-shimmer h-4 w-3/4 rounded" />
                          <div className="skeleton-shimmer h-3 w-1/2 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Text Skeleton */}
                <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Text Block Skeleton</h3>
                  <div className="space-y-2">
                    <div className="skeleton-shimmer h-4 w-full rounded" />
                    <div className="skeleton-shimmer h-4 w-full rounded" />
                    <div className="skeleton-shimmer h-4 w-4/5 rounded" />
                    <div className="skeleton-shimmer h-4 w-3/5 rounded" />
                  </div>
                </div>

                {/* Item Grid Skeleton */}
                <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Grid Skeleton</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="skeleton-shimmer aspect-square rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Success Animations */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Success & Feedback Animations
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Satisfying confirmations that close the feedback loop. Stripe's checkmark animation reduced support queries by 10%.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Spring Checkmark */}
                <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Spring Checkmark</h3>
                    <button
                      onClick={triggerSuccessDemo}
                      className="text-xs text-[var(--teed-green-11)] hover:text-[var(--teed-green-12)] font-medium"
                    >
                      Play
                    </button>
                  </div>
                  <div className="h-24 flex items-center justify-center bg-[var(--grey-2)] rounded-lg mb-4">
                    <div
                      className={`w-12 h-12 rounded-full bg-[var(--teed-green-9)] flex items-center justify-center transition-all duration-500 ${
                        showSuccess ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                      }`}
                      style={{
                        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    >
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    <strong>Use for:</strong> Form submissions, saves, generic confirmations
                  </p>
                </div>

                {/* Button State Flow */}
                <div className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Button Flow</h3>
                  </div>
                  <div className="h-24 flex items-center justify-center bg-[var(--grey-2)] rounded-lg mb-4">
                    <button
                      onClick={triggerButtonDemo}
                      disabled={buttonLoading}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        buttonSuccess
                          ? 'bg-[var(--teed-green-9)] text-white'
                          : 'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white'
                      } disabled:opacity-70`}
                    >
                      {buttonLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_infinite]" />
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_0.15s_infinite]" />
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-[bounce_0.6s_ease-in-out_0.3s_infinite]" />
                          </span>
                          Adding...
                        </span>
                      ) : buttonSuccess ? (
                        <span className="flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Added!
                        </span>
                      ) : (
                        'Add to Bag'
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    <strong>Use for:</strong> Any action button with async operation
                  </p>
                </div>
              </div>
            </section>

            {/* Micro-interactions */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Micro-interactions
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Small delightful touches that make the interface feel alive ("juice").
              </p>

              <div className="grid md:grid-cols-4 gap-4">
                {/* Scale Press */}
                <div className="p-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl text-center">
                  <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-3">Scale Press</h3>
                  <button className="px-4 py-2 bg-[var(--grey-4)] rounded-lg font-medium transition-transform active:scale-95">
                    Press me
                  </button>
                  <code className="block text-xs text-[var(--text-tertiary)] mt-2">active:scale-95</code>
                </div>

                {/* Hover Lift */}
                <div className="p-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl text-center">
                  <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-3">Hover Lift</h3>
                  <div className="p-3 bg-[var(--grey-3)] rounded-lg transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer">
                    Hover me
                  </div>
                  <code className="block text-xs text-[var(--text-tertiary)] mt-2">hover:-translate-y-1</code>
                </div>

                {/* Glow Focus */}
                <div className="p-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl text-center">
                  <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-3">Glow Focus</h3>
                  <input
                    type="text"
                    placeholder="Focus me"
                    className="px-3 py-2 border border-[var(--border-subtle)] rounded-lg text-sm w-full focus:ring-2 focus:ring-[var(--teed-green-5)] focus:border-[var(--teed-green-9)] outline-none transition-all"
                  />
                  <code className="block text-xs text-[var(--text-tertiary)] mt-2">focus:ring-2</code>
                </div>

                {/* Toggle Switch */}
                <div className="p-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl text-center">
                  <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-3">Spring Toggle</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-[var(--grey-5)] peer-focus:ring-2 peer-focus:ring-[var(--teed-green-5)] rounded-full peer peer-checked:bg-[var(--teed-green-9)] transition-colors">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                    </div>
                  </label>
                  <code className="block text-xs text-[var(--text-tertiary)] mt-2">spring easing</code>
                </div>
              </div>
            </section>

            {/* Implementation Plan */}
            <section className="p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Implementation Priority
              </h2>
              <div className="space-y-3">
                {[
                  { priority: 1, name: 'DotsLoader', impact: 'Replace all Loader2 spinners', status: 'ready' },
                  { priority: 2, name: 'SuccessCheck', impact: 'Add to item confirmations', status: 'ready' },
                  { priority: 3, name: 'Skeleton', impact: 'Bag lists, item cards', status: 'ready' },
                  { priority: 4, name: 'LoadingButton', impact: 'Unified button states', status: 'ready' },
                  { priority: 5, name: 'PulseRing', impact: 'AI-specific operations', status: 'planned' },
                  { priority: 6, name: 'ConfettiBurst', impact: 'Celebration moments', status: 'planned' },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-4 p-3 bg-[var(--grey-2)] rounded-lg">
                    <span className="w-6 h-6 flex items-center justify-center bg-[var(--teed-green-9)] text-white text-xs font-bold rounded-full">
                      {item.priority}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{item.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{item.impact}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      item.status === 'ready'
                        ? 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)]'
                        : 'bg-[var(--grey-4)] text-[var(--grey-11)]'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* CSS Reference */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                CSS Keyframes Reference
              </h2>
              <div className="p-4 bg-[var(--grey-2)] rounded-xl overflow-x-auto">
                <pre className="text-xs text-[var(--text-secondary)] font-mono whitespace-pre">
{`/* Add to globals.css */

/* Skeleton shimmer */
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--grey-3) 25%,
    var(--grey-4) 50%,
    var(--grey-3) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Confetti burst */
@keyframes confetti-burst {
  0% {
    transform: translate(-50%, -50%) rotate(var(--rotation)) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--rotation)) translateY(-60px);
    opacity: 0;
  }
}

/* Indeterminate progress */
@keyframes progress-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}`}
                </pre>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
