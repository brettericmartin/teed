'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Share2, Trash2, Camera, ChevronLeft, Package, Images, Link, Sparkles } from 'lucide-react';
import ItemList from './components/ItemList';
import QuickAddItem from './components/QuickAddItem';
import AddItemForm from './components/AddItemForm';
import ShareModal from './components/ShareModal';
import PhotoUploadModal from './components/PhotoUploadModal';
import BulkPhotoUploadModal from './components/BulkPhotoUploadModal';
import TranscriptProcessorModal from './components/TranscriptProcessorModal';
import ProductReviewModal, { IdentifiedProduct } from './components/ProductReviewModal';
import BatchPhotoSelector from './components/BatchPhotoSelector';
import ItemSelectionModal from './components/ItemSelectionModal';
import EnrichmentPreview from './components/EnrichmentPreview';
import ClarificationModal from './components/ClarificationModal';
import AIAssistantHub from './components/AIAssistantHub';
import BagAnalytics from './components/BagAnalytics';
import { Button } from '@/components/ui/Button';

type Link = {
  id: string;
  url: string;
  kind: string;
  metadata: any;
  created_at: string;
  is_auto_generated?: boolean;
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
  is_featured: boolean;
  featured_position: number | null;
  links: Link[];
};

type Bag = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  is_public: boolean;
  background_image: string | null;
  category: string | null;
  tags: string[];
  created_at: string;
  updated_at: string | null;
  items: Item[];
};

type BagEditorClientProps = {
  initialBag: Bag;
  ownerHandle: string;
};

