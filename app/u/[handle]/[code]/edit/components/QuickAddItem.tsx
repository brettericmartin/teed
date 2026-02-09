'use client';

import { useState, useCallback, useRef } from 'react';
import { Camera, Sparkles, Info, Search, Link as LinkIcon, Type } from 'lucide-react';
import AISuggestions from './AISuggestions';
import ItemPreview from './ItemPreview';
import { TapToIdentifyWizard } from '@/components/apis';
import type { IdentifiedItem } from '@/components/apis/TapToIdentifyWizard';
import {
  startIdentificationSession,
  recordIdentificationOutcome,
  type IdentificationStage,
} from '@/lib/analytics/identificationTelemetry';
import { parseText, type ParsedTextResult } from '@/lib/textParsing';
import ParsedPreview from '@/components/add/ParsedPreview';

// Compress and convert image to JPEG (handles HEIC from mobile)
async function compressImageForAPI(base64: string, maxSizeKB: number = 5000): Promise<string> {
  // Convert data URL to blob
  const fetchBlob = async (): Promise<Blob> => {
    try {
      const response = await fetch(base64);
      if (response.ok) return await response.blob();
    } catch { /* fall through */ }

    // Manual conversion fallback
    const commaIndex = base64.indexOf(',');
    if (commaIndex === -1) throw new Error('Invalid data URL');

    const prefix = base64.substring(0, commaIndex);
    let data = base64.substring(commaIndex + 1);
    const mimeMatch = prefix.match(/^data:([^;]+)/);
    const mimeType = mimeMatch?.[1] || 'image/jpeg';

    // Clean and decode
    data = data.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
    const paddingNeeded = (4 - (data.length % 4)) % 4;
    if (paddingNeeded > 0) data += '='.repeat(paddingNeeded);

    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    return new Blob([bytes], { type: mimeType });
  };

  try {
    const blob = await fetchBlob();

    // Load image using createImageBitmap or Image fallback
    let imgWidth: number, imgHeight: number;
    let drawSource: ImageBitmap | HTMLImageElement;

    if (typeof createImageBitmap === 'function') {
      try {
        drawSource = await createImageBitmap(blob);
        imgWidth = drawSource.width;
        imgHeight = drawSource.height;
      } catch {
        drawSource = await loadImageFromBlob(blob);
        imgWidth = drawSource.width;
        imgHeight = drawSource.height;
      }
    } else {
      drawSource = await loadImageFromBlob(blob);
      imgWidth = drawSource.width;
      imgHeight = drawSource.height;
    }

    if (imgWidth === 0 || imgHeight === 0) {
      throw new Error('Image has invalid dimensions');
    }

    // Calculate target dimensions
    let width = imgWidth;
    let height = imgHeight;
    const MAX_DIMENSION = 2400;

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Create canvas and draw
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.drawImage(drawSource, 0, 0, width, height);

    // Clean up ImageBitmap
    if ('close' in drawSource && typeof drawSource.close === 'function') {
      drawSource.close();
    }

    // Compress with reducing quality - convert to JPEG (higher quality for slideshow)
    let quality = 0.92;
    let result = canvas.toDataURL('image/jpeg', quality);

    while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.7) {
      quality -= 0.05;
      result = canvas.toDataURL('image/jpeg', quality);
    }

    console.log('[QuickAdd Compress]', {
      original: `${imgWidth}x${imgHeight}`,
      final: `${width}x${height}`,
      sizeKB: Math.round((result.length * 3) / 4 / 1024),
    });

    return result;
  } catch (err) {
    console.error('[QuickAdd Compress] Error:', err);
    throw err;
  }
}

// Helper to load image from blob
function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

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
  onAddFromLink?: (url: string) => void;
};


// Helper to convert IdentifiedItem to ProductSuggestion
function convertIdentifiedItemToSuggestion(
  item: IdentifiedItem
): ProductSuggestion {
  return {
    custom_name: item.name,
    custom_description: item.visualDescription || '',
    notes: '',
    category: 'golf', // Default category
    confidence: item.confidence / 100, // Convert 0-100 to 0-1
    brand: item.brand,
    uploadedImageBase64: item.croppedImageBase64
  };
}

