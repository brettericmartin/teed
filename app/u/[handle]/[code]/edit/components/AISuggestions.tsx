'use client';

import { useState, useEffect } from 'react';
import InlineClarificationCard from '@/components/clarification/InlineClarificationCard';
import { getConfidenceLevel } from '@/lib/analytics/identificationTelemetry';

type ProductSuggestion = {
  custom_name: string;
  custom_description: string;
  notes: string;
  category: string;
  confidence: number;
  brand?: string;
  source?: 'library' | 'ai' | 'web';
  imageUrl?: string;
  productUrl?: string;
  price?: string;
};

type ClarificationQuestion = {
  id: string;
  question: string;
  options: string[];
};

type AISuggestionsProps = {
  suggestions: ProductSuggestion[];
  clarificationNeeded: boolean;
  questions: ClarificationQuestion[];
  onSelectSuggestion: (suggestion: ProductSuggestion) => void;
  onAnswerQuestion: (answers: Record<string, string>) => void;
  isLoading?: boolean;
  searchTier?: 'library' | 'library+ai' | 'ai' | 'vision' | 'fallback' | 'error';
  onForceAI?: () => void; // Trigger AI search when "None of these" is clicked
  onAddManually?: () => void; // Allow user to add item manually
};

// Staged loading messages
const LOADING_STAGES = [
  { message: 'Searching library...', icon: '📚', duration: 400 },
  { message: 'Using AI to identify...', icon: '🤖', duration: 2000 },
];

