'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, HelpCircle, X, AlertTriangle } from 'lucide-react';
import type { SingleItemIdentificationResult, ProductGuess } from '@/lib/apis/types';

interface IdentificationResultCardProps {
  result: SingleItemIdentificationResult;
  croppedImage: string;                    // The cropped region image
  onSelectGuess: (guessIndex: number) => void;
  onReject: () => void;                    // Go back, try again
  selectedGuessIndex?: number;             // Currently selected guess
  className?: string;
}

/**
 * Displays identification results with top 3 guesses
 *
 * Shows:
 * - Cropped image preview
 * - Visual description
 * - Top 3 product guesses with confidence bars
 * - Matching reasons and differentiators
 * - Uncertainty info and suggestions
 */
export function IdentificationResultCard({
  result,
  croppedImage,
  onSelectGuess,
  onReject,
  selectedGuessIndex,
  className = ''
}: IdentificationResultCardProps) {
  const [expandedGuess, setExpandedGuess] = useState<number | null>(0); // First one expanded by default
  const [showVisualDescription, setShowVisualDescription] = useState(false);

  const { visualDescription, guesses, uncertainty } = result;

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
        return { text: 'High Confidence', color: 'text-green-600' };
      case 'medium':
        return { text: 'Medium Confidence', color: 'text-blue-600' };
      case 'low':
        return { text: 'Low Confidence', color: 'text-yellow-600' };
      case 'uncertain':
        return { text: 'Uncertain', color: 'text-red-600' };
    }
  };

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

        {/* Visual description toggle - 44px touch target */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setShowVisualDescription(!showVisualDescription)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 active:text-gray-900 min-h-[44px] -my-2 py-2"
          >
            <span className="font-medium">What AI sees:</span>
            <span className="text-gray-500 truncate">{visualDescription.objectType}</span>
            {showVisualDescription ? <ChevronUp size={16} className="flex-shrink-0" /> : <ChevronDown size={16} className="flex-shrink-0" />}
          </button>

          {showVisualDescription && (
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p><strong>Colors:</strong> {visualDescription.primaryColor}{visualDescription.secondaryColors.length > 0 ? `, ${visualDescription.secondaryColors.join(', ')}` : ''}</p>
              {visualDescription.materials.length > 0 && (
                <p><strong>Materials:</strong> {visualDescription.materials.join(', ')}</p>
              )}
              {visualDescription.visibleText.length > 0 && (
                <p><strong>Text seen:</strong> {visualDescription.visibleText.join(', ')}</p>
              )}
              {visualDescription.brandIndicators.length > 0 && (
                <p><strong>Brand cues:</strong> {visualDescription.brandIndicators.join(', ')}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Uncertainty warning */}
      {!uncertainty.isConfident && (
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
          Select the correct product
        </h3>
        <p className="text-sm text-gray-500">
          Choose from our top {guesses.filter(g => g.confidence > 0).length} guesses
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
                  <p className="font-medium text-gray-900 truncate">{guess.name}</p>
                  <p className="text-sm text-gray-500">
                    {guess.brand}
                    {guess.year && ` (${guess.year})`}
                  </p>

                  {/* Confidence bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getConfidenceColor(guess.confidence)} transition-all`}
                        style={{ width: `${guess.confidence}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${confidenceLabel.color}`}>
                      {guess.confidence}%
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

                  {/* Select button - 44px touch target */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectGuess(index);
                    }}
                    className={`mt-3 w-full py-3 min-h-[44px] px-4 rounded-lg font-medium transition-colors ${
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
