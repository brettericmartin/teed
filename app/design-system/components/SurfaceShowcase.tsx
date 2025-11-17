'use client';

export function SurfaceShowcase() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold text-[var(--text-primary)] mb-3">
          Surfaces & Elevations
        </h2>
        <p className="text-[var(--text-secondary)] text-lg">
          Teed uses subtle elevation through shadows and backgrounds to create visual hierarchy and depth.
        </p>
      </div>

      {/* Backgrounds */}
      <div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Background Layers</h3>
        <div className="space-y-4">
          <div className="p-8 rounded-xl" style={{ backgroundColor: 'var(--background)' }}>
            <p className="font-semibold text-[var(--text-primary)] mb-1">Base Background</p>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Primary page background · var(--background) · #F9F5EE
            </p>

            <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-6">
              <p className="font-semibold text-[var(--text-primary)] mb-1">Surface (Cards)</p>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Default surface for cards and panels · var(--surface) · #FFFFFF
              </p>

              <div className="bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-lg p-4">
                <p className="font-semibold text-[var(--text-primary)] mb-1">Elevated Surface</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Slightly elevated panels · var(--surface-elevated) · #FEFDFB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shadow System */}
      <div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Shadow Elevations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'var(--shadow-1)' }}>
            <p className="font-semibold text-[var(--text-primary)] mb-1">Shadow 1</p>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Inset shadows, subtle depth</p>
            <code className="text-xs font-mono text-[var(--text-tertiary)]">var(--shadow-1)</code>
          </div>

          <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'var(--shadow-2)' }}>
            <p className="font-semibold text-[var(--text-primary)] mb-1">Shadow 2</p>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Resting cards (default)</p>
            <code className="text-xs font-mono text-[var(--text-tertiary)]">var(--shadow-2)</code>
          </div>

          <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'var(--shadow-3)' }}>
            <p className="font-semibold text-[var(--text-primary)] mb-1">Shadow 3</p>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Elevated cards</p>
            <code className="text-xs font-mono text-[var(--text-tertiary)]">var(--shadow-3)</code>
          </div>

          <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'var(--shadow-4)' }}>
            <p className="font-semibold text-[var(--text-primary)] mb-1">Shadow 4</p>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Hover states, popovers</p>
            <code className="text-xs font-mono text-[var(--text-tertiary)]">var(--shadow-4)</code>
          </div>

          <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'var(--shadow-5)' }}>
            <p className="font-semibold text-[var(--text-primary)] mb-1">Shadow 5</p>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Dropdown menus</p>
            <code className="text-xs font-mono text-[var(--text-tertiary)]">var(--shadow-5)</code>
          </div>

          <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'var(--shadow-6)' }}>
            <p className="font-semibold text-[var(--text-primary)] mb-1">Shadow 6</p>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Modals, dialogs</p>
            <code className="text-xs font-mono text-[var(--text-tertiary)]">var(--shadow-6)</code>
          </div>
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Border Radius</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[var(--border-subtle)] p-4 flex flex-col items-center gap-3" style={{ borderRadius: 'var(--radius-sm)' }}>
            <div className="w-16 h-16 bg-[var(--teed-green-3)]" style={{ borderRadius: 'var(--radius-sm)' }} />
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Small</p>
              <code className="text-xs font-mono text-[var(--text-secondary)]">8px</code>
            </div>
          </div>

          <div className="bg-white border border-[var(--border-subtle)] p-4 flex flex-col items-center gap-3" style={{ borderRadius: 'var(--radius-md)' }}>
            <div className="w-16 h-16 bg-[var(--teed-green-3)]" style={{ borderRadius: 'var(--radius-md)' }} />
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Medium</p>
              <code className="text-xs font-mono text-[var(--text-secondary)]">12px</code>
            </div>
          </div>

          <div className="bg-white border border-[var(--border-subtle)] p-4 flex flex-col items-center gap-3" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="w-16 h-16 bg-[var(--teed-green-3)]" style={{ borderRadius: 'var(--radius-lg)' }} />
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Large</p>
              <code className="text-xs font-mono text-[var(--text-secondary)]">16px</code>
            </div>
          </div>

          <div className="bg-white border border-[var(--border-subtle)] p-4 flex flex-col items-center gap-3" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div className="w-16 h-16 bg-[var(--teed-green-3)]" style={{ borderRadius: 'var(--radius-xl)' }} />
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">X-Large</p>
              <code className="text-xs font-mono text-[var(--text-secondary)]">20px</code>
            </div>
          </div>
        </div>
      </div>

      {/* Spacing System */}
      <div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Spacing Scale (8pt Grid)</h3>
        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
              <div key={step} className="flex items-center gap-4">
                <code className="text-sm font-mono text-[var(--text-secondary)] w-24">
                  --space-{step}
                </code>
                <div
                  className="bg-[var(--teed-green-8)] h-6 rounded"
                  style={{ width: `var(--space-${step})` }}
                />
                <span className="text-sm text-[var(--text-tertiary)]">
                  {step * 4}px
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
