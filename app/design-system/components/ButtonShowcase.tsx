'use client';

import { Sparkles, Plus, Trash2, Settings } from 'lucide-react';

export function ButtonShowcase() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold text-[var(--text-primary)] mb-3">Buttons</h2>
        <p className="text-[var(--text-secondary)] text-lg">
          Semantic button variants designed for specific actions and contexts across the Teed platform.
        </p>
      </div>

      {/* AI/Smart Actions */}
      <div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
          AI / Smart Actions
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Use for AI-powered features, intelligent suggestions, and automated actions.
        </p>
        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Default */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Default
              </p>
              <button
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-ai-bg)] text-[var(--button-ai-text)] font-medium rounded-xl shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Enhance
              </button>
            </div>

            {/* Hover */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Hover
              </p>
              <button
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-ai-bg-hover)] text-[var(--button-ai-text)] font-medium rounded-xl shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Enhance
              </button>
            </div>

            {/* Focus */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Focus
              </p>
              <button
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-ai-bg)] text-[var(--button-ai-text)] font-medium rounded-xl shadow-sm transition-all outline outline-2 outline-offset-2 outline-[var(--focus-ring)]"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Enhance
              </button>
            </div>

            {/* Disabled */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Disabled
              </p>
              <button
                disabled
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-ai-bg)] text-[var(--button-ai-text)] font-medium rounded-xl shadow-sm transition-all opacity-50 cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Enhance
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">CSS Tokens</h4>
            <div className="font-mono text-xs text-[var(--text-secondary)] space-y-1">
              <div>Background: <code className="text-[var(--text-primary)]">var(--button-ai-bg)</code></div>
              <div>Hover: <code className="text-[var(--text-primary)]">var(--button-ai-bg-hover)</code></div>
              <div>Active: <code className="text-[var(--text-primary)]">var(--button-ai-bg-active)</code></div>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Add Actions */}
      <div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
          Create / Add Actions
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Use for creating new items, adding to collections, or any additive action.
        </p>
        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Default */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Default
              </p>
              <button
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-create-bg)] text-[var(--button-create-text)] font-medium rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Bag
              </button>
            </div>

            {/* Hover */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Hover
              </p>
              <button
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-create-bg-hover)] text-[var(--button-create-text)] font-medium rounded-xl shadow-md transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Bag
              </button>
            </div>

            {/* Active */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Active
              </p>
              <button
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-create-bg-active)] text-[var(--button-create-text)] font-medium rounded-xl shadow-sm transition-all scale-[0.98]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Bag
              </button>
            </div>

            {/* Disabled */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Disabled
              </p>
              <button
                disabled
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-create-bg)] text-[var(--button-create-text)] font-medium rounded-xl shadow-sm transition-all opacity-50 cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Bag
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Destructive/Remove Actions */}
      <div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
          Destructive / Remove Actions
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Use for delete, remove, or any potentially destructive action. Requires confirmation.
        </p>
        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Default */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Default
              </p>
              <button
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-destructive-bg)] text-[var(--button-destructive-text)] font-medium rounded-xl shadow-sm transition-all"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Item
              </button>
            </div>

            {/* Hover */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Hover
              </p>
              <button
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-destructive-bg-hover)] text-[var(--button-destructive-text)] font-medium rounded-xl shadow-md transition-all"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Item
              </button>
            </div>

            {/* Active */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Active
              </p>
              <button
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-destructive-bg-active)] text-[var(--button-destructive-text)] font-medium rounded-xl shadow-sm transition-all scale-[0.98]"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Item
              </button>
            </div>

            {/* Disabled */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Disabled
              </p>
              <button
                disabled
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-destructive-bg)] text-[var(--button-destructive-text)] font-medium rounded-xl shadow-sm transition-all opacity-50 cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Item
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary/Neutral Actions */}
      <div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
          Secondary / Neutral Actions
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Use for less prominent actions, secondary options, or neutral operations.
        </p>
        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Default */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Default
              </p>
              <button
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] font-medium rounded-xl shadow-sm transition-all"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>

            {/* Hover */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Hover
              </p>
              <button
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-secondary-bg-hover)] text-[var(--button-secondary-text)] font-medium rounded-xl shadow-sm transition-all"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>

            {/* Active */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Active
              </p>
              <button
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-secondary-bg-active)] text-[var(--button-secondary-text)] font-medium rounded-xl shadow-sm transition-all scale-[0.98]"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>

            {/* Disabled */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">
                Disabled
              </p>
              <button
                disabled
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] font-medium rounded-xl shadow-sm transition-all opacity-50 cursor-not-allowed"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ghost Buttons */}
      <div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
          Ghost Buttons
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Use for tertiary actions or when you need a minimal button style.
        </p>
        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-ghost-bg)] text-[var(--button-ghost-text)] border border-[var(--button-ghost-border)] font-medium rounded-xl transition-all">
              Default
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-ghost-bg-hover)] text-[var(--button-ghost-text)] border border-[var(--border-hover)] font-medium rounded-xl transition-all">
              Hover
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-ghost-bg-active)] text-[var(--button-ghost-text)] border border-[var(--border-strong)] font-medium rounded-xl transition-all scale-[0.98]">
              Active
            </button>
            <button disabled className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-ghost-bg)] text-[var(--button-ghost-text)] border border-[var(--button-ghost-border)] font-medium rounded-xl transition-all opacity-50 cursor-not-allowed">
              Disabled
            </button>
          </div>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Button Sizes</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Three standard sizes to fit different contexts and hierarchies.
        </p>
        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8">
          <div className="flex items-center gap-4">
            <button className="inline-flex items-center justify-center px-3 py-1.5 bg-[var(--button-create-bg)] text-[var(--button-create-text)] text-sm font-medium rounded-xl shadow-sm">
              Small
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--button-create-bg)] text-[var(--button-create-text)] text-base font-medium rounded-xl shadow-sm">
              Medium (Default)
            </button>
            <button className="inline-flex items-center justify-center px-6 py-3 bg-[var(--button-create-bg)] text-[var(--button-create-text)] text-lg font-medium rounded-xl shadow-sm">
              Large
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
