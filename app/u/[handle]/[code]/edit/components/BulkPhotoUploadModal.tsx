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
// Uses createImageBitmap for better mobile Safari support, falls back to Image
async function compressImage(base64: string, maxSizeKB: number = 5000): Promise<string> {
  // First, convert data URL to blob for createImageBitmap
  const fetchBlob = async (): Promise<Blob> => {
    // Try fetch approach first (works on most browsers)
    try {
      const response = await fetch(base64);
      if (response.ok) {
        return await response.blob();
      }
    } catch {
      // Fall through to manual approach
    }

    // Manual conversion for older browsers
    const commaIndex = base64.indexOf(',');
    if (commaIndex === -1) throw new Error('Invalid data URL');

    const prefix = base64.substring(0, commaIndex);
    let data = base64.substring(commaIndex + 1);
    const mimeMatch = prefix.match(/^data:([^;]+)/);
    const mimeType = mimeMatch?.[1] || 'image/jpeg';

    // Clean and decode
    data = data.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
    const paddingNeeded = (4 - (data.length % 4)) % 4;
    if (paddingNeeded > 0) data += '='.repeat(paddingNeeded);

    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    return new Blob([bytes], { type: mimeType });
  };

  try {
    const blob = await fetchBlob();

    // Try createImageBitmap first (better mobile support)
    let imgWidth: number, imgHeight: number;
    let drawSource: ImageBitmap | HTMLImageElement;

    if (typeof createImageBitmap === 'function') {
      try {
        drawSource = await createImageBitmap(blob);
        imgWidth = drawSource.width;
        imgHeight = drawSource.height;
      } catch {
        // Fall back to Image
        drawSource = await loadImageFromBlob(blob);
        imgWidth = drawSource.width;
        imgHeight = drawSource.height;
      }
    } else {
      drawSource = await loadImageFromBlob(blob);
      imgWidth = drawSource.width;
      imgHeight = drawSource.height;
    }

    // Validate dimensions
    if (imgWidth === 0 || imgHeight === 0) {
      throw new Error('Image has invalid dimensions');
    }

    // Calculate target dimensions
    let width = imgWidth;
    let height = imgHeight;
    const MAX_DIMENSION = 2400; // Higher for better slideshow quality

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Create canvas and draw
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.drawImage(drawSource, 0, 0, width, height);

    // Clean up ImageBitmap if used
    if ('close' in drawSource && typeof drawSource.close === 'function') {
      drawSource.close();
    }

    // Compress with reducing quality (higher quality for slideshow)
    let quality = 0.92;
    let result = canvas.toDataURL('image/jpeg', quality);

    while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.5) {
      quality -= 0.05;
      result = canvas.toDataURL('image/jpeg', quality);
    }

    if (!result.startsWith('data:image/')) {
      throw new Error('Compression produced invalid format');
    }

    console.log('[Compress] Success:', {
      original: `${imgWidth}x${imgHeight}`,
      final: `${width}x${height}`,
      quality: quality.toFixed(1),
      sizeKB: Math.round((result.length * 3) / 4 / 1024),
    });

    return result;
  } catch (err) {
    console.error('[Compress] Error:', err);
    throw err;
  }
}

// Helper to load image from blob using HTMLImageElement
function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
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
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_PHOTOS = 10;
  const MAX_SIZE_MB = 20;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  // Debug helper - adds timestamped log entry
  const addDebug = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev.slice(-9), `${time}: ${msg}`]);
    console.log(`[BulkUpload] ${msg}`);
  };

  if (!isOpen) return null;

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    addDebug(`Selected ${files.length} file(s)`);
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
        addDebug(`Processing: ${file.name} (${file.type}, ${Math.round(file.size/1024)}KB)`);

        // Validate file type
        if (!file.type.startsWith('image/')) {
          addDebug(`Skipped: not an image`);
          continue;
        }

        // Validate file size
        if (file.size > MAX_SIZE_BYTES) {
          addDebug(`Error: file too large`);
          setError(`"${file.name}" is too large (max ${MAX_SIZE_MB}MB)`);
          continue;
        }

        // Read file as data URL
        let base64: string;
        try {
          base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const result = event.target?.result;
              if (typeof result === 'string') {
                resolve(result);
              } else {
                reject(new Error('FileReader did not return string'));
              }
            };
            reader.onerror = () => reject(new Error('FileReader error'));
            reader.readAsDataURL(file);
          });
          addDebug(`Read OK: ${base64.substring(0, 30)}...`);
        } catch (readErr: any) {
          addDebug(`Read failed: ${readErr.message}`);
          setError(`Failed to read "${file.name}".`);
          continue;
        }

        // Basic validation
        if (!base64 || !base64.startsWith('data:')) {
          addDebug(`Invalid data URL`);
          setError(`Invalid format for "${file.name}".`);
          continue;
        }

        let finalBase64 = base64;

        // ALWAYS compress images over 1MB for bulk uploads
        // This is critical - large payloads cause "string did not match expected pattern" errors
        const commaIdx = base64.indexOf(',');
        const base64Part = commaIdx > -1 ? base64.substring(commaIdx + 1) : base64;
        const sizeKB = Math.round((base64Part.length * 3) / 4 / 1024);

        // Use 1.5MB target for bulk (multiply by # of images = ~15MB max payload)
        const targetSizeKB = 1500;

        if (sizeKB > targetSizeKB) {
          addDebug(`Compressing from ${sizeKB}KB to ~${targetSizeKB}KB...`);
          try {
            finalBase64 = await compressImage(base64, targetSizeKB);
            const newSize = Math.round((finalBase64.length * 3) / 4 / 1024);
            addDebug(`Compressed OK: ${newSize}KB`);
          } catch (compErr: any) {
            addDebug(`Compress failed: ${compErr.message}`);
            // Still try to use original, but warn user if it's very large
            if (sizeKB > 5000) {
              setError(`"${file.name}" is too large and compression failed. Try a smaller image.`);
              continue;
            }
            finalBase64 = base64;
          }
        } else {
          addDebug(`Size OK: ${sizeKB}KB`);
        }

        addDebug(`Success: ${file.name}`);
        newPhotos.push({
          id: `${Date.now()}-${Math.random()}`,
          base64: finalBase64,
          originalName: file.name,
        });
      }

      addDebug(`Added ${newPhotos.length} photo(s)`);
      setPhotos(prev => [...prev, ...newPhotos]);
      setIsProcessing(false);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      addDebug(`Error: ${err.message || err}`);
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

        {/* Debug Log - visible on screen for mobile debugging */}
        {debugLog.length > 0 && (
          <div className="mx-6 mb-2 p-3 bg-gray-900 rounded-lg max-h-24 overflow-y-auto">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400 font-mono">Debug</span>
              <button
                onClick={() => setDebugLog([])}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Clear
              </button>
            </div>
            {debugLog.map((log, i) => (
              <div key={i} className="text-xs text-green-400 font-mono truncate">{log}</div>
            ))}
          </div>
        )}

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
