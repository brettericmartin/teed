'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link as LinkIcon, Loader2, Camera, X, Image as ImageIcon } from 'lucide-react';
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
  const [searchTier, setSearchTier] = useState<'library' | 'library+ai' | 'ai' | 'vision' | 'fallback' | 'error' | undefined>();
  const [isAdding, setIsAdding] = useState(false);
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [scrapedData, setScrapedData] = useState<any>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null); // Track URL from input to attach to suggestions
  const [previewingSuggestion, setPreviewingSuggestion] = useState<ProductSuggestion | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to detect if input is a URL
  const isUrl = (text: string): boolean => {
    const trimmed = text.trim();
    // Check if it's a valid URL with protocol
    try {
      new URL(trimmed);
      return true;
    } catch {
      // Check for URL-like patterns without protocol
      // Match: domain.tld or domain.tld/path or www.domain.tld
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
    setPendingUrl(url); // Track the URL to attach to any suggestions

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
          category: '', // Will be inferred later or set by user
          confidence: 0.95,
          brand: data.brand || undefined,
          productUrl: url, // Use original URL
          imageUrl: data.image,
          price: data.price,
        };

        setSuggestions([suggestion]);
      } else {
        console.error('Failed to scrape URL');
        // Fall back to AI enrichment - pendingUrl will be attached to results
        fetchSuggestions(url, {});
      }
    } catch (error) {
      console.error('Error scraping URL:', error);
      // Fall back to AI enrichment - pendingUrl will be attached to results
      fetchSuggestions(url, {});
    } finally {
      setIsScrapingUrl(false);
    }
  }, []);

  // Handle image selection
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  // Analyze image with GPT-4 Vision
  const analyzeImage = useCallback(async () => {
    if (!selectedImage) return;

    setIsAnalyzingImage(true);
    setSuggestions([]);
    setSearchTier(undefined);

    try {
      const response = await fetch('/api/ai/identify-from-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          textHint: input.trim() || undefined,
          bagContext: bagTitle,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setSearchTier(data.searchTier);
      } else {
        const error = await response.json();
        console.error('Failed to analyze image:', error);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsAnalyzingImage(false);
    }
  }, [selectedImage, input, bagTitle]);

  // Auto-analyze when image is selected or text hint changes
  useEffect(() => {
    if (selectedImage) {
      // Debounce to allow user to finish typing hint
      const timer = setTimeout(() => {
        analyzeImage();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [selectedImage, input]); // Re-analyze when input changes (text hint)

  // Re-analyze when user provides text hint after image
  const handleAnalyzeWithHint = () => {
    if (selectedImage) {
      analyzeImage();
    }
  };

  // Clear selected image
  const clearImage = () => {
    setSelectedImage(null);
    setSuggestions([]);
    setSearchTier(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch AI suggestions with debounce
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
        // Attach pending URL to all suggestions if one exists
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

  // Debounced effect for fetching suggestions or scraping URLs
  // Skip text search when image is selected - use vision API instead
  useEffect(() => {
    // If image is selected, don't do text search - vision handles it
    if (selectedImage) return;

    const timer = setTimeout(() => {
      if (input && input.trim().length >= 2) {
        // Check if input is a URL
        if (isUrl(input.trim())) {
          scrapeUrl(normalizeUrl(input.trim()));
        } else {
          // Clear pending URL when input is not a URL
          setPendingUrl(null);
          fetchSuggestions(input, existingAnswers);
        }
      } else {
        // Clear pending URL when input is cleared
        setPendingUrl(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [input, existingAnswers, fetchSuggestions, scrapeUrl, selectedImage]);

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
      setPendingUrl(null);
      setPreviewingSuggestion(null);
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  // Force AI search when user clicks "None of these"
  const handleForceAI = () => {
    if (input.trim().length >= 2) {
      fetchSuggestions(input, existingAnswers, true);
    }
  };

  // Allow user to manually add the item (dismiss suggestions)
  const handleAddManually = () => {
    setSuggestions([]);
    setQuestions([]);
    setClarificationNeeded(false);
    onShowManualForm();
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
              placeholder={selectedImage ? "Describe items to find (optional)..." : "Type item name or paste product URL..."}
              disabled={isAdding || isScrapingUrl || isAnalyzingImage}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 pr-10"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && selectedImage && input.trim()) {
                  handleAnalyzeWithHint();
                }
              }}
            />
            {isScrapingUrl && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            )}
            {isUrl(input.trim()) && !isScrapingUrl && input.trim().length > 0 && !selectedImage && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <LinkIcon className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>

          {/* Camera button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAdding || isAnalyzingImage}
            className={`px-4 py-3 rounded-lg border-2 transition-colors ${
              selectedImage
                ? 'border-green-500 bg-green-50 text-green-600'
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600'
            } disabled:opacity-50`}
            title="Upload photo to identify products"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* Image preview */}
        {selectedImage && (
          <div className="mt-3 relative">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="relative w-20 h-20 flex-shrink-0">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full h-full object-cover rounded-md"
                />
                <button
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" />
                  Photo uploaded
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {input.trim()
                    ? `Looking for: "${input.trim()}"`
                    : 'Type what items to find, or let AI identify all products'}
                </p>
                {input.trim() && (
                  <button
                    onClick={handleAnalyzeWithHint}
                    disabled={isAnalyzingImage}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Re-analyze with hint
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Help text */}
        {!input && !selectedImage && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Camera className="w-3 h-3" />
              Upload a photo + describe items for AI identification
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

        {/* Image analysis status */}
        {isAnalyzingImage && (
          <p className="mt-2 text-xs text-purple-600 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Analyzing image with AI vision...
          </p>
        )}

        {/* AI Suggestions - show for text input OR image analysis */}
        {(input.trim().length >= 2 || selectedImage) && (
          <div className="mt-4">
            <AISuggestions
              suggestions={suggestions}
              clarificationNeeded={clarificationNeeded}
              questions={questions}
              onSelectSuggestion={handleSelectSuggestion}
              onAnswerQuestion={handleAnswerQuestion}
              isLoading={isLoadingSuggestions || isAnalyzingImage}
              searchTier={searchTier}
              onForceAI={selectedImage ? handleAnalyzeWithHint : handleForceAI}
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