export default function BagEditorClient({ initialBag, ownerHandle }: BagEditorClientProps) {
  const router = useRouter();
  const [bag, setBag] = useState<Bag>(initialBag);
  const [title, setTitle] = useState(bag.title);
  const [description, setDescription] = useState(bag.description || '');
  const [isPublic, setIsPublic] = useState(bag.is_public);
  const [category, setCategory] = useState(bag.category || '');
  const [tags, setTags] = useState<string[]>(bag.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showTranscriptProcessor, setShowTranscriptProcessor] = useState(false);
  const [showProductReview, setShowProductReview] = useState(false);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [showBatchPhotoSelector, setShowBatchPhotoSelector] = useState(false);
  const [selectedItemsForPhotos, setSelectedItemsForPhotos] = useState<typeof bag.items>([]);
  const [identifiedProducts, setIdentifiedProducts] = useState<{
    products: IdentifiedProduct[];
    totalConfidence: number;
    processingTime: number;
  } | null>(null);
  const [capturedPhotoBase64, setCapturedPhotoBase64] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isFillingLinks, setIsFillingLinks] = useState(false);
  const [enrichmentSuggestions, setEnrichmentSuggestions] = useState<any[]>([]);
  const [showEnrichmentPreview, setShowEnrichmentPreview] = useState(false);
  const [clarificationQuestions, setClarificationQuestions] = useState<any[]>([]);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, Record<string, string>>>({});

  // Auto-save bag metadata (debounced)
  useEffect(() => {
    const hasChanges =
      title !== bag.title ||
      description !== (bag.description || '') ||
      isPublic !== bag.is_public ||
      category !== (bag.category || '') ||
      JSON.stringify(tags) !== JSON.stringify(bag.tags || []);

    if (!hasChanges) return;

    const timeoutId = setTimeout(async () => {
      await saveBagMetadata();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [title, description, isPublic, category, tags]);

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
          category: category || null,
          tags: tags,
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

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
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

      // Trigger background auto-enrichment (don't await - run silently)
      autoEnrichItem(newItem.id, itemData.custom_name);
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item. Please try again.');
    }
  };

  // Silent auto-enrichment for newly added items
  const autoEnrichItem = async (itemId: string, itemName: string) => {
    try {
      console.log(`[auto-enrich] Starting for "${itemName}" (${itemId})`);

      // Get AI suggestions for this item
      const enrichResponse = await fetch('/api/ai/enrich-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: itemName,
          bagContext: bag.title,
        }),
      });

      if (!enrichResponse.ok) {
        console.log(`[auto-enrich] Failed to get suggestions for "${itemName}"`);
        return;
      }

      const enrichResult = await enrichResponse.json();

      // Pick the top suggestion if confidence is high enough
      const topSuggestion = enrichResult.suggestions?.[0];
      if (!topSuggestion || topSuggestion.confidence < 0.7) {
        console.log(`[auto-enrich] Skipping "${itemName}" - low confidence (${topSuggestion?.confidence || 0})`);
        return;
      }

      // Prepare updates (only apply if fields are empty)
      const updates: Record<string, string> = {};

      // Get current item state from bag
      const currentItem = bag.items.find(i => i.id === itemId);

      if (!currentItem?.brand && topSuggestion.brand) {
        updates.brand = topSuggestion.brand;
      }
      if (!currentItem?.custom_description && topSuggestion.custom_description) {
        updates.custom_description = topSuggestion.custom_description;
      }
      if (!currentItem?.notes && topSuggestion.notes) {
        updates.notes = topSuggestion.notes;
      }

      // Apply updates if we have any
      if (Object.keys(updates).length > 0) {
        const updateResponse = await fetch(`/api/items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (updateResponse.ok) {
          const updatedItem = await updateResponse.json();
          console.log(`[auto-enrich] Updated "${itemName}" with:`, Object.keys(updates));

          // Update local state
          setBag((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
              item.id === itemId ? { ...item, ...updatedItem } : item
            ),
          }));
        }
      }

      // Also try to find and add a product link
      try {
        const linkSearchQuery = `${topSuggestion.brand || ''} ${itemName}`.trim();
        const linkResponse = await fetch('/api/ai/find-product-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName: linkSearchQuery,
            brandName: topSuggestion.brand,
          }),
        });

        if (linkResponse.ok) {
          const linkResult = await linkResponse.json();

          // If we found a product URL, add it as a link
          if (linkResult.productUrl) {
            const addLinkResponse = await fetch(`/api/items/${itemId}/links`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: linkResult.productUrl,
                kind: 'shop',
                is_auto_generated: true,
              }),
            });

            if (addLinkResponse.ok) {
              const newLink = await addLinkResponse.json();
              console.log(`[auto-enrich] Added link for "${itemName}":`, linkResult.productUrl);

              // Update local state with new link
              setBag((prev) => ({
                ...prev,
                items: prev.items.map((item) =>
                  item.id === itemId
                    ? { ...item, links: [...item.links, newLink] }
                    : item
                ),
              }));
            }
          }
        }
      } catch (linkError) {
        console.log(`[auto-enrich] Link search failed for "${itemName}":`, linkError);
      }

      console.log(`[auto-enrich] Completed for "${itemName}"`);
    } catch (error) {
      console.error(`[auto-enrich] Error for "${itemName}":`, error);
      // Silent failure - don't interrupt user
    }
  };

  // Silent auto-link finding for items that are already enriched (e.g., from photo ID)
  const autoFindProductLink = async (itemId: string, itemName: string, brand?: string | null) => {
    try {
      console.log(`[auto-link] Starting for "${itemName}" (${itemId})`);

      const searchQuery = `${brand || ''} ${itemName}`.trim();
      const linkResponse = await fetch('/api/ai/find-product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: searchQuery,
          brandName: brand,
        }),
      });

      if (!linkResponse.ok) {
        console.log(`[auto-link] Failed to find link for "${itemName}"`);
        return;
      }

      const linkResult = await linkResponse.json();

      // If we found a product URL, add it as a link
      if (linkResult.productUrl) {
        const addLinkResponse = await fetch(`/api/items/${itemId}/links`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: linkResult.productUrl,
            kind: 'shop',
            is_auto_generated: true,
          }),
        });

        if (addLinkResponse.ok) {
          const newLink = await addLinkResponse.json();
          console.log(`[auto-link] Added link for "${itemName}":`, linkResult.productUrl);

          // Update local state with new link
          setBag((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
              item.id === itemId
                ? { ...item, links: [...item.links, newLink] }
                : item
            ),
          }));
        }
      } else {
        console.log(`[auto-link] No product URL found for "${itemName}"`);
      }

      console.log(`[auto-link] Completed for "${itemName}"`);
    } catch (error) {
      console.error(`[auto-link] Error for "${itemName}":`, error);
      // Silent failure - don't interrupt user
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

      // Preserve photo_url since API doesn't return it
      const preservedPhotoUrl =
        updates.custom_photo_id !== undefined && 'photo_url' in updates
          ? (updates as any).photo_url
          : null;

      setBag((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              ...updatedItem,
              photo_url: preservedPhotoUrl || item.photo_url,
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
    // Store the captured photo to use later when creating items
    setCapturedPhotoBase64(base64Image);

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
      setCapturedPhotoBase64(null); // Clear on error
      alert(error.message || 'Failed to identify products. Please try again.');
    } finally {
      setIsIdentifying(false);
    }
  };

  // Bulk photo upload handler (for 2-10 photos)
  const handleBulkPhotosCapture = async (base64Images: string[]) => {
    setIsIdentifying(true);
    setShowPhotoUpload(false);

    try {
      const response = await fetch('/api/ai/identify-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: base64Images,
          bagType: bag.title,
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

  // Transcript processing handler
  const handleTranscriptProductsExtracted = async (products: IdentifiedProduct[]) => {
    setShowTranscriptProcessor(false);

    // Format products to match the expected structure
    const formattedResult = {
      products,
      totalConfidence: products.length > 0
        ? products.reduce((sum, p) => sum + (p.confidence || 0), 0) / products.length
        : 0,
      processingTime: 0,
    };

    setIdentifiedProducts(formattedResult);
    setShowProductReview(true);
  };

  // Step 29: Batch item creation from AI results
  const handleAddSelectedProducts = async (selectedProducts: IdentifiedProduct[], uploadedPhotoFile?: File) => {
    try {
      // Create all items in parallel for better performance
      const createdItems = await Promise.all(
        selectedProducts.map(async (product, index) => {
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

          // Try to upload a photo for this item
          // Priority: 1) User's captured photo (for single item), 2) Google product image
          const shouldUseUserPhoto = capturedPhotoBase64 && selectedProducts.length === 1;

          if (shouldUseUserPhoto && capturedPhotoBase64) {
            // Upload the user's captured photo for single item selection
            try {
              // Convert base64 to blob
              const base64Data = capturedPhotoBase64.split(',')[1];
              const mimeType = capturedPhotoBase64.split(';')[0].split(':')[1];
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: mimeType });

              // Upload to our storage
              const formData = new FormData();
              formData.append('file', blob, `${product.name}-${Date.now()}.jpg`);
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
              console.error(`Failed to upload user photo for ${product.name}:`, photoError);
              // Continue without photo - don't fail the whole operation
            }
          } else if (product.productImage?.imageUrl) {
            // Use server-side upload-from-url to bypass CORS for Google images
            try {
              const uploadResponse = await fetch('/api/media/upload-from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageUrl: product.productImage.imageUrl,
                  itemId: newItem.id,
                  filename: `${product.name}.jpg`,
                }),
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
              } else {
                const errorData = await uploadResponse.json().catch(() => ({}));
                console.error(`Failed to upload Google image for ${product.name}:`, errorData);
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
      setCapturedPhotoBase64(null); // Clear the captured photo

      // Show success message
      alert(`Successfully added ${createdItems.length} items to your bag!`);

      // Trigger background auto-link finding for photo ID items
      // (they already have enrichment from AI vision, just need links)
      createdItems.forEach((item, index) => {
        const product = selectedProducts[index];
        if (product) {
          autoFindProductLink(item.id, product.name, product.brand);
        }
      });
    } catch (error: any) {
      console.error('Error adding products:', error);
      alert(error.message || 'Failed to add some items. Please try again.');
      throw error; // Re-throw so ProductReviewModal can handle it
    }
  };

  // Fill product info handler - shows preview modal (or clarification questions first)
  const handleFillLinks = async (withAnswers?: Record<string, Record<string, string>>) => {
    setIsFillingLinks(true);

    try {
      // Get preview suggestions (include answers if provided)
      const response = await fetch('/api/items/preview-enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bagId: bag.id,
          clarificationAnswers: withAnswers || clarificationAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const result = await response.json();

      if (!result.suggestions || result.suggestions.length === 0) {
        alert('No items to enrich! Add some items to your bag first.');
        return;
      }

      // If there are clarification questions and no answers provided yet, show questions first
      if (result.needsClarification && result.questions?.length > 0 && !withAnswers) {
        setClarificationQuestions(result.questions);
        setEnrichmentSuggestions(result.suggestions); // Store suggestions for later
        setShowClarificationModal(true);
        return;
      }

      // Show preview modal (even if items have data - user can choose to replace)
      setEnrichmentSuggestions(result.suggestions);
      setShowEnrichmentPreview(true);
      setShowClarificationModal(false);
      setClarificationQuestions([]);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert('Failed to generate suggestions. Please try again.');
    } finally {
      setIsFillingLinks(false);
    }
  };

  // Handle clarification answers and re-run enrichment
  const handleClarificationSubmit = async (answers: Record<string, Record<string, string>>) => {
    setClarificationAnswers(answers);
    setShowClarificationModal(false);
    // Re-run with answers
    await handleFillLinks(answers);
  };

  // Skip clarification and use current suggestions
  const handleSkipClarification = () => {
    setShowClarificationModal(false);
    setClarificationQuestions([]);
    setShowEnrichmentPreview(true);
  };

  // Apply approved enrichments
  const handleApproveEnrichments = async (approvedItemIds: string[], editedValues: Record<string, any>) => {
    try {
      // Build approved suggestions with edited values
      const approvedSuggestions = enrichmentSuggestions
        .filter(s => approvedItemIds.includes(s.itemId))
        .map(s => {
          const edited = editedValues[s.itemId] || {};
          return {
            itemId: s.itemId,
            brand: edited.brand !== undefined ? edited.brand : s.suggested.brand,
            description: edited.description !== undefined ? edited.description : s.suggested.description,
            notes: edited.notes !== undefined ? edited.notes : s.suggested.notes,
            link: edited.link !== undefined ? edited.link : s.suggested.link,
          };
        });

      const response = await fetch('/api/items/apply-enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bagId: bag.id,
          approvedSuggestions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply enrichments');
      }

      const result = await response.json();

      // Refresh bag
      const bagResponse = await fetch(`/api/bags/${bag.code}`);
      if (bagResponse.ok) {
        const updatedBag = await bagResponse.json();
        setBag(updatedBag);
      }

      // Close modal
      setShowEnrichmentPreview(false);
      setEnrichmentSuggestions([]);

      // Show success message
      const messages = [];
      if (result.detailsEnriched > 0) {
        messages.push(`✨ Enriched ${result.detailsEnriched} item${result.detailsEnriched > 1 ? 's' : ''}`);
      }
      if (result.linksAdded > 0) {
        messages.push(`🔗 Added ${result.linksAdded} link${result.linksAdded > 1 ? 's' : ''}`);
      }

      if (messages.length > 0) {
        alert(messages.join('\n') + '\n\nYour bag has been updated! 🎉');
      }
    } catch (error) {
      console.error('Error applying enrichments:', error);
      alert('Failed to apply changes. Please try again.');
    }
  };

  // Batch photo application handler
  const handleApplyBatchPhotos = async (selections: Array<{ itemId: string; imageUrl: string }>) => {
    try {
      // Apply photos in parallel using server-side upload to bypass CORS
      await Promise.all(
        selections.map(async ({ itemId, imageUrl }) => {
          try {
            // Use server-side upload-from-url to download and upload in one step
            const uploadResponse = await fetch('/api/media/upload-from-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl,
                itemId,
                filename: 'product.jpg',
              }),
            });

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json().catch(() => ({}));
              throw new Error(errorData.error || 'Failed to upload image');
            }

            const uploadData = await uploadResponse.json();

            // Update item with photo
            await fetch(`/api/items/${itemId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                custom_photo_id: uploadData.mediaAssetId,
              }),
            });

            // Update local state
            setBag((prev) => ({
              ...prev,
              items: prev.items.map((item) =>
                item.id === itemId
                  ? { ...item, custom_photo_id: uploadData.mediaAssetId, photo_url: uploadData.url }
                  : item
              ),
            }));
          } catch (error) {
            console.error(`Failed to apply photo for item ${itemId}:`, error);
            throw error;
          }
        })
      );

      alert(`Successfully added ${selections.length} photos!`);
    } catch (error: any) {
      console.error('Error applying batch photos:', error);
      throw new Error(error.message || 'Failed to apply some photos');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header - Scrolls away with content */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Title Row with Public Toggle and Actions */}
          <div className="flex items-start gap-2 sm:gap-3 mb-2">
            {/* Editable Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bag Title"
              className="flex-1 text-lg sm:text-2xl font-bold text-[var(--text-primary)] text-base border-0 border-b-2 border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--teed-green-8)] focus:outline-none bg-transparent px-0 py-1 transition-colors placeholder:text-[var(--input-placeholder)] min-w-0"
            />

            {/* Privacy Toggle - Inline with title */}
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic(!isPublic)}
              className={`${
                isPublic ? 'bg-[var(--teed-green-8)]' : 'bg-[var(--grey-5)]'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2 flex-shrink-0 mt-1`}
              title={isPublic ? 'Public - Anyone with link can view' : 'Private - Only you can view'}
            >
              <span
                className={`${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
              />
            </button>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Share Button */}
              <Button
                onClick={() => setShowShareModal(true)}
                variant="secondary"
                size="sm"
                className="min-h-[44px] min-w-[44px] p-2.5"
              >
                <Share2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>

              {/* Delete Bag Button */}
              <Button
                onClick={handleDeleteBag}
                variant="destructive"
                size="sm"
                className="min-h-[44px] min-w-[44px] p-2.5"
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>

          {/* Description and Status Row */}
          <div className="flex items-start gap-2">
            {/* Editable Description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={1}
              className="flex-1 text-sm text-[var(--text-secondary)] text-base w-full border-0 border-b-2 border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--teed-green-8)] focus:outline-none bg-transparent px-0 py-1 resize-none transition-colors placeholder:text-[var(--input-placeholder)] min-w-0"
            />

            {/* Save Status & Privacy Label */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] flex-shrink-0">
              {isSaving ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin h-3 w-3" />
                </span>
              ) : lastSaved ? (
                <span className="hidden sm:inline">
                  Saved {formatLastSaved()}
                </span>
              ) : null}
              <span className="text-[var(--text-primary)] font-medium">
                {isPublic ? '🌐 Public' : '🔒 Private'}
              </span>
            </div>
          </div>

          {/* Category and Tags Row */}
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-[var(--border-subtle)]">
            {/* Category Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-xs bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded px-2 py-1 focus:outline-none focus:border-[var(--teed-green-8)] transition-colors"
              >
                <option value="">None</option>
                <option value="golf">⛳ Golf</option>
                <option value="travel">✈️ Travel</option>
                <option value="tech">💻 Tech</option>
                <option value="camping">🏕️ Camping</option>
                <option value="photography">📷 Photography</option>
                <option value="fitness">💪 Fitness</option>
                <option value="cooking">🍳 Cooking</option>
                <option value="music">🎵 Music</option>
                <option value="art">🎨 Art</option>
                <option value="gaming">🎮 Gaming</option>
                <option value="other">📦 Other</option>
              </select>
            </div>

            {/* Tags Input */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Tags:</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add tag and press Enter..."
                  className="flex-1 text-xs bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded px-2 py-1 focus:outline-none focus:border-[var(--teed-green-8)] transition-colors placeholder:text-[var(--input-placeholder)]"
                />
                <button
                  onClick={handleAddTag}
                  className="text-xs bg-[var(--teed-green-8)] text-white px-2 py-1 rounded hover:bg-[var(--teed-green-9)] transition-colors"
                  type="button"
                >
                  Add
                </button>
              </div>
              {/* Tag Display */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--sky-2)] text-[var(--sky-11)] rounded text-xs"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-[var(--sky-12)] transition-colors"
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Add Item Section */}
        <div className="mb-6 space-y-4">
          {/* Quick AI-Powered Text Input (Primary) */}
          {!showManualForm && (
            <QuickAddItem
              onAdd={async (suggestion) => {
                // Create the item first
                const response = await fetch(`/api/bags/${bag.code}/items`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    custom_name: suggestion.custom_name,
                    custom_description: suggestion.custom_description || undefined,
                    notes: suggestion.notes || undefined,
                    quantity: 1,
                    brand: suggestion.brand || undefined,
                  }),
                });

                if (!response.ok) {
                  throw new Error('Failed to add item');
                }

                const newItem = await response.json();

                // If there's a product URL from scraping, add it as a link
                if (suggestion.productUrl) {
                  try {
                    await fetch(`/api/items/${newItem.id}/links`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        url: suggestion.productUrl,
                        kind: 'product',
                        label: suggestion.custom_name || 'Product Link',
                      }),
                    });
                  } catch (error) {
                    console.error('Failed to add product link:', error);
                  }
                }

                // Update local state
                setBag((prev) => ({
                  ...prev,
                  items: [...prev.items, { ...newItem, links: [] }],
                }));
              }}
              bagTitle={bag.title}
              onShowManualForm={() => setShowManualForm(true)}
            />
          )}

          {/* AI Assistant Hub */}
          <AIAssistantHub
            itemCount={bag.items.length}
            itemsWithoutPhotos={bag.items.filter(item => !item.photo_url).length}
            onAddFromPhoto={() => setShowPhotoUpload(true)}
            onAddFromTranscript={() => setShowTranscriptProcessor(true)}
            onFindPhotos={() => setShowItemSelection(true)}
            onFillProductInfo={handleFillLinks}
            isIdentifying={isIdentifying}
            isFillingInfo={isFillingLinks}
          />

          {/* Analytics (only show for public bags) */}
          {isPublic && (
            <BagAnalytics bagId={bag.id} />
          )}

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
        ownerHandle={ownerHandle}
        onTogglePublic={() => setIsPublic(!isPublic)}
      />

      {/* Bulk Photo Upload Modal (supports 1-10 photos) */}
      <BulkPhotoUploadModal
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        onPhotosCapture={handleBulkPhotosCapture}
        bagType={bag.title}
      />

      {/* Transcript Processor Modal */}
      <TranscriptProcessorModal
        isOpen={showTranscriptProcessor}
        onClose={() => setShowTranscriptProcessor(false)}
        onProductsExtracted={handleTranscriptProductsExtracted}
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

      {/* Item Selection Modal */}
      <ItemSelectionModal
        isOpen={showItemSelection}
        onClose={() => setShowItemSelection(false)}
        items={bag.items.map(item => ({
          id: item.id,
          custom_name: item.custom_name || 'Unnamed Item',
          brand: item.brand,
          custom_description: item.custom_description,
          currentPhotoUrl: item.photo_url,
        }))}
        onConfirm={(selectedItems) => {
          setSelectedItemsForPhotos(selectedItems as typeof bag.items);
          setShowItemSelection(false);
          setShowBatchPhotoSelector(true);
        }}
        title="Select Items for Photo Search"
        description="Choose which items you want to search for photos"
      />

      {/* Batch Photo Selector Modal */}
      <BatchPhotoSelector
        isOpen={showBatchPhotoSelector}
        onClose={() => {
          setShowBatchPhotoSelector(false);
          setSelectedItemsForPhotos([]);
        }}
        items={selectedItemsForPhotos.map(item => ({
          id: item.id,
          custom_name: item.custom_name || 'Unnamed Item',
          brand: item.brand,
          custom_description: item.custom_description,
          currentPhotoUrl: item.photo_url,
        }))}
        onApplyPhotos={handleApplyBatchPhotos}
      />

      {/* Clarification Questions Modal */}
      {showClarificationModal && (
        <ClarificationModal
          questions={clarificationQuestions}
          itemNames={bag.items.reduce((acc, item) => {
            acc[item.id] = item.custom_name || 'Unnamed Item';
            return acc;
          }, {} as Record<string, string>)}
          onSubmit={handleClarificationSubmit}
          onSkip={handleSkipClarification}
          isLoading={isFillingLinks}
        />
      )}

      {/* Enrichment Preview Modal */}
      {showEnrichmentPreview && (
        <EnrichmentPreview
          suggestions={enrichmentSuggestions}
          onApprove={handleApproveEnrichments}
          onCancel={() => {
            setShowEnrichmentPreview(false);
            setEnrichmentSuggestions([]);
          }}
        />
      )}
    </div>
  );
}
