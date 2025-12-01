'use client';

import { useState, useEffect } from 'react';

type ProductSuggestion = {
  custom_name: string;
  custom_description: string;
  notes: string;
  category: string;
  confidence: number;
  source?: 'library' | 'ai' | 'web';
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
  searchTier?: 'library' | 'library+ai' | 'ai' | 'fallback' | 'error';
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
  const [showClarification, setShowClarification] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
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

  const handleAnswerChange = (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
  };

  const handleSubmitAnswers = () => {
    onAnswerQuestion(answers);
    setAnswers({});
    setShowClarification(false);
  };

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

  // Get tier label
  const getTierLabel = () => {
    switch (searchTier) {
      case 'library':
        return { text: 'Found in library', icon: '📚', color: 'text-emerald-600 bg-emerald-50' };
      case 'library+ai':
        return { text: 'Library + AI', icon: '📚🤖', color: 'text-blue-600 bg-blue-50' };
      case 'ai':
        return { text: 'AI identified', icon: '🤖', color: 'text-purple-600 bg-purple-50' };
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

  const tierInfo = getTierLabel();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Suggestions (click to add):
        </div>
        {tierInfo && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${tierInfo.color}`}>
            {tierInfo.icon} {tierInfo.text}
          </span>
        )}
      </div>

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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 group-hover:text-[var(--sky-11)]">
                      {suggestion.custom_name}
                    </span>
                    {sourceBadge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sourceBadge.color}`}>
                        {sourceBadge.text}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {suggestion.custom_description}
                  </div>
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
            <span>{searchTier === 'library' ? 'None of these? Try AI' : 'Search again with AI'}</span>
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

      {/* Clarification Toggle */}
      {clarificationNeeded && questions.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowClarification(!showClarification)}
            className="w-full text-center py-2 px-4 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {showClarification ? '▲ Hide questions' : "▼ Tell us more to refine suggestions"}
          </button>

          {/* Clarification Questions */}
          {showClarification && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
              {questions.map((question) => (
                <div key={question.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {question.question}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {question.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleAnswerChange(question.id, option)}
                        className={`p-3 border-2 rounded-lg text-sm transition-all ${
                          answers[question.id] === option
                            ? 'border-[var(--sky-6)] bg-[var(--sky-2)] text-[var(--sky-11)] font-medium'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(answers).length === questions.length && (
                <button
                  onClick={handleSubmitAnswers}
                  className="w-full mt-4 py-2 px-4 bg-[var(--sky-5)] text-[var(--sky-11)] rounded-lg hover:bg-[var(--sky-6)] font-medium transition-colors"
                >
                  Get Refined Suggestions
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
