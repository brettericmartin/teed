'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Trash2, Camera, ChevronLeft, Package, Images, Link, Sparkles, Upload, Image, X, Eye, Loader2, BookOpen } from 'lucide-react';
import { GolfLoader } from '@/components/ui/GolfLoader';
import NextLink from 'next/link';
import ItemList from './components/ItemList';
import QuickAddItem from './components/QuickAddItem';
import AddItemForm from './components/AddItemForm';
import ShareModal from './components/ShareModal';
import PhotoUploadModal, { type PhotoPipelineResult } from './components/PhotoUploadModal';
import BulkLinkImportModal from './components/BulkLinkImportModal';
import BulkTextAddModal from './components/BulkTextAddModal';
import ProductReviewModal, { IdentifiedProduct } from './components/ProductReviewModal';
import BatchPhotoSelector from './components/BatchPhotoSelector';
import ItemSelectionModal from './components/ItemSelectionModal';
import EnrichmentPreview from './components/EnrichmentPreview';
import BagAnalytics from './components/BagAnalytics';
import CoverPhotoCropper, { type AspectRatioId } from './components/CoverPhotoCropper';
import BagToolsMenu from '@/components/bag/BagToolsMenu';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { CATEGORIES } from '@/lib/categories';
import { useCelebration } from '@/lib/celebrations';
import * as bagsApi from '@/lib/api/domains/bags';
import * as itemsApi from '@/lib/api/domains/items';
import * as mediaApi from '@/lib/api/domains/media';
import * as aiApi from '@/lib/api/domains/ai';
import BagCompletionButton from '@/components/BagCompletionButton';
import { EditorOnboarding } from '@/components/EditorOnboarding';
import StoryTimeline from '@/components/story/StoryTimeline';

