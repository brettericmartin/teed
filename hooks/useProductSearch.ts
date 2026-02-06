'use client';

import { useState, useCallback, useRef } from 'react';
import { parseText, type ParsedTextResult } from '@/lib/textParsing';
import type { Category } from '@/lib/productLibrary/schema';
import {
  startIdentificationSession,
  recordIdentificationOutcome,
} from '@/lib/analytics/identificationTelemetry';

type ProductSuggestion = {
  custom_name: string;
  custom_description: string;
  notes: string;
  category: string;
  confidence: number;
  brand?: string;
  source?: 'library' | 'ai' | 'web';
};

type ClarificationQuestion = {
  id: string;
  question: string;
  options: string[];
};

type UseProductSearchOptions = {
  bagContext?: string;
  categoryHint?: Category;
};

export function useProductSearch({ bagContext, categoryHint }: UseProductSearchOptions = {}) {
  const [input, setInput] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ParsedTextResult | null>(null);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [clarificationNeeded, setClarificationNeeded] = useState(false);
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [searchTier, setSearchTier] = useState<'library' | 'library+ai' | 'ai' | 'fallback' | 'error' | undefined>();
  const [existingAnswers, setExistingAnswers] = useState<Record<string, string>>({});
  const [hasSearched, setHasSearched] = useState(false);

  // Telemetry session tracking
  const telemetrySessionRef = useRef<string | null>(null);
  // Abort controller for in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update input and run client-side parsing (no API call)
  const updateInput = useCallback((value: string) => {
    setInput(value);
    setHasSearched(false);

    if (value.trim().length >= 2) {
      const parsed = parseText(value, { categoryHint });
      setParsedPreview(parsed);
    } else {
      setParsedPreview(null);
      setSuggestions([]);
      setQuestions([]);
      setClarificationNeeded(false);
    }
  }, [categoryHint]);

  // Update a parsed field (from chip editing)
  const updateParsedField = useCallback((field: 'brand' | 'color' | 'productName', value: string) => {
    setParsedPreview(prev => {
      if (!prev) return prev;
      if (field === 'brand') {
        return { ...prev, brand: value ? { value, confidence: 1, source: 'user' } : null };
      }
      if (field === 'color') {
        return { ...prev, color: value || null };
      }
      if (field === 'productName') {
        return { ...prev, productName: value ? { value, confidence: 1 } : null };
      }
      return prev;
    });
  }, []);

  // Explicit search trigger
  const search = useCallback(async (forceAI = false) => {
    const searchInput = input.trim();
    if (searchInput.length < 2) return;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setHasSearched(true);

    try {
      // Build the request body, optionally including edited parsed values
      const body: Record<string, unknown> = {
        userInput: searchInput,
        bagContext,
        existingAnswers,
        forceAI,
        categoryHint,
      };

      const response = await fetch('/api/ai/enrich-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortController.signal,
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setQuestions(data.questions || []);
        setClarificationNeeded(data.clarificationNeeded || false);
        setSearchTier(data.searchTier as typeof searchTier);

        // Start telemetry session when we have results
        if (data.suggestions?.length > 0) {
          telemetrySessionRef.current = startIdentificationSession('text', searchInput);
        }
      } else {
        console.error('Failed to fetch suggestions');
        setSuggestions([]);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      if (abortControllerRef.current === abortController) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [input, bagContext, existingAnswers, categoryHint]);

  // Handle clarification question answers
  const handleAnswerQuestion = useCallback((answers: Record<string, string>) => {
    setExistingAnswers(answers);
    // Re-search with the new answers
    search();
  }, [search]);

  // Record telemetry when a suggestion is selected
  const recordSelection = useCallback((suggestion: { confidence: number }) => {
    if (telemetrySessionRef.current) {
      recordIdentificationOutcome(
        telemetrySessionRef.current,
        'text_parsing',
        suggestion.confidence,
        suggestions.length,
        'accepted'
      );
      telemetrySessionRef.current = null;
    }
  }, [suggestions.length]);

  // Reset all state
  const reset = useCallback(() => {
    setInput('');
    setParsedPreview(null);
    setSuggestions([]);
    setQuestions([]);
    setClarificationNeeded(false);
    setExistingAnswers({});
    setSearchTier(undefined);
    setHasSearched(false);
  }, []);

  return {
    input,
    setInput: updateInput,
    parsedPreview,
    updateParsedField,
    suggestions,
    isLoading,
    clarificationNeeded,
    questions,
    searchTier,
    hasSearched,
    search,
    handleAnswerQuestion,
    recordSelection,
    reset,
  };
}
