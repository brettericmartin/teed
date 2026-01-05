'use client';

import { Package, Sparkles, Link2, MessageSquare } from 'lucide-react';

type SectionType = 'collections' | 'links' | 'about' | 'featured' | 'custom';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  type?: SectionType;
  showIcon?: boolean;
  showDivider?: boolean;
  alignment?: 'left' | 'center' | 'right';
  count?: number;
}

const SECTION_ICONS: Record<SectionType, React.ComponentType<{ className?: string }>> = {
  collections: Package,
  links: Link2,
  about: MessageSquare,
  featured: Sparkles,
  custom: Sparkles,
};

export default function SectionHeader({
  title,
  subtitle,
  type = 'custom',
  showIcon = true,
  showDivider = true,
  alignment = 'center',
  count,
}: SectionHeaderProps) {
  const Icon = SECTION_ICONS[type];

  const alignmentClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  return (
    <div className={`px-4 py-6 flex flex-col ${alignmentClasses[alignment]}`}>
      {/* Decorative top divider */}
      {showDivider && alignment === 'center' && (
        <div className="flex items-center gap-3 mb-4 w-full max-w-xs">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[var(--border-subtle)]" />
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--theme-primary, var(--teed-green-7))' }}
          />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[var(--border-subtle)]" />
        </div>
      )}

      {/* Title with optional icon */}
      <div className="flex items-center gap-2">
        {showIcon && (
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--theme-primary, var(--teed-green-7))', opacity: 0.15 }}
          >
            <span style={{ color: 'var(--theme-primary, var(--teed-green-9))' }}>
              <Icon className="w-3.5 h-3.5" />
            </span>
          </div>
        )}
        <h2 className="text-sm font-semibold text-[var(--theme-text-secondary,var(--text-secondary))]">
          {title}
        </h2>
        {count !== undefined && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: 'var(--theme-primary, var(--teed-green-7))',
              color: 'white',
              opacity: 0.9,
            }}
          >
            {count}
          </span>
        )}
      </div>

      {/* Optional subtitle */}
      {subtitle && (
        <p className="text-sm text-[var(--theme-text-tertiary,var(--text-tertiary))] mt-1 max-w-md">
          {subtitle}
        </p>
      )}

      {/* Bottom decorative line for left/right alignment */}
      {showDivider && alignment !== 'center' && (
        <div
          className="h-0.5 w-12 rounded-full mt-2"
          style={{ background: 'var(--theme-primary, var(--teed-green-7))', opacity: 0.4 }}
        />
      )}
    </div>
  );
}
