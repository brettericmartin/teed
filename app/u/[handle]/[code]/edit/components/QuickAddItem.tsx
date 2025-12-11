'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link as LinkIcon, Loader2, Camera, Sparkles } from 'lucide-react';
import AISuggestions from './AISuggestions';
import ItemPreview from './ItemPreview';
import { SmartIdentificationWizard } from '@/components/apis';
import type { ValidatedProduct } from '@/lib/apis/types';

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
  uploadedImageBase64?: string; // User's uploaded photo (base64 data URL)
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


// Helper to convert ValidatedProduct to ProductSuggestion
function convertValidatedProductToSuggestion(
  product: ValidatedProduct,
  uploadedImageBase64?: string
): ProductSuggestion {
  return {
    custom_name: product.name,
    custom_description: product.specs || product.specifications?.join(' | ') || '',
    notes: '',
    category: product.category,
    confidence: product.finalConfidence / 100, // Convert 0-100 to 0-1
    brand: product.brand,
    funFactOptions: product.funFacts,
    productUrl: product.links?.[0]?.url,
    imageUrl: product.productImage?.imageUrl,
    price: product.estimatedPrice,
    uploadedImageBase64
  };
}

export default function QuickAddItem({ onAdd, bagTitle, onShowManualForm }: QuickAddItemProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [clarificationNeeded, setClarificationNeeded] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [existingAnswers, setExistingAnswers] = useState<Record<string, string>>({});
  const [searchTier, setSearchTier] = useState<'library' | 'library+ai' | 'ai' | 'vision' | 'fallback' | 'error' | undefined>();
  const [isAdding, setIsAdding] = useState(false);
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [scrapedData, setScrapedData] = useState<any>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [previewingSuggestion, setPreviewingSuggestion] = useState<ProductSuggestion | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // APIS Smart Identification Wizard state
  const [showSmartWizard, setShowSmartWizard] = useState(false);
  const [smartWizardImage, setSmartWizardImage] = useState<string | null>(null);

  // Helper to detect if input is a URL
  const isUrl = (text: string): boolean => {
    const trimmed = text.trim();
    try {
      new URL(trimmed);
      return true;
    } catch {
      const urlPattern = /^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/\S*)?$/;
      return urlPattern.test(trimmed) || trimmed.includes('.com/') || trimmed.includes('.co/') || trimmed.includes('.golf/');
    }
  };

  // Normalize URL by adding https:// if missing
  const normalizeUrl = (text: string): string => {
    const trimmed = text.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  // Scrape URL for metadata
  const scrapeUrl = useCallback(async (url: string) => {
    setIsScrapingUrl(true);
    setScrapedData(null);
    setSuggestions([]);
    setPendingUrl(url);

    try {
      const response = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const data = await response.json();
        setScrapedData(data);

        const suggestion: ProductSuggestion = {
          custom_name: data.title || 'Product',
          custom_description: data.description || '',
          notes: data.price ? `Price: $${data.price}` : '',
          category: '',
          confidence: 0.95,
          brand: data.brand || undefined,
          productUrl: url,
          imageUrl: data.image,
          price: data.price,
        };

        setSuggestions([suggestion]);
      } else {
        console.error('Failed to scrape URL');
        fetchSuggestions(url, {});
      }
    } catch (error) {
      console.error('Error scraping URL:', error);
      fetchSuggestions(url, {});
    } finally {
      setIsScrapingUrl(false);
    }
  }, []);

  // Handle image selection - immediately launch APIS wizard
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 and launch APIS
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSmartWizardImage(base64);
      setShowSmartWizard(true);
    };
    reader.readAsDataURL(file);

    // Reset file input for next selection
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle Smart Wizard completion
  const handleSmartWizardComplete = useCallback(async (product: ValidatedProduct) => {
    const suggestion = convertValidatedProductToSuggestion(product, smartWizardImage || undefined);
    setShowSmartWizard(false);
    setSmartWizardImage(null);

    // Add the item
    await onAdd(suggestion);

    // Reset form
    setInput('');
    setSuggestions([]);
  }, [onAdd, smartWizardImage]);

  // Cancel Smart Wizard
  const handleSmartWizardCancel = useCallback(() => {
    setShowSmartWizard(false);
    setSmartWizardImage(null);
  }, []);

  // Fetch AI suggestions for text input
  const fetchSuggestions = useCallback(async (userInput: string, answers: Record<string, string> = {}, forceAI: boolean = false) => {
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
          forceAI,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const suggestions = (data.suggestions || []).map((s: ProductSuggestion) => ({
          ...s,
          productUrl: s.productUrl || pendingUrl || undefined,
        }));
        setSuggestions(suggestions);
        setQuestions(data.questions || []);
        setClarificationNeeded(data.clarificationNeeded || false);
        setSearchTier(data.searchTier);
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
  }, [bagTitle, pendingUrl]);

  // Debounced effect for text/URL input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input && input.trim().length >= 2) {
        if (isUrl(input.trim())) {
          scrapeUrl(normalizeUrl(input.trim()));
        } else {
          setPendingUrl(null);
          fetchSuggestions(input, existingAnswers);
        }
      } else {
        setPendingUrl(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [input, existingAnswers, fetchSuggestions, scrapeUrl]);

  const handleSelectSuggestion = (suggestion: ProductSuggestion) => {
    console.log('[QuickAddItem] Selected suggestion:', {
      name: suggestion.custom_name,
      productUrl: suggestion.productUrl,
      imageUrl: suggestion.imageUrl,
    });
    setPreviewingSuggestion(suggestion);
  };

  const handleConfirmPreview = async (editedSuggestion: ProductSuggestion) => {
    setIsAdding(true);
    try {
      console.log('[QuickAddItem] Confirming preview:', {
        name: editedSuggestion.custom_name,
        productUrl: editedSuggestion.productUrl,
        imageUrl: editedSuggestion.imageUrl,
      });

      await onAdd(editedSuggestion);

      // Reset form
      setInput('');
      setSuggestions([]);
      setQuestions([]);
      setExistingAnswers({});
      setScrapedData(null);
      setPendingUrl(null);
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

  const handleForceAI = () => {
    if (input.trim().length >= 2) {
      fetchSuggestions(input, existingAnswers, true);
    }
  };

  const handleAddManually = () => {
    setSuggestions([]);
    setQuestions([]);
    setClarificationNeeded(false);
    onShowManualForm();
  };

  return (
    <>
      {/* APIS Smart Identification Wizard Modal */}
      {showSmartWizard && smartWizardImage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <SmartIdentificationWizard
            initialImageBase64={smartWizardImage}
            bagContext={bagTitle}
            onComplete={handleSmartWizardComplete}
            onCancel={handleSmartWizardCancel}
          />
        </div>
      )}

      {/* Preview Modal */}
      {previewingSuggestion && (
        <ItemPreview
          suggestion={previewingSuggestion}
          onConfirm={handleConfirmPreview}
          onCancel={handleCancelPreview}
        />
      )}

      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Quick Input */}
        <div>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type item name or paste product URL..."
                disabled={isAdding || isScrapingUrl}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 pr-10"
                autoFocus
              />
              {isScrapingUrl && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              )}
              {isUrl(input.trim()) && !isScrapingUrl && input.trim().length > 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <LinkIcon className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>

            {/* Camera button - launches APIS directly */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAdding}
              className="px-4 py-3 rounded-lg border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 transition-colors disabled:opacity-50 group"
              title="Upload photo for Smart Identification"
            >
              <div className="flex items-center gap-1.5">
                <Camera className="w-5 h-5" />
                <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          </div>

          {/* Help text */}
          {!input && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Camera className="w-3 h-3" />
                <Sparkles className="w-3 h-3" />
                Upload a photo for AI-powered Smart Identification
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                or paste a product URL / type item name
              </p>
            </div>
          )}

          {/* URL scraping status */}
          {isScrapingUrl && (
            <p className="mt-2 text-xs text-blue-600 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Fetching product details from URL...
            </p>
          )}

          {/* AI Suggestions - only for text input */}
          {input.trim().length >= 2 && (
            <div className="mt-4">
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
