'use client';

import { useState, useRef, useCallback, ChangeEvent } from 'react';

type PipelineStage = 'idle' | 'scanning' | 'identifying' | 'validating' | 'complete' | 'error';

type PipelineProgress = {
  stage: PipelineStage;
  itemsFound?: number;
  itemsIdentified?: number;
  itemsVerified?: number;
  error?: string;
};

export type PhotoPipelineResult = {
  products: any[];
  pipeline: {
    totalDetected: number;
    totalIdentified: number;
    totalVerified: number;
    stageTimings: Record<string, number>;
    partial: boolean;
  };
  totalConfidence: number;
  processingTime: number;
  sourceImageBase64: string;
};

type PhotoUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCapture: (base64Image: string) => void;
  onPipelineComplete?: (result: PhotoPipelineResult) => void;
  bagType?: string;
};

// Compress image to target size while maintaining quality
async function compressImage(base64: string, maxSizeKB: number = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width === 0 || height === 0) {
          reject(new Error('Image has invalid dimensions'));
          return;
        }

        const MAX_DIMENSION = 2400;
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

        let quality = 0.92;
        let result = canvas.toDataURL('image/jpeg', quality);

        while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.5) {
          quality -= 0.05;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        if (!result.startsWith('data:image/')) {
          reject(new Error('Image compression failed'));
          return;
        }

        resolve(result);
      } catch (err) {
        console.error('Compression error:', err);
        reject(err);
      }
    };

    img.onerror = (e) => {
      console.error('Image load error:', e);
      reject(new Error('Failed to load image for compression'));
    };

    img.crossOrigin = 'anonymous';
    img.src = base64;
  });
}

