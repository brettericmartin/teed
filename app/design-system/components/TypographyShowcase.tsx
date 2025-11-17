'use client';

export function TypographyShowcase() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold text-[var(--text-primary)] mb-3">Typography</h2>
        <p className="text-[var(--text-secondary)] text-lg">
          Teed uses Inter for body text and UI elements, paired with system fonts for headings to
          balance readability with performance.
        </p>
      </div>

      {/* Heading Scales */}
      <div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Heading Scale</h3>
        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8 space-y-8">
          <div>
            <h1 className="text-[var(--text-primary)] mb-2">Heading 1</h1>
            <p className="text-sm font-mono text-[var(--text-secondary)]">
              36px / 2.25rem · font-weight: 600 · line-height: 1.25
            </p>
          </div>
          <div>
            <h2 className="text-[var(--text-primary)] mb-2">Heading 2</h2>
            <p className="text-sm font-mono text-[var(--text-secondary)]">
              28px / 1.75rem · font-weight: 600 · line-height: 1.25
            </p>
          </div>
          <div>
            <h3 className="text-[var(--text-primary)] mb-2">Heading 3</h3>
            <p className="text-sm font-mono text-[var(--text-secondary)]">
              24px / 1.5rem · font-weight: 600 · line-height: 1.25
            </p>
          </div>
          <div>
            <h4 className="text-[var(--text-primary)] mb-2">Heading 4</h4>
            <p className="text-sm font-mono text-[var(--text-secondary)]">
              20px / 1.25rem · font-weight: 600 · line-height: 1.25
            </p>
          </div>
          <div>
            <h5 className="text-[var(--text-primary)] mb-2">Heading 5</h5>
            <p className="text-sm font-mono text-[var(--text-secondary)]">
              18px / 1.125rem · font-weight: 600 · line-height: 1.25
            </p>
          </div>
          <div>
            <h6 className="text-[var(--text-primary)] mb-2">Heading 6</h6>
            <p className="text-sm font-mono text-[var(--text-secondary)]">
              16px / 1rem · font-weight: 600 · line-height: 1.25
            </p>
          </div>
        </div>
      </div>

      {/* Body Text */}
      <div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Body Text</h3>
        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8 space-y-6">
          <div>
            <p className="text-[var(--text-primary)] font-normal mb-2">
              This is regular body text using Inter at 16px. It's designed for maximum readability
              across all screen sizes and devices.
            </p>
            <p className="text-sm font-mono text-[var(--text-secondary)]">
              16px / 1rem · font-weight: 400 · line-height: 1.5 · color: var(--text-primary)
            </p>
          </div>
          <div>
            <p className="text-[var(--text-primary)] font-medium mb-2">
              This is medium weight body text, used for slight emphasis within paragraphs or labels.
            </p>
            <p className="text-sm font-mono text-[var(--text-secondary)]">
              16px / 1rem · font-weight: 500 · line-height: 1.5 · color: var(--text-primary)
            </p>
          </div>
          <div>
            <p className="text-[var(--text-secondary)] font-normal mb-2">
              This is secondary text color, used for supporting information and less critical content.
            </p>
            <p className="text-sm font-mono text-[var(--text-secondary)]">
              16px / 1rem · font-weight: 400 · line-height: 1.5 · color: var(--text-secondary)
            </p>
          </div>
          <div>
            <p className="text-[var(--text-tertiary)] font-normal mb-2">
              This is tertiary text color, used for metadata, timestamps, and subtle labels.
            </p>
            <p className="text-sm font-mono text-[var(--text-secondary)]">
              16px / 1rem · font-weight: 400 · line-height: 1.5 · color: var(--text-tertiary)
            </p>
          </div>
        </div>
      </div>

      {/* Small Text */}
      <div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Small Text & Labels</h3>
        <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8 space-y-6">
          <div>
            <p className="text-sm text-[var(--text-primary)] mb-2">
              Small text at 14px for compact interfaces and secondary information.
            </p>
            <p className="text-xs font-mono text-[var(--text-secondary)]">
              14px / 0.875rem · font-weight: 400 · line-height: 1.5
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">
              Extra small text at 12px for labels, captions, and metadata.
            </p>
            <p className="text-xs font-mono text-[var(--text-secondary)]">
              12px / 0.75rem · font-weight: 400 · line-height: 1.5
            </p>
          </div>
        </div>
      </div>

      {/* Font Stack */}
      <div className="bg-[var(--evergreen-2)] border border-[var(--border-subtle)] rounded-xl p-8">
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Font Families</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">Headings (System Fonts)</h4>
            <code className="text-sm bg-white px-3 py-1 rounded border border-[var(--border-subtle)]">
              -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif
            </code>
          </div>
          <div>
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">Body & UI (Inter)</h4>
            <code className="text-sm bg-white px-3 py-1 rounded border border-[var(--border-subtle)]">
              'Inter', -apple-system, BlinkMacSystemFont, sans-serif
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
