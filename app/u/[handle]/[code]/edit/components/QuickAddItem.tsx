'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Sparkles, Info } from 'lucide-react';
import { GolfLoader } from '@/components/ui/GolfLoader';
import AISuggestions from './AISuggestions';
import ItemPreview from './ItemPreview';
import { SmartIdentificationWizard } from '@/components/apis';
import type { ValidatedProduct } from '@/lib/apis/types';

// Compress and convert image to JPEG (handles HEIC from mobile)
async function compressImageForAPI(base64: string, maxSizeKB: number = 3500): Promise<string> {
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
    const MAX_DIMENSION = 1600;

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

    // Compress with reducing quality - convert to JPEG
    let quality = 0.85;
    let result = canvas.toDataURL('image/jpeg', quality);

    while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.3) {
      quality -= 0.1;
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
  const [previewingSuggestion, setPreviewingSuggestion] = useState<ProductSuggestion | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // APIS Smart Identification Wizard state
  const [showSmartWizard, setShowSmartWizard] = useState(false);
  const [smartWizardImage, setSmartWizardImage] = useState<string | null>(null);

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
        setSuggestions(data.suggestions || []);
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
  }, [bagTitle]);

  // Debounced effect for text input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input && input.trim().length >= 2) {
        fetchSuggestions(input, existingAnswers);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [input, existingAnswers, fetchSuggestions]);

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

        {/* Header with info tooltip */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Add Single Item</h3>
          <div className="relative">
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
                  Use this box to quickly add a single item by typing its name or uploading a photo.
                </p>
                <p className="text-gray-300">
                  For bulk imports (multiple photos, product links, etc.), use the <span className="font-medium text-sky-300">Curator</span> below.
                </p>
                <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45" />
              </div>
            )}
          </div>
        </div>

        {/* Quick Input */}
        <div>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type item name (e.g., 'TaylorMade Stealth Driver')"
                disabled={isAdding}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                autoFocus
              />
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
            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
              <Camera className="w-3 h-3" />
              <Sparkles className="w-3 h-3" />
              <span>Type a description or upload a photo to identify a single item</span>
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
