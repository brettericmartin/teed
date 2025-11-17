import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

/**
 * Reusable Card component for content containers
 * Fully supports dark mode with appropriate styling
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hoverable = false, ...props }, ref) => {
    const baseStyles =
      'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg transition-all duration-200';

    const hoverStyles = hoverable
      ? 'shadow-sm hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 cursor-pointer'
      : 'shadow-sm';

    const combinedClassName = `${baseStyles} ${hoverStyles} ${className}`;

    return <div ref={ref} className={combinedClassName} {...props} />;
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`p-4 border-b border-gray-200 dark:border-zinc-800 ${className}`}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}
        {...props}
      />
    );
  }
);

CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => {
    return <div ref={ref} className={`p-4 ${className}`} {...props} />;
  }
);

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`p-4 border-t border-gray-200 dark:border-zinc-800 ${className}`}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
