'use client';

import { useReducer, useCallback, useRef } from 'react';
import type {
  IdentificationState,
  IdentificationAction,
  IdentificationStage,
  DetectedObject,
  IdentifiedProduct,
  EnrichedProduct,
  ValidatedProduct,
  UserCorrection,
  ObjectDetectionResult,
  ProductHints
} from './types';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: IdentificationState = {
  stage: 'idle',
  userCorrections: [],
  currentStep: 0,
  totalSteps: 7,
  stepMessage: ''
};

// ============================================================================
// REDUCER
// ============================================================================

function identificationReducer(
  state: IdentificationState,
  action: IdentificationAction
): IdentificationState {
  switch (action.type) {
    case 'START':
      return {
        ...initialState,
        stage: 'detecting',
        source: action.source,
        isBulkMode: false,
        currentStep: 1,
        stepMessage: 'Detecting objects in image...'
      };

    case 'START_BULK':
      return {
        ...initialState,
        stage: 'detecting',
        sourceImages: action.images,
        isBulkMode: true,
        currentStep: 1,
        stepMessage: `Detecting objects in ${action.images.length} images...`
      };

    case 'BULK_OBJECTS_DETECTED': {
      // Aggregate objects from all images with sourceImageIndex
      const allObjects: DetectedObject[] = [];
      for (const { imageIndex, result } of action.results) {
        for (const obj of result.objects) {
          allObjects.push({
            ...obj,
            id: `img${imageIndex}_${obj.id}`,
            sourceImageIndex: imageIndex
          });
        }
      }
      return {
        ...state,
        stage: 'awaiting-object-validation',
        detectedObjects: allObjects,
        currentStep: 2,
        stepMessage: `Found ${allObjects.length} objects across ${action.results.length} images`
      };
    }

    case 'OBJECTS_DETECTED':
      return {
        ...state,
        stage: 'awaiting-object-validation',
        detectedObjects: action.result.objects,
        currentStep: 2,
        stepMessage: 'Please review detected objects'
      };

    case 'USER_VALIDATED_OBJECTS': {
      // Filter to selected objects and apply any additions
      const selectedObjects = (state.detectedObjects || [])
        .filter(obj => action.selectedIds.includes(obj.id))
        .map(obj => ({ ...obj, selected: true }));

      // Add any user-added objects
      const addedObjects: DetectedObject[] = (action.addedObjects || []).map((obj, idx) => ({
        id: `user_added_${idx}`,
        objectType: obj.objectType || 'unknown',
        productCategory: obj.productCategory || 'other',
        boundingDescription: 'user specified',
        visualCues: obj.visualCues || [],
        certainty: 'definite' as const,
        selected: true
      }));

      const validatedObjects = [...selectedObjects, ...addedObjects];

      // Record corrections if any
      const corrections: UserCorrection[] = [];
      if (action.corrections) {
        corrections.push({
          stage: 'awaiting-object-validation',
          correctionType: 'object-type',
          correctedValue: action.corrections,
          timestamp: new Date()
        });
      }

      return {
        ...state,
        stage: 'identifying',
        validatedObjects,
        userCorrections: [...state.userCorrections, ...corrections],
        currentStep: 3,
        stepMessage: 'Identifying specific products...'
      };
    }

    case 'PRODUCTS_IDENTIFIED':
      return {
        ...state,
        stage: 'awaiting-product-validation',
        identifiedProducts: action.products,
        currentStep: 4,
        stepMessage: 'Please confirm product identification'
      };

    case 'USER_VALIDATED_PRODUCTS': {
      const corrections = action.corrections || [];
      return {
        ...state,
        stage: 'enriching',
        confirmedProducts: action.confirmed,
        userCorrections: [...state.userCorrections, ...corrections],
        currentStep: 5,
        stepMessage: 'Finding product details and links...'
      };
    }

    case 'ENRICHMENT_COMPLETE':
      return {
        ...state,
        stage: 'validating',
        enrichedProducts: action.products,
        currentStep: 6,
        stepMessage: 'Validating matches against your image...'
      };

    case 'VALIDATION_COMPLETE':
      return {
        ...state,
        stage: 'complete',
        validatedProducts: action.products,
        currentStep: 7,
        stepMessage: 'Ready to add!'
      };

    case 'USER_CORRECTION':
      return {
        ...state,
        userCorrections: [...state.userCorrections, action.correction]
      };

    case 'RETRY_STAGE':
      // Reset to the specified stage
      switch (action.stage) {
        case 'detecting':
          return {
            ...state,
            stage: 'detecting',
            detectedObjects: undefined,
            currentStep: 1,
            stepMessage: 'Detecting objects in image...'
          };
        case 'identifying':
          return {
            ...state,
            stage: 'identifying',
            identifiedProducts: undefined,
            currentStep: 3,
            stepMessage: 'Identifying specific products...'
          };
        default:
          return state;
      }

    case 'SKIP_ITEM': {
      // Remove item from current stage's products
      if (state.stage === 'awaiting-product-validation' && state.identifiedProducts) {
        return {
          ...state,
          identifiedProducts: state.identifiedProducts.filter(p => p.id !== action.itemId)
        };
      }
      if (state.stage === 'complete' && state.validatedProducts) {
        return {
          ...state,
          validatedProducts: state.validatedProducts.filter(p => p.id !== action.itemId)
        };
      }
      return state;
    }

    case 'ABORT':
      return initialState;

    case 'ERROR':
      return {
        ...state,
        stage: 'error',
        error: action.error,
        recoveryOptions: action.recoveryOptions,
        stepMessage: 'An error occurred'
      };

    default:
      return state;
  }
}

