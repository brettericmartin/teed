'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Share2, Trash2, Camera, ChevronLeft } from 'lucide-react';
import ItemList from './components/ItemList';
import QuickAddItem from './components/QuickAddItem';
import AddItemForm from './components/AddItemForm';
import ShareModal from './components/ShareModal';
import PhotoUploadModal from './components/PhotoUploadModal';
import ProductReviewModal, { IdentifiedProduct } from './components/ProductReviewModal';
import { Button } from '@/components/ui/Button';

type Link = {
  id: string;
  url: string;
  kind: string;
  metadata: any;
  created_at: string;
};

type Item = {
  id: string;
  bag_id: string;
  custom_name: string | null;
  brand: string | null;
  custom_description: string | null;
  notes: string | null;
  quantity: number;
  sort_index: number;
  custom_photo_id: string | null;
  photo_url: string | null;
  promo_codes: string | null;
  links: Link[];
};

type Bag = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  is_public: boolean;
  background_image: string | null;
  created_at: string;
  updated_at: string | null;
  items: Item[];
};

type BagEditorClientProps = {
  initialBag: Bag;
};

export default function BagEditorClient({ initialBag }: BagEditorClientProps) {
  const router = useRouter();
  const [bag, setBag] = useState<Bag>(initialBag);
  const [title, setTitle] = useState(bag.title);
  const [description, setDescription] = useState(bag.description || '');
  const [isPublic, setIsPublic] = useState(bag.is_public);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showProductReview, setShowProductReview] = useState(false);
  const [identifiedProducts, setIdentifiedProducts] = useState<{
    products: IdentifiedProduct[];
    totalConfidence: number;
    processingTime: number;
  } | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);

  // Auto-save bag metadata (debounced)
  useEffect(() => {
    const hasChanges =
      title !== bag.title ||
      description !== (bag.description || '') ||
      isPublic !== bag.is_public;

    if (!hasChanges) return;

    const timeoutId = setTimeout(async () => {
      await saveBagMetadata();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [title, description, isPublic]);

  const saveBagMetadata = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/bags/${bag.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          is_public: isPublic,
        }),
      });

      if (response.ok) {
        const updatedBag = await response.json();
        setBag((prev) => ({ ...prev, ...updatedBag }));
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Error saving bag:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = async (itemData: {
    custom_name: string;
    custom_description?: string;
    notes?: string;
    quantity?: number;
  }) => {
    try {
      const response = await fetch(`/api/bags/${bag.code}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      const newItem = await response.json();
      setBag((prev) => ({
        ...prev,
        items: [...prev.items, { ...newItem, links: [] }],
      }));
      // QuickAddItem component handles its own state reset
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setBag((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      }));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleUpdateItem = async (
    itemId: string,
    updates: Partial<Omit<Item, 'id' | 'bag_id' | 'links'>>
  ) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      const updatedItem = await response.json();
      setBag((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id === itemId) {
            // Preserve photo_url if updating custom_photo_id
            // (API doesn't return photo_url, only custom_photo_id)
            const preservedPhotoUrl =
              updates.custom_photo_id !== undefined && 'photo_url' in updates
                ? (updates as any).photo_url
                : item.photo_url;

            return {
              ...item,
              ...updatedItem,
              photo_url: preservedPhotoUrl
            };
          }
          return item;
        }),
      }));
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item. Please try again.');
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return lastSaved.toLocaleTimeString();
  };

  const handleDeleteBag = async () => {
    if (!confirm('Are you sure you want to delete this bag? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/bags/${bag.code}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete bag');
      }

      // Navigate back to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting bag:', error);
      alert('Failed to delete bag. Please try again.');
    }
  };

  // Step 29: Photo upload and AI identification handlers
  const handlePhotoCapture = async (base64Image: string) => {
    setIsIdentifying(true);
    setShowPhotoUpload(false);

    try {
      const response = await fetch('/api/ai/identify-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          bagType: bag.title, // Use bag title as context
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to identify products');
      }

      const result = await response.json();

      setIdentifiedProducts(result);
      setShowProductReview(true);
    } catch (error: any) {
      console.error('Error identifying products:', error);
      alert(error.message || 'Failed to identify products. Please try again.');
    } finally {
      setIsIdentifying(false);
    }
  };

  // Step 29: Batch item creation from AI results
  const handleAddSelectedProducts = async (selectedProducts: IdentifiedProduct[], uploadedPhotoFile?: File) => {
    try {
      // Create all items in parallel for better performance
      const createdItems = await Promise.all(
        selectedProducts.map(async (product) => {
          const response = await fetch(`/api/bags/${bag.code}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              custom_name: product.name,
              brand: product.brand || null,
              custom_description: product.specifications
                ? product.specifications.join(' | ')
                : product.category,
              notes: product.estimatedPrice
                ? `Est. price: ${product.estimatedPrice}`
                : undefined,
              quantity: 1,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to add ${product.name}`);
          }

          const newItem = await response.json();

          // If product has a Google image, download and upload it
          if (product.productImage?.imageUrl) {
            try {
              // Download the Google image
              const imageResponse = await fetch(product.productImage.imageUrl);
              const imageBlob = await imageResponse.blob();

              // Upload to our storage
              const formData = new FormData();
              formData.append('file', imageBlob, `${product.name}.jpg`);
              formData.append('itemId', newItem.id);

              const uploadResponse = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData,
              });

              if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();

                // Update item with photo
                await fetch(`/api/items/${newItem.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    custom_photo_id: uploadData.mediaAssetId,
                  }),
                });

                newItem.custom_photo_id = uploadData.mediaAssetId;
                newItem.photo_url = uploadData.url;
              }
            } catch (photoError) {
              console.error(`Failed to upload product image for ${product.name}:`, photoError);
              // Continue without photo - don't fail the whole operation
            }
          }

          return newItem;
        })
      );

      // Update bag state with new items
      setBag((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          ...createdItems.map((item) => ({ ...item, links: [] })),
        ],
      }));

      setShowProductReview(false);
      setIdentifiedProducts(null);

      // Show success message
      alert(`Successfully added ${createdItems.length} items to your bag!`);
    } catch (error: any) {
      console.error('Error adding products:', error);
      alert(error.message || 'Failed to add some items. Please try again.');
      throw error; // Re-throw so ProductReviewModal can handle it
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-3">
              {/* Save Status */}
              <div className="text-xs text-[var(--text-secondary)]">
                {isSaving ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin mr-2 h-3 w-3" />
                    Saving...
                  </span>
                ) : lastSaved ? (
                  <span>Saved {formatLastSaved()}</span>
                ) : null}
              </div>

              {/* Share Button */}
              <Button
                onClick={() => setShowShareModal(true)}
                variant="secondary"
                size="sm"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>

              {/* Delete Bag Button */}
              <Button
                onClick={handleDeleteBag}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* Editable Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bag Title"
            className="text-2xl font-bold text-[var(--text-primary)] w-full border-0 border-b-2 border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--teed-green-8)] focus:outline-none bg-transparent px-0 py-1 transition-colors placeholder:text-[var(--input-placeholder)]"
          />

          {/* Editable Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            rows={2}
            className="mt-2 text-sm text-[var(--text-secondary)] w-full border-0 border-b-2 border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--teed-green-8)] focus:outline-none bg-transparent px-0 py-1 resize-none transition-colors placeholder:text-[var(--input-placeholder)]"
          />

          {/* Privacy Toggle */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic(!isPublic)}
              className={`${
                isPublic ? 'bg-[var(--teed-green-8)]' : 'bg-[var(--grey-5)]'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2`}
            >
              <span
                className={`${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
              />
            </button>
            <span className="text-sm text-[var(--text-primary)]">
              {isPublic ? 'Public' : 'Private'}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {isPublic ? 'Anyone with the link can view' : 'Only you can view'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Item Section */}
        <div className="mb-6 space-y-4">
          {/* Quick AI-Powered Text Input (Primary) */}
          {!showManualForm && (
            <QuickAddItem
              onAdd={async (suggestion) => {
                await handleAddItem({
                  custom_name: suggestion.custom_name,
                  custom_description: suggestion.custom_description || undefined,
                  notes: suggestion.notes || undefined,
                  quantity: 1,
                });
              }}
              bagTitle={bag.title}
              onShowManualForm={() => setShowManualForm(true)}
            />
          )}

          {/* Photo Upload Button (Secondary) */}
          <Button
            onClick={() => setShowPhotoUpload(true)}
            disabled={isIdentifying}
            variant="ai"
            className="w-full py-3"
          >
            {isIdentifying ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Identifying Products...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2" />
                Add from Photo (AI)
              </>
            )}
          </Button>

          {/* Manual Form (Hidden by default) */}
          {showManualForm && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Manual Entry</h3>
                <button
                  onClick={() => setShowManualForm(false)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Back to quick add
                </button>
              </div>
              <AddItemForm
                onSubmit={async (data) => {
                  await handleAddItem(data);
                  setShowManualForm(false);
                }}
                onCancel={() => setShowManualForm(false)}
                bagTitle={bag.title}
              />
            </div>
          )}
        </div>

        {/* Items List */}
        {bag.items.length > 0 ? (
          <ItemList
            items={bag.items}
            onDelete={handleDeleteItem}
            onUpdate={handleUpdateItem}
            bagCode={bag.code}
          />
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-[var(--text-tertiary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-[var(--text-primary)]">No items yet</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Get started by adding your first item.
            </p>
          </div>
        )}
      </main>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        bagCode={bag.code}
        bagTitle={bag.title}
        isPublic={isPublic}
        onTogglePublic={() => setIsPublic(!isPublic)}
      />

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        onPhotoCapture={handlePhotoCapture}
        bagType={bag.title}
      />

      {/* Product Review Modal */}
      {identifiedProducts && (
        <ProductReviewModal
          isOpen={showProductReview}
          onClose={() => {
            setShowProductReview(false);
            setIdentifiedProducts(null);
          }}
          products={identifiedProducts.products}
          totalConfidence={identifiedProducts.totalConfidence}
          processingTime={identifiedProducts.processingTime}
          onAddSelected={handleAddSelectedProducts}
        />
      )}
    </div>
  );
}
