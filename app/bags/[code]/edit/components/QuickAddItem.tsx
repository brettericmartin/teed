'use client';

import { useState, useCallback } from 'react';
import { Search, Link as LinkIcon, Type } from 'lucide-react';
import AISuggestions from './AISuggestions';
import ParsedPreview from '@/components/add/ParsedPreview';
import { useProductSearch } from '@/hooks/useProductSearch';

type ProductSuggestion = {
  custom_name: string;
  custom_description: string;
  notes: string;
  category: string;
  confidence: number;
};

type QuickAddItemProps = {
  onAdd: (suggestion: ProductSuggestion) => Promise<void>;
  bagTitle?: string;
  onShowManualForm: () => void;
  onAddFromLink?: (url: string) => void;
};

export default function QuickAddItem({ onAdd, bagTitle, onShowManualForm, onAddFromLink }: QuickAddItemProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [mode, setMode] = useState<'text' | 'link'>('text');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  const {
    input,
    setInput,
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
  } = useProductSearch({ bagContext: bagTitle });

  const handleSelectSuggestion = useCallback(async (suggestion: ProductSuggestion) => {
    recordSelection(suggestion);

    setIsAdding(true);
    try {
      await onAdd(suggestion);
      reset();
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsAdding(false);
    }
  }, [onAdd, recordSelection, reset]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim().length >= 2 && !isLoading) {
      e.preventDefault();
      search();
    }
  }, [input, isLoading, search]);

  const handleLinkSubmit = useCallback(() => {
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      setLinkError('Please paste a URL');
      return;
    }
    let url = trimmed;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setLinkError('Please enter a valid URL');
        return;
      }
    } catch {
      setLinkError('Please enter a valid URL');
      return;
    }
    setLinkError(null);
    onAddFromLink?.(url);
    setLinkUrl('');
  }, [linkUrl, onAddFromLink]);

  const handleSwitchMode = useCallback((newMode: 'text' | 'link') => {
    setMode(newMode);
    if (newMode === 'link') {
      setInput('');
      reset();
    } else {
      setLinkUrl('');
      setLinkError(null);
    }
  }, [setInput, reset]);

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header with mode toggle */}
      {onAddFromLink && (
        <div className="flex justify-center mb-3">
          <div className="flex rounded-lg border border-[var(--teed-green-5)] bg-[var(--teed-green-2)] p-1 gap-1">
            <button
              type="button"
              onClick={() => handleSwitchMode('text')}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold rounded-md transition-all ${
                mode === 'text'
                  ? 'bg-[var(--teed-green-9)] text-white shadow-sm'
                  : 'text-[var(--teed-green-11)] hover:bg-[var(--teed-green-3)]'
              }`}
            >
              <Type className="w-4 h-4" />
              Text
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('link')}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold rounded-md transition-all ${
                mode === 'link'
                  ? 'bg-[var(--teed-green-9)] text-white shadow-sm'
                  : 'text-[var(--teed-green-11)] hover:bg-[var(--teed-green-3)]'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              Link
            </button>
          </div>
        </div>
      )}

      {/* Link Input Mode */}
      {mode === 'link' && onAddFromLink && (
        <div>
          <div className="flex gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value);
                setLinkError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLinkSubmit();
                }
              }}
              placeholder="Paste a product URL (e.g., https://amazon.com/dp/...)"
              className={`flex-1 px-4 py-3 text-base border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                linkError ? 'border-red-400' : 'border-gray-300'
              }`}
              autoFocus
            />
            <button
              onClick={handleLinkSubmit}
              disabled={!linkUrl.trim()}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Go
            </button>
          </div>

          {linkError && (
            <p className="mt-1.5 text-xs text-red-600">{linkError}</p>
          )}

          {!linkUrl && !linkError && (
            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
              <LinkIcon className="w-3 h-3" />
              <span>Paste a link from Amazon, REI, or any retailer</span>
            </p>
          )}

          {linkUrl.trim().length === 0 && (
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
      )}

      {/* Text Input Mode */}
      {mode === 'text' && (
      <div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to add? (e.g., driver, lipstick, tent...)"
            disabled={isAdding}
            className="flex-1 px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            autoFocus
          />
          <button
            onClick={() => search()}
            disabled={input.trim().length < 2 || isLoading || isAdding}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>

        {/* Parsed Preview Chips */}
        {parsedPreview && input.trim().length >= 2 && (
          <ParsedPreview
            parsed={parsedPreview}
            onUpdateField={updateParsedField}
          />
        )}

        {/* Help text */}
        {!input && (
          <p className="mt-2 text-xs text-gray-500">
            Type a product name and press Enter or click Search
          </p>
        )}

        {/* AI Suggestions */}
        {(hasSearched || isLoading) && (
          <div className="mt-4">
            <AISuggestions
              suggestions={suggestions}
              clarificationNeeded={clarificationNeeded}
              questions={questions}
              onSelectSuggestion={handleSelectSuggestion}
              onAnswerQuestion={handleAnswerQuestion}
              isLoading={isLoading}
              searchTier={searchTier}
              onForceAI={() => search(true)}
              onAddManually={onShowManualForm}
            />
          </div>
        )}

        {/* Manual Entry Link */}
        {hasSearched && !isLoading && suggestions.length === 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={onShowManualForm}
              className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              Can&apos;t find what you&apos;re looking for? Add manually
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
      )}
    </div>
  );
}