/**
 * Robust data URL to Blob converter that handles mobile browser quirks.
 * Handles URL-safe base64 (-_ instead of +/), missing padding, and whitespace.
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  // First try the fetch approach - most reliable when it works
  try {
    const response = await fetch(dataUrl);
    if (response.ok) {
      return await response.blob();
    }
  } catch (fetchError) {
    console.log('Fetch approach failed, falling back to manual decode:', fetchError);
  }

  // Manual fallback for browsers where fetch(dataUrl) doesn't work
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    throw new Error('Invalid data URL format - no comma found');
  }

  const prefix = dataUrl.substring(0, commaIndex);
  let base64 = dataUrl.substring(commaIndex + 1);

  // Extract MIME type
  const mimeMatch = prefix.match(/^data:([^;]+)/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';

  // Clean base64: remove whitespace
  base64 = base64.replace(/\s/g, '');

  // Convert URL-safe base64 to standard base64
  base64 = base64.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  const paddingNeeded = (4 - (base64.length % 4)) % 4;
  if (paddingNeeded > 0) {
    base64 += '='.repeat(paddingNeeded);
  }

  // Decode base64 to binary
  let binary: string;
  try {
    binary = atob(base64);
  } catch (atobError) {
    console.error('atob failed:', atobError, 'base64 prefix:', base64.substring(0, 30));
    throw new Error('Failed to decode image data');
  }

  // Convert to Uint8Array
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}


type Link = {
  id: string;
  url: string;
  kind: string;
  metadata: any;
  created_at: string;
  is_auto_generated?: boolean;
};

type ItemSpecs = {
  [key: string]: string | number | boolean;
};

type Section = {
  id: string;
  bag_id: string;
  name: string;
  description: string | null;
  sort_index: number;
  collapsed_by_default: boolean;
  created_at: string;
  updated_at: string;
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
  section_id: string | null; // Optional section this item belongs to
  // New context fields (Phase 1)
  why_chosen: string | null;
  specs: ItemSpecs;
  compared_to: string | null;
  alternatives: string[] | null;
  price_paid: number | null;
  purchase_date: string | null;
  links: Link[];
  // Optimistic UI state
  _isPending?: boolean; // True while API call is in progress
  _optimisticId?: string; // Temporary ID for optimistic items
};

type Bag = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  is_public: boolean;
  is_complete: boolean;
  completed_at: string | null;
  background_image: string | null;
  category: string | null;
  hero_item_id: string | null;
  cover_photo_id: string | null;
  cover_photo_url: string | null;
  cover_photo_aspect: string | null;
  created_at: string;
  updated_at: string | null;
  items: Item[];
  sections: Section[];
};

type BagEditorClientProps = {
  initialBag: Bag;
  ownerHandle: string;
};

export default function BagEditorClient({ initialBag, ownerHandle }: BagEditorClientProps) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { celebrateItemAdded, celebrateMilestone } = useCelebration();
  const [bag, setBag] = useState<Bag>(initialBag);
  const [title, setTitle] = useState(bag.title);
  const [description, setDescription] = useState(bag.description || '');
  const [isPublic, setIsPublic] = useState(bag.is_public);
  const [category, setCategory] = useState(bag.category || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBulkLinkImport, setShowBulkLinkImport] = useState(false);
  const [showBulkTextAdd, setShowBulkTextAdd] = useState(false);
  const [linkImportInitialUrl, setLinkImportInitialUrl] = useState<string | undefined>();
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
  const [capturedPhotosArray, setCapturedPhotosArray] = useState<string[]>([]); // For bulk photo uploads
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [pipelineStats, setPipelineStats] = useState<{
    totalDetected: number;
    totalIdentified: number;
    totalVerified: number;
  } | null>(null);
  const [isFillingLinks, setIsFillingLinks] = useState(false);
  const [enrichmentSuggestions, setEnrichmentSuggestions] = useState<any[]>([]);
  const [showEnrichmentPreview, setShowEnrichmentPreview] = useState(false);
  const [showCoverCropper, setShowCoverCropper] = useState(false);
  const [coverImageToCrop, setCoverImageToCrop] = useState<string | null>(null);
  const [showEnrichmentItemSelection, setShowEnrichmentItemSelection] = useState(false);
  const [enrichingItemId, setEnrichingItemId] = useState<string | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const handleGenerateDescription = async () => {
    setIsGeneratingDescription(true);
    try {
      const data = await aiApi.generateBagDescription({
        bagCode: bag.code,
        type: 'description',
      });

      if (data.description) {
        setDescription(data.description);
        toast.showSuccess('Description generated!');
      }
    } catch (error: any) {
      console.error('Error generating description:', error);
      toast.showError('Failed to generate description');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Auto-save bag metadata (debounced)
  useEffect(() => {
    const hasChanges =
      title !== bag.title ||
      description !== (bag.description || '') ||
      isPublic !== bag.is_public ||
      category !== (bag.category || '');

    if (!hasChanges) return;

    const timeoutId = setTimeout(async () => {
      await saveBagMetadata();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [title, description, isPublic, category]);

  const saveBagMetadata = async () => {
    setIsSaving(true);

    try {
      const updatedBag = await bagsApi.update(bag.code, {
        title,
        description: description || null,
        is_public: isPublic,
        category: category || null,
      });

      setBag((prev) => ({ ...prev, ...updatedBag }));
      setLastSaved(new Date());
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
    brand?: string;
    imageUrl?: string; // External image URL from APIS
    photo_url?: string; // Direct photo URL
    selectedPhotoUrl?: string; // Photo URL selected from preview modal
  }) => {
    // Generate a temporary ID for optimistic UI
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create optimistic item immediately with pending state
    const optimisticItem: Item = {
      id: optimisticId,
      _optimisticId: optimisticId,
      _isPending: true,
      bag_id: bag.id,
      custom_name: itemData.custom_name,
      brand: itemData.brand || null,
      custom_description: itemData.custom_description || null,
      notes: itemData.notes || null,
      quantity: itemData.quantity || 1,
      sort_index: bag.items.length,
      custom_photo_id: null,
      photo_url: itemData.photo_url || itemData.imageUrl || itemData.selectedPhotoUrl || null,
      promo_codes: null,
      is_featured: false,
      featured_position: null,
      section_id: null,
      why_chosen: null,
      specs: {},
      compared_to: null,
      alternatives: null,
      price_paid: null,
      purchase_date: null,
      links: [],
    };

    // Add optimistic item to UI immediately
    setBag((prev) => ({
      ...prev,
      items: [...prev.items, optimisticItem],
    }));

    // Celebrate the new item immediately (optimistic)
    const newItemCount = bag.items.length + 1;
    celebrateItemAdded();
    celebrateMilestone(newItemCount);

    try {
      // Map imageUrl to photo_url for API
      const apiPayload = {
        ...itemData,
        photo_url: itemData.photo_url || itemData.imageUrl || undefined,
      };
      // Remove non-API fields from payload
      delete (apiPayload as any).imageUrl;
      delete (apiPayload as any).selectedPhotoUrl;

      const newItem = await bagsApi.addItem(bag.code, apiPayload);
      let finalPhotoUrl = newItem.photo_url;
      let finalCustomPhotoId = newItem.custom_photo_id;

      // If a photo was selected in the preview modal, upload it to storage
      if (itemData.selectedPhotoUrl) {
        try {
          console.log('[handleAddItem] Uploading selected photo:', itemData.selectedPhotoUrl.substring(0, 50));
          const sanitizedName = itemData.custom_name.replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 50);
          const uploadResult = await mediaApi.uploadFromUrl({
            imageUrl: itemData.selectedPhotoUrl,
            itemId: newItem.id,
            filename: `${sanitizedName}.jpg`,
          });

          console.log('[handleAddItem] Photo uploaded:', uploadResult);

          // Update item with the custom_photo_id
          await itemsApi.update(newItem.id, {
            custom_photo_id: uploadResult.mediaAssetId,
          });

          finalPhotoUrl = uploadResult.url;
          finalCustomPhotoId = uploadResult.mediaAssetId;
        } catch (photoError) {
          console.error('[handleAddItem] Error uploading photo:', photoError);
          toast.showError('Photo upload failed, but item was added');
        }
      }

      // Replace optimistic item with real item from server
      setBag((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item._optimisticId === optimisticId
            ? {
                ...newItem,
                photo_url: finalPhotoUrl,
                custom_photo_id: finalCustomPhotoId,
                links: [],
                _isPending: false,
                _optimisticId: undefined,
              }
            : item
        ),
      }));

      // Trigger background auto-enrichment (don't await - run silently)
      // Skip if we already have brand (from preview modal)
      if (!itemData.brand) {
        autoEnrichItem(newItem.id, itemData.custom_name);
      }
    } catch (error) {
      console.error('Error adding item:', error);

      // Remove optimistic item on failure
      setBag((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item._optimisticId !== optimisticId),
      }));

      toast.showError('Failed to add item. Please try again.');
      throw error; // Re-throw so caller knows it failed
    }
  };

  // Silent auto-enrichment for newly added items
  const autoEnrichItem = async (itemId: string, itemName: string) => {
    try {
      console.log(`[auto-enrich] Starting for "${itemName}" (${itemId})`);

      // Get AI suggestions for this item
      const enrichResult = await aiApi.enrichItem({
        userInput: itemName,
        bagContext: bag.title,
      });

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
        const updatedItem = await itemsApi.update(itemId, updates);
        console.log(`[auto-enrich] Updated "${itemName}" with:`, Object.keys(updates));

        // Update local state
        setBag((prev) => ({
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? { ...item, ...updatedItem } : item
          ),
        }));
      }

      // Also try to find and add a product link
      try {
        const linkSearchQuery = `${topSuggestion.brand || ''} ${itemName}`.trim();
        const linkResult = await aiApi.findProductImage({
          productName: linkSearchQuery,
          brandName: topSuggestion.brand,
        });

        // If we found a product URL, add it as a link
        if ((linkResult as any).productUrl) {
          const newLink = await itemsApi.addLink(itemId, {
            url: (linkResult as any).productUrl,
            kind: 'shop',
            is_auto_generated: true,
          }) as any as Link;

          console.log(`[auto-enrich] Added link for "${itemName}":`, (linkResult as any).productUrl);

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
      const linkResult = await aiApi.findProductImage({
        productName: searchQuery,
        brandName: brand || undefined,
      });

      // If we found a product URL, add it as a link
      if ((linkResult as any).productUrl) {
        const newLink = await itemsApi.addLink(itemId, {
          url: (linkResult as any).productUrl,
          kind: 'shop',
          is_auto_generated: true,
        }) as any as Link;

        console.log(`[auto-link] Added link for "${itemName}":`, (linkResult as any).productUrl);

        // Update local state with new link
        setBag((prev) => ({
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId
              ? { ...item, links: [...item.links, newLink] }
              : item
          ),
        }));
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
    const item = bag.items.find(i => i.id === itemId);
    const itemName = item?.custom_name || 'this item';

    const confirmed = await confirm({
      title: 'Delete Item',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Keep',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      await itemsApi.del(itemId);

      setBag((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      }));

      toast.showSuccess(`"${itemName}" deleted`);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.showError('Failed to delete item. Please try again.');
    }
  };

  // Handle item moved to another bag
  const handleItemMoved = (itemId: string, targetBagTitle: string) => {
    const movedItem = bag.items.find((item) => item.id === itemId);
    const itemName = movedItem?.custom_name || 'Item';

    // Remove item from local state
    setBag((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));

    toast.showSuccess(`"${itemName}" moved to "${targetBagTitle}"`);
  };

  // Batch reorder items - only sends changed items to API
  const handleReorderItems = async (items: Array<{ id: string; sort_index: number }>) => {
    try {
      await bagsApi.reorderItems(bag.code, items);

      // Update local state with new sort indices
      setBag((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          const update = items.find((u) => u.id === item.id);
          return update ? { ...item, sort_index: update.sort_index } : item;
        }),
      }));
    } catch (error: any) {
      console.error('[ReorderItems] Error:', error);
      throw error; // Re-throw so ItemList can handle revert
    }
  };

  const handleUpdateItem = async (
    itemId: string,
    updates: Partial<Omit<Item, 'id' | 'bag_id' | 'links'>>
  ) => {
    try {
      console.log('[UpdateItem] Updating item:', itemId, 'with:', updates);

      const updatedItem = await itemsApi.update(itemId, updates);
      console.log('[UpdateItem] Success:', updatedItem);

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
    } catch (error: any) {
      console.error('[UpdateItem] Error:', error);
      alert(error.message || 'Failed to update item. Please try again.');
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

  // Handle toggling hero item
  const handleToggleHero = async (itemId: string) => {
    const newHeroId = bag.hero_item_id === itemId ? null : itemId;

    try {
      const updatedBag = await bagsApi.update(bag.code, {
        hero_item_id: newHeroId,
      });

      setBag((prev) => ({ ...prev, hero_item_id: updatedBag.hero_item_id }));
    } catch (error) {
      console.error('Error updating hero item:', error);
    }
  };

  // Handle cover photo selection - opens cropper first
  const handleCoverPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read file as data URL to show in cropper
    const reader = new FileReader();
    reader.onload = () => {
      setCoverImageToCrop(reader.result as string);
      setShowCoverCropper(true);
    };
    reader.onerror = () => {
      console.error('Error reading file');
      alert('Failed to read image. Please try again.');
    };
    reader.readAsDataURL(file);

    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
  };

  // Handle cropping existing cover photo
  const handleCropExistingCover = async (imageUrl: string) => {
    try {
      // Fetch the existing image and convert to data URL for the cropper
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        setCoverImageToCrop(reader.result as string);
        setShowCoverCropper(true);
      };
      reader.onerror = () => {
        throw new Error('Failed to read image');
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error loading cover photo for cropping:', error);
      toast.showError('Failed to load image for cropping. Try uploading a new photo.');
    }
  };

  // Handle cropped cover photo upload
  const handleCroppedCoverPhotoUpload = async (croppedBlob: Blob, aspectRatio: AspectRatioId) => {
    setShowCoverCropper(false);
    setCoverImageToCrop(null);

    try {
      const formData = new FormData();
      formData.append('file', croppedBlob, 'cover-photo.jpg');
      formData.append('aspectRatio', aspectRatio);

      const uploadData = await bagsApi.uploadCoverPhoto(bag.code, formData);

      setBag((prev) => ({
        ...prev,
        cover_photo_id: uploadData.mediaAssetId,
        cover_photo_url: uploadData.url,
        cover_photo_aspect: uploadData.aspectRatio,
      }));

      toast.showSuccess('Cover photo updated!');
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      toast.showError('Failed to upload cover photo. Please try again.');
    }
  };

  // Handle removing cover photo
  const handleRemoveCoverPhoto = async () => {
    try {
      await bagsApi.deleteCoverPhoto(bag.code);

      setBag((prev) => ({
        ...prev,
        cover_photo_id: null,
        cover_photo_url: null,
        cover_photo_aspect: '21/9',
      }));
    } catch (error) {
      console.error('Error removing cover photo:', error);
    }
  };

  const handleDeleteBag = async () => {
    const confirmed = await confirm({
      title: 'Delete Bag',
      message: `Are you sure you want to delete "${bag.title}"? All items and photos will be permanently removed.`,
      confirmText: 'Delete Bag',
      cancelText: 'Keep',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      await bagsApi.del(bag.code);

      // Navigate back to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting bag:', error);
      toast.showError('Failed to delete bag. Please try again.');
    }
  };

  // Handle photo pipeline completion
  const handlePipelineComplete = useCallback((result: PhotoPipelineResult) => {
    setCapturedPhotoBase64(result.sourceImageBase64);
    setPipelineStats(result.pipeline ? {
      totalDetected: result.pipeline.totalDetected,
      totalIdentified: result.pipeline.totalIdentified,
      totalVerified: result.pipeline.totalVerified,
    } : null);
    setIdentifiedProducts({
      products: result.products as IdentifiedProduct[],
      totalConfidence: result.totalConfidence,
      processingTime: result.processingTime,
    });
    setShowPhotoUpload(false);
    setShowProductReview(true);
  }, []);

  // Step 29: Batch item creation from AI results
  const handleAddSelectedProducts = async (selectedProducts: IdentifiedProduct[], uploadedPhotoFile?: File) => {
    try {
      // Create all items in parallel for better performance
      const createdItems = await Promise.all(
        selectedProducts.map(async (product, index) => {
          const newItem = await bagsApi.addItem(bag.code, {
            custom_name: product.name,
            brand: product.brand || null,
            custom_description: product.specifications
              ? product.specifications.join(' | ')
              : product.category,
            notes: product.estimatedPrice
              ? `Est. price: ${product.estimatedPrice}`
              : undefined,
            quantity: 1,
            // Set photo_url as fallback (external URL from product image)
            // If upload to storage succeeds later, custom_photo_id will override this
            photo_url: product.productImage?.imageUrl || undefined,
          });

          // Try to upload a photo for this item
          // Priority: 1) User's source photo from bulk upload (via sourceImageIndex)
          //           2) User's captured photo (for single item legacy flow)
          //           3) Google product image
          console.log('[AddProduct] Photo sources:', {
            productName: product.name,
            sourceImageIndex: product.sourceImageIndex,
            capturedPhotosArrayLength: capturedPhotosArray.length,
            hasCapturedPhotoBase64: !!capturedPhotoBase64,
            hasProductImage: !!product.productImage?.imageUrl,
          });

          const sourcePhotoFromBulk = typeof product.sourceImageIndex === 'number' &&
            capturedPhotosArray[product.sourceImageIndex];
          const shouldUseLegacyUserPhoto = capturedPhotoBase64 && selectedProducts.length === 1;
          const userPhotoToUse = sourcePhotoFromBulk || (shouldUseLegacyUserPhoto ? capturedPhotoBase64 : null);

          console.log('[AddProduct] Photo decision:', {
            hasSourcePhotoFromBulk: !!sourcePhotoFromBulk,
            shouldUseLegacyUserPhoto,
            willUploadUserPhoto: !!userPhotoToUse,
          });

          if (userPhotoToUse) {
            // Upload the user's captured photo
            try {
              if (typeof userPhotoToUse !== 'string') {
                console.error('Photo data is not a string:', typeof userPhotoToUse);
                throw new Error('Invalid photo data type');
              }

              // Use robust helper that handles mobile browser quirks
              // (URL-safe base64, missing padding, whitespace, etc.)
              let blob: Blob;
              const dataUrl = userPhotoToUse.startsWith('data:')
                ? userPhotoToUse
                : `data:image/jpeg;base64,${userPhotoToUse}`;

              try {
                blob = await dataUrlToBlob(dataUrl);
              } catch (convError) {
                console.error('Failed to convert data URL to blob:', convError);
                throw new Error('Failed to process image');
              }

              // Validate blob
              if (!blob || blob.size === 0) {
                console.error('Failed to create blob from photo data');
                throw new Error('Empty photo data');
              }

              console.log('Created blob:', { type: blob.type, size: blob.size });

              // Upload to our storage
              const formData = new FormData();
              // Sanitize filename - remove special characters that break Supabase storage
              const sanitizedName = product.name.replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 50);
              formData.append('file', blob, `${sanitizedName}-${Date.now()}.jpg`);
              formData.append('itemId', newItem.id);

              const uploadData = await mediaApi.upload(formData);

              // Update item with photo
              await itemsApi.update(newItem.id, {
                custom_photo_id: uploadData.mediaAssetId,
              });

              newItem.custom_photo_id = uploadData.mediaAssetId;
              newItem.photo_url = uploadData.url;
            } catch (photoError) {
              console.error(`Failed to upload user photo for ${product.name}:`, photoError);
              // Continue without photo - don't fail the whole operation
            }
          } else if (product.productImage?.imageUrl) {
            // Use server-side upload-from-url to bypass CORS for Google images
            try {
              // Sanitize filename
              const sanitizedName = product.name.replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 50);
              const uploadData = await mediaApi.uploadFromUrl({
                imageUrl: product.productImage.imageUrl,
                itemId: newItem.id,
                filename: `${sanitizedName}.jpg`,
              });

              // Update item with photo
              await itemsApi.update(newItem.id, {
                custom_photo_id: uploadData.mediaAssetId,
              });

              newItem.custom_photo_id = uploadData.mediaAssetId;
              newItem.photo_url = uploadData.url;
            } catch (photoError) {
              console.error(`Failed to upload product image for ${product.name}:`, photoError);
              // Continue without photo - don't fail the whole operation
            }
          }

          return newItem;
        })
      );

      // Update bag state with new items
      const newItemCount = bag.items.length + createdItems.length;
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
      setCapturedPhotosArray([]); // Clear the bulk photos array

      // Celebrate batch add
      celebrateItemAdded();

      // Check for milestone celebrations
      celebrateMilestone(newItemCount);

      // Show success message
      toast.showAI(`Successfully added ${createdItems.length} items to your bag!`);

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
      toast.showError(error.message || 'Failed to add some items. Please try again.');
      throw error; // Re-throw so ProductReviewModal can handle it
    }
  };

  // Fill product info handler - generates suggestions and shows preview modal
  const handleFillLinks = async (itemIds?: string[]) => {
    setIsFillingLinks(true);

    try {
      const result = await itemsApi.previewEnrichment(bag.id, itemIds || []);

      if (!result.suggestions || result.suggestions.length === 0) {
        alert('No items to enrich! Add some items to your bag first.');
        return;
      }

      // Show preview modal
      setEnrichmentSuggestions(result.suggestions);
      setShowEnrichmentPreview(true);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert('Failed to generate suggestions. Please try again.');
    } finally {
      setIsFillingLinks(false);
    }
  };

  // Enrich a single item — triggers preview-enrichment for just that item
  const handleEnrichSingleItem = async (itemId: string) => {
    setEnrichingItemId(itemId);
    try {
      await handleFillLinks([itemId]);
    } finally {
      setEnrichingItemId(null);
    }
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

      const result = await itemsApi.applyEnrichment({
        bagId: bag.id,
        approvedSuggestions,
      });

      // Refresh bag
      try {
        const updatedBag = await bagsApi.get(bag.code);
        setBag(updatedBag as unknown as Bag);
      } catch {
        // Refresh failed, but enrichment was applied
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
        toast.showAI(`${messages.join(' • ')} — Bag updated!`);
      }
    } catch (error) {
      console.error('Error applying enrichments:', error);
      toast.showError('Failed to apply changes. Please try again.');
    }
  };

  // Batch photo application handler - handles partial failures gracefully
  const handleApplyBatchPhotos = async (selections: Array<{ itemId: string; imageUrl: string }>) => {
    console.log('[BatchPhotos] Applying photos:', selections);

    // Use Promise.allSettled to handle partial failures
    const results = await Promise.allSettled(
      selections.map(async ({ itemId, imageUrl }) => {
        console.log('[BatchPhotos] Uploading photo for item:', itemId, imageUrl.substring(0, 50));

        // Use server-side upload-from-url to download and upload in one step
        const uploadData = await mediaApi.uploadFromUrl({
          imageUrl,
          itemId,
          filename: 'product.jpg',
        });

        // Update item with photo
        await itemsApi.update(itemId, {
          custom_photo_id: uploadData.mediaAssetId,
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

        return { itemId, success: true };
      })
    );

    // Count successes and failures
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // Log failures for debugging
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[BatchPhotos] Failed for item ${selections[index].itemId}:`, result.reason);
      }
    });

    // Show appropriate message
    if (failed === 0) {
      toast.showAI(`Successfully added ${succeeded} photos!`);
    } else if (succeeded > 0) {
      toast.showInfo(`Added ${succeeded} photos. ${failed} failed.`);
    } else {
      throw new Error('Failed to add any photos. Please try again.');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header - Scrolls away with content */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-3 sm:pb-4">
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
              {/* View Public Page Button */}
              <NextLink href={`/u/${ownerHandle}/${bag.code}`}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-[44px] min-w-[44px] p-2.5"
                >
                  <Eye className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">View</span>
                </Button>
              </NextLink>

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

              {/* Completion Button */}
              <BagCompletionButton
                bagCode={bag.code}
                isComplete={bag.is_complete}
                onCompletionChange={(isComplete) => {
                  setBag((prev) => ({
                    ...prev,
                    is_complete: isComplete,
                    completed_at: isComplete ? new Date().toISOString() : null,
                  }));
                }}
                size="sm"
              />

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
            {/* Editable Description with AI Generate */}
            <div className="flex-1 flex items-start gap-1.5 min-w-0">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={1}
                className="flex-1 text-sm text-[var(--text-secondary)] text-base w-full border-0 border-b-2 border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--teed-green-8)] focus:outline-none bg-transparent px-0 py-1 resize-none transition-colors placeholder:text-[var(--input-placeholder)] min-w-0"
              />
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDescription}
                className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--sky-11)] bg-[var(--sky-3)] hover:bg-[var(--sky-4)] rounded-md transition-colors disabled:opacity-50"
                title="AI Generate Description"
              >
                {isGeneratingDescription ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Save Status & Privacy Label */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] flex-shrink-0">
              {isSaving ? (
                <span className="flex items-center">
                  <GolfLoader size="sm" />
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
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
              {isPublic && !category && (
                <span className="text-xs text-amber-500">
                  Pick a category so your bag appears in discover filters
                </span>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Cover Photo (display only when present) */}
        {bag.cover_photo_url && (
          <div className="mb-4">
            <div
              className="relative rounded-lg overflow-hidden bg-[var(--sky-2)] border border-[var(--border-subtle)]"
              style={{ aspectRatio: (bag.cover_photo_aspect || '21/9').replace('/', ' / ') }}
            >
              <img
                src={bag.cover_photo_url}
                alt="Bag cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => handleCropExistingCover(bag.cover_photo_url!)}
                  className="p-2 bg-[var(--surface)] rounded-full shadow-md hover:bg-[var(--surface-hover)] transition-colors"
                  title="Crop cover photo"
                >
                  <svg className="w-4 h-4 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                    <path d="M18 22V8a2 2 0 0 0-2-2H2" />
                  </svg>
                </button>
                <label
                  className="p-2 bg-[var(--surface)] rounded-full shadow-md hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                  title="Upload new cover photo"
                >
                  <Camera className="w-4 h-4 text-[var(--text-secondary)]" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleCoverPhotoSelect}
                  />
                </label>
                <button
                  onClick={handleRemoveCoverPhoto}
                  className="p-2 bg-[var(--surface)] rounded-full shadow-md hover:bg-[var(--surface-hover)] transition-colors"
                  title="Remove cover photo"
                >
                  <X className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bag Tools Menu */}
        <div className="mb-6">
          <BagToolsMenu
            showAnalytics={isPublic}
            hasCoverPhoto={!!bag.cover_photo_url}
            itemCount={bag.items.length}
            renderQuickAdd={(onDismiss) => (
              <>
                {!showManualForm ? (
                  <QuickAddItem
                    onAdd={async (suggestion) => {
                      const isVideoUrl = (url: string): boolean => {
                        const videoPatterns = [
                          /youtube\.com\/watch/,
                          /youtu\.be\//,
                          /youtube\.com\/shorts\//,
                          /tiktok\.com\/@.+\/video\//,
                          /tiktok\.com\/t\//,
                          /vm\.tiktok\.com\//,
                          /instagram\.com\/(?:p|reel|reels)\//,
                        ];
                        return videoPatterns.some(pattern => pattern.test(url));
                      };

                      console.log('[QuickAddItem] Creating item:', {
                        imageUrl: suggestion.imageUrl,
                        productUrl: suggestion.productUrl,
                        uploadedImageBase64: !!suggestion.uploadedImageBase64,
                      });
                      const newItem = await bagsApi.addItem(bag.code, {
                        custom_name: suggestion.custom_name,
                        custom_description: suggestion.custom_description || undefined,
                        notes: suggestion.notes || undefined,
                        quantity: 1,
                        brand: suggestion.brand || undefined,
                        photo_url: suggestion.imageUrl || undefined,
                      });
                      console.log('[QuickAddItem] Item created:', newItem.id);
                      let finalPhotoUrl: string | null = null;
                      let finalCustomPhotoId: string | null = null;

                      const base64ToBlob = (base64DataUrl: string): Blob => {
                        const [header, data] = base64DataUrl.split(',');
                        const mimeMatch = header.match(/data:([^;]+);/);
                        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
                        const byteString = atob(data);
                        const arrayBuffer = new ArrayBuffer(byteString.length);
                        const uint8Array = new Uint8Array(arrayBuffer);
                        for (let i = 0; i < byteString.length; i++) {
                          uint8Array[i] = byteString.charCodeAt(i);
                        }
                        return new Blob([uint8Array], { type: mimeType });
                      };

                      if (suggestion.uploadedImageBase64) {
                        try {
                          console.log('[QuickAddItem] Uploading user photo (base64)...');
                          const blob = base64ToBlob(suggestion.uploadedImageBase64);
                          const file = new File([blob], `${suggestion.custom_name || 'product'}-photo.jpg`, { type: blob.type });

                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('itemId', newItem.id);

                          const uploadResult = await mediaApi.upload(formData);
                          console.log('[QuickAddItem] User photo uploaded:', uploadResult);

                          await itemsApi.update(newItem.id, {
                            custom_photo_id: uploadResult.mediaAssetId,
                          });

                          finalPhotoUrl = uploadResult.url;
                          finalCustomPhotoId = uploadResult.mediaAssetId;
                        } catch (error) {
                          console.error('[QuickAddItem] Error uploading user photo:', error);
                        }
                      } else if (suggestion.imageUrl) {
                        try {
                          console.log('[QuickAddItem] Uploading image from URL:', suggestion.imageUrl);
                          const uploadResult = await mediaApi.uploadFromUrl({
                            imageUrl: suggestion.imageUrl,
                            itemId: newItem.id,
                            filename: `${suggestion.custom_name || 'product'}-thumbnail.jpg`,
                          });
                          console.log('[QuickAddItem] Image uploaded:', uploadResult);

                          await itemsApi.update(newItem.id, {
                            custom_photo_id: uploadResult.mediaAssetId,
                          });

                          finalPhotoUrl = uploadResult.url;
                          finalCustomPhotoId = uploadResult.mediaAssetId;
                        } catch (error) {
                          console.error('[QuickAddItem] Error uploading image:', error);
                        }
                      }

                      let newLinks: any[] = [];
                      if (suggestion.productUrl) {
                        try {
                          const linkKind = isVideoUrl(suggestion.productUrl) ? 'video' : 'product';

                          const newLink = await itemsApi.addLink(newItem.id, {
                            url: suggestion.productUrl,
                            kind: linkKind,
                            label: suggestion.custom_name || 'Product Link',
                          });
                          newLinks = [newLink];
                        } catch (error) {
                          console.error('Failed to add product link:', error);
                        }
                      }

                      setBag((prev) => ({
                        ...prev,
                        items: [...prev.items, {
                          ...newItem,
                          photo_url: finalPhotoUrl,
                          custom_photo_id: finalCustomPhotoId,
                          links: newLinks,
                        }],
                      }));

                      toast.showSuccess(`Added "${suggestion.custom_name}" to bag`);
                    }}
                    bagTitle={bag.title}
                    onShowManualForm={() => setShowManualForm(true)}
                    onAddFromLink={(url) => {
                      setLinkImportInitialUrl(url);
                      setShowBulkLinkImport(true);
                    }}
                  />
                ) : (
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
              </>
            )}
            onBulkAddFromLinks={() => setShowBulkLinkImport(true)}
            onBulkAddFromText={() => setShowBulkTextAdd(true)}
            onScanPhoto={() => setShowPhotoUpload(true)}
            onPhotoMatch={() => setShowItemSelection(true)}
            onEnhanceDetails={() => setShowEnrichmentItemSelection(true)}
            renderCoverPhoto={(onDismiss) => (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[var(--border-subtle)] rounded-lg cursor-pointer hover:border-[var(--teed-green-8)] hover:bg-[var(--surface-hover)] transition-colors">
                <div className="flex flex-col items-center justify-center py-6">
                  <Image className="w-8 h-8 text-[var(--text-tertiary)] mb-2" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    <span className="font-medium text-[var(--teed-green-9)]">Click to upload</span> a cover photo
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">PNG, JPG up to 10MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    onDismiss();
                    handleCoverPhotoSelect(e);
                  }}
                />
              </label>
            )}
            renderAnalytics={(onDismiss) => (
              <BagAnalytics bagId={bag.id} />
            )}
          />
        </div>

        {/* Items List */}
        {bag.items.length > 0 ? (
          <ItemList
            items={bag.items}
            onDelete={handleDeleteItem}
            onUpdate={handleUpdateItem}
            onReorder={handleReorderItems}
            bagCode={bag.code}
            heroItemId={bag.hero_item_id}
            onToggleHero={handleToggleHero}
            onItemMoved={handleItemMoved}
            onEnrichItem={handleEnrichSingleItem}
            enrichingItemId={enrichingItemId}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 px-4 bg-gradient-to-b from-[var(--teed-green-2)] to-transparent rounded-xl border-2 border-dashed border-[var(--teed-green-5)]"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Package className="mx-auto h-12 w-12 text-[var(--teed-green-8)]" />
            </motion.div>
            <h3 className="mt-3 text-base font-semibold text-[var(--text-primary)]">No items yet</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
              Use the Quick Add box above to add your first item - type a name or upload a photo!
            </p>
            <motion.div
              className="mt-4 flex justify-center gap-2"
              animate={{
                y: [0, -2, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[var(--teed-green-10)] bg-[var(--teed-green-3)] rounded-full">
                <Sparkles className="w-3 h-3" />
                AI-powered identification
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* History - Timeline with visibility controls */}
        <div className="mt-8 pt-8 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-[var(--text-secondary)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              History
            </h3>
            <span className="text-xs text-[var(--text-tertiary)] ml-2">
              Click the eye icon to show/hide entries from public view
            </span>
          </div>
          <StoryTimeline
            bagCode={bag.code}
            maxItems={10}
            showFilters={true}
            groupByTimePeriod={true}
            isOwner={true}
            onItemClick={(entry) => {
              // Scroll to item and highlight it
              if ('itemId' in entry && entry.itemId && 'itemExists' in entry && entry.itemExists) {
                const itemId = entry.itemId;
                const el = document.getElementById(`item-${itemId}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // Add highlight effect
                  el.classList.add('ring-2', 'ring-[var(--teed-green-6)]', 'ring-offset-2');
                  setTimeout(() => {
                    el.classList.remove('ring-2', 'ring-[var(--teed-green-6)]', 'ring-offset-2');
                  }, 2000);
                }
              }
            }}
          />
        </div>
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


      {/* Bulk Link Import Modal */}
      <BulkLinkImportModal
        isOpen={showBulkLinkImport}
        onClose={() => {
          setShowBulkLinkImport(false);
          setLinkImportInitialUrl(undefined);
        }}
        bagCode={bag.code}
        initialUrl={linkImportInitialUrl}
        onItemsAdded={(count) => {
          // Refresh the bag data to get new items
          toast.showAI(`Added ${count} item${count !== 1 ? 's' : ''} from links!`);
          // Trigger a refresh by fetching updated bag data
          bagsApi.get(bag.code)
            .then(updatedBag => {
              if (updatedBag && updatedBag.items) {
                setBag(prev => ({
                  ...prev,
                  items: updatedBag.items as Item[],
                }));
              }
            })
            .catch(err => console.error('Error refreshing bag:', err));
        }}
      />

      {/* Bulk Text Add Modal */}
      <BulkTextAddModal
        isOpen={showBulkTextAdd}
        onClose={() => setShowBulkTextAdd(false)}
        bagCode={bag.code}
        onItemsAdded={(count) => {
          toast.showAI(`Added ${count} item${count !== 1 ? 's' : ''} from text!`);
          bagsApi.get(bag.code)
            .then(updatedBag => {
              if (updatedBag && updatedBag.items) {
                setBag(prev => ({
                  ...prev,
                  items: updatedBag.items as Item[],
                }));
              }
            })
            .catch(err => console.error('Error refreshing bag:', err));
        }}
      />

      {/* Photo Upload + Pipeline Modal */}
      <PhotoUploadModal
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        onPhotoCapture={(base64) => {
          setCapturedPhotoBase64(base64);
          setShowPhotoUpload(false);
        }}
        onPipelineComplete={handlePipelineComplete}
        bagType={bag.category || undefined}
      />

      {/* Product Review Modal */}
      {identifiedProducts && (
        <ProductReviewModal
          isOpen={showProductReview}
          onClose={() => {
            setShowProductReview(false);
            setIdentifiedProducts(null);
            setPipelineStats(null);
          }}
          products={identifiedProducts.products}
          totalConfidence={identifiedProducts.totalConfidence}
          processingTime={identifiedProducts.processingTime}
          onAddSelected={handleAddSelectedProducts}
          pipelineStats={pipelineStats ?? undefined}
        />
      )}


      {/* Item Selection Modal for Photos */}
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
          // Look up full item data from bag.items to get links property
          const selectedIds = new Set(selectedItems.map(i => i.id));
          const fullItems = bag.items.filter(item => selectedIds.has(item.id));
          setSelectedItemsForPhotos(fullItems);
          setShowItemSelection(false);
          setShowBatchPhotoSelector(true);
        }}
        title="Select Items for Photo Search"
        description="Choose which items you want to search for photos"
      />

      {/* Item Selection Modal for Auto-Fill Details */}
      <ItemSelectionModal
        isOpen={showEnrichmentItemSelection}
        onClose={() => setShowEnrichmentItemSelection(false)}
        items={bag.items.map(item => ({
          id: item.id,
          custom_name: item.custom_name || 'Unnamed Item',
          brand: item.brand,
          custom_description: item.custom_description,
          currentPhotoUrl: item.photo_url,
          hasDetails: !!(item.brand && item.custom_description && item.notes),
        }))}
        onConfirm={(selectedItems) => {
          const selectedIds = selectedItems.map(i => i.id);
          setShowEnrichmentItemSelection(false);
          handleFillLinks(selectedIds);
        }}
        title="Select Items to Auto-Fill"
        description="Choose which items you want to generate details for"
        mode="enrichment"
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
          // Get the first product URL from item links for image extraction
          productUrl: item.links?.find(link => link.url)?.url || null,
        }))}
        onApplyPhotos={handleApplyBatchPhotos}
      />

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

      {/* Cover Photo Cropper Modal */}
      {showCoverCropper && coverImageToCrop && (
        <CoverPhotoCropper
          imageSrc={coverImageToCrop}
          onComplete={handleCroppedCoverPhotoUpload}
          onCancel={() => {
            setShowCoverCropper(false);
            setCoverImageToCrop(null);
          }}
          initialAspectRatio={(bag.cover_photo_aspect as AspectRatioId) || '21/9'}
        />
      )}

      {/* Editor Onboarding - First-run tips */}
      <EditorOnboarding />
    </div>
  );
}
