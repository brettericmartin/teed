'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import ImageCropModal from './ImageCropModal';

type ItemPhotoUploadProps = {
  itemId: string;
  currentPhotoUrl?: string | null;
  existingMediaAssetId?: string | null;
  onPhotoUploaded: (mediaAssetId: string, photoUrl: string) => void;
  onPhotoRemoved?: () => void;
  itemName: string;
  itemBrand?: string | null;
  itemDescription?: string | null;
};

export default function ItemPhotoUpload({
  itemId,
  currentPhotoUrl,
  existingMediaAssetId,
  onPhotoUploaded,
  onPhotoRemoved,
  itemName,
  itemBrand,
  itemDescription,
}: ItemPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isFindingImage, setIsFindingImage] = useState(false);
  const [isLoadingForCrop, setIsLoadingForCrop] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [imageSuggestions, setImageSuggestions] = useState<string[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const MAX_SIZE_MB = 10;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowPhotoMenu(false);
      }
    };

    if (showPhotoMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPhotoMenu]);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      setError(`Image too large. Maximum size is ${MAX_SIZE_MB}MB`);
      return;
    }

    // Show crop modal for manual upload
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      // Validate data URL format (important for mobile compatibility)
      if (!result || typeof result !== 'string' || !result.startsWith('data:image/')) {
        console.error('Invalid image data from FileReader:', typeof result, (result as string)?.substring?.(0, 30));
        setError('Failed to read image. Please try again.');
        return;
      }
      setSelectedImageUrl(result);
      setIsCropModalOpen(true);
    };
    reader.onerror = () => {
      setError('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFindProductImage = async () => {
    setIsFindingImage(true);
    setError(null);
    setImageSuggestions([]);

    try {
      let searchQuery: string;

      // If we have a description, use AI to enhance it
      if (itemDescription && itemDescription.trim()) {
        console.log('Enhancing search query with AI from description:', itemDescription);

        const enhanceResponse = await fetch('/api/ai/enhance-search-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: itemDescription.trim(),
            productName: itemName,
            brand: itemBrand || undefined,
          }),
        });

        if (!enhanceResponse.ok) {
          console.warn('AI enhancement failed, falling back to basic query');
          // Fall back to basic query if AI enhancement fails
          const queryParts = [itemName];
          if (itemBrand) queryParts.unshift(itemBrand);
          searchQuery = queryParts.join(' ');
        } else {
          const enhanceData = await enhanceResponse.json();
          searchQuery = enhanceData.query;
          console.log('AI-enhanced query:', searchQuery);
        }
      } else {
        // Build basic query from item name and brand
        const queryParts = [itemName];
        if (itemBrand) queryParts.unshift(itemBrand);
        searchQuery = queryParts.join(' ');
        console.log('Using basic query:', searchQuery);
      }

      // Use Google Custom Search to find product images
      const response = await fetch('/api/ai/find-product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to find product images');
      }

      const data = await response.json();
      console.log('Found images:', data.images);

      if (data.images && data.images.length > 0) {
        setImageSuggestions(data.images);
        setShowImagePicker(true);
      } else {
        setError('No product images found. Try adding more details to the description or upload your own.');
      }
    } catch (err: any) {
      console.error('Find image error:', err);
      setError(err.message || 'Failed to find product images');
    } finally {
      setIsFindingImage(false);
    }
  };

  const handleSelectGoogleImage = async (imageUrl: string) => {
    setIsUploading(true);
    setError(null);

    try {
      console.log('Uploading image from URL:', imageUrl);

      // Use server-side endpoint to bypass CORS
      const uploadResponse = await fetch('/api/media/upload-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          itemId,
          filename: `${itemName.replace(/[^a-z0-9]/gi, '-')}.jpg`,
          existingMediaAssetId: existingMediaAssetId || undefined,
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      console.log('Image uploaded successfully:', uploadData);

      onPhotoUploaded(uploadData.mediaAssetId, uploadData.url);
      setPreview(uploadData.url);
      setShowImagePicker(false);
      setImageSuggestions([]);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    setIsCropModalOpen(false);

    // Show preview of cropped image
    const croppedImageUrl = URL.createObjectURL(croppedImage);
    setPreview(croppedImageUrl);

    // Upload the cropped image
    await uploadPhoto(croppedImage);
  };

  const handleCropCancel = () => {
    setIsCropModalOpen(false);
    setSelectedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadPhoto = async (file: File | Blob) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      // Convert Blob to File if needed
      const fileToUpload = file instanceof File
        ? file
        : new File([file], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' });

      formData.append('file', fileToUpload);
      formData.append('itemId', itemId);
      // Pass existing media asset ID so server can delete it
      if (existingMediaAssetId) {
        formData.append('existingMediaAssetId', existingMediaAssetId);
      }

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload photo');
      }

      const data = await response.json();

      // Call parent callback with media asset ID and URL
      onPhotoUploaded(data.mediaAssetId, data.url);

      setPreview(data.url);
    } catch (err: any) {
      console.error('Photo upload error:', err);
      setError(err.message || 'Failed to upload photo');
      setPreview(currentPhotoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onPhotoRemoved) {
      onPhotoRemoved();
    }
  };

  const handleCropExistingPhoto = async () => {
    if (!preview) return;

    setIsLoadingForCrop(true);
    setError(null);
    setShowPhotoMenu(false);

    try {
      // Fetch the image through our proxy to avoid CORS issues
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(preview)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error('Failed to load image for cropping');
      }

      const blob = await response.blob();

      // Convert blob to data URL for the cropper
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (!result || typeof result !== 'string' || !result.startsWith('data:image/')) {
          setError('Failed to process image for cropping');
          setIsLoadingForCrop(false);
          return;
        }
        setSelectedImageUrl(result);
        setIsCropModalOpen(true);
        setIsLoadingForCrop(false);
      };
      reader.onerror = () => {
        setError('Failed to read image for cropping');
        setIsLoadingForCrop(false);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      console.error('Error loading image for crop:', err);
      setError(err.message || 'Failed to load image for cropping');
      setIsLoadingForCrop(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || isFindingImage}
      />

      {/* Preview or Upload Options */}
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Item photo"
            className="w-full h-32 object-contain bg-gray-50 rounded-lg border-2 border-gray-200"
          />
          <div className="absolute top-2 right-2 flex gap-1.5">
            {/* Crop button */}
            <button
              onClick={handleCropExistingPhoto}
              disabled={isUploading || isLoadingForCrop}
              className="p-1.5 bg-white rounded-full shadow-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              title="Crop photo"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 3v4M3 7h4m10 0h4m-4 10v4m0-4h4M7 21v-4m0 0H3m4 0V7m10 10V7M7 7h10v10H7z"
                />
              </svg>
            </button>

            {/* Change photo button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-1.5 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Change photo"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* Remove photo button */}
            <button
              onClick={handleRemovePhoto}
              disabled={isUploading}
              className="p-1.5 bg-white rounded-full shadow-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              title="Remove photo"
            >
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
          {(isUploading || isLoadingForCrop) && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
              <div className="flex items-center gap-2 text-white">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm font-medium">{isLoadingForCrop ? 'Loading...' : 'Uploading...'}</span>
              </div>
            </div>
          )}
        </div>
      ) : showImagePicker ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Choose Product Image</h5>
              <p className="text-xs text-gray-500 mt-0.5">Select the best match for your item</p>
            </div>
            <button
              onClick={() => {
                setShowImagePicker(false);
                setImageSuggestions([]);
              }}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              ← Back
            </button>
          </div>

          {/* Image Gallery */}
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
            {imageSuggestions.map((imageUrl, index) => (
              <div
                key={index}
                className="relative border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all bg-white overflow-hidden cursor-pointer"
                onClick={() => !isUploading && handleSelectGoogleImage(imageUrl)}
              >
                <div className="h-48 w-full flex items-center justify-center p-3">
                  <img
                    src={imageUrl}
                    alt={`Product option ${index + 1}`}
                    className="max-w-full max-h-full object-contain"
                    onLoad={() => console.log('Image loaded:', imageUrl)}
                    onError={(e) => {
                      console.error('Image failed to load:', imageUrl);
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23999"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>

                {/* Loading overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-xs text-white font-medium">Uploading...</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Helper text */}
          <p className="text-xs text-gray-500 text-center mt-2">
            Found {imageSuggestions.length} product images
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {/* Find Product Image */}
          <button
            onClick={handleFindProductImage}
            disabled={isUploading || isFindingImage}
            className="h-32 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg hover:border-blue-400 hover:bg-blue-100 transition-colors flex flex-col items-center justify-center gap-2 text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-sm font-medium">
              {isFindingImage ? 'Searching...' : 'Find Product Image'}
            </span>
            <span className="text-xs">Search Google</span>
          </button>

          {/* Upload Your Own */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isFindingImage}
            className="h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-sm font-medium">
              {isUploading ? 'Uploading...' : 'Upload Your Own'}
            </span>
            <span className="text-xs">With cropping</span>
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-2">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Crop Modal */}
      {selectedImageUrl && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageUrl={selectedImageUrl}
          onClose={handleCropCancel}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
