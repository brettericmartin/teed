# Teed UI/UX Implementation Guide

Ready-to-implement components and patterns for the curated experience revamp.

---

## Quick Start

```bash
# Install required dependencies
npm install framer-motion canvas-confetti @radix-ui/react-dialog
```

---

## Phase 1: Foundation Components

### 1.1 Celebration Provider

Create a context for managing celebrations app-wide.

```tsx
// lib/celebrations.tsx
'use client';

import { createContext, useContext, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationContextType {
  celebrate: (intensity?: 'micro' | 'medium' | 'major') => void;
  celebrateClone: () => void;
  celebrateFirstBag: () => void;
  celebrateShare: () => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

// Teed brand colors for confetti
const TEED_COLORS = ['#8BAA7E', '#D9B47C', '#82B2BF', '#1F3A2E'];

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  const celebrate = useCallback((intensity: 'micro' | 'medium' | 'major' = 'medium') => {
    const configs = {
      micro: { particleCount: 30, spread: 40 },
      medium: { particleCount: 80, spread: 60 },
      major: { particleCount: 150, spread: 90 }
    };

    const haptics = {
      micro: 50,
      medium: [100, 50, 100],
      major: [100, 50, 100, 50, 150]
    };

    triggerHaptic(haptics[intensity]);

    confetti({
      ...configs[intensity],
      origin: { y: 0.6 },
      colors: TEED_COLORS,
      disableForReducedMotion: true,
      useWorker: true
    });
  }, [triggerHaptic]);

  const celebrateClone = useCallback(() => {
    celebrate('medium');
    // Could trigger golf ball animation here
  }, [celebrate]);

  const celebrateFirstBag = useCallback(() => {
    celebrate('major');
    // Trigger the ball-tee-off animation
  }, [celebrate]);

  const celebrateShare = useCallback(() => {
    celebrate('micro');
  }, [celebrate]);

  return (
    <CelebrationContext.Provider value={{ celebrate, celebrateClone, celebrateFirstBag, celebrateShare }}>
      {children}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within CelebrationProvider');
  }
  return context;
}
```

### 1.2 Magnetic Button

Premium button with magnetic cursor attraction.

```tsx
// components/ui/MagneticButton.tsx
'use client';

import { useRef, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
  disabled?: boolean;
}

export function MagneticButton({
  children,
  className,
  onClick,
  strength = 0.3,
  disabled = false
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setPosition({
      x: (e.clientX - centerX) * strength,
      y: (e.clientY - centerY) * strength
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative transition-shadow',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {children}
    </motion.button>
  );
}
```

### 1.3 Enhanced Toast with Progress

Extend your existing Toast to include visual countdown.

```tsx
// components/ui/EnhancedToast.tsx
'use client';

import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Sparkles, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'info' | 'ai';
  message: string;
  duration?: number;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: AlertCircle,
  ai: Sparkles
};

const colors = {
  success: 'bg-[var(--teed-green-2)] border-[var(--teed-green-6)] text-[var(--teed-green-11)]',
  error: 'bg-[var(--copper-2)] border-[var(--copper-6)] text-[var(--copper-11)]',
  info: 'bg-[var(--sky-2)] border-[var(--sky-6)] text-[var(--sky-11)]',
  ai: 'bg-[var(--sky-2)] border-[var(--sky-6)] text-[var(--sky-11)]'
};

export function EnhancedToast({ type, message, duration = 4000, onClose, action }: ToastProps) {
  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative overflow-hidden rounded-lg border shadow-lg ${colors[type]}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1 text-sm font-medium">{message}</span>

        {action && (
          <button
            onClick={action.onClick}
            className="text-sm font-semibold underline hover:no-underline"
          >
            {action.label}
          </button>
        )}

        <button onClick={onClose} className="p-1 hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar countdown */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-current opacity-30"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}
```

---

## Phase 2: Action Components

### 2.1 Clone Success Modal

Modal that appears after successful clone with next steps.

