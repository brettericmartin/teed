'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, RefreshCw, AlertTriangle, Loader2, Images } from 'lucide-react';
import { useIdentificationWizard } from '@/lib/apis/useIdentificationWizard';
import IdentificationProgress from './IdentificationProgress';
import ObjectValidationCheckpoint from './ObjectValidationCheckpoint';
import ProductValidationCheckpoint from './ProductValidationCheckpoint';
import FinalReview from './FinalReview';
import type { ValidatedProduct, IdentifiedProduct, UserCorrection, ProductHints } from '@/lib/apis/types';

interface SmartIdentificationWizardProps {
  // Single image mode
  onComplete: (product: ValidatedProduct) => void;
  onCancel: () => void;
  bagContext?: string;
  initialImageBase64?: string;
  initialUrl?: string;

  // Bulk mode
  initialImages?: string[];  // Array of base64 images for bulk processing
  onCompleteAll?: (products: ValidatedProduct[]) => void;  // Callback for bulk completion
}

export default function SmartIdentificationWizard({
  onComplete,
  onCancel,
  bagContext,
  initialImageBase64,
  initialUrl,
  initialImages,
  onCompleteAll
}: SmartIdentificationWizardProps) {
  const wizard = useIdentificationWizard();
  const { state } = wizard;
  const [addedProducts, setAddedProducts] = useState<ValidatedProduct[]>([]);

  const isBulkMode = !!initialImages && initialImages.length > 0;
  const imageCount = isBulkMode ? initialImages.length : 1;

  // Auto-start when props are provided
  useEffect(() => {
    if (state.stage === 'idle') {
      if (isBulkMode && initialImages) {
        wizard.startBulk(initialImages);
      } else if (initialImageBase64) {
        wizard.start({
          type: 'image',
          imageBase64: initialImageBase64
        });
      } else if (initialUrl) {
        wizard.start({
          type: 'url',
          url: initialUrl
        });
      }
    }
  }, [initialImageBase64, initialUrl, initialImages, isBulkMode, state.stage, wizard]);

  // Handle object validation
  const handleObjectValidation = useCallback((
    selectedIds: string[],
    corrections?: string,
    addedObjects?: any[],
    productHints?: ProductHints
  ) => {
    wizard.validateObjects(selectedIds, corrections, addedObjects, productHints);
  }, [wizard]);

  // Handle product validation
  const handleProductValidation = useCallback((
    confirmed: IdentifiedProduct[],
    corrections?: UserCorrection[]
  ) => {
    wizard.validateProducts(confirmed, corrections);
  }, [wizard]);

  // Handle add to bag (single item)
  const handleAddToBag = useCallback((product: ValidatedProduct) => {
    // Store any corrections for learning
    if (product.userCorrectionApplied) {
      wizard.storeCorrection({
        stage: 'complete',
        productId: product.id,
        correctionType: 'product-name',
        correctedValue: product.userCorrectionApplied,
        timestamp: new Date()
      }, product);
    }

    if (isBulkMode) {
      // In bulk mode, collect products until user is done
      setAddedProducts(prev => [...prev, product]);
    } else {
      onComplete(product);
    }
  }, [wizard, onComplete, isBulkMode]);

  // Handle "Done Adding" in bulk mode
  const handleDoneAdding = useCallback(() => {
    if (isBulkMode && onCompleteAll && addedProducts.length > 0) {
      onCompleteAll(addedProducts);
    } else if (addedProducts.length > 0) {
      // Fallback to single callback if onCompleteAll not provided
      addedProducts.forEach(p => onComplete(p));
    }
    onCancel();
  }, [addedProducts, onCompleteAll, onComplete, onCancel, isBulkMode]);

  // Handle edit
  const handleEdit = useCallback((product: ValidatedProduct) => {
    console.log('Edit product:', product);
  }, []);

  // Handle skip
  const handleSkip = useCallback((productId: string) => {
    wizard.skipItem(productId);
  }, [wizard]);

  // Handle retry
  const handleRetry = useCallback(() => {
    if (isBulkMode && initialImages) {
      wizard.startBulk(initialImages);
    } else if (state.source) {
      wizard.start(state.source);
    }
  }, [wizard, state.source, isBulkMode, initialImages]);

  // Get source image for display - in bulk mode, use first image or specific
  const getSourceImage = useCallback((imageIndex?: number) => {
    if (isBulkMode && initialImages) {
      return initialImages[imageIndex ?? 0];
    }
    return state.source?.imageBase64;
  }, [isBulkMode, initialImages, state.source]);

  // Render based on current stage
  const renderStageContent = () => {
    switch (state.stage) {
      case 'idle':
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Upload an image or paste a URL to start</p>
          </div>
        );

      case 'detecting':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700 font-medium">
              {isBulkMode
                ? `Detecting objects in ${imageCount} images...`
                : 'Detecting objects in image...'}
            </p>
            {isBulkMode && (
              <p className="text-sm text-gray-500 mt-1">
                Processing all images in parallel
              </p>
            )}

            {/* Show thumbnail strip for bulk mode */}
            {isBulkMode && initialImages && (
              <div className="mt-6 flex gap-2 overflow-x-auto max-w-full px-4">
                {initialImages.slice(0, 5).map((img, idx) => (
                  <div
                    key={idx}
                    className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 border-gray-200"
                  >
                    <img
                      src={img}
                      alt={`Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {initialImages.length > 5 && (
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium">
                    +{initialImages.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'awaiting-object-validation':
        return state.detectedObjects ? (
          <ObjectValidationCheckpoint
            objects={state.detectedObjects}
            onValidate={handleObjectValidation}
            onCancel={onCancel}
            sourceImages={isBulkMode ? initialImages : undefined}
          />
        ) : null;

      case 'identifying':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700 font-medium">Identifying specific products...</p>
            <p className="text-sm text-gray-500 mt-1">
              Using your feedback to find exact matches
            </p>
          </div>
        );

      case 'awaiting-product-validation':
        return state.identifiedProducts ? (
          <ProductValidationCheckpoint
            products={state.identifiedProducts}
            onValidate={handleProductValidation}
            onCancel={onCancel}
          />
        ) : null;

      case 'enriching':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700 font-medium">Finding product details & links...</p>
            <p className="text-sm text-gray-500 mt-1">
              Searching for specs, prices, and purchase links
            </p>
          </div>
        );

      case 'validating':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700 font-medium">Validating matches against your image...</p>
            <p className="text-sm text-gray-500 mt-1">
              Comparing found products to ensure accuracy
            </p>
          </div>
        );

      case 'complete':
        return state.validatedProducts ? (
          <FinalReview
            products={state.validatedProducts}
            sourceImage={getSourceImage()}
            sourceImages={isBulkMode ? initialImages : undefined}
            onAddToBag={handleAddToBag}
            onEdit={handleEdit}
            onSkip={handleSkip}
            onStartOver={wizard.abort}
            isBulkMode={isBulkMode}
            addedCount={addedProducts.length}
            onDone={handleDoneAdding}
          />
        ) : null;

      case 'error':
        return (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Something went wrong</h3>
                <p className="text-red-700 mt-1">{state.error}</p>

                {state.recoveryOptions && state.recoveryOptions.length > 0 && (
                  <div className="mt-4 flex gap-2">
                    {state.recoveryOptions.includes('Try again') && (
                      <button
                        onClick={handleRetry}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                      </button>
                    )}
                    {state.recoveryOptions.includes('Add manually') && (
                      <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                      >
                        Add Manually
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl w-full mx-auto max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Smart Identification
              {isBulkMode && (
                <span className="flex items-center gap-1 text-sm font-normal bg-white/20 px-2 py-0.5 rounded-full">
                  <Images className="w-4 h-4" />
                  {imageCount} photos
                </span>
              )}
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              AI-powered product recognition with validation
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Progress */}
      {state.stage !== 'idle' && state.stage !== 'error' && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <IdentificationProgress
            currentStage={state.stage}
            stepMessage={state.stepMessage}
          />
        </div>
      )}

      {/* Bulk mode added counter */}
      {isBulkMode && addedProducts.length > 0 && state.stage === 'complete' && (
        <div className="px-6 py-2 bg-green-50 border-b border-green-200 flex-shrink-0">
          <p className="text-sm text-green-700">
            <span className="font-medium">{addedProducts.length}</span> item{addedProducts.length !== 1 ? 's' : ''} ready to add
          </p>
        </div>
      )}

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        {renderStageContent()}
      </div>
    </div>
  );
}

// Export hook for external use
export { useIdentificationWizard } from '@/lib/apis/useIdentificationWizard';
