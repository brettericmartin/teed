'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, HelpCircle, X, AlertTriangle, Sparkles, Eye, Type, Pencil } from 'lucide-react';
import type { SingleItemIdentificationResult, ProductGuess } from '@/lib/apis/types';

export interface EditedGuess {
  name: string;
  brand: string;
}

interface IdentificationResultCardProps {
  result: SingleItemIdentificationResult;
  croppedImage: string;                    // The cropped region image
  onSelectGuess: (guessIndex: number, edits?: EditedGuess) => void;
  onReject: () => void;                    // Go back, try again
  selectedGuessIndex?: number;             // Currently selected guess
  className?: string;
}

/**
 * Displays identification results with top 3 guesses
 *
 * Enhanced to show:
 * - Novelty/OOD warnings for unknown products
 * - Confidence intervals instead of just point estimates
 * - OCR text matches when present
 * - Feature confidence in visual description
 */
export function IdentificationResultCard({
  result,
  croppedImage,
  onSelectGuess,
  onReject,
  selectedGuessIndex,
  className = ''
}: IdentificationResultCardProps) {
  const [expandedGuess, setExpandedGuess] = useState<number | null>(0);
  const [showVisualDescription, setShowVisualDescription] = useState(false);
  const [editingGuess, setEditingGuess] = useState<number | null>(null);
  const [editedValues, setEditedValues] = useState<Record<number, EditedGuess>>({});

  const { visualDescription, guesses, uncertainty, novelty } = result;

  // Get current edited or original values for a guess
  const getGuessValues = (index: number, guess: ProductGuess): EditedGuess => {
    if (editedValues[index]) {
      return editedValues[index];
    }
    return { name: guess.name, brand: guess.brand };
  };

  // Check if a guess has been edited
  const isEdited = (index: number, guess: ProductGuess): boolean => {
    const edited = editedValues[index];
    if (!edited) return false;
    return edited.name !== guess.name || edited.brand !== guess.brand;
  };

  // Get confidence bar color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-blue-500';
    if (confidence >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get confidence label
  const getConfidenceLabel = (level: ProductGuess['confidenceLevel']): { text: string; color: string } => {
    switch (level) {
      case 'high':
        return { text: 'High', color: 'text-green-600' };
      case 'medium':
        return { text: 'Medium', color: 'text-blue-600' };
      case 'low':
        return { text: 'Low', color: 'text-yellow-600' };
      case 'uncertain':
        return { text: 'Uncertain', color: 'text-red-600' };
    }
  };

  // Check if OCR found useful text
  const hasOcrText = visualDescription.ocrTexts && visualDescription.ocrTexts.length > 0;
  const brandTextFound = visualDescription.ocrTexts?.find(t => t.type === 'brand');
  const modelTextFound = visualDescription.ocrTexts?.find(t => t.type === 'model');

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header with image */}
      <div className="flex gap-4 p-4 bg-gray-50 border-b">
        {/* Cropped image preview */}
        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
          <img
            src={croppedImage}
            alt="Selected region"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Visual description toggle */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setShowVisualDescription(!showVisualDescription)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 active:text-gray-900 min-h-[44px] -my-2 py-2"
          >
            <Eye size={16} className="flex-shrink-0" />
            <span className="font-medium">What AI sees:</span>
            <span className="text-gray-500 truncate">{visualDescription.objectType}</span>
            {visualDescription.objectTypeConfidence > 0 && (
              <span className="text-xs text-gray-400">
                ({visualDescription.objectTypeConfidence}%)
              </span>
            )}
            {showVisualDescription ? <ChevronUp size={16} className="flex-shrink-0" /> : <ChevronDown size={16} className="flex-shrink-0" />}
          </button>

          {showVisualDescription && (
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>
                <strong>Colors:</strong> {visualDescription.primaryColor}
                {visualDescription.primaryColorConfidence > 0 && (
                  <span className="text-gray-400"> ({visualDescription.primaryColorConfidence}%)</span>
                )}
                {visualDescription.secondaryColors.length > 0 ? `, ${visualDescription.secondaryColors.join(', ')}` : ''}
              </p>
              {visualDescription.materials.length > 0 && (
                <p>
                  <strong>Materials:</strong> {visualDescription.materials.join(', ')}
                  {visualDescription.materialsConfidence > 0 && (
                    <span className="text-gray-400"> ({visualDescription.materialsConfidence}%)</span>
                  )}
                </p>
              )}
              {visualDescription.brandIndicators.length > 0 && (
                <p><strong>Brand cues:</strong> {visualDescription.brandIndicators.join(', ')}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* OCR Text Found Banner */}
      {hasOcrText && (brandTextFound || modelTextFound) && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <Type size={16} className="text-blue-600 flex-shrink-0" />
          <div className="text-sm">
            <span className="text-blue-800 font-medium">Text detected: </span>
            <span className="text-blue-700">
              {brandTextFound && `"${brandTextFound.text}"`}
              {brandTextFound && modelTextFound && ', '}
              {modelTextFound && `"${modelTextFound.text}"`}
            </span>
            <span className="text-blue-500 text-xs ml-1">
              (boosting confidence)
            </span>
          </div>
        </div>
      )}

      {/* Novelty/OOD Warning - More prominent than uncertainty */}
      {novelty?.isNovel && (
        <div className="px-4 py-3 bg-orange-50 border-b border-orange-200 flex items-start gap-2">
          <Sparkles size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-orange-800 font-medium">Unfamiliar Product</p>
            <p className="text-orange-700">{novelty.reason || 'This product doesn\'t match our knowledge base well.'}</p>
            <p className="text-orange-600 text-xs mt-1">
              {novelty.suggestedAction}
            </p>
          </div>
        </div>
      )}

      {/* Uncertainty warning (if not novel but still uncertain) */}
      {!novelty?.isNovel && !uncertainty.isConfident && (
        <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100 flex items-start gap-2">
          <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-yellow-800 font-medium">Not fully confident</p>
            <p className="text-yellow-700">{uncertainty.reason}</p>
            {uncertainty.whatWouldHelp.length > 0 && (
              <p className="text-yellow-600 text-xs mt-1">
                Tip: {uncertainty.whatWouldHelp[0]}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Title */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {novelty?.isNovel ? 'Help us identify this product' : 'Select the correct product'}
        </h3>
        <p className="text-sm text-gray-500">
          {novelty?.isNovel
            ? 'Our best guesses below - please select if any match'
            : `Choose from our top ${guesses.filter(g => g.confidence > 0).length} guesses`
          }
        </p>
      </div>

      {/* Guesses list */}
      <div className="px-4 pb-4 space-y-3">
        {guesses.map((guess, index) => {
          // Skip guesses with 0 confidence (padding)
          if (guess.confidence === 0 && guess.name === 'Could not identify') return null;

          const isExpanded = expandedGuess === index;
          const isSelected = selectedGuessIndex === index;
          const confidenceLabel = getConfidenceLabel(guess.confidenceLevel);
          const hasInterval = guess.confidenceInterval && guess.confidenceInterval.lower !== guess.confidenceInterval.upper;

          return (
            <div
              key={index}
              className={`border rounded-lg overflow-hidden transition-all ${
                isSelected
                  ? 'border-green-500 ring-2 ring-green-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Guess header (clickable) */}
              <button
                onClick={() => setExpandedGuess(isExpanded ? null : index)}
                className="w-full p-3 flex items-start gap-3 text-left"
              >
                {/* Rank badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  index === 0 ? 'bg-blue-100 text-blue-700' :
                  index === 1 ? 'bg-gray-100 text-gray-700' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  {index + 1}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  {(() => {
                    const currentValues = getGuessValues(index, guess);
                    const wasEdited = isEdited(index, guess);

                    return (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{currentValues.name}</p>
                          {/* Edited indicator */}
                          {wasEdited && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                              <Pencil size={10} />
                              Edited
                            </span>
                          )}
                          {/* OCR match indicator */}
                          {!wasEdited && guess.ocrMatch?.matched && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                              <Type size={10} />
                              OCR
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {currentValues.brand}
                          {guess.year && ` (${guess.year})`}
                        </p>
                      </>
                    );
                  })()}

                  {/* Confidence bar with interval */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
                      {/* Confidence interval background */}
                      {hasInterval && (
                        <div
                          className="absolute h-full bg-gray-200"
                          style={{
                            left: `${guess.confidenceInterval!.lower}%`,
                            width: `${guess.confidenceInterval!.upper - guess.confidenceInterval!.lower}%`
                          }}
                        />
                      )}
                      {/* Point estimate */}
                      <div
                        className={`h-full ${getConfidenceColor(guess.confidence)} transition-all relative z-10`}
                        style={{ width: `${guess.confidence}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${confidenceLabel.color} whitespace-nowrap`}>
                      {guess.confidence}%
                      {hasInterval && (
                        <span className="text-gray-400 font-normal">
                          {' '}[{guess.confidenceInterval!.lower}-{guess.confidenceInterval!.upper}]
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Expand/collapse icon */}
                <div className="text-gray-400">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t bg-gray-50">
                  {/* Edit mode */}
                  {editingGuess === index ? (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Product Name
                        </label>
                        <input
                          type="text"
                          value={editedValues[index]?.name ?? guess.name}
                          onChange={(e) => setEditedValues(prev => ({
                            ...prev,
                            [index]: {
                              name: e.target.value,
                              brand: prev[index]?.brand ?? guess.brand
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., TaylorMade P-7TW Irons"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Brand
                        </label>
                        <input
                          type="text"
                          value={editedValues[index]?.brand ?? guess.brand}
                          onChange={(e) => setEditedValues(prev => ({
                            ...prev,
                            [index]: {
                              name: prev[index]?.name ?? guess.name,
                              brand: e.target.value
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., TaylorMade"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGuess(null);
                          }}
                          className="flex-1 py-2.5 min-h-[44px] px-4 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGuess(null);
                            const edits = editedValues[index];
                            if (edits && (edits.name !== guess.name || edits.brand !== guess.brand)) {
                              onSelectGuess(index, edits);
                            } else {
                              onSelectGuess(index);
                            }
                          }}
                          className="flex-1 py-2.5 min-h-[44px] px-4 rounded-lg font-medium text-white bg-green-500 hover:bg-green-600 active:bg-green-700 transition-colors"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <Check size={18} />
                            Save & Select
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* OCR match details */}
                      {guess.ocrMatch?.matched && (
                        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs font-medium text-blue-700 flex items-center gap-1">
                            <Type size={12} />
                            Text match: "{guess.ocrMatch.matchedText}"
                            <span className="text-blue-500 font-normal">
                              (+{guess.ocrMatch.boostApplied}% boost)
                            </span>
                          </p>
                        </div>
                      )}

                      {/* Matching reasons */}
                      {guess.matchingReasons.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Why this match:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {guess.matchingReasons.map((reason, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <Check size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Differentiators */}
                      {guess.differentiators.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">To confirm:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {guess.differentiators.map((diff, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <HelpCircle size={12} className="text-blue-500 flex-shrink-0 mt-0.5" />
                                <span>{diff}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-3 flex gap-2">
                        {/* Edit button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Initialize edit values with current values
                            if (!editedValues[index]) {
                              setEditedValues(prev => ({
                                ...prev,
                                [index]: { name: guess.name, brand: guess.brand }
                              }));
                            }
                            setEditingGuess(index);
                          }}
                          className="py-2.5 min-h-[44px] px-4 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 transition-colors flex items-center gap-2"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        {/* Select button - 44px touch target */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const edits = editedValues[index];
                            if (edits && (edits.name !== guess.name || edits.brand !== guess.brand)) {
                              onSelectGuess(index, edits);
                            } else {
                              onSelectGuess(index);
                            }
                          }}
                          className={`flex-1 py-2.5 min-h-[44px] px-4 rounded-lg font-medium transition-colors ${
                            isSelected
                              ? 'bg-green-500 text-white active:bg-green-600'
                              : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
                          }`}
                        >
                          {isSelected ? (
                            <span className="flex items-center justify-center gap-2">
                              <Check size={18} />
                              Selected
                            </span>
                          ) : (
                            'This is correct'
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer actions - 44px touch targets */}
      <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
        <button
          onClick={onReject}
          className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-gray-600 hover:text-gray-900 active:bg-gray-200 rounded-lg transition-colors"
        >
          <X size={18} />
          <span>None of these</span>
        </button>

        {selectedGuessIndex !== undefined && (
          <p className="text-sm text-green-600 font-medium">
            Ready to add
          </p>
        )}
      </div>
    </div>
  );
}
