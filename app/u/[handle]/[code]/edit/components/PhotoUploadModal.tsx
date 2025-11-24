'use client';

import { useState, useRef, ChangeEvent } from 'react';

type PhotoUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCapture: (base64Image: string) => void;
  bagType?: string;
};

// Compress image to target size while maintaining quality
async function compressImage(base64: string, maxSizeKB: number = 3500): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Max dimension for good quality while reducing size
      const MAX_DIMENSION = 2000;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels to get under target size
      let quality = 0.9;
      let result = canvas.toDataURL('image/jpeg', quality);

      // Reduce quality until we're under the target size
      while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.3) { // 1.37 accounts for base64 overhead
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(result);
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = base64;
  });
}

export default function PhotoUploadModal({
  isOpen,
  onClose,
  onPhotoCapture,
  bagType,
}: PhotoUploadModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE_MB = 20; // Accept larger files since we'll compress them
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

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

    setIsProcessing(true);

    try {
      // Read file as base64
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;

          // Check if image needs compression (> 3.5MB to stay under Vercel's 4.5MB limit)
          const sizeKB = Math.round((base64.length * 3) / 4 / 1024);
          let finalBase64 = base64;

          if (sizeKB > 3500) {
            console.log(`Compressing image from ${sizeKB}KB...`);
            finalBase64 = await compressImage(base64, 3500);
            const newSizeKB = Math.round((finalBase64.length * 3) / 4 / 1024);
            console.log(`Compressed to ${newSizeKB}KB`);
          }

          setPreview(finalBase64);
          setIsProcessing(false);
        } catch (compressError) {
          console.error('Compression error:', compressError);
          setError('Failed to process image. Please try a smaller file.');
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read image file');
        setIsProcessing(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image');
      setIsProcessing(false);
    }
  };

  const handleCameraCapture = () => {
    // On mobile, this will open the camera
    // On desktop, it will open file picker
    fileInputRef.current?.click();
  };

  const handleUsePhoto = () => {
    if (preview) {
      onPhotoCapture(preview);
      handleReset();
    }
  };

  const handleReset = () => {
    setPreview(null);
    setError(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseModal = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[var(--overlay-bg)] transition-opacity"
        onClick={handleCloseModal}
      />

      {/* Modal */}
      <div className="flex min-h-full items-start md:items-center justify-center md:p-4">
        <div className="relative bg-[var(--surface)] md:rounded-[var(--radius-xl)] shadow-[var(--shadow-4)] w-full h-full md:h-auto md:max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Upload Product Photo
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Take a photo or select from your device
                {bagType && ` (${bagType} items)`}
              </p>
            </div>
            <button
              onClick={handleCloseModal}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors rounded-lg hover:bg-[var(--surface-hover)] active:bg-[var(--surface-active)]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!preview ? (
              // Upload buttons
              <div className="space-y-4">
                {/* Camera button (primary on mobile) */}
                <button
                  onClick={handleCameraCapture}
                  disabled={isProcessing}
                  className="w-full py-4 px-6 bg-[var(--button-primary-bg)] hover:bg-[var(--button-primary-bg-hover)] text-[var(--button-primary-text)] font-medium rounded-[var(--radius-lg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  {isProcessing ? 'Processing...' : 'Take Photo'}
                </button>

                {/* File upload button (secondary) */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full py-4 px-6 bg-[var(--button-secondary-bg)] hover:bg-[var(--button-secondary-bg-hover)] text-[var(--button-secondary-text)] font-medium rounded-[var(--radius-lg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Choose from Device
                </button>

                {/* Info box */}
                <div className="bg-[var(--sky-2)] border border-[var(--sky-6)] rounded-[var(--radius-lg)] p-4 mt-6">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-[var(--sky-11)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-[var(--sky-11)]">Tips for best results</h3>
                      <ul className="mt-2 text-sm text-[var(--sky-11)] space-y-1">
                        <li>• Take clear, well-lit photos</li>
                        <li>• Include multiple items in one photo</li>
                        <li>• Ensure products are visible and in focus</li>
                        <li>• Large photos will be automatically optimized</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Preview and confirm
              <div className="space-y-4">
                {/* Image preview */}
                <div className="relative rounded-[var(--radius-lg)] overflow-hidden bg-[var(--sand-2)]">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
                  >
                    Take Another
                  </button>
                  <button
                    onClick={handleUsePhoto}
                    className="px-6 py-3 bg-[var(--button-primary-bg)] hover:bg-[var(--button-primary-bg-hover)] text-[var(--button-primary-text)] font-medium rounded-[var(--radius-lg)] transition-colors"
                  >
                    Identify Products
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mt-4 bg-[var(--copper-2)] border border-[var(--copper-6)] rounded-[var(--radius-lg)] p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-[var(--copper-11)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-[var(--copper-11)]">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
