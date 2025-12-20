'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IllustrationProps {
  className?: string;
  animate?: boolean;
}

// Golf bag illustration for new users / no bags
export function GolfBagIllustration({ className, animate = true }: IllustrationProps) {
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className={cn('w-32 h-32', className)}
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.5 }}
    >
      {/* Soft gradient background circle */}
      <defs>
        <linearGradient id="bagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--teed-green-3)" />
          <stop offset="100%" stopColor="var(--sky-3)" />
        </linearGradient>
        <linearGradient id="bagBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--evergreen-10)" />
          <stop offset="100%" stopColor="var(--evergreen-12)" />
        </linearGradient>
      </defs>

      <circle cx="60" cy="60" r="55" fill="url(#bagGradient)" />

      {/* Golf bag body */}
      <motion.path
        d="M45 35 L50 90 Q55 95 60 95 Q65 95 70 90 L75 35 Q60 30 45 35"
        fill="url(#bagBody)"
        initial={animate ? { pathLength: 0 } : false}
        animate={animate ? { pathLength: 1 } : false}
        transition={{ duration: 0.8, delay: 0.2 }}
      />

      {/* Bag pocket */}
      <rect x="52" y="60" width="16" height="18" rx="3" fill="var(--evergreen-8)" />

      {/* Golf clubs sticking out */}
      <motion.g
        initial={animate ? { y: -5, opacity: 0 } : false}
        animate={animate ? { y: 0, opacity: 1 } : false}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        {/* Club 1 - Driver */}
        <line x1="48" y1="35" x2="42" y2="15" stroke="var(--grey-7)" strokeWidth="2" />
        <circle cx="42" cy="13" r="5" fill="var(--grey-6)" />

        {/* Club 2 - Iron */}
        <line x1="56" y1="35" x2="54" y2="18" stroke="var(--grey-7)" strokeWidth="2" />
        <rect x="50" y="12" width="8" height="6" rx="1" fill="var(--grey-6)" />

        {/* Club 3 - Putter */}
        <line x1="64" y1="35" x2="66" y2="18" stroke="var(--grey-7)" strokeWidth="2" />
        <rect x="64" y="12" width="6" height="8" rx="1" fill="var(--grey-6)" />

        {/* Club 4 - Wedge */}
        <line x1="72" y1="35" x2="78" y2="20" stroke="var(--grey-7)" strokeWidth="2" />
        <polygon points="78,18 82,22 76,24" fill="var(--grey-6)" />
      </motion.g>

      {/* Sparkle accents */}
      <motion.g
        initial={animate ? { scale: 0 } : false}
        animate={animate ? { scale: 1 } : false}
        transition={{ duration: 0.3, delay: 0.8 }}
      >
        <circle cx="85" cy="30" r="2" fill="var(--teed-green-8)" />
        <circle cx="90" cy="45" r="1.5" fill="var(--sky-8)" />
        <circle cx="30" cy="50" r="1.5" fill="var(--copper-7)" />
      </motion.g>
    </motion.svg>
  );
}

// Camera/capture illustration for no items
export function CaptureIllustration({ className, animate = true }: IllustrationProps) {
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className={cn('w-32 h-32', className)}
      initial={animate ? { opacity: 0, scale: 0.9 } : false}
      animate={animate ? { opacity: 1, scale: 1 } : false}
      transition={{ duration: 0.5 }}
    >
      <defs>
        <linearGradient id="captureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--sky-3)" />
          <stop offset="100%" stopColor="var(--teed-green-3)" />
        </linearGradient>
      </defs>

      <circle cx="60" cy="60" r="55" fill="url(#captureGradient)" />

      {/* Camera body */}
      <motion.rect
        x="30" y="40" width="60" height="45" rx="8"
        fill="var(--evergreen-11)"
        initial={animate ? { scale: 0.8 } : false}
        animate={animate ? { scale: 1 } : false}
        transition={{ duration: 0.4, delay: 0.2 }}
      />

      {/* Camera flash */}
      <rect x="35" y="45" width="12" height="8" rx="2" fill="var(--grey-5)" />

      {/* Camera lens */}
      <motion.circle
        cx="60" cy="60" r="15"
        fill="var(--evergreen-9)"
        stroke="var(--grey-6)"
        strokeWidth="3"
        initial={animate ? { scale: 0 } : false}
        animate={animate ? { scale: 1 } : false}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
      <motion.circle
        cx="60" cy="60" r="8"
        fill="var(--sky-10)"
        initial={animate ? { scale: 0 } : false}
        animate={animate ? { scale: 1 } : false}
        transition={{ duration: 0.3, delay: 0.5 }}
      />
      <circle cx="57" cy="57" r="3" fill="var(--sky-6)" opacity="0.6" />

      {/* Viewfinder */}
      <rect x="75" y="32" width="10" height="8" rx="2" fill="var(--evergreen-10)" />

      {/* Sparkle/AI effect */}
      <motion.g
        initial={animate ? { opacity: 0, rotate: -30 } : false}
        animate={animate ? { opacity: 1, rotate: 0 } : false}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <path
          d="M95 35 L98 42 L105 42 L100 47 L102 54 L95 50 L88 54 L90 47 L85 42 L92 42 Z"
          fill="var(--copper-7)"
        />
      </motion.g>

      {/* Small sparkles */}
      <motion.g
        initial={animate ? { scale: 0 } : false}
        animate={animate ? { scale: 1 } : false}
        transition={{ duration: 0.3, delay: 0.9 }}
      >
        <circle cx="25" cy="75" r="2" fill="var(--teed-green-8)" />
        <circle cx="95" cy="70" r="1.5" fill="var(--sky-8)" />
      </motion.g>
    </motion.svg>
  );
}

