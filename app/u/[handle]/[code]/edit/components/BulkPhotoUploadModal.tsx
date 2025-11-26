'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { X, Upload, Camera, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';

type BulkPhotoUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onPhotosCapture: (base64Images: string[]) => void;
  bagType?: string;
};

type PhotoPreview = {
  id: string;
  base64: string;
  originalName: string;
};

// Compress image to target size while maintaining quality
// Handles iPhone HEIC, various mobile browser quirks, etc.
async function compressImage(base64: string, maxSizeKB: number = 3500): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Validate dimensions
        if (width === 0 || height === 0) {
          reject(new Error('Image has invalid dimensions'));
          return;
        }

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

        let quality = 0.9;
        let result = canvas.toDataURL('image/jpeg', quality);

        while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.3) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        // Validate the result - accept any data:image format
        if (!result.startsWith('data:image/')) {
          console.error('Compression produced invalid format:', result.substring(0, 50));
          reject(new Error('Image compression failed'));
          return;
        }

        console.log('Compressed successfully:', {
          originalWidth: img.width,
          originalHeight: img.height,
          finalWidth: width,
          finalHeight: height,
          quality,
          resultSizeKB: Math.round((result.length * 3) / 4 / 1024),
        });

        resolve(result);
      } catch (err) {
        console.error('Compression error:', err);
        reject(err);
      }
    };

    img.onerror = (e) => {
      console.error('Image load error:', e, 'src prefix:', base64.substring(0, 50));
      reject(new Error('Failed to load image for compression. The image format may not be supported.'));
    };

    // Handle cross-origin issues on some mobile browsers
    img.crossOrigin = 'anonymous';
    img.src = base64;
  });
}

export default function BulkPhotoUploadModal({
  isOpen,
  onClose,
  onPhotosCapture,
  bagType,
}: BulkPhotoUploadModalProps) {
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_PHOTOS = 10;
  const MAX_SIZE_MB = 20;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  if (!isOpen) return null;

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);

    // Check total count
    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed. You can upload ${MAX_PHOTOS - photos.length} more.`);
      return;
    }

    setIsProcessing(true);

    try {
      const newPhotos: PhotoPreview[] = [];

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          continue; // Skip non-images
        }

        // Validate file size
        if (file.size > MAX_SIZE_BYTES) {
          setError(`"${file.name}" is too large (max ${MAX_SIZE_MB}MB)`);
          continue;
        }

        // Read and process file
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        // Validate data URL format
        if (!base64 || typeof base64 !== 'string') {
          console.error('FileReader returned invalid data:', typeof base64);
          setError(`Failed to read "${file.name}". Please try again.`);
          continue;
        }

        // Ensure it's a valid data URL
        if (!base64.startsWith('data:')) {
          console.error('Invalid data URL format for', file.name, '- prefix:', base64.substring(0, 20));
          setError(`Invalid image format for "${file.name}".`);
          continue;
        }

        // Compress if needed
        const commaIdx = base64.indexOf(',');
        const base64Part = commaIdx > -1 ? base64.substring(commaIdx + 1) : base64;
        const sizeKB = Math.round((base64Part.length * 3) / 4 / 1024);
        let finalBase64 = base64;

        if (sizeKB > 3500) {
          console.log(`Compressing ${file.name} from ${sizeKB}KB...`);
          finalBase64 = await compressImage(base64, 3500);
          const newCommaIdx = finalBase64.indexOf(',');
          const newBase64Part = newCommaIdx > -1 ? finalBase64.substring(newCommaIdx + 1) : finalBase64;
          const newSizeKB = Math.round((newBase64Part.length * 3) / 4 / 1024);
          console.log(`Compressed to ${newSizeKB}KB`);
        }

        // Final validation
        if (!finalBase64.startsWith('data:image/')) {
          console.error('Final base64 invalid for', file.name);
          setError(`Failed to process "${file.name}".`);
          continue;
        }

        newPhotos.push({
          id: `${Date.now()}-${Math.random()}`,
          base64: finalBase64,
          originalName: file.name,
        });
      }

      setPhotos(prev => [...prev, ...newPhotos]);
      setIsProcessing(false);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Photo processing error:', err);
      setError('Failed to process some photos. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = () => {
    if (photos.length === 0) {
      setError('Please add at least one photo');
      return;
    }

    onPhotosCapture(photos.map(p => p.base64));
    // Reset state
    setPhotos([]);
    setError(null);
  };

  const handleCancel = () => {
    setPhotos([]);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-[var(--surface)] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Upload Photos
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Add up to {MAX_PHOTOS} photos at once
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            disabled={isProcessing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--border-subtle)] rounded-xl p-8 hover:border-[var(--teed-green-8)] hover:bg-[var(--sky-1)] transition-all cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing || photos.length >= MAX_PHOTOS}
            />
            <div className="text-center">
              {isProcessing ? (
                <>
                  <Loader2 className="w-12 h-12 text-[var(--teed-green-9)] mx-auto mb-4 animate-spin" />
                  <p className="text-sm text-[var(--text-secondary)]">Processing photos...</p>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-[var(--text-secondary)] group-hover:text-[var(--teed-green-9)] mx-auto mb-4 transition-colors" />
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                    Click to upload photos
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {photos.length > 0
                      ? `${photos.length}/${MAX_PHOTOS} photos added`
                      : `Upload up to ${MAX_PHOTOS} photos (JPEG, PNG)`}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-[var(--copper-2)] border border-[var(--copper-6)] rounded-lg p-3 text-sm text-[var(--copper-11)]">
              {error}
            </div>
          )}

          {/* Photo Grid */}
          {photos.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                Selected Photos ({photos.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square bg-[var(--surface-elevated)] rounded-lg overflow-hidden group"
                  >
                    <img
                      src={photo.base64}
                      alt={photo.originalName}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-2 right-2 p-1.5 bg-[var(--copper-9)] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--copper-10)]"
                      title="Remove photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">{photo.originalName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--sky-1)] flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={photos.length === 0 || isProcessing}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="w-4 h-4" />
            Identify Items ({photos.length} {photos.length === 1 ? 'photo' : 'photos'})
          </button>
        </div>
      </div>
    </div>
  );
}