// ============================================================================
// HOOK
// ============================================================================

export function useIdentificationWizard() {
  const [state, dispatch] = useReducer(identificationReducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  // -------------------------------------------------------------------------
  // Start identification process
  // -------------------------------------------------------------------------
  const start = useCallback(async (source: IdentificationState['source']) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    dispatch({ type: 'START', source });

    try {
      // Call object detection API
      const response = await fetch('/api/ai/detect-objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: source?.imageBase64,
          imageUrl: source?.url,
          textHint: source?.textHint
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to detect objects');
      }

      const data = await response.json();
      if (data.success && data.result) {
        dispatch({ type: 'OBJECTS_DETECTED', result: data.result });
      } else {
        throw new Error(data.error || 'No objects detected');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      dispatch({
        type: 'ERROR',
        error: error.message || 'Failed to detect objects',
        recoveryOptions: ['Try again', 'Add manually']
      });
    }
  }, []);

  // -------------------------------------------------------------------------
  // Start bulk identification (multiple images)
  // -------------------------------------------------------------------------
  const startBulk = useCallback(async (images: string[]) => {
    if (images.length === 0) return;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    dispatch({ type: 'START_BULK', images });

    try {
      // Process all images in parallel
      const detectionPromises = images.map(async (imageBase64, index) => {
        const response = await fetch('/api/ai/detect-objects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64 }),
          signal: abortControllerRef.current!.signal
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Image ${index + 1}: ${error.error || 'Failed to detect objects'}`);
        }

        const data = await response.json();
        return {
          imageIndex: index,
          result: data.result as ObjectDetectionResult
        };
      });

      const results = await Promise.all(detectionPromises);

      // Filter out any failed detections
      const successfulResults = results.filter(r => r.result && r.result.objects);

      if (successfulResults.length === 0) {
        throw new Error('No objects detected in any images');
      }

      dispatch({ type: 'BULK_OBJECTS_DETECTED', results: successfulResults });
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      dispatch({
        type: 'ERROR',
        error: error.message || 'Failed to detect objects in images',
        recoveryOptions: ['Try again', 'Add manually']
      });
    }
  }, []);

  // -------------------------------------------------------------------------
  // Validate detected objects (user checkpoint 1)
  // -------------------------------------------------------------------------
  const validateObjects = useCallback(async (
    selectedIds: string[],
    corrections?: string,
    addedObjects?: Partial<DetectedObject>[],
    productHints?: ProductHints
  ) => {
    dispatch({ type: 'USER_VALIDATED_OBJECTS', selectedIds, corrections, addedObjects });

    // Get the validated objects from state after dispatch
    const validatedObjects = (state.detectedObjects || [])
      .filter(obj => selectedIds.includes(obj.id));

    const allObjects: DetectedObject[] = [
      ...validatedObjects,
      ...(addedObjects || []).map((obj, idx) => ({
        id: `user_added_${idx}`,
        objectType: obj.objectType || 'unknown',
        productCategory: obj.productCategory || 'other',
        boundingDescription: 'user specified',
        visualCues: obj.visualCues || [],
        certainty: 'definite' as const,
        selected: true,
        sourceImageIndex: undefined
      }))
    ];

    // If no objects selected but user provided correction text, use that as the object to identify
    // This handles the case where user unchecks detected items and types what they actually want
    if (allObjects.length === 0 && corrections && corrections.trim()) {
      allObjects.push({
        id: 'user_correction_0',
        objectType: corrections.trim(),
        productCategory: 'other', // Will be inferred by AI
        boundingDescription: 'user specified via correction',
        visualCues: [],
        certainty: 'definite' as const,
        selected: true,
        sourceImageIndex: undefined
      });
    }

    if (allObjects.length === 0) {
      dispatch({
        type: 'ERROR',
        error: 'No objects selected for identification',
        recoveryOptions: ['Go back', 'Add manually']
      });
      return;
    }

    try {
      // Get image source - handle both single and bulk modes
      let imageBase64 = state.source?.imageBase64;
      const imageUrl = state.source?.url;

      // In bulk mode, use sourceImages instead
      if (!imageBase64 && !imageUrl && state.sourceImages && state.sourceImages.length > 0) {
        // For bulk mode, use the first image or the image matching the first object's sourceImageIndex
        const firstObjectWithImage = allObjects.find(obj => obj.sourceImageIndex !== undefined);
        if (firstObjectWithImage?.sourceImageIndex !== undefined) {
          imageBase64 = state.sourceImages[firstObjectWithImage.sourceImageIndex];
        } else {
          imageBase64 = state.sourceImages[0];
        }
      }

      // Call product identification API
      const response = await fetch('/api/ai/identify-products-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          imageUrl,
          validatedObjects: allObjects,
          userContext: corrections,
          productHints
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to identify products');
      }

      const data = await response.json();
      if (data.success && data.products) {
        dispatch({ type: 'PRODUCTS_IDENTIFIED', products: data.products });
      } else {
        throw new Error(data.error || 'No products identified');
      }
    } catch (error: any) {
      dispatch({
        type: 'ERROR',
        error: error.message || 'Failed to identify products',
        recoveryOptions: ['Try again', 'Add manually']
      });
    }
  }, [state.detectedObjects, state.source, state.sourceImages]);

  // -------------------------------------------------------------------------
  // Validate identified products (user checkpoint 2)
  // -------------------------------------------------------------------------
  const validateProducts = useCallback(async (
    confirmed: IdentifiedProduct[],
    corrections?: UserCorrection[]
  ) => {
    dispatch({ type: 'USER_VALIDATED_PRODUCTS', confirmed, corrections });

    if (confirmed.length === 0) {
      dispatch({
        type: 'ERROR',
        error: 'No products confirmed for enrichment',
        recoveryOptions: ['Go back', 'Add manually']
      });
      return;
    }

    try {
      // Call enrichment API
      const response = await fetch('/api/ai/enrich-products-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: confirmed,
          yearAware: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enrich products');
      }

      const data = await response.json();
      if (data.success && data.products) {
        dispatch({ type: 'ENRICHMENT_COMPLETE', products: data.products });

        // Now validate against source image
        await validateAgainstSource(data.products);
      } else {
        throw new Error(data.error || 'No enrichment data');
      }
    } catch (error: any) {
      dispatch({
        type: 'ERROR',
        error: error.message || 'Failed to enrich products',
        recoveryOptions: ['Try again', 'Skip enrichment']
      });
    }
  }, [state.source]);

  // -------------------------------------------------------------------------
  // Validate enriched products against source (stage 4)
  // -------------------------------------------------------------------------
  const validateAgainstSource = useCallback(async (enrichedProducts: EnrichedProduct[]) => {
    // Get source image - handle both single and bulk modes
    let sourceImage = state.source?.imageBase64 || state.source?.url;

    // In bulk mode, use first sourceImage if no single source
    if (!sourceImage && state.sourceImages && state.sourceImages.length > 0) {
      sourceImage = state.sourceImages[0];
    }

    if (!sourceImage) {
      // Skip validation if no source image
      const validatedProducts: ValidatedProduct[] = enrichedProducts.map(p => ({
        ...p,
        validation: {
          productId: p.id,
          visualMatchScore: 70, // Default score without validation
          matchDetails: {
            colorMatch: { matches: true, confidence: 70 },
            shapeMatch: { matches: true, confidence: 70 },
            brandLogoMatch: { matches: true, confidence: 70 },
            modelDetailsMatch: { matches: true, confidence: 70 },
            yearIndicatorsMatch: { matches: true, confidence: 70 }
          },
          discrepancies: ['No source image for validation'],
          recommendation: 'likely' as const
        },
        finalConfidence: 70
      }));
      dispatch({ type: 'VALIDATION_COMPLETE', products: validatedProducts });
      return;
    }

    try {
      // Validate each product in parallel
      const validationPromises = enrichedProducts.map(async (product) => {
        // For bulk mode, try to use the image matching the product's sourceImageIndex
        let productSourceImage = sourceImage;
        if (state.sourceImages && (product as any).sourceImageIndex !== undefined) {
          productSourceImage = state.sourceImages[(product as any).sourceImageIndex] || sourceImage;
        }

        const response = await fetch('/api/ai/validate-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceImage: productSourceImage,
            enrichedProduct: product
          })
        });

        if (!response.ok) {
          // Return a default validation on error
          return {
            ...product,
            validation: {
              productId: product.id,
              visualMatchScore: 50,
              matchDetails: {
                colorMatch: { matches: false, confidence: 50 },
                shapeMatch: { matches: false, confidence: 50 },
                brandLogoMatch: { matches: false, confidence: 50 },
                modelDetailsMatch: { matches: false, confidence: 50 },
                yearIndicatorsMatch: { matches: false, confidence: 50 }
              },
              discrepancies: ['Validation failed'],
              recommendation: 'uncertain' as const
            },
            finalConfidence: 50
          } as ValidatedProduct;
        }

        const data = await response.json();
        return {
          ...product,
          validation: data.validation,
          finalConfidence: data.validation?.visualMatchScore || 50
        } as ValidatedProduct;
      });

      const validatedProducts = await Promise.all(validationPromises);
      dispatch({ type: 'VALIDATION_COMPLETE', products: validatedProducts });

    } catch (error: any) {
      dispatch({
        type: 'ERROR',
        error: error.message || 'Failed to validate products',
        recoveryOptions: ['Skip validation', 'Try again']
      });
    }
  }, [state.source, state.sourceImages]);

  // -------------------------------------------------------------------------
  // Store correction for learning
  // -------------------------------------------------------------------------
  const storeCorrection = useCallback(async (
    correction: UserCorrection,
    finalProduct?: ValidatedProduct
  ) => {
    dispatch({ type: 'USER_CORRECTION', correction });

    try {
      await fetch('/api/ai/store-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correction,
          finalProduct,
          sourceImage: state.source?.imageBase64 || state.source?.url
        })
      });
    } catch (error) {
      // Don't fail the flow if learning fails
      console.error('Failed to store correction:', error);
    }
  }, [state.source]);

  // -------------------------------------------------------------------------
  // Skip an item
  // -------------------------------------------------------------------------
  const skipItem = useCallback((itemId: string) => {
    dispatch({ type: 'SKIP_ITEM', itemId });
  }, []);

  // -------------------------------------------------------------------------
  // Retry a stage
  // -------------------------------------------------------------------------
  const retryStage = useCallback((stage: IdentificationStage) => {
    dispatch({ type: 'RETRY_STAGE', stage });

    if (stage === 'detecting' && state.source) {
      start(state.source);
    }
  }, [state.source, start]);

  // -------------------------------------------------------------------------
  // Abort the process
  // -------------------------------------------------------------------------
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    dispatch({ type: 'ABORT' });
  }, []);

  // -------------------------------------------------------------------------
  // Select/deselect an object
  // -------------------------------------------------------------------------
  const toggleObjectSelection = useCallback((objectId: string) => {
    if (!state.detectedObjects) return;

    const updatedObjects = state.detectedObjects.map(obj =>
      obj.id === objectId ? { ...obj, selected: !obj.selected } : obj
    );

    // Manually update state (this is a workaround since we don't have a dedicated action)
    dispatch({
      type: 'OBJECTS_DETECTED',
      result: {
        objects: updatedObjects,
        totalDetected: updatedObjects.length,
        processingTimeMs: 0,
        imageAnalysis: { quality: 'good', lighting: 'good' }
      }
    });
  }, [state.detectedObjects]);

  return {
    state,
    start,
    startBulk,
    validateObjects,
    validateProducts,
    storeCorrection,
    skipItem,
    retryStage,
    abort,
    toggleObjectSelection
  };
}

export type UseIdentificationWizardReturn = ReturnType<typeof useIdentificationWizard>;