export default function QuickAddItem({ onAdd, bagTitle, onShowManualForm, onAddFromLink }: QuickAddItemProps) {
  const [mode, setMode] = useState<'text' | 'link'>('text');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [clarificationNeeded, setClarificationNeeded] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [existingAnswers, setExistingAnswers] = useState<Record<string, string>>({});
  const [searchTier, setSearchTier] = useState<'library' | 'library+ai' | 'ai' | 'vision' | 'fallback' | 'error' | undefined>();
  const [isAdding, setIsAdding] = useState(false);
  const [previewingSuggestion, setPreviewingSuggestion] = useState<ProductSuggestion | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<ParsedTextResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // APIS Smart Identification Wizard state
  const [showSmartWizard, setShowSmartWizard] = useState(false);
  const [smartWizardImage, setSmartWizardImage] = useState<string | null>(null);

  // Telemetry session tracking
  const telemetrySessionRef = useRef<string | null>(null);
  const lastSearchTierRef = useRef<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle image selection - compress and launch APIS wizard
  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input immediately for next selection
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawBase64 = event.target?.result as string;

      try {
        // Compress and convert to JPEG (handles HEIC from mobile)
        const compressedBase64 = await compressImageForAPI(rawBase64);
        setSmartWizardImage(compressedBase64);
        setShowSmartWizard(true);
      } catch (err) {
        console.error('[QuickAdd] Image processing failed:', err);
        // Try with raw base64 as fallback
        setSmartWizardImage(rawBase64);
        setShowSmartWizard(true);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle Tap-to-Identify Wizard completion
  const handleTapToIdentifyComplete = useCallback(async (items: IdentifiedItem[]) => {
    setShowSmartWizard(false);
    setSmartWizardImage(null);

    // Add all identified items
    for (const item of items) {
      const suggestion = convertIdentifiedItemToSuggestion(item);
      await onAdd(suggestion);
    }

    // Reset form
    setInput('');
    setSuggestions([]);
  }, [onAdd]);

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

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoadingSuggestions(true);
    setHasSearched(true);

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
        signal: abortController.signal,
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
          telemetrySessionRef.current = startIdentificationSession('text', userInput);
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
        setIsLoadingSuggestions(false);
        abortControllerRef.current = null;
      }
    }
  }, [bagTitle]);

  // Handle text input changes - runs client-side parsing only, no API call
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    setHasSearched(false);

    if (value.trim().length >= 2) {
      const parsed = parseText(value);
      setParsedPreview(parsed);
    } else {
      setParsedPreview(null);
      setSuggestions([]);
      setQuestions([]);
      setClarificationNeeded(false);
    }
  }, []);

  // Explicit search trigger - only fires on button click or Enter key
  const handleSearch = useCallback((forceAI = false) => {
    if (input.trim().length < 2) return;
    fetchSuggestions(input, existingAnswers, forceAI);
  }, [input, existingAnswers, fetchSuggestions]);

  // Convert searchTier to IdentificationStage for telemetry
  const getStageFromTier = (tier?: string): IdentificationStage => {
    switch (tier) {
      case 'library': return 'library_cache';
      case 'library+ai': return 'ai_enrichment';
      case 'ai': return 'ai_enrichment';
      case 'vision': return 'ai_semantic';
      case 'fallback': return 'fallback';
      default: return 'text_parsing';
    }
  };

  const handleSelectSuggestion = (suggestion: ProductSuggestion) => {
    console.log('[QuickAddItem] Selected suggestion:', {
      name: suggestion.custom_name,
      productUrl: suggestion.productUrl,
      imageUrl: suggestion.imageUrl,
    });

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
      setPreviewingSuggestion(null);
      setParsedPreview(null);
      setHasSearched(false);
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
    // Record telemetry for rejected suggestions (trying AI)
    if (telemetrySessionRef.current && suggestions.length > 0) {
      recordIdentificationOutcome(
        telemetrySessionRef.current,
        getStageFromTier(lastSearchTierRef.current),
        suggestions[0]?.confidence || 0,
        suggestions.length,
        'rejected'
      );
      telemetrySessionRef.current = null;
    }

    handleSearch(true);
  };

  const handleAddManually = () => {
    // Record telemetry for manual entry choice
    if (telemetrySessionRef.current) {
      recordIdentificationOutcome(
        telemetrySessionRef.current,
        getStageFromTier(lastSearchTierRef.current),
        suggestions[0]?.confidence || 0,
        suggestions.length,
        'manual_entry'
      );
      telemetrySessionRef.current = null;
    }

    setSuggestions([]);
    setQuestions([]);
    setClarificationNeeded(false);
    onShowManualForm();
  };

  const handleLinkSubmit = () => {
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
  };

  const handleSwitchMode = (newMode: 'text' | 'link') => {
    setMode(newMode);
    if (newMode === 'link') {
      setInput('');
      setSuggestions([]);
      setQuestions([]);
      setClarificationNeeded(false);
      setParsedPreview(null);
      setHasSearched(false);
    } else {
      setLinkUrl('');
      setLinkError(null);
    }
  };

  return (
    <>
      {/* Tap-to-Identify Wizard Modal */}
      {showSmartWizard && smartWizardImage && (
        <div className="fixed inset-0 bg-black z-50">
          <TapToIdentifyWizard
            imageSource={smartWizardImage}
            onComplete={handleTapToIdentifyComplete}
            onCancel={handleSmartWizardCancel}
            categoryHint="golf"
            className="h-full"
          />
        </div>
      )}

      {/* Preview Modal */}
      {previewingSuggestion && (
        <ItemPreview
          suggestion={previewingSuggestion}
          onConfirm={handleConfirmPreview}
          onCancel={handleCancelPreview}
          isAdding={isAdding}
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

        {/* Header with mode toggle and info tooltip */}
        <div className="flex items-center justify-center mb-3 relative">
          <div className="flex items-center">
            {/* Segmented toggle */}
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
              {onAddFromLink && (
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
              )}
            </div>
          </div>
          <div className="absolute right-0 top-0">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
            {showTooltip && (
              <div className="absolute right-0 top-full mt-1 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                <p className="font-medium mb-1">Adding items to your bag:</p>
                <p className="text-gray-300 mb-2">
                  Use this box to quickly add a single item by typing its name, uploading a photo, or pasting a link.
                </p>
                <p className="text-gray-300">
                  For bulk imports (multiple photos, product links, etc.), use the <span className="font-medium text-sky-300">Curator</span> below.
                </p>
                <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45" />
              </div>
            )}
          </div>
        </div>

        {/* Link Input Mode */}
        {mode === 'link' && (
          <div>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
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
                  className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    linkError ? 'border-red-400' : 'border-gray-300'
                  }`}
                  autoFocus
                />
              </div>

              {/* Go button */}
              <button
                type="button"
                onClick={handleLinkSubmit}
                disabled={!linkUrl.trim()}
                className="px-4 py-3 rounded-lg border-2 border-blue-500 bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 disabled:bg-gray-300 disabled:border-gray-300 font-medium"
              >
                Go
              </button>

              {/* Camera button */}
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

            {linkError && (
              <p className="mt-1.5 text-xs text-red-600">{linkError}</p>
            )}

            {!linkUrl && !linkError && (
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
                <LinkIcon className="w-3 h-3" />
                <span>Paste a link from Amazon, REI, or any retailer</span>
              </p>
            )}

            {/* Always available manual link */}
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
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="Type item name (e.g., 'TaylorMade Stealth Driver')"
                disabled={isAdding}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                autoFocus
              />
            </div>

            {/* Search button */}
            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={isAdding || input.trim().length < 2}
              className="px-4 py-3 rounded-lg border-2 border-blue-500 bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 disabled:bg-gray-300 disabled:border-gray-300"
              title="Search for matches"
            >
              <Search className="w-5 h-5" />
            </button>

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
            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
              <Camera className="w-3 h-3" />
              <Sparkles className="w-3 h-3" />
              <span>Type a description or upload a photo to identify a single item</span>
            </p>
          )}

          {/* Parsed Preview chips */}
          {parsedPreview && input.trim().length >= 2 && (
            <div className="mt-2">
              <ParsedPreview parsed={parsedPreview} />
            </div>
          )}

          {/* AI Suggestions - only after explicit search */}
          {hasSearched && (
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
          {hasSearched && !isLoadingSuggestions && suggestions.length === 0 && (
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
        )}
      </div>
    </>
  );
}