```tsx
// components/modals/CloneSuccessModal.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Edit, LayoutGrid, X } from 'lucide-react';
import Link from 'next/link';
import { MagneticButton } from '@/components/ui/MagneticButton';

interface CloneSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  clonedBag: {
    code: string;
    name: string;
    itemCount: number;
  };
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }
};

export function CloneSuccessModal({ isOpen, onClose, clonedBag }: CloneSuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] p-8"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-[var(--surface-hover)] rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-6 bg-[var(--teed-green-2)] rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-12 h-12 text-[var(--teed-green-8)]" />
            </motion.div>

            {/* Content */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Bag cloned successfully!
              </h2>
              <p className="text-[var(--text-secondary)]">
                Your copy of "{clonedBag.name}" is ready to customize.
                <br />
                <span className="text-sm">{clonedBag.itemCount} items included.</span>
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link href={`/bags/${clonedBag.code}/edit`} className="block">
                <MagneticButton className="w-full px-6 py-3 bg-[var(--teed-green-8)] text-white rounded-lg font-semibold hover:bg-[var(--teed-green-9)] flex items-center justify-center gap-2">
                  <Edit className="w-5 h-5" />
                  Start Editing Your Bag
                </MagneticButton>
              </Link>

              <Link href="/dashboard" className="block">
                <button className="w-full px-6 py-3 border border-[var(--border-subtle)] rounded-lg font-medium hover:bg-[var(--surface-hover)] flex items-center justify-center gap-2">
                  <LayoutGrid className="w-5 h-5" />
                  Go to Dashboard
                </button>
              </Link>

              <button
                onClick={onClose}
                className="w-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2"
              >
                I'll do it later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

### 2.2 Sticky Action Bar

Mobile-optimized sticky CTA bar.

```tsx
// components/ui/StickyActionBar.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, GitFork } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

interface StickyActionBarProps {
  bagName: string;
  itemCount: number;
  creatorHandle: string;
  onClone: () => void;
  onShare: () => void;
}

export function StickyActionBar({
  bagName,
  itemCount,
  creatorHandle,
  onClone,
  onShare
}: StickyActionBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)]/95 backdrop-blur-lg border-t border-[var(--border-subtle)] safe-area-inset-bottom"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            {/* Bag Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate text-[var(--text-primary)]">
                {bagName}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {itemCount} items • by @{creatorHandle}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onShare}
                className="p-2.5 border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--surface-hover)] lg:px-4 lg:flex lg:items-center lg:gap-2"
                aria-label="Share bag"
              >
                <Share2 className="w-5 h-5" />
                <span className="hidden lg:inline text-sm font-medium">Share</span>
              </button>

              <MagneticButton
                onClick={onClone}
                className="px-5 py-2.5 bg-[var(--teed-green-8)] text-white rounded-lg font-semibold hover:bg-[var(--teed-green-9)] flex items-center gap-2 whitespace-nowrap"
              >
                <GitFork className="w-4 h-4" />
                Clone Bag
              </MagneticButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 2.3 Social Proof Metrics

Display views, clones, and badges.

```tsx
// components/ui/SocialProofMetrics.tsx
import { Eye, GitFork, Bookmark, BadgeCheck, Sparkles } from 'lucide-react';

interface SocialProofMetricsProps {
  viewCount?: number;
  cloneCount?: number;
  saveCount?: number;
  isFeatured?: boolean;
  featuredCategory?: string;
  creatorVerified?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export function SocialProofMetrics({
  viewCount,
  cloneCount,
  saveCount,
  isFeatured,
  featuredCategory,
  creatorVerified
}: SocialProofMetricsProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap text-sm text-[var(--text-secondary)]">
      {/* View Count (only if > 50) */}
      {viewCount && viewCount > 50 && (
        <span className="flex items-center gap-1.5">
          <Eye className="w-4 h-4" />
          {formatNumber(viewCount)} views
        </span>
      )}

      {/* Clone Count */}
      {cloneCount && cloneCount > 0 && (
        <span className="flex items-center gap-1.5">
          <GitFork className="w-4 h-4" />
          {formatNumber(cloneCount)} {cloneCount === 1 ? 'clone' : 'clones'}
        </span>
      )}

      {/* Save Count (only if > 10) */}
      {saveCount && saveCount > 10 && (
        <span className="flex items-center gap-1.5">
          <Bookmark className="w-4 h-4" />
          {formatNumber(saveCount)} saves
        </span>
      )}

      {/* Featured Badge */}
      {isFeatured && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-[var(--copper-2)] to-[var(--sand-2)] border border-[var(--copper-6)] rounded-full text-[var(--copper-11)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">
            Featured{featuredCategory ? ` in ${featuredCategory}` : ''}
          </span>
        </span>
      )}

      {/* Verified Badge (for creator display) */}
      {creatorVerified && (
        <BadgeCheck className="w-4 h-4 text-[var(--teed-green-8)]" />
      )}
    </div>
  );
}
```

---

## Phase 3: Editorial Components

### 3.1 Curator's Note

