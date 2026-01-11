'use client';

import { createContext, useContext, useCallback, ReactNode } from 'react';
import confetti from 'canvas-confetti';

// Teed brand colors for confetti
const TEED_COLORS = ['#8BAA7E', '#D9B47C', '#82B2BF', '#1F3A2E', '#C2784A'];

interface CelebrationConfig {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
  scalar?: number;
}

interface CelebrationContextType {
  celebrate: (intensity?: 'micro' | 'medium' | 'major', config?: CelebrationConfig) => void;
  celebrateClone: () => void;
  celebrateFirstBag: () => void;
  celebrateBagCreated: () => void;
  celebrateItemAdded: () => void;
  celebrateShare: () => void;
  celebrateSave: () => void;
  celebrateComplete: () => void;
  celebrateMilestone: (count: number) => void;
  celebrateProfileUpdate: () => void;
  triggerHaptic: (pattern: number | number[]) => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

const INTENSITY_CONFIGS: Record<'micro' | 'medium' | 'major', { particleCount: number; spread: number; scalar?: number }> = {
  micro: { particleCount: 30, spread: 40 },
  medium: { particleCount: 80, spread: 60 },
  major: { particleCount: 150, spread: 90, scalar: 1.2 }
};

const HAPTIC_PATTERNS = {
  micro: 50,
  medium: [100, 50, 100] as number[],
  major: [100, 50, 100, 50, 150] as number[]
};

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Haptics not supported or blocked
      }
    }
  }, []);

  const celebrate = useCallback((
    intensity: 'micro' | 'medium' | 'major' = 'medium',
    config?: CelebrationConfig
  ) => {
    // Check for reduced motion preference
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        // Just trigger haptic for users who prefer reduced motion
        triggerHaptic(HAPTIC_PATTERNS[intensity]);
        return;
      }
    }

    // Trigger haptic feedback
    triggerHaptic(HAPTIC_PATTERNS[intensity]);

    // Fire confetti
    const baseConfig = INTENSITY_CONFIGS[intensity];

    confetti({
      particleCount: config?.particleCount ?? baseConfig.particleCount,
      spread: config?.spread ?? baseConfig.spread,
      origin: config?.origin ?? { y: 0.6 },
      colors: config?.colors ?? TEED_COLORS,
      scalar: config?.scalar ?? baseConfig.scalar ?? 1,
      disableForReducedMotion: true
    });
  }, [triggerHaptic]);

  const celebrateClone = useCallback(() => {
    celebrate('medium');

    // Secondary burst after short delay for extra impact
    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { x: 0.3, y: 0.5 },
        colors: TEED_COLORS,
        disableForReducedMotion: true
      });
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { x: 0.7, y: 0.5 },
        colors: TEED_COLORS,
        disableForReducedMotion: true
      });
    }, 150);
  }, [celebrate]);

  const celebrateFirstBag = useCallback(() => {
    celebrate('major');

    // Firework-style bursts
    const duration = 2000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 30,
        spread: 60,
        startVelocity: 30,
        origin: {
          x: Math.random(),
          y: Math.random() * 0.4
        },
        colors: TEED_COLORS,
        disableForReducedMotion: true
      });
    }, 250);
  }, [celebrate]);

  const celebrateShare = useCallback(() => {
    celebrate('micro', {
      origin: { x: 0.5, y: 0.7 },
      spread: 50
    });
  }, [celebrate]);

  const celebrateSave = useCallback(() => {
    triggerHaptic(50);
    // No confetti for save - just haptic feedback
  }, [triggerHaptic]);

  const celebrateComplete = useCallback(() => {
    celebrate('medium');

    // Golf-themed celebration - ball flying off
    setTimeout(() => {
      confetti({
        particleCount: 20,
        spread: 30,
        startVelocity: 45,
        angle: 45,
        origin: { x: 0.5, y: 0.8 },
        colors: ['#FFFFFF', '#F5F5F5'], // Golf ball colors
        shapes: ['circle'],
        scalar: 0.8,
        disableForReducedMotion: true
      });
    }, 100);
  }, [celebrate]);

  // Celebration for regular bag creation (not first bag)
  const celebrateBagCreated = useCallback(() => {
    triggerHaptic(HAPTIC_PATTERNS.medium);

    // Check for reduced motion
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;
    }

    // Subtle upward burst - feels like opening a gift
    confetti({
      particleCount: 50,
      spread: 55,
      startVelocity: 35,
      origin: { x: 0.5, y: 0.7 },
      colors: TEED_COLORS,
      disableForReducedMotion: true
    });
  }, [triggerHaptic]);

  // Celebration for adding an item - very subtle
  const celebrateItemAdded = useCallback(() => {
    triggerHaptic(50); // Quick haptic pulse

    // Check for reduced motion
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;
    }

    // Small sparkle effect - not too intrusive
    confetti({
      particleCount: 15,
      spread: 30,
      startVelocity: 20,
      gravity: 1.5,
      origin: { x: 0.5, y: 0.4 },
      colors: ['#8BAA7E', '#82B2BF'], // Just teed-green and sky
      scalar: 0.7,
      disableForReducedMotion: true
    });
  }, [triggerHaptic]);

  // Celebration for reaching milestones (5, 10, 25, 50, 100 items/bags)
  const celebrateMilestone = useCallback((count: number) => {
    // Only celebrate at specific milestones
    const milestones = [5, 10, 25, 50, 100, 250, 500];
    if (!milestones.includes(count)) return;

    triggerHaptic(HAPTIC_PATTERNS.major);

    // Check for reduced motion
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;
    }

    // Gold-themed celebration for milestones
    const goldColors = ['#D9B47C', '#C2784A', '#FFD700', '#FFA500'];

    // Main burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: goldColors,
      disableForReducedMotion: true
    });

    // Secondary bursts from sides
    setTimeout(() => {
      confetti({
        particleCount: 30,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: goldColors,
        disableForReducedMotion: true
      });
      confetti({
        particleCount: 30,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: goldColors,
        disableForReducedMotion: true
      });
    }, 150);
  }, [triggerHaptic]);

  // Celebration for exiting edit mode after making changes - "Your showcase is updated"
  const celebrateProfileUpdate = useCallback(() => {
    triggerHaptic(HAPTIC_PATTERNS.micro);

    // Check for reduced motion
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;
    }

    // Subtle, elegant sparkle from the center - feels like polishing a display
    confetti({
      particleCount: 25,
      spread: 45,
      startVelocity: 25,
      gravity: 1.2,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#8BAA7E', '#D9B47C', '#82B2BF'], // Teed green, gold, sky
      scalar: 0.8,
      disableForReducedMotion: true
    });
  }, [triggerHaptic]);

  return (
    <CelebrationContext.Provider
      value={{
        celebrate,
        celebrateClone,
        celebrateFirstBag,
        celebrateBagCreated,
        celebrateItemAdded,
        celebrateShare,
        celebrateSave,
        celebrateComplete,
        celebrateMilestone,
        celebrateProfileUpdate,
        triggerHaptic
      }}
    >
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

// Standalone celebration functions for use outside of React context
export const celebrations = {
  micro: () => {
    confetti({
      particleCount: 30,
      spread: 40,
      origin: { y: 0.6 },
      colors: TEED_COLORS,
      disableForReducedMotion: true
    });
  },

  medium: () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: TEED_COLORS,
      disableForReducedMotion: true
    });
  },

  major: () => {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: TEED_COLORS,
      scalar: 1.2,
      disableForReducedMotion: true
    });
  }
};
