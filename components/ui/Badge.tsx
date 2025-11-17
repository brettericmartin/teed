import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'purple' | 'outline';
}

/**
 * Reusable Badge component for tags, status indicators, and labels
 * Fully supports dark mode with appropriate styling
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200';

    const variantStyles = {
      default:
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      success:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      warning:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      error:
        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      purple:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      outline:
        'border-2 border-gray-300 text-gray-700 bg-transparent dark:border-zinc-700 dark:text-gray-300',
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`;

    return <span ref={ref} className={combinedClassName} {...props} />;
  }
);

Badge.displayName = 'Badge';

export { Badge };
