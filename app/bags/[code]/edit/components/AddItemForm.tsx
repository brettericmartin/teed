'use client';

import { useState, FormEvent, useEffect, useCallback } from 'react';
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

type AddItemFormProps = {
  onSubmit: (data: {
    custom_name: string;
    custom_description?: string;
    notes?: string;
    quantity?: number;
  }) => Promise<void>;
  onCancel: () => void;
  bagTitle?: string; // Optional: for context
};

export default function AddItemForm({ onSubmit, onCancel, bagTitle }: AddItemFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Enrichment state
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [clarificationNeeded, setClarificationNeeded] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [existingAnswers, setExistingAnswers] = useState<Record<string, string>>({});

  // Fetch AI suggestions with debounce
  const fetchSuggestions = useCallback(async (input: string, answers: Record<string, string> = {}) => {
    if (input.trim().length < 2) {
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
          userInput: input,
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
      if (name && name.trim().length >= 2) {
        fetchSuggestions(name, existingAnswers);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [name, existingAnswers, fetchSuggestions]);

  const handleSelectSuggestion = async (suggestion: ProductSuggestion) => {
    // Auto-fill form with suggestion
    setName(suggestion.custom_name);
    setDescription(suggestion.custom_description);
    setNotes(suggestion.notes);

    // Clear suggestions
    setSuggestions([]);
    setQuestions([]);
    setClarificationNeeded(false);

    // Auto-submit if we have confidence
    if (suggestion.confidence >= 0.85) {
      setIsSubmitting(true);
      try {
        await onSubmit({
          custom_name: suggestion.custom_name,
          custom_description: suggestion.custom_description || undefined,
          notes: suggestion.notes || undefined,
          quantity: parseInt(quantity) || 1,
        });

        // Reset form
        setName('');
        setDescription('');
        setNotes('');
        setQuantity('1');
        setExistingAnswers({});
      } catch (error) {
        console.error('Error adding item:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleAnswerQuestion = (answers: Record<string, string>) => {
    setExistingAnswers(answers);
    fetchSuggestions(name, answers);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        custom_name: name.trim(),
        custom_description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        quantity: parseInt(quantity) || 1,
      });

      // Reset form
      setName('');
      setDescription('');
      setNotes('');
      setQuantity('1');
      setSuggestions([]);
      setQuestions([]);
      setExistingAnswers({});
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
    >
      <div className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="item-name" className="block text-sm font-medium text-gray-700 mb-1">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="item-name"
            name="custom_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., driver, lipstick, tent..."
            required
            autoFocus
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />

          {/* AI Suggestions */}
          {name.trim().length >= 2 && (
            <div className="mt-3">
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
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="item-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            id="item-description"
            name="custom_description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Down-filled, -20°F rated"
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {/* Notes Field */}
        <div>
          <label htmlFor="item-notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="item-notes"
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Personal notes about this item"
            rows={2}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100"
          />
        </div>

        {/* Quantity Field */}
        <div>
          <label htmlFor="item-quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            id="item-quantity"
            name="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            disabled={isSubmitting}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding...' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}
