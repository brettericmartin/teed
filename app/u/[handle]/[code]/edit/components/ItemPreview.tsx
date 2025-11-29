'use client';

import { useState } from 'react';
import { Check, Edit2, X } from 'lucide-react';

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
};

export default function ItemPreview({ suggestion, onConfirm, onCancel }: ItemPreviewProps) {
  const [editedSuggestion, setEditedSuggestion] = useState<ProductSuggestion>(suggestion);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFactIndex, setSelectedFactIndex] = useState(0);

  const handleConfirm = () => {
    // Use the selected fun fact as the notes
    const finalSuggestion = {
      ...editedSuggestion,
      notes: editedSuggestion.funFactOptions?.[selectedFactIndex] || editedSuggestion.notes,
    };
    onConfirm(finalSuggestion);
  };

  const hasFunFactOptions = editedSuggestion.funFactOptions && editedSuggestion.funFactOptions.length > 1;

  return (
    <div className="fixed inset-0 bg-[var(--overlay-bg)] flex items-center justify-center p-4 z-50 backdrop-blur-sm modal-backdrop-enter">
      <div className="bg-[var(--modal-bg)] rounded-[var(--radius-xl)] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[var(--shadow-6)] border border-[var(--modal-border)] modal-content-enter">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--modal-bg)] border-b border-[var(--border-subtle)] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Review Item Details</h2>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent"
              />
            ) : (
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                {editedSuggestion.custom_description || 'Not specified'}
              </div>
            )}
          </div>

          {/* Fun Facts Selection */}
          {hasFunFactOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Your Favorite Fun Fact
                <span className="text-xs text-gray-500 ml-2">
                  ({editedSuggestion.funFactOptions?.length} options)
                </span>
              </label>
              <div className="space-y-3">
                {editedSuggestion.funFactOptions?.map((fact, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedFactIndex(index)}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                      selectedFactIndex === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          selectedFactIndex === index
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedFactIndex === index && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          {index === 0 && '⚡ Technical/Performance'}
                          {index === 1 && '⭐ Celebrity/Tour Usage'}
                          {index === 2 && '📚 Historical/Innovation'}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{fact}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Single Note (no options) */}
          {!hasFunFactOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes / Fun Facts
              </label>
              {isEditing ? (
                <textarea
                  value={editedSuggestion.notes}
                  onChange={(e) =>
                    setEditedSuggestion({ ...editedSuggestion, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-700 leading-relaxed">
                  {editedSuggestion.notes || 'No notes provided'}
                </div>
              )}
            </div>
          )}

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
              className="flex items-center gap-2 px-6 py-2 bg-[var(--button-create-bg)] text-white rounded-lg hover:bg-[var(--button-create-bg-hover)] font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              Add to Bag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
