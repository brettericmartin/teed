import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ColorShowcase } from './components/ColorShowcase';
import { ButtonShowcase } from './components/ButtonShowcase';
import { TypographyShowcase } from './components/TypographyShowcase';
import { SurfaceShowcase } from './components/SurfaceShowcase';

export const metadata = {
  title: 'Design System - Teed',
  description: 'Comprehensive design system documentation for the Teed platform',
};

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[var(--border-subtle)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>

          <div>
            <h1 className="text-4xl font-semibold text-[var(--text-primary)] mb-3">
              Teed Design System
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-3xl">
              A comprehensive design language for creating consistent, accessible, and beautiful
              experiences across the Teed platform. Built with earthy tones, soft aesthetics, and
              premium attention to detail.
            </p>
          </div>

          {/* Quick Navigation */}
          <nav className="mt-8 flex gap-3 flex-wrap">
            {[
              { label: 'Colors', href: '#colors' },
              { label: 'Buttons', href: '#buttons' },
              { label: 'Typography', href: '#typography' },
              { label: 'Surfaces', href: '#surfaces' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-2 bg-[var(--surface-hover)] text-[var(--text-primary)] rounded-lg text-sm font-medium hover:bg-[var(--surface-active)] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-24">
          {/* Colors Section */}
          <section id="colors">
            <ColorShowcase />
          </section>

          {/* Buttons Section */}
          <section id="buttons">
            <ButtonShowcase />
          </section>

          {/* Typography Section */}
          <section id="typography">
            <TypographyShowcase />
          </section>

          {/* Surfaces Section */}
          <section id="surfaces">
            <SurfaceShowcase />
          </section>

          {/* Principles */}
          <section>
            <h2 className="text-3xl font-semibold text-[var(--text-primary)] mb-6">
              Design Principles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                  Minimal & Premium
                </h3>
                <p className="text-[var(--text-secondary)]">
                  Every element should feel intentional. Use plenty of white space, soft colors,
                  and subtle transitions to create a calm, premium experience.
                </p>
              </div>

              <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                  Earthy & Natural
                </h3>
                <p className="text-[var(--text-secondary)]">
                  Our color palette draws from nature - sage greens, warm sands, and deep
                  evergreens. Avoid harsh contrasts and neon accents.
                </p>
              </div>

              <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                  Rounded & Soft
                </h3>
                <p className="text-[var(--text-secondary)]">
                  Use generous border radius values (12-24px) and soft shadows to create a friendly,
                  approachable feel. Avoid sharp corners and heavy shadows.
                </p>
              </div>

              <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                  Accessible by Default
                </h3>
                <p className="text-[var(--text-secondary)]">
                  All color combinations meet WCAG AA standards. Focus states are always visible.
                  Interactive elements have clear affordances.
                </p>
              </div>
            </div>
          </section>

          {/* Usage Guidelines */}
          <section>
            <h2 className="text-3xl font-semibold text-[var(--text-primary)] mb-6">
              Usage Guidelines
            </h2>
            <div className="bg-[var(--sand-2)] border border-[var(--border-subtle)] rounded-xl p-8">
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Button Semantic Meaning
              </h3>
              <div className="space-y-4 text-[var(--text-secondary)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-2">
                      AI / Smart Actions (Earthy Sage)
                    </h4>
                    <p className="text-sm">
                      Use for AI-powered features, intelligent suggestions, automated enrichment,
                      or any "smart" functionality. Examples: "AI Enhance", "Auto-categorize",
                      "Smart Suggestions"
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-2">
                      Create / Add Actions (Deep Evergreen)
                    </h4>
                    <p className="text-sm">
                      Use for creating new items, adding to collections, or any additive action.
                      This is your primary action color. Examples: "Create Bag", "Add Item", "New
                      Collection"
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-2">
                      Destructive / Remove Actions (Copper)
                    </h4>
                    <p className="text-sm">
                      Use for delete, remove, or potentially destructive actions. Always require
                      confirmation. Examples: "Delete Bag", "Remove Item", "Clear All"
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-2">
                      Secondary / Neutral (Sky Tint)
                    </h4>
                    <p className="text-sm">
                      Use for less prominent actions, secondary options, or neutral operations.
                      Examples: "Cancel", "Settings", "View Details"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Developer Resources */}
          <section>
            <h2 className="text-3xl font-semibold text-[var(--text-primary)] mb-6">
              Developer Resources
            </h2>
            <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8">
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                CSS Custom Properties
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                All design tokens are available as CSS custom properties. Reference them directly in
                your stylesheets:
              </p>
              <div className="bg-[var(--evergreen-2)] border border-[var(--border-subtle)] rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-[var(--text-primary)]">
{`.button-ai {
  background: var(--button-ai-bg);
  color: var(--button-ai-text);
  border-radius: var(--radius-xl);
  padding: var(--space-3) var(--space-4);
  box-shadow: var(--shadow-2);
}

.button-ai:hover {
  background: var(--button-ai-bg-hover);
  box-shadow: var(--shadow-3);
}

.button-ai:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}`}
                </pre>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
