'use client';

import { useState, useEffect, useCallback } from 'react';
import AISuggestions from './AISuggestions';

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

type QuickAddItemProps = {
  onAdd: (suggestion: ProductSuggestion) => Promise<void>;
  bagTitle?: string;
  onShowManualForm: () => void;
};

export default function QuickAddItem({ onAdd, bagTitle, onShowManualForm }: QuickAddItemProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [clarificationNeeded, setClarificationNeeded] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [existingAnswers, setExistingAnswers] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Fetch AI suggestions with debounce
  const fetchSuggestions = useCallback(async (userInput: string, answers: Record<string, string> = {}) => {
    if (userInput.trim().length < 2) {
      setSuggestions([]);
      setQuestions([]);
      setClarificationNeeded(false);
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      const response = await fetch('/api/ai/enrich-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          bagContext: bagTitle,
          existingAnswers: answers,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setQuestions(data.questions || []);
        setClarificationNeeded(data.clarificationNeeded || false);
      } else {
        console.error('Failed to fetch suggestions');
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [bagTitle]);

  // Debounced effect for fetching suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input && input.trim().length >= 2) {
        fetchSuggestions(input, existingAnswers);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [input, existingAnswers, fetchSuggestions]);

  const handleSelectSuggestion = async (suggestion: ProductSuggestion) => {
    setIsAdding(true);
    try {
      await onAdd(suggestion);

      // Reset form
      setInput('');
      setSuggestions([]);
      setQuestions([]);
      setExistingAnswers({});
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleAnswerQuestion = (answers: Record<string, string>) => {
    setExistingAnswers(answers);
    fetchSuggestions(input, answers);
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Quick Input */}
      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What do you want to add? (e.g., driver, lipstick, tent...)"
          disabled={isAdding}
          className="w-full px-4 py-3 text-base border-2 border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent disabled:bg-[var(--surface-hover)]"
          autoFocus
        />

        {/* Help text */}
        {!input && (
          <p className="mt-2 text-xs text-gray-500">
            Start typing and AI will suggest items with details
          </p>
        )}

        {/* AI Suggestions */}
        {input.trim().length >= 2 && (
          <div className="mt-4">
            <AISuggestions
              suggestions={suggestions}
              clarificationNeeded={clarificationNeeded}
              questions={questions}
              onSelectSuggestion={handleSelectSuggestion}
              onAnswerQuestion={handleAnswerQuestion}
              isLoading={isLoadingSuggestions}
            />
          </div>
        )}

        {/* Manual Entry Link */}
        {!isLoadingSuggestions && suggestions.length === 0 && input.trim().length >= 2 && (
          <div className="mt-4 text-center">
            <button
              onClick={onShowManualForm}
              className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              Can't find what you're looking for? Add manually →
            </button>
          </div>
        )}

        {/* Always available manual link */}
        {input.trim().length === 0 && (
          <div className="mt-3 text-center">
            <button
              onClick={onShowManualForm}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              or add item manually
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
