'use client';

import { useState, FormEvent, useEffect, useCallback, useRef } from 'react';
import AISuggestions from './AISuggestions';
import ItemPreviewModal from './ItemPreviewModal';
import {
  startIdentificationSession,
  recordIdentificationOutcome,
  type IdentificationStage,
} from '@/lib/analytics/identificationTelemetry';

type ProductSuggestion = {
  custom_name: string;
  custom_description: string;
  notes: string;
  category: string;
  confidence: number;
  brand?: string;
};

type ClarificationQuestion = {
  id: string;
  question: string;
  options: string[];
};

type LearningInfo = {
  isLearning: boolean;
  productsBeingLearned: string[];
  message?: string;
};

type AddItemFormProps = {
  onSubmit: (data: {
    custom_name: string;
    custom_description?: string;
    notes?: string;
    quantity?: number;
    brand?: string;
    selectedPhotoUrl?: string;
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

  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ProductSuggestion | null>(null);

  // AI Enrichment state
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [clarificationNeeded, setClarificationNeeded] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [existingAnswers, setExistingAnswers] = useState<Record<string, string>>({});
  const [learningInfo, setLearningInfo] = useState<LearningInfo | null>(null);
  const [searchTier, setSearchTier] = useState<'library' | 'library+ai' | 'ai' | 'fallback' | 'error' | undefined>();

  // Telemetry session tracking
  const telemetrySessionRef = useRef<string | null>(null);
  const lastSearchTierRef = useRef<string | undefined>(undefined);

  // Convert searchTier to IdentificationStage for telemetry
  const getStageFromTier = (tier?: string): IdentificationStage => {
    switch (tier) {
      case 'library': return 'library_cache';
      case 'library+ai': return 'ai_enrichment';
      case 'ai': return 'ai_enrichment';
      case 'fallback': return 'fallback';
      default: return 'text_parsing';
    }
  };

  // Fetch AI suggestions with debounce
  const fetchSuggestions = useCallback(async (input: string, answers: Record<string, string> = {}, forceAI: boolean = false) => {
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
          forceAI,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setQuestions(data.questions || []);
        setClarificationNeeded(data.clarificationNeeded || false);
        setSearchTier(data.searchTier);
        lastSearchTierRef.current = data.searchTier;

        // Start telemetry session when we have results
        if (data.suggestions?.length > 0) {
          telemetrySessionRef.current = startIdentificationSession('text', input);
        }

        // Handle learning info
        if (data.learning?.isLearning) {
          setLearningInfo(data.learning);
          // Clear learning message after 4 seconds
          setTimeout(() => setLearningInfo(null), 4000);
        }
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

  const handleSelectSuggestion = (suggestion: ProductSuggestion) => {
    // Record telemetry for accepted suggestion
    if (telemetrySessionRef.current) {
      recordIdentificationOutcome(
        telemetrySessionRef.current,
        getStageFromTier(lastSearchTierRef.current),
        suggestion.confidence,
        suggestions.length,
        'accepted'
      );
      telemetrySessionRef.current = null;
    }

    // Open preview modal instead of auto-submitting
    // This allows user to review details and select a photo
    setSelectedSuggestion(suggestion);
    setPreviewModalOpen(true);

    // Clear suggestions UI (modal takes over)
    setSuggestions([]);
    setQuestions([]);
    setClarificationNeeded(false);
  };

  const handleConfirmItem = async (finalItem: {
    custom_name: string;
    brand?: string;
    custom_description?: string;
    notes?: string;
    selectedPhotoUrl?: string;
  }) => {
    try {
      await onSubmit({
        custom_name: finalItem.custom_name,
        brand: finalItem.brand,
        custom_description: finalItem.custom_description,
        notes: finalItem.notes,
        quantity: parseInt(quantity) || 1,
        selectedPhotoUrl: finalItem.selectedPhotoUrl,
      });

      // Close modal and reset state
      setPreviewModalOpen(false);
      setSelectedSuggestion(null);
      setName('');
      setDescription('');
      setNotes('');
      setQuantity('1');
      setExistingAnswers({});
    } catch (error) {
      console.error('Error adding item:', error);
      throw error; // Re-throw so modal knows it failed
    }
  };

  const handleCancelPreview = () => {
    setPreviewModalOpen(false);
    // Keep the suggestion data in the form for manual editing if they want
    if (selectedSuggestion) {
      setName(selectedSuggestion.custom_name);
      setDescription(selectedSuggestion.custom_description || '');
      setNotes(selectedSuggestion.notes || '');
    }
    setSelectedSuggestion(null);
  };

  const handleAnswerQuestion = (answers: Record<string, string>) => {
    setExistingAnswers(answers);
    fetchSuggestions(name, answers);
  };

  // Force AI search when user clicks "None of these"
  const handleForceAI = () => {
    if (name.trim().length >= 2) {
      fetchSuggestions(name, existingAnswers, true);
    }
  };

  // Allow user to manually add the item (dismiss suggestions)
  const handleAddManually = () => {
    setSuggestions([]);
    setQuestions([]);
    setClarificationNeeded(false);
    // Focus stays on form for manual entry
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
                searchTier={searchTier}
                onForceAI={handleForceAI}
                onAddManually={handleAddManually}
              />
            </div>
          )}

          {/* Learning Notification */}
          {learningInfo && (
            <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg animate-pulse">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{learningInfo.message}</span>
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
          className="px-4 py-2 bg-[var(--button-create-bg)] hover:bg-[var(--button-create-bg-hover)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding...' : 'Add Item'}
        </button>
      </div>

      {/* Item Preview Modal - for photo selection */}
      <ItemPreviewModal
        isOpen={previewModalOpen}
        suggestion={selectedSuggestion}
        bagTitle={bagTitle}
        onConfirm={handleConfirmItem}
        onCancel={handleCancelPreview}
      />
    </form>
  );
}
