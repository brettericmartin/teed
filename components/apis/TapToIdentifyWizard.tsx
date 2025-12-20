'use client';

import React, { useState, useCallback } from 'react';
import { Crosshair, Square, Plus, Check, X } from 'lucide-react';
import { ImageSelectionCanvas } from './ImageSelectionCanvas';
import { IdentificationResultCard, EditedGuess } from './IdentificationResultCard';
import { IdentificationLoadingState } from './IdentificationLoadingState';
import { useQuickIdentify } from '@/lib/apis/useQuickIdentify';
import { cropImageToRegion } from '@/lib/apis/cropImage';
import type {
  SelectionRegion,
  IdentifiedCanvasItem,
  TapToIdentifyStage,
  ProductGuess
} from '@/lib/apis/types';

interface TapToIdentifyWizardProps {
  imageSource: string;                     // Base64 or URL
  onComplete: (items: IdentifiedItem[]) => void;
  onCancel: () => void;
  categoryHint?: string;                   // Optional category hint
  className?: string;
}

export interface IdentifiedItem {
  name: string;
  brand: string;
  model?: string;
  year?: number;
  confidence: number;
  croppedImageBase64: string;
  visualDescription: string;
  region: SelectionRegion;
}

/**
 * Tap-to-Identify Wizard
 *
 * Simple flow:
 * 1. User sees image
 * 2. User taps or draws to select an item
 * 3. AI identifies, shows top 3 guesses
 * 4. User picks correct guess
 * 5. Repeat for more items, or complete
 */
