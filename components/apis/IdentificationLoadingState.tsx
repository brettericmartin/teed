'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Brain, Search, Sparkles, Check } from 'lucide-react';

interface IdentificationLoadingStateProps {
  croppedImage: string;
  className?: string;
}

// Pipeline stages with timing estimates (total ~8 seconds to cover typical API response)
const STAGES = [
  {
    id: 'analyzing',
    label: 'Analyzing image',
    icon: Eye,
    duration: 1500,
    messages: [
      'Looking at your photo...',
      'Examining details...',
    ]
  },
  {
    id: 'extracting',
    label: 'Extracting features',
    icon: Search,
    duration: 2500,
    messages: [
      'Finding colors and shapes...',
      'Detecting brand markers...',
      'Reading any visible text...',
    ]
  },
  {
    id: 'matching',
    label: 'Matching products',
    icon: Brain,
    duration: 2500,
    messages: [
      'Searching product database...',
      'Comparing visual signatures...',
      'Checking brand catalogs...',
    ]
  },
  {
    id: 'ranking',
    label: 'Ranking matches',
    icon: Sparkles,
    duration: 1500,
    messages: [
      'Calculating confidence scores...',
      'Finding best matches...',
      'Almost there...',
    ]
  }
];

/**
 * Animated loading state for product identification
 *
 * Shows:
 * - Cropped image with scanning animation
 * - Progressive stage indicators
 * - Cycling status messages
 * - Overall progress bar
 */
export function IdentificationLoadingState({
  croppedImage,
  className = ''
}: IdentificationLoadingStateProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Progress through stages
  useEffect(() => {
    const totalDuration = STAGES.reduce((sum, s) => sum + s.duration, 0);
    let elapsed = 0;

    // Calculate when each stage should start
    const stageStartTimes = STAGES.map((stage, i) => {
      const startTime = elapsed;
      elapsed += stage.duration;
      return startTime;
    });

    const startTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startTime;

      // Update progress (cap at 95% to avoid looking "done" before results)
      const progressPercent = Math.min(95, (elapsedMs / totalDuration) * 100);
      setProgress(progressPercent);

      // Update current stage
      for (let i = STAGES.length - 1; i >= 0; i--) {
        if (elapsedMs >= stageStartTimes[i]) {
          setCurrentStageIndex(i);
          break;
        }
      }

      // Loop if we exceed total duration (API taking longer)
      if (elapsedMs > totalDuration) {
        // Stay on last stage, cycle messages
        setCurrentStageIndex(STAGES.length - 1);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Cycle through messages within current stage
  useEffect(() => {
    const stage = STAGES[currentStageIndex];
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % stage.messages.length);
    }, 1500);

    // Reset message index when stage changes
    setCurrentMessageIndex(0);

    return () => clearInterval(messageInterval);
  }, [currentStageIndex]);

  const currentStage = STAGES[currentStageIndex];
  const CurrentIcon = currentStage.icon;

  return (
    <div className={`bg-white rounded-xl overflow-hidden shadow-lg ${className}`}>
      {/* Image with scanning animation */}
      <div className="relative aspect-square max-h-48 mx-auto overflow-hidden bg-gray-100">
        <img
          src={croppedImage}
          alt="Analyzing..."
          className="w-full h-full object-contain"
        />

        {/* Scanning line animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-80 animate-ai-scan"
            style={{
              boxShadow: '0 0 20px 10px rgba(59, 130, 246, 0.3)',
            }}
          />
        </div>

        {/* Corner brackets overlay */}
        <div className="absolute inset-4 pointer-events-none">
          {/* Top left */}
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-blue-500" />
          {/* Top right */}
          <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-blue-500" />
          {/* Bottom left */}
          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-blue-500" />
          {/* Bottom right */}
          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-blue-500" />
        </div>

        {/* Pulsing overlay */}
        <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
      </div>

      {/* Progress section */}
      <div className="p-4 space-y-4">
        {/* Stage indicators */}
        <div className="flex items-center justify-between gap-1">
          {STAGES.map((stage, index) => {
            const StageIcon = stage.icon;
            const isActive = index === currentStageIndex;
            const isComplete = index < currentStageIndex;

            return (
              <div
                key={stage.id}
                className={`flex-1 flex flex-col items-center gap-1 transition-all duration-300 ${
                  isActive ? 'scale-110' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isComplete
                      ? 'bg-green-100 text-green-600'
                      : isActive
                      ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-300 ring-offset-1'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isComplete ? (
                    <Check size={16} className="animate-in fade-in duration-200" />
                  ) : (
                    <StageIcon
                      size={16}
                      className={isActive ? 'animate-pulse' : ''}
                    />
                  )}
                </div>
                <span
                  className={`text-[10px] text-center leading-tight transition-colors ${
                    isActive ? 'text-blue-600 font-medium' : 'text-gray-400'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current status message */}
        <div className="flex items-center justify-center gap-2 min-h-[24px]">
          <CurrentIcon
            size={16}
            className="text-blue-500 animate-pulse flex-shrink-0"
          />
          <p
            className="text-sm text-gray-600 animate-in fade-in slide-in-from-bottom-1 duration-300"
            key={`${currentStageIndex}-${currentMessageIndex}`}
          >
            {currentStage.messages[currentMessageIndex]}
          </p>
        </div>

        {/* Reassurance text */}
        <p className="text-xs text-gray-400 text-center">
          This usually takes 3-5 seconds
        </p>
      </div>
    </div>
  );
}