export default function AISuggestions({
  suggestions,
  clarificationNeeded,
  questions,
  onSelectSuggestion,
  onAnswerQuestion,
  isLoading = false,
  searchTier,
  onForceAI,
  onAddManually,
}: AISuggestionsProps) {
  const [clarificationDismissed, setClarificationDismissed] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);

  // Progress through loading stages
  useEffect(() => {
    if (!isLoading) {
      setLoadingStage(0);
      return;
    }

    // Move to next stage after delay
    if (loadingStage < LOADING_STAGES.length - 1) {
      const timer = setTimeout(() => {
        setLoadingStage(prev => prev + 1);
      }, LOADING_STAGES[loadingStage].duration);
      return () => clearTimeout(timer);
    }
  }, [isLoading, loadingStage]);

  // Reset clarification dismissed state when questions change
  useEffect(() => {
    setClarificationDismissed(false);
  }, [questions]);

  const handleClarificationAnswer = (answers: Record<string, string>) => {
    setClarificationDismissed(true);
    onAnswerQuestion(answers);
  };

  const handleClarificationSkip = () => {
    setClarificationDismissed(true);
  };

  // Show inline clarification if needed and not dismissed
  const showInlineClarification = clarificationNeeded && questions.length > 0 && !clarificationDismissed;

  if (isLoading) {
    const currentStage = LOADING_STAGES[loadingStage];
    return (
      <div className="space-y-3">
        {/* Progress indicator */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            {LOADING_STAGES.map((stage, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 text-xs font-medium transition-all duration-300 ${
                  idx < loadingStage
                    ? 'text-emerald-600'
                    : idx === loadingStage
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  idx < loadingStage
                    ? 'bg-emerald-100'
                    : idx === loadingStage
                    ? 'bg-blue-100 animate-pulse'
                    : 'bg-gray-100'
                }`}>
                  {idx < loadingStage ? '✓' : stage.icon}
                </span>
                <span className="hidden sm:inline">{stage.message.replace('...', '')}</span>
                {idx < LOADING_STAGES.length - 1 && (
                  <span className={`w-8 h-0.5 mx-1 ${
                    idx < loadingStage ? 'bg-emerald-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current stage message (mobile) */}
        <div className="sm:hidden text-sm text-gray-600 flex items-center gap-2">
          <span className="animate-pulse">{currentStage.icon}</span>
          {currentStage.message}
        </div>

        {/* Loading skeletons */}
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-4 border border-gray-200 rounded-lg bg-gray-50 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  // Get confidence-based label using highest suggestion confidence
  const getConfidenceLabel = () => {
    const topConfidence = suggestions[0]?.confidence || 0;
    const level = getConfidenceLevel(topConfidence);

    // Add source icon based on search tier
    let icon = '';
    switch (searchTier) {
      case 'library':
        icon = '📚';
        break;
      case 'library+ai':
        icon = '📚🤖';
        break;
      case 'ai':
        icon = '🤖';
        break;
      case 'vision':
        icon = '👁️';
        break;
      default:
        icon = level.level === 'high' ? '✓' : level.level === 'medium' ? '○' : '?';
    }

    return {
      text: level.label,
      description: level.description,
      icon,
      color: level.color,
      level: level.level,
    };
  };

  // Legacy tier label for backwards compatibility
  const getTierLabel = () => {
    switch (searchTier) {
      case 'library':
        return { text: 'Found in library', icon: '📚', color: 'text-emerald-600 bg-emerald-50' };
      case 'library+ai':
        return { text: 'Library + AI', icon: '📚🤖', color: 'text-blue-600 bg-blue-50' };
      case 'ai':
        return { text: 'AI identified', icon: '🤖', color: 'text-purple-600 bg-purple-50' };
      case 'vision':
        return { text: 'Vision AI', icon: '👁️', color: 'text-indigo-600 bg-indigo-50' };
      case 'fallback':
        return { text: 'Best guess', icon: '❓', color: 'text-amber-600 bg-amber-50' };
      default:
        return null;
    }
  };

  const getSourceBadge = (source?: 'library' | 'ai' | 'web') => {
    switch (source) {
      case 'library':
        return { text: 'Library', color: 'bg-emerald-100 text-emerald-700' };
      case 'ai':
        return { text: 'AI', color: 'bg-purple-100 text-purple-700' };
      case 'web':
        return { text: 'Web', color: 'bg-amber-100 text-amber-700' };
      default:
        return null;
    }
  };

  const confidenceInfo = getConfidenceLabel();

  return (
    <div className="space-y-3">
      {/* Inline Clarification Card - Shows ABOVE suggestions when needed */}
      {showInlineClarification && (
        <InlineClarificationCard
          questions={questions}
          onAnswer={handleClarificationAnswer}
          onSkip={handleClarificationSkip}
          isLoading={isLoading}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {confidenceInfo.level === 'minimal'
            ? 'Possible matches:'
            : 'Suggestions (click to add):'}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${confidenceInfo.color}`}
            title={confidenceInfo.description}
          >
            {confidenceInfo.icon} {confidenceInfo.text}
          </span>
        </div>
      </div>

      {/* Show helpful context for lower confidence results */}
      {confidenceInfo.level === 'low' && (
        <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          These are possible matches. Please verify the details are correct.
        </div>
      )}
      {confidenceInfo.level === 'minimal' && (
        <div className="text-xs text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
          We couldn&apos;t find a strong match. You may want to add this manually for accuracy.
        </div>
      )}

      {/* Suggestions */}
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => {
          const sourceBadge = getSourceBadge(suggestion.source);
          return (
            <button
              key={index}
              onClick={() => onSelectSuggestion(suggestion)}
              className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-[var(--sky-6)] hover:bg-[var(--sky-2)] transition-all group"
            >
              <div className="flex items-start gap-3">
                {/* Product thumbnail */}
                {suggestion.imageUrl && (
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(suggestion.imageUrl)}`}
                      alt={suggestion.custom_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide image on error
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {suggestion.brand && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-gray-800 text-white">
                            {suggestion.brand}
                          </span>
                        )}
                        <span className="font-semibold text-gray-900 group-hover:text-[var(--sky-11)]">
                          {suggestion.custom_name}
                        </span>
                        {sourceBadge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sourceBadge.color}`}>
                            {sourceBadge.text}
                          </span>
                        )}
                      </div>
                      {suggestion.custom_description && (
                        <div className="text-sm text-gray-600 mt-1">
                          {suggestion.custom_description}
                        </div>
                      )}
                      {suggestion.notes && (
                        <div className="text-xs text-gray-500 mt-2 italic">
                          {suggestion.notes}
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {suggestion.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* "None of these" and "Add manually" buttons - ALWAYS visible */}
      <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-gray-200">
        {/* Show "Try AI" when library-only, or "Search again" when AI was already used */}
        {onForceAI && (
          <button
            onClick={onForceAI}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <span>🤖</span>
            <span>{searchTier === 'library' ? 'None of these? Try AI' : 'Find more'}</span>
          </button>
        )}

        {/* Always show manual add option */}
        {onAddManually && (
          <button
            onClick={onAddManually}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <span>✏️</span>
            <span>Add manually</span>
          </button>
        )}
      </div>
    </div>
  );
}