export function TapToIdentifyWizard({
  imageSource,
  onComplete,
  onCancel,
  categoryHint,
  className = ''
}: TapToIdentifyWizardProps) {
  // Mode: tap or draw
  const [mode, setMode] = useState<'tap' | 'draw'>('tap');

  // Stage
  const [stage, setStage] = useState<TapToIdentifyStage>('ready');

  // Current identification
  const [currentRegion, setCurrentRegion] = useState<SelectionRegion | null>(null);
  const [currentCroppedImage, setCurrentCroppedImage] = useState<string | null>(null);
  const [selectedGuessIndex, setSelectedGuessIndex] = useState<number | undefined>(undefined);
  const [currentEdits, setCurrentEdits] = useState<EditedGuess | undefined>(undefined);

  // Identified items
  const [identifiedItems, setIdentifiedItems] = useState<IdentifiedCanvasItem[]>([]);

  // API hook
  const { identify, isLoading, result, error, reset: resetIdentify } = useQuickIdentify();

  // Handle region selected
  const handleRegionSelected = useCallback(async (region: SelectionRegion) => {
    setCurrentRegion(region);
    setStage('identifying');
    setSelectedGuessIndex(undefined);

    try {
      // Crop the image
      const cropped = await cropImageToRegion(imageSource, region);
      setCurrentCroppedImage(cropped);

      // Call API
      await identify({
        imageBase64: cropped,
        categoryHint
      });

      setStage('reviewing');
    } catch (err) {
      console.error('Identification failed:', err);
      setStage('error');
    }
  }, [imageSource, categoryHint, identify]);

  // Handle guess selection (with optional edits)
  const handleSelectGuess = useCallback((index: number, edits?: EditedGuess) => {
    setSelectedGuessIndex(index);
    setCurrentEdits(edits);
  }, []);

  // Store correction for learning (non-blocking)
  const storeVisualCorrection = useCallback(async (
    visualDescription: {
      objectType: string;
      itemTypeReasoning?: string;
      primaryColor: string;
      secondaryColors: string[];
      materials: string[];
      brandIndicators: string[];
      designEra?: string;
      ocrTexts?: Array<{ text: string; type: string; confidence: number }>;
    },
    originalGuess: ProductGuess,
    correction: EditedGuess
  ) => {
    try {
      await fetch('/api/ai/store-visual-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visualDescription: {
            objectType: visualDescription.objectType,
            itemTypeReasoning: visualDescription.itemTypeReasoning,
            primaryColor: visualDescription.primaryColor,
            secondaryColors: visualDescription.secondaryColors,
            materials: visualDescription.materials,
            brandIndicators: visualDescription.brandIndicators,
            designEra: visualDescription.designEra,
            ocrTexts: visualDescription.ocrTexts,
          },
          originalGuess: {
            name: originalGuess.name,
            brand: originalGuess.brand,
            confidence: originalGuess.confidence,
            matchingReasons: originalGuess.matchingReasons,
          },
          correction,
          category: categoryHint,
        }),
      });
      console.log('[TapToIdentify] Stored correction for learning');
    } catch (err) {
      // Non-critical - just log
      console.warn('[TapToIdentify] Failed to store correction:', err);
    }
  }, [categoryHint]);

  // Handle confirm (add to list)
  const handleConfirmItem = useCallback(() => {
    if (!result || selectedGuessIndex === undefined || !currentRegion || !currentCroppedImage) return;

    const originalGuess = result.guesses[selectedGuessIndex];

    // If user edited, store the correction for learning
    if (currentEdits && (currentEdits.name !== originalGuess.name || currentEdits.brand !== originalGuess.brand)) {
      storeVisualCorrection(result.visualDescription, originalGuess, currentEdits);
    }

    const newItem: IdentifiedCanvasItem = {
      id: `item_${Date.now()}`,
      region: currentRegion,
      result,
      selectedGuessIndex,
      croppedImageBase64: currentCroppedImage,
      edits: currentEdits
    };

    setIdentifiedItems(prev => [...prev, newItem]);

    // Reset for next item
    setCurrentRegion(null);
    setCurrentCroppedImage(null);
    setSelectedGuessIndex(undefined);
    setCurrentEdits(undefined);
    resetIdentify();
    setStage('ready');
  }, [result, selectedGuessIndex, currentRegion, currentCroppedImage, currentEdits, resetIdentify, storeVisualCorrection]);

  // Handle reject (go back)
  const handleReject = useCallback(() => {
    setCurrentRegion(null);
    setCurrentCroppedImage(null);
    setSelectedGuessIndex(undefined);
    resetIdentify();
    setStage('ready');
  }, [resetIdentify]);

  // Handle complete
  const handleComplete = useCallback(() => {
    const items: IdentifiedItem[] = identifiedItems.map(item => {
      const guess = item.result.guesses[item.selectedGuessIndex];
      // Use edits if available, otherwise fall back to guess values
      const name = item.edits?.name ?? guess.name;
      const brand = item.edits?.brand ?? guess.brand;
      return {
        name,
        brand,
        model: guess.model,
        year: guess.year,
        confidence: guess.confidence,
        croppedImageBase64: item.croppedImageBase64,
        visualDescription: item.result.visualDescription.objectType,
        region: item.region
      };
    });
    onComplete(items);
  }, [identifiedItems, onComplete]);

  // Handle item click on canvas
  const handleItemClick = useCallback((item: IdentifiedCanvasItem) => {
    // Could show details or allow editing
    console.log('Clicked on item:', item);
  }, []);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header - safe area padding for notch phones */}
      <div className="flex items-center justify-between p-4 border-b bg-white pt-safe">
        <div className="flex-1 min-w-0 mr-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Identify Items
          </h2>
          <p className="text-sm text-gray-500">
            {stage === 'ready' && 'Tap or draw on items to identify them'}
            {stage === 'identifying' && 'Analyzing...'}
            {stage === 'reviewing' && 'Select the correct product'}
            {stage === 'error' && 'Something went wrong'}
          </p>
        </div>

        {/* Mode toggle - 44px touch targets */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg flex-shrink-0">
          <button
            onClick={() => setMode('tap')}
            className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium transition-colors ${
              mode === 'tap'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 active:bg-gray-200'
            }`}
          >
            <Crosshair size={18} />
            <span>Tap</span>
          </button>
          <button
            onClick={() => setMode('draw')}
            className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium transition-colors ${
              mode === 'draw'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 active:bg-gray-200'
            }`}
          >
            <Square size={18} />
            <span>Draw</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Image canvas */}
          <ImageSelectionCanvas
            imageSource={imageSource}
            onRegionSelected={handleRegionSelected}
            identifiedItems={identifiedItems}
            onItemClick={handleItemClick}
            mode={mode}
            disabled={stage === 'identifying' || stage === 'reviewing'}
          />

          {/* Loading state - enhanced with visual feedback */}
          {stage === 'identifying' && currentCroppedImage && (
            <IdentificationLoadingState croppedImage={currentCroppedImage} />
          )}

          {/* Error state */}
          {stage === 'error' && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 font-medium">Identification failed</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={handleReject}
                className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
              >
                Try again
              </button>
            </div>
          )}

          {/* Result card */}
          {stage === 'reviewing' && result && currentCroppedImage && (
            <IdentificationResultCard
              result={result}
              croppedImage={currentCroppedImage}
              onSelectGuess={handleSelectGuess}
              onReject={handleReject}
              selectedGuessIndex={selectedGuessIndex}
            />
          )}

          {/* Identified items list */}
          {identifiedItems.length > 0 && stage === 'ready' && (
            <div className="bg-white rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                Identified Items ({identifiedItems.length})
              </h3>
              <div className="space-y-2">
                {identifiedItems.map((item) => {
                  const guess = item.result.guesses[item.selectedGuessIndex];
                  // Use edits if available
                  const displayName = item.edits?.name ?? guess.name;
                  const displayBrand = item.edits?.brand ?? guess.brand;
                  const wasEdited = item.edits && (item.edits.name !== guess.name || item.edits.brand !== guess.brand);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.croppedImageBase64}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{displayName}</p>
                          {wasEdited && (
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                              Edited
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{displayBrand}</p>
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        {guess.confidence}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer - safe area padding for home indicator */}
      <div className="p-4 border-t bg-white flex items-center justify-between gap-3 pb-safe">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 min-h-[44px] text-gray-600 hover:text-gray-900 active:bg-gray-100 font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* Add more button (when in reviewing state with selection) */}
          {stage === 'reviewing' && selectedGuessIndex !== undefined && (
            <button
              onClick={handleConfirmItem}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add & Identify More</span>
              <span className="sm:hidden">Add More</span>
            </button>
          )}

          {/* Complete button */}
          {identifiedItems.length > 0 && (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 active:bg-green-700 transition-colors"
            >
              <Check size={18} />
              Done ({identifiedItems.length})
            </button>
          )}

          {/* If reviewing and has selection, also show single add button */}
          {stage === 'reviewing' && selectedGuessIndex !== undefined && identifiedItems.length === 0 && (
            <button
              onClick={() => {
                handleConfirmItem();
                // Immediately complete with single item
                setTimeout(() => {
                  if (result && currentRegion && currentCroppedImage) {
                    const guess = result.guesses[selectedGuessIndex];
                    // Use edits if available
                    const name = currentEdits?.name ?? guess.name;
                    const brand = currentEdits?.brand ?? guess.brand;
                    const item: IdentifiedItem = {
                      name,
                      brand,
                      model: guess.model,
                      year: guess.year,
                      confidence: guess.confidence,
                      croppedImageBase64: currentCroppedImage,
                      visualDescription: result.visualDescription.objectType,
                      region: currentRegion
                    };
                    onComplete([item]);
                  }
                }, 0);
              }}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 active:bg-green-700 transition-colors"
            >
              <Check size={18} />
              Add to Bag
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
