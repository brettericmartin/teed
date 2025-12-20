/**
 * Haptic feedback utilities for mobile interactions
 * Provides tactile feedback to make interactions feel more responsive
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [15, 30, 15],
  warning: [30, 50, 30],
  error: [50, 100, 50],
  selection: 15,
};

/**
 * Check if haptic feedback is supported
 */
export function isHapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback with a predefined pattern
 */
export function haptic(pattern: HapticPattern = 'light'): void {
  if (!isHapticsSupported()) return;

  try {
    navigator.vibrate(HAPTIC_PATTERNS[pattern]);
  } catch {
    // Haptics blocked or not supported
  }
}

/**
 * Trigger custom haptic pattern
 */
export function hapticCustom(pattern: number | number[]): void {
  if (!isHapticsSupported()) return;

  try {
    navigator.vibrate(pattern);
  } catch {
    // Haptics blocked or not supported
  }
}

/**
 * Hook for using haptics in React components
 */
export function useHaptics() {
  return {
    isSupported: isHapticsSupported(),
    light: () => haptic('light'),
    medium: () => haptic('medium'),
    heavy: () => haptic('heavy'),
    success: () => haptic('success'),
    warning: () => haptic('warning'),
    error: () => haptic('error'),
    selection: () => haptic('selection'),
    custom: hapticCustom,
  };
}

/**
 * Higher-order function to wrap event handlers with haptic feedback
 */
export function withHaptic<T extends (...args: any[]) => any>(
  handler: T,
  pattern: HapticPattern = 'light'
): T {
  return ((...args: Parameters<T>) => {
    haptic(pattern);
    return handler(...args);
  }) as T;
}
