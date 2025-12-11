'use client';

import { Check, Loader2 } from 'lucide-react';
import { IDENTIFICATION_STAGES, type IdentificationStage } from '@/lib/apis/types';

interface IdentificationProgressProps {
  currentStage: IdentificationStage;
  stepMessage: string;
}

export default function IdentificationProgress({
  currentStage,
  stepMessage
}: IdentificationProgressProps) {
  // Find current stage index
  const currentIndex = IDENTIFICATION_STAGES.findIndex(s => s.id === currentStage);

  // Filter out error and idle stages for display
  const displayStages = IDENTIFICATION_STAGES.filter(s =>
    s.id !== 'idle' && s.id !== 'error'
  );

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-3">
        {displayStages.map((stage, index) => {
          const stageIndex = IDENTIFICATION_STAGES.findIndex(s => s.id === stage.id);
          const isComplete = currentIndex > stageIndex;
          const isCurrent = currentStage === stage.id;
          const isPending = currentIndex < stageIndex;

          return (
            <div key={stage.id} className="flex items-center flex-1">
              {/* Stage indicator */}
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  transition-all duration-300
                  ${isComplete
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                      ? 'bg-blue-500 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
                title={stage.label}
              >
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  stage.userAction ? (
                    <span className="text-xs">{stage.icon}</span>
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )
                ) : (
                  <span className="text-xs">{stage.icon}</span>
                )}
              </div>

              {/* Connector line */}
              {index < displayStages.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-1 rounded-full transition-all duration-500
                    ${isComplete ? 'bg-emerald-400' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Stage labels - hidden on mobile */}
      <div className="hidden md:flex items-center gap-1">
        {displayStages.map((stage, index) => {
          const stageIndex = IDENTIFICATION_STAGES.findIndex(s => s.id === stage.id);
          const isComplete = currentIndex > stageIndex;
          const isCurrent = currentStage === stage.id;

          return (
            <div key={`label-${stage.id}`} className="flex items-center flex-1">
              <span
                className={`
                  text-xs font-medium truncate
                  ${isComplete
                    ? 'text-emerald-600'
                    : isCurrent
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }
                `}
              >
                {stage.label}
              </span>
              {index < displayStages.length - 1 && <div className="flex-1" />}
            </div>
          );
        })}
      </div>

      {/* Current step message */}
      <div className="mt-3 flex items-center gap-2 text-sm">
        {currentStage !== 'idle' && currentStage !== 'complete' && currentStage !== 'error' && (
          <>
            {!IDENTIFICATION_STAGES.find(s => s.id === currentStage)?.userAction && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            )}
            <span className="text-gray-700">{stepMessage}</span>
            {IDENTIFICATION_STAGES.find(s => s.id === currentStage)?.estimatedTime && (
              <span className="text-gray-400 text-xs">
                (~{IDENTIFICATION_STAGES.find(s => s.id === currentStage)?.estimatedTime})
              </span>
            )}
          </>
        )}
        {currentStage === 'complete' && (
          <span className="text-emerald-600 font-medium flex items-center gap-1">
            <Check className="w-4 h-4" />
            {stepMessage}
          </span>
        )}
      </div>
    </div>
  );
}