// Search/discover illustration for no results
export function DiscoverIllustration({ className, animate = true }: IllustrationProps) {
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className={cn('w-32 h-32', className)}
      initial={animate ? { opacity: 0 } : false}
      animate={animate ? { opacity: 1 } : false}
      transition={{ duration: 0.5 }}
    >
      <defs>
        <linearGradient id="discoverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--sand-3)" />
          <stop offset="100%" stopColor="var(--copper-2)" />
        </linearGradient>
      </defs>

      <circle cx="60" cy="60" r="55" fill="url(#discoverGradient)" />

      {/* Magnifying glass */}
      <motion.circle
        cx="52" cy="52" r="22"
        fill="none"
        stroke="var(--evergreen-11)"
        strokeWidth="5"
        initial={animate ? { pathLength: 0 } : false}
        animate={animate ? { pathLength: 1 } : false}
        transition={{ duration: 0.6, delay: 0.2 }}
      />

      {/* Glass fill */}
      <circle cx="52" cy="52" r="18" fill="var(--sky-3)" opacity="0.5" />

      {/* Glass shine */}
      <path d="M42 42 Q45 38 52 38" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />

      {/* Handle */}
      <motion.line
        x1="68" y1="68" x2="88" y2="88"
        stroke="var(--evergreen-11)"
        strokeWidth="6"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0 } : false}
        animate={animate ? { pathLength: 1 } : false}
        transition={{ duration: 0.4, delay: 0.6 }}
      />

      {/* Items in glass */}
      <motion.g
        initial={animate ? { opacity: 0, y: 5 } : false}
        animate={animate ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.3, delay: 0.8 }}
      >
        <rect x="42" y="48" width="8" height="8" rx="2" fill="var(--teed-green-8)" />
        <rect x="52" y="52" width="6" height="6" rx="1" fill="var(--copper-7)" />
        <rect x="48" y="58" width="5" height="5" rx="1" fill="var(--sky-8)" />
      </motion.g>

      {/* Sparkles */}
      <motion.g
        initial={animate ? { scale: 0 } : false}
        animate={animate ? { scale: 1 } : false}
        transition={{ duration: 0.3, delay: 1 }}
      >
        <circle cx="30" cy="35" r="2" fill="var(--copper-6)" />
        <circle cx="85" cy="40" r="1.5" fill="var(--teed-green-7)" />
      </motion.g>
    </motion.svg>
  );
}

// Bookmark/saved illustration for no saved items
export function SavedIllustration({ className, animate = true }: IllustrationProps) {
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className={cn('w-32 h-32', className)}
      initial={animate ? { opacity: 0 } : false}
      animate={animate ? { opacity: 1 } : false}
      transition={{ duration: 0.5 }}
    >
      <defs>
        <linearGradient id="savedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--amber-2)" />
          <stop offset="100%" stopColor="var(--sand-3)" />
        </linearGradient>
      </defs>

      <circle cx="60" cy="60" r="55" fill="url(#savedGradient)" />

      {/* Stack of bookmarks */}
      <motion.path
        d="M35 30 L35 85 L50 72 L65 85 L65 30 Z"
        fill="var(--grey-4)"
        initial={animate ? { y: 10, opacity: 0 } : false}
        animate={animate ? { y: 0, opacity: 1 } : false}
        transition={{ duration: 0.4, delay: 0.2 }}
      />

      <motion.path
        d="M45 25 L45 80 L60 67 L75 80 L75 25 Z"
        fill="var(--sand-6)"
        initial={animate ? { y: 10, opacity: 0 } : false}
        animate={animate ? { y: 0, opacity: 1 } : false}
        transition={{ duration: 0.4, delay: 0.35 }}
      />

      <motion.path
        d="M55 20 L55 75 L70 62 L85 75 L85 20 Z"
        fill="var(--amber-7)"
        initial={animate ? { y: 10, opacity: 0 } : false}
        animate={animate ? { y: 0, opacity: 1 } : false}
        transition={{ duration: 0.4, delay: 0.5 }}
      />

      {/* Heart on front bookmark */}
      <motion.path
        d="M70 35 C70 32 73 30 76 32 C79 30 82 32 82 35 C82 40 76 45 76 45 C76 45 70 40 70 35"
        fill="var(--copper-7)"
        initial={animate ? { scale: 0 } : false}
        animate={animate ? { scale: 1 } : false}
        transition={{ duration: 0.3, delay: 0.7 }}
      />

      {/* Sparkles */}
      <motion.g
        initial={animate ? { scale: 0 } : false}
        animate={animate ? { scale: 1 } : false}
        transition={{ duration: 0.3, delay: 0.9 }}
      >
        <circle cx="95" cy="45" r="2" fill="var(--amber-6)" />
        <circle cx="25" cy="65" r="1.5" fill="var(--teed-green-7)" />
        <circle cx="92" cy="75" r="1.5" fill="var(--copper-6)" />
      </motion.g>
    </motion.svg>
  );
}

// Export map for easy access by variant
export const emptyStateIllustrations = {
  'new-user': GolfBagIllustration,
  'no-bags': GolfBagIllustration,
  'no-items': CaptureIllustration,
  'no-results': DiscoverIllustration,
  'no-saved': SavedIllustration,
  'no-clones': GolfBagIllustration,
  'search-empty': DiscoverIllustration,
} as const;

export type IllustrationType = keyof typeof emptyStateIllustrations;