```tsx
// components/ui/CuratorNote.tsx
interface CuratorNoteProps {
  note: string;
  curatorName: string;
  curatorAvatar?: string;
  variant?: 'inline' | 'featured';
}

export function CuratorNote({
  note,
  curatorName,
  curatorAvatar,
  variant = 'inline'
}: CuratorNoteProps) {
  if (variant === 'inline') {
    return (
      <div className="border-l-2 border-[var(--sand-8)] pl-6 py-4 my-6">
        <p className="font-serif italic text-[var(--text-secondary)] leading-relaxed mb-3">
          "{note}"
        </p>
        <div className="flex items-center gap-2 text-sm">
          {curatorAvatar && (
            <img src={curatorAvatar} alt="" className="w-6 h-6 rounded-full" />
          )}
          <span className="text-[var(--text-tertiary)]">— {curatorName}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--sand-2)] to-[var(--sky-2)] p-6">
      {/* Subtle pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      <div className="relative">
        <p className="text-xs uppercase tracking-widest text-[var(--copper-10)] font-semibold mb-3">
          Curator's Note
        </p>
        <blockquote className="font-serif text-lg italic text-[var(--text-primary)] leading-relaxed mb-4">
          "{note}"
        </blockquote>
        <div className="flex items-center gap-3">
          {curatorAvatar && (
            <img src={curatorAvatar} alt="" className="w-10 h-10 rounded-full ring-2 ring-white" />
          )}
          <span className="font-medium text-[var(--text-primary)]">{curatorName}</span>
        </div>
      </div>
    </div>
  );
}
```

### 3.2 Empty State

```tsx
// components/ui/EmptyState.tsx
import { ShoppingBag, Search, Camera, Plus } from 'lucide-react';
import Link from 'next/link';
import { MagneticButton } from './MagneticButton';

type EmptyStateVariant = 'new-user' | 'no-bags' | 'no-items' | 'no-results';

const configs: Record<EmptyStateVariant, {
  icon: typeof ShoppingBag;
  title: string;
  description: string;
  cta: string;
  ctaHref: string;
}> = {
  'new-user': {
    icon: ShoppingBag,
    title: 'Your first bag awaits',
    description: 'Start curating your collection. Add items you love, organize them your way, and share with the world.',
    cta: 'Create Your First Bag',
    ctaHref: '/bags/new'
  },
  'no-bags': {
    icon: ShoppingBag,
    title: 'No bags yet',
    description: 'Create a bag to start organizing your gear. Golf clubs, travel essentials, desk setup — whatever you collect.',
    cta: 'Create a Bag',
    ctaHref: '/bags/new'
  },
  'no-items': {
    icon: Camera,
    title: 'This bag is empty',
    description: 'Add items by snapping a photo with AI identification, or manually add products.',
    cta: 'Add Your First Item',
    ctaHref: '#add-item'
  },
  'no-results': {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or browse featured bags below.',
    cta: 'Clear Search',
    ctaHref: '#clear'
  }
};

interface EmptyStateProps {
  variant: EmptyStateVariant;
  onAction?: () => void;
}

export function EmptyState({ variant, onAction }: EmptyStateProps) {
  const config = configs[variant];
  const Icon = config.icon;

  const handleClick = () => {
    if (onAction) {
      onAction();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {/* Icon circle */}
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[var(--teed-green-2)] to-[var(--sky-3)] flex items-center justify-center mb-6">
        <Icon className="w-14 h-14 text-[var(--teed-green-9)]" strokeWidth={1.5} />
      </div>

      {/* Content */}
      <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
        {config.title}
      </h3>
      <p className="text-[var(--text-secondary)] max-w-md mb-8 leading-relaxed">
        {config.description}
      </p>

      {/* CTA */}
      {config.ctaHref.startsWith('#') ? (
        <MagneticButton
          onClick={handleClick}
          className="px-6 py-3 bg-[var(--teed-green-8)] text-white font-semibold rounded-lg hover:bg-[var(--teed-green-9)] transition-all"
        >
          {config.cta}
        </MagneticButton>
      ) : (
        <Link href={config.ctaHref}>
          <MagneticButton className="px-6 py-3 bg-[var(--teed-green-8)] text-white font-semibold rounded-lg hover:bg-[var(--teed-green-9)] transition-all">
            {config.cta}
          </MagneticButton>
        </Link>
      )}
    </div>
  );
}
```

---

## Phase 4: CSS Enhancements

Add these to `app/globals.css`:

