'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { LoadingBall } from '@/components/ui/LoadingBall';
import AISuggestions from './AISuggestions';
import ItemPreview from './ItemPreview';

type ProductSuggestion = {
  custom_name: string;
  custom_description: string;
  notes: string;
  category: string;
  confidence: number;
  brand?: string;
  funFactOptions?: string[]; // Multiple fun fact options to choose from
  productUrl?: string;
  imageUrl?: string;
  price?: string;
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
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [scrapedData, setScrapedData] = useState<any>(null);
  const [previewingSuggestion, setPreviewingSuggestion] = useState<ProductSuggestion | null>(null);

  // Helper to detect if input is a URL
  const isUrl = (text: string): boolean => {
    try {
      new URL(text);
      return true;
    } catch {
      return text.startsWith('http://') || text.startsWith('https://') || text.includes('amazon.com') || text.includes('.com');
    }
  };

  // Scrape URL for metadata
  const scrapeUrl = useCallback(async (url: string) => {
    setIsScrapingUrl(true);
    setScrapedData(null);
    setSuggestions([]);

    try {
      const response = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const data = await response.json();
        setScrapedData(data);

        // Create a suggestion from scraped data
        const suggestion: ProductSuggestion = {
          custom_name: data.title || 'Product',
          custom_description: data.description || '',
          notes: data.price ? `Price: $${data.price}` : '',
          category: data.domain,
          confidence: 0.95,
          productUrl: data.url,
          imageUrl: data.image,
          price: data.price,
        };

        setSuggestions([suggestion]);
      } else {
        console.error('Failed to scrape URL');
        // Fall back to AI enrichment
        fetchSuggestions(url, {});
      }
    } catch (error) {
      console.error('Error scraping URL:', error);
      // Fall back to AI enrichment
      fetchSuggestions(url, {});
    } finally {
      setIsScrapingUrl(false);
    }
  }, []);

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

  // Debounced effect for fetching suggestions or scraping URLs
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input && input.trim().length >= 2) {
        // Check if input is a URL
        if (isUrl(input.trim())) {
          scrapeUrl(input.trim());
        } else {
          fetchSuggestions(input, existingAnswers);
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [input, existingAnswers, fetchSuggestions, scrapeUrl]);

  const handleSelectSuggestion = (suggestion: ProductSuggestion) => {
    // Show preview modal instead of adding directly
    setPreviewingSuggestion(suggestion);
  };

  const handleConfirmPreview = async (editedSuggestion: ProductSuggestion) => {
    setIsAdding(true);
    try {
      await onAdd(editedSuggestion);

      // Reset form
      setInput('');
      setSuggestions([]);
      setQuestions([]);
      setExistingAnswers({});
      setScrapedData(null);
      setPreviewingSuggestion(null);
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleCancelPreview = () => {
    setPreviewingSuggestion(null);
  };

  const handleAnswerQuestion = (answers: Record<string, string>) => {
    setExistingAnswers(answers);
    fetchSuggestions(input, answers);
  };

  return (
    <>
      {/* Preview Modal */}
      {previewingSuggestion && (
        <ItemPreview
          suggestion={previewingSuggestion}
          onConfirm={handleConfirmPreview}
          onCancel={handleCancelPreview}
        />
      )}

      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Quick Input */}
      <div>
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type item name or paste product URL..."
            disabled={isAdding || isScrapingUrl}
            className="w-full px-4 py-3 text-base border-2 border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent disabled:bg-[var(--surface-hover)] pr-10"
            autoFocus
          />
          {isScrapingUrl && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <LoadingBall size="sm" variant="ai" />
            </div>
          )}
          {isUrl(input.trim()) && !isScrapingUrl && input.trim().length > 0 && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <LinkIcon className="w-5 h-5 text-green-500" />
            </div>
          )}
        </div>

        {/* Help text */}
        {!input && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <LinkIcon className="w-3 h-3" />
              Paste a product URL (Amazon, etc.) for instant details
            </p>
            <p className="text-xs text-gray-400">
              or type item name for AI suggestions
            </p>
          </div>
        )}

        {/* URL scraping status */}
        {isScrapingUrl && (
          <p className="mt-2 text-xs text-blue-600 flex items-center gap-2">
            <LoadingBall size="sm" variant="ai" />
            Fetching product details from URL...
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
    </>
  );
}
