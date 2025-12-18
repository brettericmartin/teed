'use client';

import { useRef, useState, ReactNode, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MagneticButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  children: ReactNode;
  className?: string;
  /** Strength of the magnetic pull (0-1). Default: 0.3 */
  strength?: number;
  /** Disable magnetic effect while keeping animations */
  disableMagnetic?: boolean;
  /** Scale on hover. Default: 1.02 */
  hoverScale?: number;
  /** Scale on tap/press. Default: 0.98 */
  tapScale?: number;
}

const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  (
    {
      children,
      className,
      strength = 0.3,
      disableMagnetic = false,
      hoverScale = 1.02,
      tapScale = 0.98,
      disabled,
      ...props
    },
    ref
  ) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    // Check for reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || disableMagnetic || prefersReducedMotion) return;

      const element = buttonRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate distance from center
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      // Apply magnetic pull (limited by strength)
      setPosition({
        x: distanceX * strength,
        y: distanceY * strength
      });
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    // Use internal ref if no external ref provided
    const combinedRef = (node: HTMLButtonElement | null) => {
      (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    return (
      <motion.button
        ref={combinedRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
        animate={prefersReducedMotion ? undefined : { x: position.x, y: position.y }}
        whileHover={prefersReducedMotion ? undefined : { scale: hoverScale }}
        whileTap={prefersReducedMotion ? undefined : { scale: tapScale }}
        transition={{
          type: 'spring',
          stiffness: 150,
          damping: 15,
          mass: 0.1
        }}
        className={cn(
          'relative transition-shadow',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

MagneticButton.displayName = 'MagneticButton';

export { MagneticButton };
export default MagneticButton;
