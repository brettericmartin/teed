'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, ImageIcon, Eye, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingTip {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  target?: string; // CSS selector for the element to highlight
}

const ONBOARDING_TIPS: OnboardingTip[] = [
  {
    id: 'ai-curator',
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Add items with AI',
    description: 'Paste links or upload photos - our AI will identify products automatically and enrich your items.',
  },
  {
    id: 'cover-photo',
    icon: <ImageIcon className="w-5 h-5" />,
    title: 'Customize your cover',
    description: 'Add a cover photo to make your bag stand out. Click the camera icon at the top.',
  },
  {
    id: 'privacy',
    icon: <Eye className="w-5 h-5" />,
    title: 'Control visibility',
    description: 'Your bag is private by default. Toggle the visibility when you\'re ready to share.',
  },
];

const STORAGE_KEY = 'teed-editor-onboarding-seen';

/**
 * EditorOnboarding - First-run tips for the bag editor
 *
 * Shows dismissible tips on first visit to help users:
 * 1. Understand the AI curator features
 * 2. Know how to customize their cover photo
 * 3. Understand privacy controls
 *
 * Tips are stored in localStorage and only shown once per user.
 */
export function EditorOnboarding() {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Check localStorage on mount - using sync check to avoid setState in effect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen) return; // Already seen, don't show

    // First time - show onboarding after a brief delay
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Mark as seen and hide
  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  // Go to next tip
  const handleNext = () => {
    if (currentTipIndex < ONBOARDING_TIPS.length - 1) {
      setCurrentTipIndex(prev => prev + 1);
    } else {
      handleDismiss();
    }
  };

  // Skip all
  const handleSkip = () => {
    handleDismiss();
  };

  // Don't render if already seen or not visible
  if (!isVisible) return null;

  const currentTip = ONBOARDING_TIPS[currentTipIndex];
  const isLastTip = currentTipIndex === ONBOARDING_TIPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-[2px] animate-in fade-in duration-300"
        onClick={handleSkip}
      />

      {/* Tip Card */}
      <div className={cn(
        'fixed z-50 w-full max-w-sm mx-auto px-4',
        'bottom-24 left-1/2 -translate-x-1/2',
        'animate-in fade-in slide-in-from-bottom-4 duration-300'
      )}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-teed-green-50 to-sky-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teed-green-100 flex items-center justify-center text-teed-green-600">
                {currentTip.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  Tip {currentTipIndex + 1} of {ONBOARDING_TIPS.length}
                </p>
                <h3 className="font-semibold text-gray-900">{currentTip.title}</h3>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="p-2 rounded-full hover:bg-white/50 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            <p className="text-gray-600 text-sm leading-relaxed">
              {currentTip.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-t border-gray-100">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Skip all
            </button>

            <div className="flex items-center gap-2">
              {/* Progress dots */}
              <div className="flex gap-1.5 mr-3">
                {ONBOARDING_TIPS.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-colors',
                      index === currentTipIndex ? 'bg-teed-green-600' : 'bg-gray-300'
                    )}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className={cn(
                  'flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm transition-all',
                  'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white'
                )}
              >
                {isLastTip ? 'Got it!' : 'Next'}
                {!isLastTip && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Hook to check if user has seen onboarding
 * Returns true by default (SSR-safe)
 */
export function useHasSeenOnboarding(): boolean {
  // Check synchronously on client, default true for SSR
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}
