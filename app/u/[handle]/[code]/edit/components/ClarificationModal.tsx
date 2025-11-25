'use client';

import { useState } from 'react';
import { X, HelpCircle, ChevronRight, Loader2, Sparkles } from 'lucide-react';

type ClarificationQuestion = {
  id: string;
  question: string;
  options: string[];
  itemId: string;
};

type ClarificationModalProps = {
  questions: ClarificationQuestion[];
  itemNames: Record<string, string>; // Map itemId to item name
  onSubmit: (answers: Record<string, Record<string, string>>) => Promise<void>;
  onSkip: () => void;
  isLoading?: boolean;
};

export default function ClarificationModal({
  questions,
  itemNames,
  onSubmit,
  onSkip,
  isLoading = false,
}: ClarificationModalProps) {
  // Group questions by itemId
  const questionsByItem = questions.reduce((acc, q) => {
    if (!acc[q.itemId]) acc[q.itemId] = [];
    acc[q.itemId].push(q);
    return acc;
  }, {} as Record<string, ClarificationQuestion[]>);

  const itemIds = Object.keys(questionsByItem);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentItemId = itemIds[currentItemIndex];
  const currentItemQuestions = questionsByItem[currentItemId] || [];
  const currentItemName = itemNames[currentItemId] || 'Item';

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentItemId]: {
        ...(prev[currentItemId] || {}),
        [questionId]: option,
      },
    }));
  };

  const handleNext = () => {
    if (currentItemIndex < itemIds.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(answers);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastItem = currentItemIndex === itemIds.length - 1;
  const hasAnsweredCurrent = currentItemQuestions.every(
    q => answers[currentItemId]?.[q.id]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[var(--sky-9)] to-[var(--sky-10)] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Quick Questions</h2>
                <p className="text-sm text-white/80">Help us get better results</p>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={isLoading || isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${((currentItemIndex + 1) / itemIds.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-white/80">
              {currentItemIndex + 1}/{itemIds.length}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Item name */}
          <div className="mb-4">
            <span className="text-sm text-[var(--text-secondary)]">For:</span>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {currentItemName}
            </h3>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {currentItemQuestions.map((question) => (
              <div key={question.id}>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-3">
                  {question.question}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {question.options.map((option) => {
                    const isSelected = answers[currentItemId]?.[question.id] === option;
                    return (
                      <button
                        key={option}
                        onClick={() => handleSelectOption(question.id, option)}
                        className={`px-4 py-3 text-sm font-medium rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-[var(--sky-9)] bg-[var(--sky-2)] text-[var(--sky-11)]'
                            : 'border-gray-200 hover:border-gray-300 text-[var(--text-primary)]'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-3">
            {currentItemIndex > 0 ? (
              <button
                onClick={handlePrev}
                className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Back
              </button>
            ) : (
              <button
                onClick={onSkip}
                disabled={isLoading || isSubmitting}
                className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Skip All
              </button>
            )}

            <div className="flex-1" />

            {isLastItem ? (
              <button
                onClick={handleSubmit}
                disabled={isLoading || isSubmitting}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[var(--sky-9)] hover:bg-[var(--sky-10)] rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Get Better Results
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[var(--sky-9)] hover:bg-[var(--sky-10)] rounded-xl transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