```css
/* ============================================
   GRAINY GRADIENTS
   ============================================ */

.grainy-gradient {
  position: relative;
}

.grainy-gradient::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  z-index: 1;
}

/* ============================================
   GLOW SHADOWS
   ============================================ */

--shadow-glow-teed:
  0 0 0 1px var(--teed-green-6),
  0 4px 12px rgba(139, 170, 126, 0.15),
  0 8px 24px rgba(139, 170, 126, 0.1);

--shadow-glow-sky:
  0 0 0 1px var(--sky-6),
  0 4px 16px rgba(207, 227, 232, 0.25),
  0 8px 32px rgba(207, 227, 232, 0.15);

--shadow-glow-copper:
  0 0 0 1px var(--copper-6),
  0 4px 16px rgba(194, 120, 74, 0.2),
  0 8px 32px rgba(194, 120, 74, 0.1);

.shadow-glow-teed {
  box-shadow: var(--shadow-glow-teed);
}

.shadow-glow-teed-hover:hover {
  box-shadow: var(--shadow-glow-teed);
}

/* ============================================
   GLASSMORPHISM
   ============================================ */

.glass {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-dark {
  background: rgba(31, 58, 46, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* ============================================
   ANIMATED GRADIENT BORDER
   ============================================ */

.gradient-border {
  position: relative;
  background: var(--surface);
}

.gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, var(--teed-green-6), var(--sky-6), var(--copper-6));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* ============================================
   SAFE AREAS (iOS)
   ============================================ */

.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.safe-area-inset-top {
  padding-top: env(safe-area-inset-top, 0);
}

/* ============================================
   ENHANCED GOLF BALL ANIMATIONS
   ============================================ */

@keyframes ball-roll-progress {
  from { transform: translateX(-50%) rotate(0deg); }
  to { transform: translateX(-50%) rotate(360deg); }
}

@keyframes celebration-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.animate-celebration-bounce {
  animation: celebration-bounce 0.6s ease-out;
}

/* ============================================
   SCROLL REVEAL (Pure CSS with JS toggle)
   ============================================ */

.reveal-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.reveal-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger delays for lists */
.reveal-stagger > .reveal-on-scroll:nth-child(1) { transition-delay: 0ms; }
.reveal-stagger > .reveal-on-scroll:nth-child(2) { transition-delay: 100ms; }
.reveal-stagger > .reveal-on-scroll:nth-child(3) { transition-delay: 200ms; }
.reveal-stagger > .reveal-on-scroll:nth-child(4) { transition-delay: 300ms; }
.reveal-stagger > .reveal-on-scroll:nth-child(5) { transition-delay: 400ms; }
.reveal-stagger > .reveal-on-scroll:nth-child(6) { transition-delay: 500ms; }

/* ============================================
   HORIZONTAL SCROLL
   ============================================ */

.horizontal-scroll {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

.horizontal-scroll > * {
  scroll-snap-align: start;
  flex-shrink: 0;
}
```

---

## Phase 5: Animation Variants Library

```tsx
// lib/animations.ts
export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

export const slideUp = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30
    }
  }
};

export const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30
};

export const smoothTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1]
};
```

---

## Usage Examples

### Clone Flow Integration

```tsx
// In your bag detail page
import { useCelebration } from '@/lib/celebrations';
import { CloneSuccessModal } from '@/components/modals/CloneSuccessModal';

export function BagDetailPage({ bag }) {
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [clonedBag, setClonedBag] = useState(null);
  const { celebrateClone } = useCelebration();

  const handleClone = async () => {
    try {
      const result = await cloneBag(bag.id);
      setClonedBag(result);
      celebrateClone(); // Confetti + haptic
      setShowCloneModal(true);
    } catch (error) {
      toast.error('Failed to clone bag');
    }
  };

  return (
    <>
      <MagneticButton
        onClick={handleClone}
        className="px-6 py-3 bg-[var(--teed-green-8)] text-white ..."
      >
        <GitFork className="w-5 h-5" />
        Clone This Bag
      </MagneticButton>

      <CloneSuccessModal
        isOpen={showCloneModal}
        onClose={() => setShowCloneModal(false)}
        clonedBag={clonedBag}
      />

      <StickyActionBar
        bagName={bag.name}
        itemCount={bag.items.length}
        creatorHandle={bag.creator.handle}
        onClone={handleClone}
        onShare={handleShare}
      />
    </>
  );
}
```

### Staggered Grid

```tsx
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

export function BagGrid({ bags }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {bags.map((bag) => (
        <motion.div key={bag.id} variants={staggerItem}>
          <BagCard bag={bag} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

---

## Checklist

### Phase 1
- [ ] `npm install framer-motion canvas-confetti @radix-ui/react-dialog`
- [ ] Create `lib/celebrations.tsx`
- [ ] Create `components/ui/MagneticButton.tsx`
- [ ] Add grainy gradient CSS to globals.css
- [ ] Add glow shadows to globals.css

### Phase 2
- [ ] Create `components/modals/CloneSuccessModal.tsx`
- [ ] Create `components/ui/StickyActionBar.tsx`
- [ ] Create `components/ui/SocialProofMetrics.tsx`
- [ ] Update bag detail page with new CTAs

### Phase 3
- [ ] Create `components/ui/CuratorNote.tsx`
- [ ] Create `components/ui/EmptyState.tsx`
- [ ] Add editorial scaffolding to bag pages

### Phase 4
- [ ] Add all CSS enhancements to globals.css
- [ ] Create `lib/animations.ts`
- [ ] Update existing components with new animations

### Phase 5
- [ ] Expand golf ball animation suite
- [ ] Add sound effects (optional)
- [ ] Performance audit
- [ ] Accessibility audit

---

*Implementation Guide v1.0 - December 2025*
