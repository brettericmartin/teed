'use client';

import { useState, useRef, ChangeEvent } from 'react';

type PhotoUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCapture: (base64Image: string) => void;
  bagType?: string;
};

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

  const MAX_SIZE_MB = 2;
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

      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPreview(base64);
        setIsProcessing(false);
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
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleCloseModal}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Upload Product Photo
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Take a photo or select from your device
                {bagType && ` (${bagType} items)`}
              </p>
            </div>
            <button
              onClick={handleCloseModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
              capture="environment" // Use rear camera on mobile
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
                  className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
                  className="w-full py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-blue-900">Tips for best results</h3>
                      <ul className="mt-2 text-sm text-blue-700 space-y-1">
                        <li>• Take clear, well-lit photos</li>
                        <li>• Include multiple items in one photo</li>
                        <li>• Ensure products are visible and in focus</li>
                        <li>• Maximum file size: {MAX_SIZE_MB}MB</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Preview and confirm
              <div className="space-y-4">
                {/* Image preview */}
                <div className="relative rounded-lg overflow-hidden bg-gray-100">
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
                    className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  >
                    Take Another
                  </button>
                  <button
                    onClick={handleUsePhoto}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Identify Products
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
