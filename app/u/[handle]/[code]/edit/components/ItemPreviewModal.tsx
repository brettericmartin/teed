'use client';

import { useState, useEffect } from 'react';
import { X, Check, Loader2, ImageOff, AlertCircle } from 'lucide-react';

type ProductSuggestion = {
  custom_name: string;
  custom_description: string;
  notes: string;
  category: string;
  confidence: number;
  brand?: string;
  // Variant hints from parsing
  detectedSize?: string;
  detectedColor?: string;
  suggestedSizes?: string[];
  suggestedColors?: string[];
};

type ItemPreviewModalProps = {
  isOpen: boolean;
  suggestion: ProductSuggestion | null;
  bagTitle?: string;
  onConfirm: (finalItem: {
    custom_name: string;
    brand?: string;
    custom_description?: string;
    notes?: string;
    selectedPhotoUrl?: string;
  }) => Promise<void>;
  onCancel: () => void;
};

export default function ItemPreviewModal({
  isOpen,
  suggestion,
  bagTitle,
  onConfirm,
  onCancel,
}: ItemPreviewModalProps) {
  // Form state (editable fields)
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Variant state
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showVariantSection, setShowVariantSection] = useState(false);

  // Photo state
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Set<number>>(new Set());

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when suggestion changes
  useEffect(() => {
    if (suggestion) {
      setName(suggestion.custom_name);
      setBrand(suggestion.brand || '');
      setDescription(suggestion.custom_description || '');
      setNotes(suggestion.notes || '');
      setSelectedPhotoIndex(null);
      setPhotos([]);
      setPhotoError(null);
      setFailedPhotos(new Set());

      // Initialize variants
      setSelectedSize(suggestion.detectedSize || null);
      setSelectedColor(suggestion.detectedColor || null);

      // Show variant section if we have detected variants or suggestions
      const hasVariants = suggestion.detectedSize ||
        suggestion.detectedColor ||
        (suggestion.suggestedSizes && suggestion.suggestedSizes.length > 0) ||
        (suggestion.suggestedColors && suggestion.suggestedColors.length > 0);
      setShowVariantSection(!!hasVariants);
    }
  }, [suggestion]);

  // Fetch photos when modal opens with a suggestion
  useEffect(() => {
    if (isOpen && suggestion) {
      fetchPhotos();
    }
  }, [isOpen, suggestion]);

  const fetchPhotos = async () => {
    if (!suggestion) return;

    setIsLoadingPhotos(true);
    setPhotoError(null);
    setFailedPhotos(new Set());

    try {
      // Build search query from name and brand
      const searchQuery = suggestion.brand
        ? `${suggestion.brand} ${suggestion.custom_name}`
        : suggestion.custom_name;

      const response = await fetch('/api/ai/find-product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to search for photos');
      }

      const data = await response.json();
      const imageUrls = data.images || [];

      // Take first 6 images
      setPhotos(imageUrls.slice(0, 6));

      // Auto-select first image if available
      if (imageUrls.length > 0) {
        setSelectedPhotoIndex(0);
      }
    } catch (error: any) {
      console.error('Error fetching product photos:', error);
      setPhotoError(error.message || 'Could not load photos');
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const handlePhotoError = (index: number) => {
    setFailedPhotos(prev => new Set(prev).add(index));
    // If the failed photo was selected, clear selection
    if (selectedPhotoIndex === index) {
      // Find next valid photo
      const nextValid = photos.findIndex((_, i) => i !== index && !failedPhotos.has(i));
      setSelectedPhotoIndex(nextValid >= 0 ? nextValid : null);
    }
  };

  // Build final description with variant info
  const buildFinalDescription = () => {
    const parts: string[] = [];

    // Add base description
    if (description.trim()) {
      parts.push(description.trim());
    }

    // Add variant info
    const variantParts: string[] = [];
    if (selectedSize) variantParts.push(`Size: ${selectedSize}`);
    if (selectedColor) variantParts.push(`Color: ${selectedColor}`);

    if (variantParts.length > 0) {
      parts.push(variantParts.join(' | '));
    }

    return parts.join(' • ') || undefined;
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm({
        custom_name: name.trim(),
        brand: brand.trim() || undefined,
        custom_description: buildFinalDescription(),
        notes: notes.trim() || undefined,
        selectedPhotoUrl:
          selectedPhotoIndex !== null && !failedPhotos.has(selectedPhotoIndex)
            ? photos[selectedPhotoIndex]
            : undefined,
      });
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipPhoto = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm({
        custom_name: name.trim(),
        brand: brand.trim() || undefined,
        custom_description: buildFinalDescription(),
        notes: notes.trim() || undefined,
        // No photo
      });
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !suggestion) return null;

  const validPhotosCount = photos.filter((_, i) => !failedPhotos.has(i)).length;
  const hasValidSelection = selectedPhotoIndex !== null && !failedPhotos.has(selectedPhotoIndex);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white md:bg-black/50 md:items-center md:justify-center md:p-4">
      {/* Desktop backdrop - click to close */}
      <div
        className="hidden md:block fixed inset-0"
        onClick={onCancel}
      />

      {/* Modal container - full screen mobile, centered card desktop */}
      <div className="relative flex flex-col w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-xl md:shadow-2xl bg-white overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 bg-white">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">
              Add Item{bagTitle ? ` to ${bagTitle}` : ''}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Review details and select a photo
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="ml-2 p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 md:p-6 space-y-4">
            {/* Name input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--teed-green-6)] focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* Brand input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., TaylorMade, Nike, Apple..."
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--teed-green-6)] focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* Description input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key specs or details..."
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--teed-green-6)] focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* Notes input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Personal notes about this item..."
                rows={2}
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--teed-green-6)] focus:border-transparent resize-none disabled:bg-gray-100"
              />
            </div>

            {/* Variant selection section - optional */}
            {showVariantSection && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Variant (optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSize(null);
                      setSelectedColor(null);
                      setShowVariantSection(false);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>

                {/* Size selection */}
                {(suggestion?.detectedSize || (suggestion?.suggestedSizes && suggestion.suggestedSizes.length > 0)) && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Size</label>
                    <div className="flex flex-wrap gap-2">
                      {/* Pre-fill with detected size */}
                      {suggestion?.detectedSize && (
                        <button
                          type="button"
                          onClick={() => setSelectedSize(suggestion.detectedSize!)}
                          disabled={isSubmitting}
                          className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all ${
                            selectedSize === suggestion.detectedSize
                              ? 'border-[var(--teed-green-8)] bg-[var(--teed-green-8)] text-white'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {suggestion.detectedSize}
                        </button>
                      )}
                      {/* Suggested sizes */}
                      {suggestion?.suggestedSizes?.filter(s => s !== suggestion.detectedSize).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          disabled={isSubmitting}
                          className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all ${
                            selectedSize === size
                              ? 'border-[var(--teed-green-8)] bg-[var(--teed-green-8)] text-white'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                      {/* Clear option */}
                      {selectedSize && (
                        <button
                          type="button"
                          onClick={() => setSelectedSize(null)}
                          disabled={isSubmitting}
                          className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Color selection */}
                {(suggestion?.detectedColor || (suggestion?.suggestedColors && suggestion.suggestedColors.length > 0)) && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {/* Pre-fill with detected color */}
                      {suggestion?.detectedColor && (
                        <button
                          type="button"
                          onClick={() => setSelectedColor(suggestion.detectedColor!)}
                          disabled={isSubmitting}
                          className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all ${
                            selectedColor === suggestion.detectedColor
                              ? 'border-[var(--teed-green-8)] bg-[var(--teed-green-8)] text-white'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {suggestion.detectedColor}
                        </button>
                      )}
                      {/* Suggested colors */}
                      {suggestion?.suggestedColors?.filter(c => c !== suggestion.detectedColor).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          disabled={isSubmitting}
                          className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all ${
                            selectedColor === color
                              ? 'border-[var(--teed-green-8)] bg-[var(--teed-green-8)] text-white'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                      {/* Clear option */}
                      {selectedColor && (
                        <button
                          type="button"
                          onClick={() => setSelectedColor(null)}
                          disabled={isSubmitting}
                          className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show "Add variant" button if no variant section but could have variants */}
            {!showVariantSection && (
              <button
                type="button"
                onClick={() => setShowVariantSection(true)}
                className="text-sm text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] font-medium"
              >
                + Add size/color
              </button>
            )}

            {/* Photo selection section */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Photo
              </label>

              {isLoadingPhotos ? (
                /* Loading skeleton */
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg bg-gray-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : photoError ? (
                /* Error state */
                <div className="flex flex-col items-center justify-center py-8 px-4 bg-gray-50 rounded-lg border border-gray-200">
                  <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 text-center">{photoError}</p>
                  <button
                    onClick={fetchPhotos}
                    className="mt-3 text-sm text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] font-medium"
                  >
                    Try again
                  </button>
                </div>
              ) : photos.length === 0 ? (
                /* No photos found */
                <div className="flex flex-col items-center justify-center py-8 px-4 bg-gray-50 rounded-lg border border-gray-200">
                  <ImageOff className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 text-center">No photos found</p>
                  <p className="text-xs text-gray-500 mt-1">You can add one later</p>
                </div>
              ) : (
                /* Photo grid */
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photoUrl, index) => {
                    const isFailed = failedPhotos.has(index);
                    const isSelected = selectedPhotoIndex === index && !isFailed;

                    if (isFailed) {
                      return (
                        <div
                          key={index}
                          className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center"
                        >
                          <ImageOff className="w-6 h-6 text-gray-300" />
                        </div>
                      );
                    }

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedPhotoIndex(index)}
                        disabled={isSubmitting}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected
                            ? 'border-[var(--teed-green-8)] ring-2 ring-[var(--teed-green-6)] ring-offset-1'
                            : 'border-gray-200 hover:border-gray-300'
                        } disabled:opacity-50`}
                      >
                        <img
                          src={photoUrl}
                          alt={`Product photo option ${index + 1}`}
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

              {/* Photo count indicator */}
              {!isLoadingPhotos && validPhotosCount > 0 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {hasValidSelection
                    ? `Photo ${selectedPhotoIndex! + 1} of ${validPhotosCount} selected`
                    : `${validPhotosCount} photos available`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer - sticky at bottom */}
        <div className="flex-shrink-0 px-4 py-4 md:px-6 border-t border-gray-200 bg-white safe-area-bottom">
          <div className="flex gap-3">
            {/* Skip Photo button - only show when photos are loaded but none selected or when there are photos */}
            {!isLoadingPhotos && (photos.length > 0 || photoError) && (
              <button
                onClick={handleSkipPhoto}
                disabled={isSubmitting || !name.trim()}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Skip Photo
              </button>
            )}
            {/* Add Item button */}
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || !name.trim()}
              className={`${
                !isLoadingPhotos && (photos.length > 0 || photoError) ? 'flex-[2]' : 'flex-1'
              } px-4 py-3 text-sm font-medium text-white bg-[var(--button-create-bg)] hover:bg-[var(--button-create-bg-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {hasValidSelection ? 'Add with Photo' : 'Add Item'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
