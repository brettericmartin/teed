'use client';

import { useState } from 'react';

type ProductSuggestion = {
  custom_name: string;
  custom_description: string;
  notes: string;
  category: string;
  confidence: number;
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
};

export default function AISuggestions({
  suggestions,
  clarificationNeeded,
  questions,
  onSelectSuggestion,
  onAnswerQuestion,
  isLoading = false,
}: AISuggestionsProps) {
  const [showClarification, setShowClarification] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

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
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-600 mb-2">AI is thinking...</div>
        {[1, 2, 3].map((i) => (
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

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        AI Suggestions (click to add):
      </div>

      {/* Suggestions */}
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelectSuggestion(suggestion)}
            className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                  {suggestion.custom_name}
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
        ))}
      </div>

      {/* Clarification Toggle */}
      {clarificationNeeded && questions.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowClarification(!showClarification)}
            className="w-full text-center py-2 px-4 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {showClarification ? '▲ Hide questions' : "▼ None of these? Tell us more"}
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
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
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
                  className="w-full mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
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
