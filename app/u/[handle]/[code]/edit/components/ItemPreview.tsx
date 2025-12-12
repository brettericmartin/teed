'use client';

import { useState } from 'react';
import { Check, Edit2, X, Sparkles } from 'lucide-react';
import { GolfLoader } from '@/components/ui/GolfLoader';

type ProductSuggestion = {
  custom_name: string;
  custom_description: string;
  notes: string;
  category: string;
  confidence: number;
  brand?: string;
  funFactOptions?: string[];
  productUrl?: string;
  imageUrl?: string;
  price?: string;
};

type ItemPreviewProps = {
  suggestion: ProductSuggestion;
  onConfirm: (editedSuggestion: ProductSuggestion) => void;
  onCancel: () => void;
  isAdding?: boolean;
};

export default function ItemPreview({ suggestion, onConfirm, onCancel, isAdding = false }: ItemPreviewProps) {
  const [editedSuggestion, setEditedSuggestion] = useState<ProductSuggestion>(suggestion);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFactIndex, setSelectedFactIndex] = useState<number | null>(null); // null = no fact selected
  const [showFactOptions, setShowFactOptions] = useState(false);
  const [isGeneratingFacts, setIsGeneratingFacts] = useState(false);
  const [customNote, setCustomNote] = useState('');

  const handleConfirm = () => {
    // Use selected fun fact, custom note, or empty
    let notes = '';
    if (selectedFactIndex !== null && editedSuggestion.funFactOptions?.[selectedFactIndex]) {
      notes = editedSuggestion.funFactOptions[selectedFactIndex];
    } else if (customNote.trim()) {
      notes = customNote.trim();
    }

    const finalSuggestion = {
      ...editedSuggestion,
      notes,
    };
    onConfirm(finalSuggestion);
  };

  const generateFunFacts = async () => {
    setIsGeneratingFacts(true);
    try {
      const response = await fetch('/api/ai/generate-fun-facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: editedSuggestion.brand,
          productName: editedSuggestion.custom_name,
          category: editedSuggestion.category,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEditedSuggestion({
          ...editedSuggestion,
          funFactOptions: data.funFacts || [],
        });
        setShowFactOptions(true);
      }
    } catch (error) {
      console.error('Failed to generate fun facts:', error);
    } finally {
      setIsGeneratingFacts(false);
    }
  };

  const hasFunFactOptions = editedSuggestion.funFactOptions && editedSuggestion.funFactOptions.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Review Item Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Confirm or edit the AI-generated information
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Cancel"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image Preview */}
          {editedSuggestion.imageUrl && (
            <div className="flex justify-center">
              <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={editedSuggestion.imageUrl}
                  alt={editedSuggestion.custom_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Hide image on error
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedSuggestion.brand || ''}
                onChange={(e) =>
                  setEditedSuggestion({ ...editedSuggestion, brand: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                {editedSuggestion.brand || 'Not specified'}
              </div>
            )}
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedSuggestion.custom_name}
                onChange={(e) =>
                  setEditedSuggestion({ ...editedSuggestion, custom_name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                {editedSuggestion.custom_name}
              </div>
            )}
          </div>

          {/* Specs/Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specs / Details
              <span className="text-xs text-gray-500 ml-2">(Use | to separate)</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedSuggestion.custom_description}
                onChange={(e) =>
                  setEditedSuggestion({
                    ...editedSuggestion,
                    custom_description: e.target.value,
                  })
                }
                placeholder="e.g., 10.5° | Fujikura Ventus | Stiff"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                {editedSuggestion.custom_description || 'Not specified'}
              </div>
            )}
          </div>

          {/* Notes Section - Optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
              <span className="text-xs text-gray-400 ml-2">(optional)</span>
            </label>

            {/* Custom note input */}
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Add your own notes about this item..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
            />

            {/* AI Generate button or Fun Fact options */}
            {!showFactOptions && !hasFunFactOptions ? (
              <button
                onClick={generateFunFacts}
                disabled={isGeneratingFacts}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {isGeneratingFacts ? (
                  <>
                    <GolfLoader size="sm" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate AI Fun Fact
                  </>
                )}
              </button>
            ) : hasFunFactOptions && (showFactOptions || selectedFactIndex !== null) ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-600">
                    Or choose an AI-generated fact:
                  </p>
                  {selectedFactIndex !== null && (
                    <button
                      onClick={() => setSelectedFactIndex(null)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {editedSuggestion.funFactOptions?.map((fact, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedFactIndex(selectedFactIndex === index ? null : index)}
                      className={`w-full text-left p-3 border-2 rounded-lg transition-all text-sm ${
                        selectedFactIndex === index
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                            selectedFactIndex === index
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedFactIndex === index && (
                            <Check className="w-2.5 h-2.5 text-white" />
                          )}
                        </div>
                        <p className="text-gray-700 leading-relaxed">{fact}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : hasFunFactOptions ? (
              <button
                onClick={() => setShowFactOptions(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Show AI Fun Facts ({editedSuggestion.funFactOptions?.length})
              </button>
            ) : null}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="px-4 py-2 bg-gray-50 rounded-lg">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">
                {editedSuggestion.category}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            {isEditing ? 'Done Editing' : 'Edit Details'}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isAdding}
              className="flex items-center gap-2 px-6 py-2 bg-[var(--button-create-bg)] text-white rounded-lg hover:bg-[var(--button-create-bg-hover)] font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isAdding ? (
                <>
                  <GolfLoader size="sm" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Add to Bag
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