function StageIndicator({ stage, progress }: { stage: PipelineStage; progress: PipelineProgress }) {
  const stages = [
    {
      key: 'scanning' as const,
      label: 'Scanning photo for items...',
      doneLabel: (p: PipelineProgress) => `Found ${p.itemsFound ?? 0} items`,
    },
    {
      key: 'identifying' as const,
      label: 'Identifying each product...',
      doneLabel: (p: PipelineProgress) => `${p.itemsIdentified ?? 0}/${p.itemsFound ?? 0} identified`,
    },
    {
      key: 'validating' as const,
      label: 'Validating identifications...',
      doneLabel: (p: PipelineProgress) => `${p.itemsVerified ?? 0}/${p.itemsIdentified ?? 0} verified`,
    },
  ];

  const stageOrder: PipelineStage[] = ['scanning', 'identifying', 'validating', 'complete'];
  const currentIdx = stageOrder.indexOf(stage);

  return (
    <div className="space-y-3 py-2">
      {stages.map((s, idx) => {
        const stageIdx = idx; // scanning=0, identifying=1, validating=2
        const isActive = stageIdx === currentIdx;
        const isDone = currentIdx > stageIdx || stage === 'complete';
        const isPending = stageIdx > currentIdx;

        return (
          <div key={s.key} className="flex items-center gap-3">
            {/* Status icon */}
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
              {isDone ? (
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : isActive ? (
                <svg className="w-5 h-5 text-[var(--sky-9)] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <div className="w-3 h-3 rounded-full bg-gray-200" />
              )}
            </div>

            {/* Label */}
            <span className={`text-sm ${
              isDone ? 'text-green-700 font-medium' :
              isActive ? 'text-[var(--text-primary)] font-medium' :
              'text-[var(--text-tertiary)]'
            }`}>
              {isDone ? s.doneLabel(progress) : s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function PhotoUploadModal({
  isOpen,
  onClose,
  onPhotoCapture,
  onPipelineComplete,
  bagType,
}: PhotoUploadModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress>({ stage: 'idle' });
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE_MB = 20;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`Image too large. Maximum size is ${MAX_SIZE_MB}MB`);
      return;
    }

    setIsProcessing(true);

    try {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;

          if (!base64 || typeof base64 !== 'string' || !base64.startsWith('data:image/')) {
            setError('Failed to read image. Please try again.');
            setIsProcessing(false);
            return;
          }

          const commaIdx = base64.indexOf(',');
          const base64Part = commaIdx > -1 ? base64.substring(commaIdx + 1) : base64;
          const sizeKB = Math.round((base64Part.length * 3) / 4 / 1024);
          let finalBase64 = base64;

          if (sizeKB > 3500) {
            finalBase64 = await compressImage(base64, 3500);
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
    fileInputRef.current?.click();
  };

  const runPipeline = useCallback(async () => {
    if (!preview) return;

    setIsRunningPipeline(true);
    setError(null);
    setPipelineProgress({ stage: 'scanning' });

    try {
      // Simulate stage transitions with a polling approach
      // The actual API call is a single request, but we show staged progress
      const progressTimer = setTimeout(() => {
        setPipelineProgress(prev => ({ ...prev, stage: 'identifying' }));
      }, 3000);

      const validateTimer = setTimeout(() => {
        setPipelineProgress(prev => ({ ...prev, stage: 'validating' }));
      }, 12000);

      const response = await fetch('/api/ai/identify-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: preview,
          options: { bagType },
        }),
      });

      clearTimeout(progressTimer);
      clearTimeout(validateTimer);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      const data = await response.json();

      // Update progress with actual results
      setPipelineProgress({
        stage: 'complete',
        itemsFound: data.pipeline?.totalDetected ?? data.products?.length ?? 0,
        itemsIdentified: data.pipeline?.totalIdentified ?? data.products?.length ?? 0,
        itemsVerified: data.pipeline?.totalVerified ?? 0,
      });

      // Wait a beat for the user to see the final status
      await new Promise(r => setTimeout(r, 800));

      if (onPipelineComplete) {
        onPipelineComplete({
          ...data,
          sourceImageBase64: preview,
        });
      } else {
        // Fallback: use legacy onPhotoCapture
        onPhotoCapture(preview);
      }

      handleReset();
    } catch (err: any) {
      console.error('[PhotoUpload] Pipeline error:', err);
      setPipelineProgress({ stage: 'error', error: err.message });
      setError(err.message || 'Failed to identify products');
    } finally {
      setIsRunningPipeline(false);
    }
  }, [preview, bagType, onPhotoCapture, onPipelineComplete]);

  const handleUsePhoto = () => {
    if (!preview) return;

    if (onPipelineComplete) {
      // New path: run the full vision pipeline
      runPipeline();
    } else {
      // Legacy path: just pass the base64 up
      onPhotoCapture(preview);
      handleReset();
    }
  };

  const handleReset = () => {
    setPreview(null);
    setError(null);
    setIsProcessing(false);
    setIsRunningPipeline(false);
    setPipelineProgress({ stage: 'idle' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseModal = () => {
    if (isRunningPipeline) return; // Don't close during pipeline
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
            {!isRunningPipeline && (
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
            )}
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

            {isRunningPipeline ? (
              // Pipeline progress view
              <div className="space-y-4">
                {/* Thumbnail of source image */}
                <div className="relative rounded-[var(--radius-lg)] overflow-hidden bg-[var(--sand-2)]">
                  <img
                    src={preview!}
                    alt="Analyzing..."
                    className="w-full h-auto max-h-48 object-contain opacity-75"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-sm font-medium">
                      Analyzing your photo...
                    </p>
                  </div>
                </div>

                {/* Stage progress */}
                <div className="bg-[var(--sky-2)] border border-[var(--sky-6)] rounded-[var(--radius-lg)] p-4">
                  <StageIndicator stage={pipelineProgress.stage} progress={pipelineProgress} />
                </div>
              </div>
            ) : !preview ? (
              // Upload buttons
              <div className="space-y-4">
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
                        <li>• Each item will be individually identified</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Preview and confirm
              <div className="space-y-4">
                <div className="relative rounded-[var(--radius-lg)] overflow-hidden bg-[var(--sand-2)]">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>

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
                  <div>
                    <p className="text-sm text-[var(--copper-11)]">{error}</p>
                    {isRunningPipeline && (
                      <button
                        onClick={handleReset}
                        className="mt-2 text-sm text-[var(--copper-11)] underline hover:no-underline"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
