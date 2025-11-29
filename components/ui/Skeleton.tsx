import * as React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton loader component for showing loading states
 * Follows the Teed design system with appropriate styling
 */
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className = '',
      variant = 'text',
      width,
      height,
      animation = 'pulse',
      style,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'bg-[var(--grey-3)] dark:bg-zinc-800';

    const variantStyles = {
      text: 'rounded h-4 w-full',
      circular: 'rounded-full',
      rectangular: '',
      rounded: 'rounded-lg',
    };

    const animationStyles = {
      pulse: 'animate-pulse',
      wave: 'skeleton-wave',
      none: '',
    };

    const combinedStyle: React.CSSProperties = {
      ...style,
      ...(width !== undefined && { width: typeof width === 'number' ? `${width}px` : width }),
      ...(height !== undefined && { height: typeof height === 'number' ? `${height}px` : height }),
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
        style={combinedStyle}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * Pre-built skeleton variants for common use cases
 */

// Text line skeleton
const SkeletonText = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'variant'>>(
  ({ className = '', ...props }, ref) => (
    <Skeleton ref={ref} variant="text" className={className} {...props} />
  )
);
SkeletonText.displayName = 'SkeletonText';

// Avatar/profile picture skeleton
const SkeletonAvatar = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'variant'>>(
  ({ className = '', width = 40, height = 40, ...props }, ref) => (
    <Skeleton ref={ref} variant="circular" width={width} height={height} className={className} {...props} />
  )
);
SkeletonAvatar.displayName = 'SkeletonAvatar';

// Card skeleton for item cards
const SkeletonCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-4 space-y-3 ${className}`}
      aria-hidden="true"
      {...props}
    >
      <div className="flex gap-4">
        <Skeleton variant="rounded" width={80} height={80} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={14} />
          <Skeleton variant="text" width="80%" height={14} />
        </div>
      </div>
    </div>
  )
);
SkeletonCard.displayName = 'SkeletonCard';

// Button skeleton
const SkeletonButton = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'variant'>>(
  ({ className = '', width = 100, height = 44, ...props }, ref) => (
    <Skeleton ref={ref} variant="rounded" width={width} height={height} className={className} {...props} />
  )
);
SkeletonButton.displayName = 'SkeletonButton';

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonButton };
