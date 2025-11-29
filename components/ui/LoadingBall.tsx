'use client';

import React from 'react';

export type LoadingBallSize = 'sm' | 'md' | 'lg';
export type LoadingBallVariant = 'ai' | 'primary' | 'neutral';

export interface LoadingBallProps {
  /**
   * Size variant
   * - sm: 16px - for buttons and inline use
   * - md: 32px - for cards and sections
   * - lg: 56px - for full-page loading
   */
  size?: LoadingBallSize;

  /**
   * Color variant
   * - ai: Sky blue gradient (for AI features)
   * - primary: Teed green gradient (general loading)
   * - neutral: Grey gradient (subtle loading)
   */
  variant?: LoadingBallVariant;

  /**
   * Optional label text displayed next to the loader
   */
  label?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * LoadingBall - A playful rolling golf ball loader for teed
 *
 * Represents the brand's connection to "what's in my bag" with
 * a rolling ball motion that suggests active processing.
 */
export function LoadingBall({
  size = 'md',
  variant = 'ai',
  label,
  className = '',
}: LoadingBallProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className={`rolling-ball-container rolling-ball-${size} rolling-ball-${variant}`}
        role="status"
        aria-live="polite"
        aria-label={label || 'Loading'}
      >
        <div className="ball" />
      </div>
      {label && (
        <span className="text-sm font-medium text-[var(--text-secondary)] animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * LoadingBallFullPage - Centered full-page loading state
 */
export function LoadingBallFullPage({
  label = 'Loading...',
  variant = 'ai'
}: Pick<LoadingBallProps, 'label' | 'variant'>) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)] z-50">
      <div className="flex flex-col items-center gap-4">
        <LoadingBall size="lg" variant={variant} />
        <p className="text-lg font-medium text-[var(--text-primary)]">{label}</p>
      </div>
    </div>
  );
}

/**
 * LoadingBallInline - Inline loading for buttons
 */
export function LoadingBallInline({
  label,
  className = ''
}: Pick<LoadingBallProps, 'label' | 'className'>) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LoadingBall size="sm" variant="ai" />
      {label && <span>{label}</span>}
    </span>
  );
}

export default LoadingBall;
