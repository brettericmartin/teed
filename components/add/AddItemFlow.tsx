'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Package,
  ChevronRight,
  Plus,
  Search,
  Camera,
  Link2,
  ArrowLeft,
  Loader2,
  Check,
  ImagePlus,
  Type,
  ImageOff,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Bag = {
  id: string;
  code: string;
  title: string;
  itemCount?: number;
  backgroundImage?: string | null;
};

type ProductSuggestion = {
  custom_name: string;
  custom_description: string;
  notes: string;
  category: string;
  confidence: number;
  brand?: string;
};

type AddItemStep = 'select-bag' | 'add-method' | 'enter-url' | 'text-search' | 'preview-item' | 'uploading';

interface AddItemFlowProps {
  isOpen: boolean;
  onClose: () => void;
  bags: Bag[];
  onCreateBag: () => void;
  /** Callback when item should be added via URL */
  onAddViaUrl: (bagCode: string, url: string) => Promise<void>;
  /** Callback to navigate to bag editor for photo upload */
  onAddViaPhoto: (bagCode: string) => void;
  /** User handle for navigation */
  userHandle: string;
}

export function AddItemFlow({
  isOpen,
  onClose,
  bags,
  onCreateBag,
  onAddViaUrl,
  onAddViaPhoto,
  userHandle,
}: AddItemFlowProps) {
  const [step, setStep] = useState<AddItemStep>('select-bag');
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Text search state
  const [textInput, setTextInput] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ProductSuggestion | null>(null);

  // Preview/photo state
  const [previewName, setPreviewName] = useState('');
  const [previewBrand, setPreviewBrand] = useState('');
  const [previewDescription, setPreviewDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Set<number>>(new Set());

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('select-bag');
        setSelectedBag(null);
        setSearchQuery('');
        setUrl('');
        setError(null);
        setTextInput('');
        setSuggestions([]);
        setSelectedSuggestion(null);
        setPreviewName('');
        setPreviewBrand('');
        setPreviewDescription('');
        setPhotos([]);
        setSelectedPhotoIndex(null);
        setPhotoError(null);
        setFailedPhotos(new Set());
      }, 300);
    }
  }, [isOpen]);

  // Filter bags by search
  const filteredBags = bags.filter(bag =>
    bag.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBag = useCallback((bag: Bag) => {
    setSelectedBag(bag);
    setStep('add-method');
  }, []);

  const handleBack = useCallback(() => {
    if (step === 'add-method') {
      setStep('select-bag');
      setSelectedBag(null);
    } else if (step === 'enter-url') {
      setStep('add-method');
      setUrl('');
      setError(null);
    } else if (step === 'text-search') {
      setStep('add-method');
      setTextInput('');
      setSuggestions([]);
    } else if (step === 'preview-item') {
      setStep('text-search');
      setSelectedSuggestion(null);
      setPhotos([]);
      setSelectedPhotoIndex(null);
      setPhotoError(null);
      setFailedPhotos(new Set());
    }
  }, [step]);

  // Fetch suggestions for text input
  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/ai/enrich-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: input,
          bagContext: selectedBag?.title,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [selectedBag?.title]);

  // Debounced text input effect
  useEffect(() => {
    if (step !== 'text-search') return;
    const timer = setTimeout(() => {
      if (textInput.trim().length >= 2) {
        fetchSuggestions(textInput);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [textInput, step, fetchSuggestions]);

  // Handle selecting a suggestion - go to preview
  const handleSelectSuggestion = useCallback((suggestion: ProductSuggestion) => {
    setSelectedSuggestion(suggestion);
    setPreviewName(suggestion.custom_name);
    setPreviewBrand(suggestion.brand || '');
    setPreviewDescription(suggestion.custom_description || '');
    setStep('preview-item');

    // Fetch photos
    fetchPhotos(suggestion);
  }, []);

  // Fetch product photos
  const fetchPhotos = useCallback(async (suggestion: ProductSuggestion) => {
    setIsLoadingPhotos(true);
    setPhotoError(null);
    setFailedPhotos(new Set());

    try {
      const searchQuery = suggestion.brand
        ? `${suggestion.brand} ${suggestion.custom_name}`
        : suggestion.custom_name;

      const response = await fetch('/api/ai/find-product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error('Failed to search for photos');
      }

      const data = await response.json();
      const imageUrls = data.images || [];
      setPhotos(imageUrls.slice(0, 6));

      if (imageUrls.length > 0) {
        setSelectedPhotoIndex(0);
      }
    } catch (error: any) {
      console.error('Error fetching photos:', error);
      setPhotoError(error.message || 'Could not load photos');
    } finally {
      setIsLoadingPhotos(false);
    }
  }, []);

  const handlePhotoError = useCallback((index: number) => {
    setFailedPhotos(prev => new Set(prev).add(index));
    if (selectedPhotoIndex === index) {
      const nextValid = photos.findIndex((_, i) => i !== index && !failedPhotos.has(i));
      setSelectedPhotoIndex(nextValid >= 0 ? nextValid : null);
    }
  }, [selectedPhotoIndex, photos, failedPhotos]);

  // Add item from preview
  const handleAddFromPreview = useCallback(async () => {
    if (!selectedBag || !previewName.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create the item
      const response = await fetch(`/api/bags/${selectedBag.code}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_name: previewName.trim(),
          brand: previewBrand.trim() || undefined,
          custom_description: previewDescription.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      const newItem = await response.json();

      // If photo selected, upload it
      if (selectedPhotoIndex !== null && !failedPhotos.has(selectedPhotoIndex) && photos[selectedPhotoIndex]) {
        try {
          const sanitizedName = previewName.replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 50);
          const uploadResponse = await fetch('/api/media/upload-from-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: photos[selectedPhotoIndex],
              itemId: newItem.id,
              filename: `${sanitizedName}.jpg`,
            }),
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            await fetch(`/api/items/${newItem.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                custom_photo_id: uploadResult.mediaAssetId,
              }),
            });
          }
        } catch (photoError) {
          console.error('Photo upload failed:', photoError);
          // Continue without photo
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedBag, previewName, previewBrand, previewDescription, selectedPhotoIndex, photos, failedPhotos, onClose]);

  const handleAddViaUrl = useCallback(async () => {
    if (!selectedBag || !url.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      await onAddViaUrl(selectedBag.code, url.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedBag, url, onAddViaUrl, onClose]);

  const handleAddViaPhoto = useCallback(() => {
    if (!selectedBag) return;
    onAddViaPhoto(selectedBag.code);
    onClose();
  }, [selectedBag, onAddViaPhoto, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className={cn(
          'fixed z-[101]',
          'inset-x-4 bottom-24 sm:inset-auto',
          'sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
          'bg-[var(--surface)] rounded-2xl shadow-2xl',
          'max-w-md w-full mx-auto overflow-hidden',
          'border border-[var(--border-subtle)]',
          'max-h-[80vh] flex flex-col'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center gap-3">
            {step !== 'select-bag' && (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-[var(--sky-3)] flex items-center justify-center">
              <Package className="w-6 h-6 text-[var(--sky-10)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {step === 'select-bag' && 'Add Item'}
                {step === 'add-method' && `Add to ${selectedBag?.title}`}
                {step === 'enter-url' && 'Paste Product URL'}
                {step === 'text-search' && 'Search for Item'}
                {step === 'preview-item' && 'Review Item'}
              </h2>
              <p className="text-sm text-[var(--text-tertiary)]">
                {step === 'select-bag' && 'Choose which bag to add to'}
                {step === 'add-method' && 'How do you want to add it?'}
                {step === 'enter-url' && "We'll extract product details"}
                {step === 'text-search' && 'Type a product name to find it'}
                {step === 'preview-item' && 'Review details and choose a photo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Bag */}
            {step === 'select-bag' && (
              <motion.div
                key="select-bag"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 space-y-3"
              >
                {/* Search */}
                {bags.length > 3 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search bags..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--sky-7)]"
                    />
                  </div>
                )}

                {/* Bag List */}
                {filteredBags.length > 0 ? (
                  <div className="space-y-2">
                    {filteredBags.map((bag) => (
                      <button
                        key={bag.id}
                        onClick={() => handleSelectBag(bag)}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--surface-hover)] transition-colors group text-left"
                      >
                        {/* Bag thumbnail */}
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--sky-4)] to-[var(--teed-green-4)] flex items-center justify-center overflow-hidden">
                          {bag.backgroundImage ? (
                            <img
                              src={bag.backgroundImage}
                              alt={bag.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-[var(--sky-10)]" />
                          )}
                        </div>

                        {/* Bag info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[var(--text-primary)] truncate">
                            {bag.title}
                          </div>
                          <div className="text-sm text-[var(--text-tertiary)]">
                            {bag.itemCount || 0} items
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                ) : bags.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" />
                    <p className="text-[var(--text-secondary)] mb-4">
                      You don't have any bags yet
                    </p>
                    <button
                      onClick={onCreateBag}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create Your First Bag
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-[var(--text-tertiary)]">
                    No bags match "{searchQuery}"
                  </div>
                )}

                {/* Create new bag option */}
                {bags.length > 0 && (
                  <button
                    onClick={onCreateBag}
                    className="w-full flex items-center gap-4 p-3 rounded-xl border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--teed-green-7)] hover:bg-[var(--teed-green-2)] transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[var(--teed-green-3)] flex items-center justify-center">
                      <Plus className="w-6 h-6 text-[var(--teed-green-9)]" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-[var(--teed-green-10)]">
                        Create New Bag
                      </div>
                      <div className="text-sm text-[var(--text-tertiary)]">
                        Start a new collection
                      </div>
                    </div>
                  </button>
                )}
              </motion.div>
            )}

            {/* Step 2: Choose Method */}
            {step === 'add-method' && (
              <motion.div
                key="add-method"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-3"
              >
                {/* Type Product Name */}
                <button
                  onClick={() => setStep('text-search')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[var(--teed-green-3)] hover:bg-[var(--teed-green-4)] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center">
                    <Type className="w-6 h-6 text-[var(--teed-green-10)]" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-[var(--teed-green-10)]">
                      Type Product Name
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      Search and select from suggestions
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--teed-green-10)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Paste URL */}
                <button
                  onClick={() => setStep('enter-url')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[var(--copper-3)] hover:bg-[var(--copper-4)] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center">
                    <Link2 className="w-6 h-6 text-[var(--copper-10)]" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-[var(--copper-10)]">
                      Paste Product URL
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      We'll extract product details automatically
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--copper-10)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Take Photo */}
                <button
                  onClick={handleAddViaPhoto}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[var(--sky-3)] hover:bg-[var(--sky-4)] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-[var(--sky-10)]" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-[var(--sky-10)]">
                      Take or Upload Photo
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      Our AI will identify the product
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--sky-10)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </motion.div>
            )}

            {/* Step 3: Enter URL */}
            {step === 'enter-url' && (
              <motion.div
                key="enter-url"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Product URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError(null);
                    }}
                    placeholder="https://amazon.com/dp/..."
                    autoFocus
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border bg-[var(--surface)] text-[var(--text-primary)]',
                      'placeholder:text-[var(--text-tertiary)]',
                      'focus:outline-none focus:ring-2',
                      error
                        ? 'border-[var(--copper-7)] focus:ring-[var(--copper-7)]'
                        : 'border-[var(--border-subtle)] focus:ring-[var(--teed-green-7)]'
                    )}
                  />
                  {error && (
                    <p className="mt-2 text-sm text-[var(--copper-9)]">{error}</p>
                  )}
                </div>

                <div className="text-sm text-[var(--text-tertiary)]">
                  Supported: Amazon, REI, Golf Galaxy, Dick's, Best Buy, and more
                </div>

                <button
                  onClick={handleAddViaUrl}
                  disabled={!url.trim() || isProcessing}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium',
                    'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors'
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Add Item
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Step: Text Search */}
            {step === 'text-search' && (
              <motion.div
                key="text-search"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Product Name
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="e.g., TaylorMade Stealth Driver"
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]"
                    />
                  </div>
                </div>

                {/* Loading state */}
                {isLoadingSuggestions && (
                  <div className="flex items-center justify-center py-6 text-[var(--text-tertiary)]">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Finding products...
                  </div>
                )}

                {/* Suggestions list */}
                {!isLoadingSuggestions && suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-[var(--text-tertiary)]">
                      Select a product:
                    </p>
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--teed-green-7)] hover:bg-[var(--teed-green-2)] transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[var(--text-primary)] truncate">
                            {suggestion.custom_name}
                          </div>
                          {suggestion.brand && (
                            <div className="text-sm text-[var(--text-tertiary)]">
                              {suggestion.brand}
                            </div>
                          )}
                          {suggestion.custom_description && (
                            <div className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                              {suggestion.custom_description}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* No results */}
                {!isLoadingSuggestions && textInput.trim().length >= 2 && suggestions.length === 0 && (
                  <div className="text-center py-6 text-[var(--text-tertiary)]">
                    <p>No products found for "{textInput}"</p>
                    <p className="text-sm mt-1">Try a different search term</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step: Preview Item */}
            {step === 'preview-item' && (
              <motion.div
                key="preview-item"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                {/* Photo Selection */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Choose Photo
                  </label>

                  {isLoadingPhotos ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-lg bg-[var(--surface-hover)] animate-pulse"
                        />
                      ))}
                    </div>
                  ) : photoError ? (
                    <div className="flex flex-col items-center justify-center py-6 px-4 bg-[var(--surface-hover)] rounded-xl">
                      <AlertCircle className="w-8 h-8 text-[var(--text-tertiary)] mb-2" />
                      <p className="text-sm text-[var(--text-secondary)]">{photoError}</p>
                      <button
                        onClick={() => selectedSuggestion && fetchPhotos(selectedSuggestion)}
                        className="mt-2 text-sm text-[var(--teed-green-9)] font-medium"
                      >
                        Try again
                      </button>
                    </div>
                  ) : photos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 px-4 bg-[var(--surface-hover)] rounded-xl">
                      <ImageOff className="w-8 h-8 text-[var(--text-tertiary)] mb-2" />
                      <p className="text-sm text-[var(--text-secondary)]">No photos found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map((photoUrl, index) => {
                        const isFailed = failedPhotos.has(index);
                        const isSelected = selectedPhotoIndex === index && !isFailed;

                        if (isFailed) {
                          return (
                            <div
                              key={index}
                              className="aspect-square rounded-lg bg-[var(--surface-hover)] flex items-center justify-center"
                            >
                              <ImageOff className="w-6 h-6 text-[var(--text-tertiary)]" />
                            </div>
                          );
                        }

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedPhotoIndex(index)}
                            className={cn(
                              'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                              isSelected
                                ? 'border-[var(--teed-green-8)] ring-2 ring-[var(--teed-green-6)] ring-offset-1'
                                : 'border-[var(--border-subtle)] hover:border-[var(--border)]'
                            )}
                          >
                            <img
                              src={photoUrl}
                              alt={`Photo option ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={() => handlePhotoError(index)}
                            />
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-[var(--teed-green-8)] rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Skip photo link */}
                  {!isLoadingPhotos && photos.length > 0 && selectedPhotoIndex !== null && (
                    <button
                      onClick={() => setSelectedPhotoIndex(null)}
                      className="mt-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    >
                      Skip photo
                    </button>
                  )}
                </div>

                {/* Editable fields */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={previewName}
                    onChange={(e) => setPreviewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={previewBrand}
                    onChange={(e) => setPreviewBrand(e.target.value)}
                    placeholder="e.g., TaylorMade"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={previewDescription}
                    onChange={(e) => setPreviewDescription(e.target.value)}
                    placeholder="Key specs or details"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]"
                  />
                </div>

                {error && (
                  <p className="text-sm text-[var(--copper-9)]">{error}</p>
                )}

                {/* Add button */}
                <button
                  onClick={handleAddFromPreview}
                  disabled={!previewName.trim() || isProcessing}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium',
                    'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors'
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Add to {selectedBag?.title}
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

export default AddItemFlow;
