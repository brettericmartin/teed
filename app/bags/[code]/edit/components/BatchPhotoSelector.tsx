'use client';

import { useState } from 'react';
import { X, Check, Image as ImageIcon, Images, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { LoadingBall } from '@/components/ui/LoadingBall';
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
  customSearchQuery?: string;
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
  const [editingSearchQuery, setEditingSearchQuery] = useState<Record<string, string>>({});
  const [showCustomSearch, setShowCustomSearch] = useState<Record<string, boolean>>({});

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
            const errorMessage = errorData.details
              ? `${errorData.error}: ${errorData.details}`
              : errorData.error || 'Failed to find image';
            throw new Error(errorMessage);
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

  const handleRetrySearch = async (itemId: string, customDescription?: string) => {
    const item = itemsWithSuggestions.find(i => i.id === itemId);
    if (!item) return;

    // Set loading state for this item
    setItemsWithSuggestions(prev =>
      prev.map(i =>
        i.id === itemId ? { ...i, isLoading: true, error: null } : i
      )
    );

    try {
      let query: string;

      // If custom description provided, enhance it with AI first
      if (customDescription && customDescription.trim()) {
        console.log('Enhancing search query with AI:', customDescription);

        const enhanceResponse = await fetch('/api/ai/enhance-search-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: customDescription.trim(),
            productName: item.custom_name,
            brand: item.brand || undefined,
          }),
        });

        if (!enhanceResponse.ok) {
          throw new Error('Failed to enhance search query');
        }

        const enhanceData = await enhanceResponse.json();
        query = enhanceData.query;
        console.log('AI-enhanced query:', query);
      } else {
        // Build query from item details
        const queryParts = [item.custom_name];
        if (item.brand) queryParts.unshift(item.brand);
        query = queryParts.join(' ');
      }

      // Search for images using the query (enhanced or default)
      const response = await fetch('/api/ai/find-product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Failed to find image';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const imageUrls = (data.images || []).slice(0, 4);

      setItemsWithSuggestions(prev =>
        prev.map(i =>
          i.id === itemId
            ? {
                ...i,
                suggestedImageUrls: imageUrls,
                selectedImageUrl: imageUrls.length > 0 ? imageUrls[0] : null,
                isLoading: false,
                error: imageUrls.length === 0 ? 'No images found' : null,
                customSearchQuery: customDescription ? query : undefined, // Store the enhanced query
              }
            : i
        )
      );

      // Clear the editing search query and hide custom search section
      setEditingSearchQuery(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
      setShowCustomSearch(prev => ({
        ...prev,
        [itemId]: false,
      }));
    } catch (error: any) {
      setItemsWithSuggestions(prev =>
        prev.map(i =>
          i.id === itemId
            ? {
                ...i,
                suggestedImageUrls: [],
                selectedImageUrl: null,
                isLoading: false,
                error: error.message || 'Failed to find image',
              }
            : i
        )
      );
    }
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
                  <span className="inline-flex items-center gap-3">
                    <LoadingBall size="md" variant="ai" />
                    Searching for Images...
                  </span>
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
                      {item.customSearchQuery && !item.error && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                          Custom search: "{item.customSearchQuery}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {items.find(i => i.id === item.id)?.currentPhotoUrl && (
                        <span className="text-xs bg-[var(--sky-3)] text-[var(--sky-11)] px-2 py-1 rounded">
                          Has Photo
                        </span>
                      )}
                      {!item.isLoading && !item.error && (
                        <button
                          onClick={() => handleRetrySearch(item.id)}
                          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                          title="Search again"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
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
                      <LoadingBall size="md" variant="ai" label="Searching..." />
                    </div>
                  ) : item.error ? (
                    <div className="py-6">
                      <div className="text-center mb-4">
                        <ImageIcon className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-2" />
                        <p className="text-sm text-[var(--text-secondary)] mb-1">{item.error}</p>
                        {item.customSearchQuery && (
                          <p className="text-xs text-[var(--text-tertiary)]">
                            Searched for: "{item.customSearchQuery}"
                          </p>
                        )}
                      </div>

                      {/* Custom Search Input - Always visible for errors */}
                      <div className="max-w-md mx-auto">
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                          Describe what you're looking for
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingSearchQuery[item.id] || ''}
                            onChange={(e) =>
                              setEditingSearchQuery(prev => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder={`e.g., "black with white swoosh" or "the blue one"`}
                            className="flex-1 px-3 py-2 text-base border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && editingSearchQuery[item.id]?.trim()) {
                                handleRetrySearch(item.id, editingSearchQuery[item.id]);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleRetrySearch(item.id, editingSearchQuery[item.id])}
                            disabled={!editingSearchQuery[item.id]?.trim()}
                            className="px-4 py-2 min-h-[44px] bg-[var(--teed-green-9)] text-white rounded-lg hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
                          >
                            <Search className="w-4 h-4" />
                            Search
                          </button>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] mt-2">
                          AI will enhance your description to find better matches
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
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
                                  ? 'border-[var(--sky-6)] ring-2 ring-[var(--sky-6)] ring-offset-2'
                                  : 'border-[var(--border-subtle)] hover:border-[var(--sky-6)]'
                              }`}
                            >
                              <img
                                src={currentItem.currentPhotoUrl}
                                alt={`${item.custom_name} current`}
                                className="w-full h-full object-contain bg-[var(--sky-2)]"
                                loading="lazy"
                              />
                              <div className="absolute bottom-0 inset-x-0 bg-[var(--sky-6)] bg-opacity-90 text-white text-xs py-1 text-center font-medium">
                                Current
                              </div>
                              {!item.selectedImageUrl && (
                                <div className="absolute top-1 right-1 w-6 h-6 bg-[var(--sky-6)] rounded-full flex items-center justify-center shadow-lg">
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

                    {/* Custom Search Section - Collapsible */}
                    <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
                      <button
                        onClick={() =>
                          setShowCustomSearch(prev => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }))
                        }
                        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {showCustomSearch[item.id] ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        <span className="font-medium">Try different search with AI</span>
                      </button>

                      {showCustomSearch[item.id] && (
                        <div className="mt-3 max-w-md">
                          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Describe what you're looking for
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editingSearchQuery[item.id] || ''}
                              onChange={(e) =>
                                setEditingSearchQuery(prev => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              placeholder={`e.g., "black with white swoosh" or "the blue one"`}
                              className="flex-1 px-3 py-2 text-base border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && editingSearchQuery[item.id]?.trim()) {
                                  handleRetrySearch(item.id, editingSearchQuery[item.id]);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleRetrySearch(item.id, editingSearchQuery[item.id])}
                              disabled={!editingSearchQuery[item.id]?.trim()}
                              className="px-4 py-2 min-h-[44px] bg-[var(--teed-green-9)] text-white rounded-lg hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
                            >
                              <Search className="w-4 h-4" />
                              Search
                            </button>
                          </div>
                          <p className="text-xs text-[var(--text-tertiary)] mt-2">
                            AI will enhance your description to find better matches
                          </p>
                        </div>
                      )}
                    </div>
                    </>
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
                  <span className="inline-flex items-center gap-2">
                    <LoadingBall size="sm" variant="primary" />
                    Applying Photos...
                  </span>
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
