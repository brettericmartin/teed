'use client';

import { useState } from 'react';
import { X, Check, Loader2, Image as ImageIcon, Images } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ItemWithSuggestion {
  id: string;
  custom_name: string;
  brand: string | null;
  custom_description: string | null;
  suggestedImageUrls: string[];
  selectedImageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

interface BatchPhotoSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  items: Array<{
    id: string;
    custom_name: string;
    brand: string | null;
    custom_description: string | null;
    currentPhotoUrl?: string | null;
  }>;
  onApplyPhotos: (selections: Array<{ itemId: string; imageUrl: string }>) => Promise<void>;
}

export default function BatchPhotoSelector({
  isOpen,
  onClose,
  items,
  onApplyPhotos,
}: BatchPhotoSelectorProps) {
  const [itemsWithSuggestions, setItemsWithSuggestions] = useState<ItemWithSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const handleFindImages = async () => {
    setIsSearching(true);

    // Initialize items with loading state
    const initialItems: ItemWithSuggestion[] = items.map(item => ({
      ...item,
      suggestedImageUrls: [],
      selectedImageUrl: null,
      isLoading: true,
      error: null,
    }));
    setItemsWithSuggestions(initialItems);

    // Fetch images for each item in parallel
    const results = await Promise.all(
      items.map(async (item) => {
        try {
          // Build search query from item details
          const queryParts = [item.custom_name];
          if (item.brand) queryParts.unshift(item.brand);
          const query = queryParts.join(' ');

          const response = await fetch('/api/ai/find-product-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to find image');
          }

          const data = await response.json();

          // Get up to 4 images
          const imageUrls = (data.images || []).slice(0, 4);

          return {
            ...item,
            suggestedImageUrls: imageUrls,
            selectedImageUrl: imageUrls.length > 0 ? imageUrls[0] : null, // Auto-select first image
            isLoading: false,
            error: imageUrls.length === 0 ? 'No images found' : null,
          };
        } catch (error: any) {
          return {
            ...item,
            suggestedImageUrls: [],
            selectedImageUrl: null,
            isLoading: false,
            error: error.message || 'Failed to find image',
          };
        }
      })
    );

    setItemsWithSuggestions(results);
    setIsSearching(false);
  };

  const handleSelectImage = (itemId: string, imageUrl: string) => {
    setItemsWithSuggestions(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, selectedImageUrl: imageUrl } : item
      )
    );
  };

  const handleDeselectItem = (itemId: string) => {
    setItemsWithSuggestions(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, selectedImageUrl: null } : item
      )
    );
  };

  const handleApply = async () => {
    const selections = itemsWithSuggestions
      .filter(item => item.selectedImageUrl)
      .map(item => ({
        itemId: item.id,
        imageUrl: item.selectedImageUrl!,
      }));

    if (selections.length === 0) {
      alert('Please select at least one image to apply');
      return;
    }

    setIsApplying(true);
    try {
      await onApplyPhotos(selections);
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to apply photos');
    } finally {
      setIsApplying(false);
    }
  };

  const selectedCount = itemsWithSuggestions.filter(item => item.selectedImageUrl).length;
  const foundCount = itemsWithSuggestions.filter(item => item.suggestedImageUrls.length > 0).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--surface)] rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Find Product Photos</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {itemsWithSuggestions.length === 0
                ? `${items.length} items without photos`
                : `Found ${foundCount} of ${items.length} images • ${selectedCount} selected`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {itemsWithSuggestions.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 mx-auto text-[var(--text-tertiary)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                Ready to find product photos
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                AI will search for product images for {items.length} items
              </p>
              <button
                onClick={handleFindImages}
                disabled={isSearching}
                className="px-8 py-4 bg-[var(--teed-green-9)] text-white rounded-lg hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="animate-spin h-6 w-6 mr-3 inline" />
                    Searching for Images...
                  </>
                ) : (
                  <>
                    <Images className="w-6 h-6 mr-3 inline" />
                    Find Images with AI
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {itemsWithSuggestions.map((item) => (
                <div
                  key={item.id}
                  className="border-2 border-[var(--border-subtle)] rounded-lg p-4 bg-[var(--surface)]"
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[var(--text-primary)] truncate">
                        {item.custom_name}
                      </h4>
                      {item.brand && (
                        <p className="text-sm text-[var(--text-secondary)] truncate">
                          {item.brand}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {items.find(i => i.id === item.id)?.currentPhotoUrl && (
                        <span className="text-xs bg-[var(--sky-3)] text-[var(--sky-11)] px-2 py-1 rounded">
                          Has Photo
                        </span>
                      )}
                      {item.selectedImageUrl && (
                        <button
                          onClick={() => handleDeselectItem(item.id)}
                          className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded transition-colors"
                        >
                          Skip
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Image Options */}
                  {item.isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin h-8 w-8 text-[var(--text-tertiary)]" />
                    </div>
                  ) : item.error ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-2" />
                        <p className="text-sm text-[var(--text-secondary)]">{item.error}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {/* Show current photo as first option if it exists */}
                      {(() => {
                        const currentItem = items.find(i => i.id === item.id);
                        if (currentItem?.currentPhotoUrl) {
                          return (
                            <button
                              key="current"
                              onClick={() => handleDeselectItem(item.id)}
                              className={`relative aspect-square rounded-lg overflow-hidden border-4 transition-all hover:scale-105 ${
                                !item.selectedImageUrl
                                  ? 'border-[var(--sky-9)] ring-2 ring-[var(--sky-9)] ring-offset-2'
                                  : 'border-[var(--border-subtle)] hover:border-[var(--sky-6)]'
                              }`}
                            >
                              <img
                                src={currentItem.currentPhotoUrl}
                                alt={`${item.custom_name} current`}
                                className="w-full h-full object-contain bg-[var(--sky-2)]"
                                loading="lazy"
                              />
                              <div className="absolute bottom-0 inset-x-0 bg-[var(--sky-9)] bg-opacity-90 text-white text-xs py-1 text-center font-medium">
                                Current
                              </div>
                              {!item.selectedImageUrl && (
                                <div className="absolute top-1 right-1 w-6 h-6 bg-[var(--sky-9)] rounded-full flex items-center justify-center shadow-lg">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </button>
                          );
                        }
                        return null;
                      })()}
                      {/* Show AI-suggested images */}
                      {item.suggestedImageUrls.map((imageUrl, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectImage(item.id, imageUrl)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-4 transition-all hover:scale-105 ${
                            item.selectedImageUrl === imageUrl
                              ? 'border-[var(--teed-green-9)] ring-2 ring-[var(--teed-green-9)] ring-offset-2'
                              : 'border-[var(--border-subtle)] hover:border-[var(--teed-green-6)]'
                          }`}
                        >
                          <img
                            src={`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`}
                            alt={`${item.custom_name} option ${index + 1}`}
                            className="w-full h-full object-contain bg-[var(--sky-2)]"
                            loading="lazy"
                          />
                          {item.selectedImageUrl === imageUrl && (
                            <div className="absolute top-1 right-1 w-6 h-6 bg-[var(--teed-green-9)] rounded-full flex items-center justify-center shadow-lg">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {itemsWithSuggestions.length > 0 && (
          <div className="border-t border-[var(--border-subtle)] p-6 bg-[var(--sky-1)]">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="text-sm text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">{selectedCount}</span> of {foundCount} images selected
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isApplying}
                className="px-6 py-3 bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] rounded-lg hover:bg-[var(--button-secondary-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying || selectedCount === 0}
                className="flex-1 px-8 py-3 bg-[var(--teed-green-9)] text-white rounded-lg hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2 inline" />
                    Applying Photos...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2 inline" />
                    Apply {selectedCount} Photo{selectedCount !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
