'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Cropper, { Area } from 'react-easy-crop';

type ImageCropModalProps = {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
};

export default function ImageCropModal({
  isOpen,
  imageUrl,
  onClose,
  onCropComplete,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageAspect, setImageAspect] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Reset state when modal opens with new image
  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setPreviewUrl(null);
      setImageLoaded(false);
      setImageAspect(1);
    }
  }, [isOpen, imageUrl]);

  // Load the image to get its aspect ratio
  useEffect(() => {
    if (!isOpen || !imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageAspect(img.naturalWidth / img.naturalHeight);
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [isOpen, imageUrl]);

  const onCropChange = (location: { x: number; y: number }) => {
    setCrop(location);
  };

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const onCropAreaComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Generate square preview whenever crop changes
  useEffect(() => {
    if (!croppedAreaPixels || !imageRef.current) return;

    const img = imageRef.current;
    const { x, y, width, height } = croppedAreaPixels;
    const size = Math.min(width, height);
    const squareX = x + (width - size) / 2;
    const squareY = y + (height - size) / 2;

    const canvas = document.createElement('canvas');
    const previewSize = 96;
    canvas.width = previewSize;
    canvas.height = previewSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      img,
      squareX,
      squareY,
      size,
      size,
      0,
      0,
      previewSize,
      previewSize
    );

    setPreviewUrl(canvas.toDataURL('image/jpeg', 0.8));
  }, [croppedAreaPixels, imageLoaded]);

  const createCroppedImage = async (): Promise<Blob | null> => {
    if (!croppedAreaPixels) return null;

    const image = new Image();
    image.src = imageUrl;

    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Set canvas size to cropped area (preserves original aspect)
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    // Convert canvas to blob - high quality for slideshow
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const croppedImage = await createCroppedImage();
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (error) {
      console.error('Error creating cropped image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Crop Image</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cropper and Preview */}
        <div className="flex flex-1 min-h-0">
          {/* Cropper */}
          <div className="relative flex-1 bg-gray-900" style={{ minHeight: '400px' }}>
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={imageAspect}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropAreaComplete}
              showGrid={true}
              objectFit="contain"
            />
          </div>

          {/* Square Preview Panel */}
          <div className="w-32 bg-gray-100 border-l flex flex-col items-center justify-center p-3 gap-2">
            <span className="text-xs text-gray-500 font-medium">Card Preview</span>
            <div className="w-24 h-24 bg-white rounded-lg shadow-inner overflow-hidden border border-gray-200">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Card preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-400 text-center">Center square of your crop</span>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t space-y-4">
          {/* Zoom Slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--button-create-bg)] rounded-md hover:bg-[var(--button-create-bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
