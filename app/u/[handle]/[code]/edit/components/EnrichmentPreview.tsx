'use client';

import { useState } from 'react';
import { Check, X, ChevronLeft, ChevronRight, Edit2, ExternalLink, Loader2, Sparkles } from 'lucide-react';

type EnrichmentSuggestion = {
  itemId: string;
  itemName: string;
  current: {
    brand?: string;
    description?: string;
    notes?: string;
    hasLink: boolean;
  };
  suggested: {
    brand?: string;
    description?: string;
    notes?: string;
    link?: {
      url: string;
      label: string;
      source: string;
      reason: string;
    };
  };
};

type EnrichmentPreviewProps = {
  suggestions: EnrichmentSuggestion[];
  onApprove: (approvedItems: string[], editedValues: Record<string, any>) => Promise<void>;
  onCancel: () => void;
};

export default function EnrichmentPreview({
  suggestions,
  onApprove,
  onCancel,
}: EnrichmentPreviewProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(suggestions.map(s => s.itemId))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isApplying, setIsApplying] = useState(false);

  // Track edited values for each suggestion
  const [editedSuggestions, setEditedSuggestions] = useState<Record<string, any>>({});

  // Track which fields are being edited
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});

  const currentSuggestion = suggestions[currentIndex];
  const isSelected = selectedItems.has(currentSuggestion.itemId);

  // Get current edited values or fall back to suggested values
  const getCurrentValues = () => {
    const edited = editedSuggestions[currentSuggestion.itemId] || {};
    return {
      brand: edited.brand !== undefined ? edited.brand : currentSuggestion.suggested.brand,
      description: edited.description !== undefined ? edited.description : currentSuggestion.suggested.description,
      notes: edited.notes !== undefined ? edited.notes : currentSuggestion.suggested.notes,
      link: edited.link !== undefined ? edited.link : currentSuggestion.suggested.link,
    };
  };

  const currentValues = getCurrentValues();

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleNext = () => {
    if (currentIndex < suggestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleEdit = (field: string, value: string) => {
    setEditedSuggestions({
      ...editedSuggestions,
      [currentSuggestion.itemId]: {
        ...(editedSuggestions[currentSuggestion.itemId] || {}),
        [field]: value,
      },
    });
  };

  const toggleEditing = (fieldKey: string) => {
    setEditingFields({
      ...editingFields,
      [fieldKey]: !editingFields[fieldKey],
    });
  };

  const handleApproveAll = async () => {
    setIsApplying(true);
    try {
      await onApprove(Array.from(selectedItems), editedSuggestions);
    } catch (error) {
      console.error('Error applying enrichments:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const selectedCount = selectedItems.size;
  const fieldKey = (field: string) => `${currentSuggestion.itemId}-${field}`;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'var(--overlay-bg)' }}
    >
      <div className="relative w-full max-w-4xl flex items-center gap-6">
        {/* Left Arrow - Floating outside modal */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="w-14 h-14 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all group flex-shrink-0"
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-full)',
            boxShadow: 'var(--shadow-4)',
          }}
          title="Previous item (← key)"
        >
          <ChevronLeft
            className="w-7 h-7 transition-transform group-hover:scale-110"
            style={{ color: 'var(--text-primary)' }}
          />
        </button>

        {/* Modal */}
        <div
          className="flex-1 max-h-[90vh] overflow-hidden flex"
          style={{
            background: 'var(--sky-2)',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-6)',
          }}
        >
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
          {/* Header */}
          <div
            className="px-8 py-6"
            style={{
              background: 'var(--base-white)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-2xl font-semibold flex items-center gap-2"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  <Sparkles className="w-6 h-6" style={{ color: 'var(--teed-green-8)' }} />
                  Review AI Suggestions
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Click <Edit2 className="w-3.5 h-3.5 inline" /> to add your own flavor • Use arrows to navigate
                </p>
              </div>
              <div className="text-right">
                <div
                  className="text-sm"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Item
                </div>
                <div
                  className="text-2xl font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {currentIndex + 1}{' '}
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    / {suggestions.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1" style={{ background: 'var(--teed-green-2)' }}>
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / suggestions.length) * 100}%`,
                background: 'var(--teed-green-8)',
              }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {/* Item Name */}
            <div className="mb-6">
              <h3
                className="text-xl font-semibold mb-2"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {currentSuggestion.itemName}
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs px-3 py-1 font-medium"
                  style={{
                    borderRadius: 'var(--radius-full)',
                    background: isSelected ? 'var(--success-bg)' : 'var(--grey-2)',
                    color: isSelected ? 'var(--success-text)' : 'var(--text-secondary)',
                  }}
                >
                  {isSelected ? '✓ Will be applied' : 'Skipped'}
                </span>
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-4">
              {/* Brand */}
              {currentSuggestion.suggested.brand && (
                <div
                  className="p-4 transition-all"
                  style={{
                    background: 'var(--base-white)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-2)',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Brand
                      </span>
                      {!currentSuggestion.current.brand && (
                        <span
                          className="text-xs px-2 py-0.5 font-medium"
                          style={{
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--sky-3)',
                            color: 'var(--sky-11)',
                          }}
                        >
                          New
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleEditing(fieldKey('brand'))}
                      className="p-1.5 rounded transition-colors"
                      style={{
                        background: editingFields[fieldKey('brand')] ? 'var(--teed-green-3)' : 'transparent',
                      }}
                      title="Edit brand"
                    >
                      <Edit2
                        className="w-4 h-4"
                        style={{ color: editingFields[fieldKey('brand')] ? 'var(--teed-green-10)' : 'var(--text-tertiary)' }}
                      />
                    </button>
                  </div>
                  {editingFields[fieldKey('brand')] ? (
                    <input
                      type="text"
                      value={currentValues.brand || ''}
                      onChange={(e) => handleEdit('brand', e.target.value)}
                      onBlur={() => toggleEditing(fieldKey('brand'))}
                      autoFocus
                      className="w-full px-3 py-2 focus:outline-none"
                      style={{
                        border: '2px solid var(--input-border-focus)',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'var(--font-body)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  ) : (
                    <div
                      className="font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {currentValues.brand}
                      {currentSuggestion.current.brand && currentSuggestion.current.brand !== currentValues.brand && (
                        <span
                          className="ml-2 text-sm line-through"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {currentSuggestion.current.brand}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {currentSuggestion.suggested.description && (
                <div
                  className="p-4 transition-all"
                  style={{
                    background: 'var(--base-white)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-2)',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Specs / Details
                      </span>
                      {!currentSuggestion.current.description && (
                        <span
                          className="text-xs px-2 py-0.5 font-medium"
                          style={{
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--sky-3)',
                            color: 'var(--sky-11)',
                          }}
                        >
                          New
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleEditing(fieldKey('description'))}
                      className="p-1.5 rounded transition-colors"
                      style={{
                        background: editingFields[fieldKey('description')] ? 'var(--teed-green-3)' : 'transparent',
                      }}
                      title="Edit description"
                    >
                      <Edit2
                        className="w-4 h-4"
                        style={{ color: editingFields[fieldKey('description')] ? 'var(--teed-green-10)' : 'var(--text-tertiary)' }}
                      />
                    </button>
                  </div>
                  {editingFields[fieldKey('description')] ? (
                    <input
                      type="text"
                      value={currentValues.description || ''}
                      onChange={(e) => handleEdit('description', e.target.value)}
                      onBlur={() => toggleEditing(fieldKey('description'))}
                      autoFocus
                      className="w-full px-3 py-2 focus:outline-none"
                      style={{
                        border: '2px solid var(--input-border-focus)',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'var(--font-body)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  ) : (
                    <div style={{ color: 'var(--text-primary)' }}>
                      {currentValues.description}
                      {currentSuggestion.current.description && currentSuggestion.current.description !== currentValues.description && (
                        <div
                          className="mt-2 text-sm line-through"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {currentSuggestion.current.description}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {currentSuggestion.suggested.notes && (
                <div
                  className="p-4 transition-all"
                  style={{
                    background: 'var(--base-white)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-2)',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Fun Facts & Notes
                      </span>
                      {!currentSuggestion.current.notes && (
                        <span
                          className="text-xs px-2 py-0.5 font-medium"
                          style={{
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--sky-3)',
                            color: 'var(--sky-11)',
                          }}
                        >
                          New
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleEditing(fieldKey('notes'))}
                      className="p-1.5 rounded transition-colors"
                      style={{
                        background: editingFields[fieldKey('notes')] ? 'var(--teed-green-3)' : 'transparent',
                      }}
                      title="Edit notes"
                    >
                      <Edit2
                        className="w-4 h-4"
                        style={{ color: editingFields[fieldKey('notes')] ? 'var(--teed-green-10)' : 'var(--text-tertiary)' }}
                      />
                    </button>
                  </div>
                  {editingFields[fieldKey('notes')] ? (
                    <textarea
                      value={currentValues.notes || ''}
                      onChange={(e) => handleEdit('notes', e.target.value)}
                      onBlur={() => toggleEditing(fieldKey('notes'))}
                      autoFocus
                      rows={4}
                      className="w-full px-3 py-2 focus:outline-none"
                      style={{
                        border: '2px solid var(--input-border-focus)',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'var(--font-body)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  ) : (
                    <div
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {currentValues.notes}
                      {currentSuggestion.current.notes && currentSuggestion.current.notes !== currentValues.notes && (
                        <div
                          className="mt-3 pt-3 line-through"
                          style={{
                            borderTop: '1px solid var(--border-subtle)',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          {currentSuggestion.current.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Product Link */}
              {currentSuggestion.suggested.link && (
                <div
                  className="p-4"
                  style={{
                    border: '2px solid var(--sand-4)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--sand-2)',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--sand-11)' }}
                    >
                      Smart Product Link
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 font-medium"
                      style={{
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--sand-3)',
                        color: 'var(--sand-11)',
                      }}
                    >
                      {currentSuggestion.suggested.link.source}
                    </span>
                  </div>
                  <a
                    href={currentSuggestion.suggested.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-medium group"
                    style={{ color: 'var(--sand-11)' }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {currentSuggestion.suggested.link.label}
                  </a>
                  <p
                    className="text-xs mt-2"
                    style={{ color: 'var(--sand-10)' }}
                  >
                    {currentSuggestion.suggested.link.reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-8 py-4"
            style={{
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--base-white)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onCancel}
                disabled={isApplying}
                className="px-4 py-2 font-medium transition-colors disabled:opacity-50"
                style={{
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                }}
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleItem(currentSuggestion.itemId)}
                  className="px-4 py-2 font-medium transition-all"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--success-bg)' : 'var(--grey-3)',
                    color: isSelected ? 'var(--success-text)' : 'var(--text-secondary)',
                  }}
                >
                  <span className="flex items-center gap-2">
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4" />
                        Selected
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        Skip This
                      </>
                    )}
                  </span>
                </button>

                <button
                  onClick={handleApproveAll}
                  disabled={selectedCount === 0 || isApplying}
                  className="flex items-center gap-2 px-6 py-2 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--button-ai-bg)',
                    color: 'var(--button-ai-text)',
                  }}
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Apply {selectedCount} Change{selectedCount !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Right Arrow - Floating outside modal */}
        <button
          onClick={handleNext}
          disabled={currentIndex === suggestions.length - 1}
          className="w-14 h-14 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all group flex-shrink-0"
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-full)',
            boxShadow: 'var(--shadow-4)',
          }}
          title="Next item (→ key)"
        >
          <ChevronRight
            className="w-7 h-7 transition-transform group-hover:scale-110"
            style={{ color: 'var(--text-primary)' }}
          />
        </button>
      </div>
    </div>
  );
}
