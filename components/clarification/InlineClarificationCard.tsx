'use client';

import { useState } from 'react';
import { Sparkles, ChevronRight, ChevronDown } from 'lucide-react';

type ClarificationQuestion = {
  id: string;
  question: string;
  options: string[];
};

type InlineClarificationCardProps = {
  questions: ClarificationQuestion[];
  onAnswer: (answers: Record<string, string>) => void;
  onSkip: () => void;
  isLoading?: boolean;
};

/**
 * InlineClarificationCard - Optional refinement UI
 *
 * Doctrine-compliant design:
 * - Primary action is "See all results" (no obligation)
 * - Narrowing is optional enhancement, not required step
 * - No "Skip" language - just proceed without narrowing
 * - Collapsible to reduce visual weight
 */
export default function InlineClarificationCard({
  questions,
  onAnswer,
  onSkip,
  isLoading = false,
}: InlineClarificationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasAnswer = answers[currentQuestion.id] !== undefined;

  const handleSelectOption = (option: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: option };
    setAnswers(newAnswers);

    // If this is the last question, submit all answers
    if (isLastQuestion) {
      onAnswer(newAnswers);
    } else {
      // Move to next question after a brief delay to show selection
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 150);
    }
  };

  const handleProceedWithResults = () => {
    onSkip();
  };

  // Collapsed state - just a subtle hint
  if (!isExpanded) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg mb-3">
        <div className="flex items-center gap-2 text-gray-600">
          <Sparkles className="w-4 h-4 text-[var(--sky-9)]" />
          <span className="text-sm">We found general results</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-1 text-sm text-[var(--sky-11)] hover:text-[var(--sky-12)] font-medium transition-colors"
          >
            Narrow down
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Expanded state - show refinement options
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Sparkles className="w-4 h-4 text-[var(--sky-9)]" />
          <span className="text-sm font-medium">Want to narrow down?</span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Collapse
        </button>
      </div>

      {/* Progress indicator (if multiple questions) */}
      {questions.length > 1 && (
        <div className="flex items-center gap-1 mb-3">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-colors ${
                idx < currentIndex
                  ? 'bg-[var(--sky-9)]'
                  : idx === currentIndex
                  ? 'bg-[var(--sky-7)]'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}

      {/* Current Question */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          {currentQuestion.question}
        </p>

        {/* Options as chips/buttons */}
        <div className="flex flex-wrap gap-2">
          {currentQuestion.options.map((option) => {
            const isSelected = answers[currentQuestion.id] === option;
            return (
              <button
                key={option}
                onClick={() => handleSelectOption(option)}
                disabled={isLoading}
                className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all disabled:opacity-50 ${
                  isSelected
                    ? 'border-[var(--sky-9)] bg-[var(--sky-9)] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-[var(--sky-6)] hover:bg-white'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary action: See all results (no obligation) */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <button
          onClick={handleProceedWithResults}
          disabled={isLoading}
          className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          See all results
        </button>

        {hasAnswer && !isLastQuestion && (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="flex items-center gap-1 text-sm text-[var(--sky-11)] font-medium"
          >
            Next question
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
