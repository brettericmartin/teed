import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ai' | 'create' | 'featured' | 'destructive' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Teed Button Component
 * Follows the Teed brand design system with semantic button variants
 *
 * Color Strategy:
 * - Sky Blue = AI/intelligent features (soft blue bg with deep muted blue text)
 * - Deep Evergreen = Manual/user-initiated actions (create variant)
 * - Copper Orange = Remove/Edit actions (destructive, featured variants)
 *
 * Variants:
 * - ai: For AI-powered features and intelligent actions (Sky Blue #CFE3E8)
 * - create: For manual new items and user-initiated actions (Deep Evergreen) - PRIMARY
 * - featured: For edit/creative actions (Copper Orange)
 * - destructive: For delete/remove actions (Copper Orange) - Requires confirmation
 * - secondary: For less prominent actions (Soft backgrounds)
 * - ghost: For tertiary actions (Transparent with border)
 * - outline: For outlined style (White with Evergreen border)
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'create', size = 'md', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed btn-lift';

    const variantStyles = {
      // AI Actions: Sky Tint (soft mint-blue) for intelligent/AI-powered features
      ai: 'bg-[var(--button-ai-bg)] text-[var(--button-ai-text)] hover:bg-[var(--button-ai-bg-hover)] active:bg-[var(--button-ai-bg-active)] shadow-sm hover:shadow-md active:scale-[0.98]',

      // Create/Add: Deep Evergreen for manual/user-initiated actions
      create: 'bg-[var(--button-create-bg)] text-[var(--button-create-text)] hover:bg-[var(--button-create-bg-hover)] active:bg-[var(--button-create-bg-active)] shadow-sm hover:shadow-md active:scale-[0.98]',

      // Featured/Edit: Copper Orange for edit/creative actions
      featured: 'bg-[var(--copper-8)] text-white hover:bg-[var(--copper-9)] active:bg-[var(--copper-10)] shadow-sm hover:shadow-md active:scale-[0.98]',

      // Destructive: Copper Orange for remove/delete actions
      destructive: 'bg-[var(--button-destructive-bg)] text-[var(--button-destructive-text)] hover:bg-[var(--button-destructive-bg-hover)] active:bg-[var(--button-destructive-bg-active)] shadow-sm hover:shadow-md active:scale-[0.98]',

      // Secondary: Soft backgrounds for secondary actions
      secondary: 'bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] hover:bg-[var(--button-secondary-bg-hover)] active:bg-[var(--button-secondary-bg-active)] shadow-sm active:scale-[0.98]',

      // Ghost: Transparent with border for tertiary actions
      ghost: 'bg-[var(--button-ghost-bg)] text-[var(--button-ghost-text)] border border-[var(--button-ghost-border)] hover:bg-[var(--button-ghost-bg-hover)] hover:border-[var(--border-hover)] active:bg-[var(--button-ghost-bg-active)] active:scale-[0.98]',

      // Outline: White background with Evergreen border
      outline: 'bg-[var(--button-outline-bg)] text-[var(--button-outline-text)] border border-[var(--button-outline-border)] hover:bg-[var(--button-outline-bg-hover)] active:bg-[var(--button-outline-bg-active)] active:scale-[0.98]',
    };

    const sizeStyles = {
      sm: 'px-3 py-2.5 text-sm rounded-lg min-h-[44px]',
      md: 'px-4 py-3 text-base rounded-xl min-h-[48px]',
      lg: 'px-6 py-3.5 text-lg rounded-xl min-h-[52px]',
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    return <button ref={ref} className={combinedClassName} {...props} />;
  }
);

Button.displayName = 'Button';

export { Button };
