'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  /** Ambient background variant */
  variant?: 'default' | 'warm' | 'cool' | 'neutral';
  /** Whether to show the grainy texture overlay */
  grainy?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * PageContainer provides consistent ambient backgrounds and layout structure
 * for main content pages. Use this to wrap page content for a premium feel.
 */
export function PageContainer({
  children,
  variant = 'default',
  grainy = true,
  className,
}: PageContainerProps) {
  const backgrounds = {
    default: 'bg-gradient-to-b from-[var(--background)] via-[var(--background)] to-[var(--teed-green-1)]',
    warm: 'bg-gradient-to-br from-[var(--background)] via-[var(--sand-1)] to-[var(--copper-1)]',
    cool: 'bg-gradient-to-br from-[var(--background)] via-[var(--sky-1)] to-[var(--teed-green-1)]',
    neutral: 'bg-[var(--background)]',
  };

  return (
    <div
      className={cn(
        'min-h-screen relative',
        backgrounds[variant],
        className
      )}
    >
      {/* Grainy texture overlay for premium feel */}
      {grainy && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * PageHeader provides a consistent header style with glass effect
 * and proper spacing for premium appearance.
 */
interface PageHeaderProps {
  children: ReactNode;
  /** Whether header should be sticky */
  sticky?: boolean;
  /** Glass blur intensity */
  glass?: 'none' | 'light' | 'medium' | 'heavy';
  /** Custom className */
  className?: string;
}

export function PageHeader({
  children,
  sticky = false,
  glass = 'none',
  className,
}: PageHeaderProps) {
  const glassStyles = {
    none: 'bg-[var(--surface)]',
    light: 'bg-[var(--surface)]',
    medium: 'bg-[var(--surface)]',
    heavy: 'bg-[var(--surface)]',
  };

  return (
    <header
      className={cn(
        glassStyles[glass],
        'border-b border-[var(--border-subtle)]',
        sticky && 'sticky top-16 z-20',
        className
      )}
    >
      {children}
    </header>
  );
}

/**
 * PageSection provides consistent section spacing and optional
 * visual separators between content sections.
 */
interface PageSectionProps {
  children: ReactNode;
  /** Spacing size */
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show top border separator */
  separator?: boolean;
  /** Custom className */
  className?: string;
}

export function PageSection({
  children,
  spacing = 'md',
  separator = false,
  className,
}: PageSectionProps) {
  const spacingStyles = {
    sm: 'py-6',
    md: 'py-10',
    lg: 'py-16',
    xl: 'py-24',
  };

  return (
    <section
      className={cn(
        spacingStyles[spacing],
        separator && 'border-t border-[var(--border-subtle)]',
        className
      )}
    >
      {children}
    </section>
  );
}

/**
 * ContentContainer provides max-width and padding constraints
 */
interface ContentContainerProps {
  children: ReactNode;
  /** Max width variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Custom className */
  className?: string;
}

export function ContentContainer({
  children,
  size = 'lg',
  className,
}: ContentContainerProps) {
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1400px]',
    full: 'max-w-full',
  };

  return (
    <div className={cn(sizes[size], 'mx-auto px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}

export default PageContainer;
