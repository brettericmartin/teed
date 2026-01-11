'use client';

import { Lock, Camera, Link2, BarChart3, Palette, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: Camera,
    title: 'AI Product Recognition',
    description: 'Upload a photo and our AI identifies every product automatically.',
    comingSoon: false,
  },
  {
    icon: Link2,
    title: 'One-Click Affiliate Links',
    description: 'Add affiliate links from Amazon, Impact, and more with a single click.',
    comingSoon: false,
  },
  {
    icon: Palette,
    title: 'Beautiful Bag Pages',
    description: 'Shareable, customizable pages for your curated collections.',
    comingSoon: false,
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track views, clicks, and earnings across all your bags.',
    comingSoon: false,
  },
  {
    icon: Users,
    title: 'Profile Pages',
    description: 'Your own link-in-bio page showcasing all your curations.',
    comingSoon: false,
  },
];

export default function FeaturePreview() {
  return (
    <div className="relative">
      {/* Feature cards with lock overlay effect */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feature, index) => (
          <div
            key={index}
            className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl border border-[var(--border-subtle)] group"
          >
            {/* Blurred preview content */}
            <div className="p-6 relative">
              <div className="w-12 h-12 rounded-xl bg-[var(--teed-green-2)] flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-[var(--teed-green-9)]" />
              </div>

              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                {feature.title}
              </h3>

              <p className="text-sm text-[var(--text-secondary)]">
                {feature.description}
              </p>

              {feature.comingSoon && (
                <span className="inline-block mt-3 text-xs font-medium text-[var(--sky-11)] bg-[var(--sky-3)] px-2 py-1 rounded-full">
                  Coming Soon
                </span>
              )}
            </div>

            {/* Lock overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-white/50 dark:from-zinc-900/90 dark:to-zinc-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--sand-3)] flex items-center justify-center mx-auto mb-2">
                  <Lock className="w-5 h-5 text-[var(--text-tertiary)]" />
                </div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Beta Access Required
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Decorative blur effect at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[var(--sand-2)] to-transparent pointer-events-none" />
    </div>
  );
}
