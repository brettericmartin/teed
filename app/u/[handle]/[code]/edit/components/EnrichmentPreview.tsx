'use client';

import { useState } from 'react';
import { Check, X, ChevronLeft, ChevronRight, Edit2, ExternalLink, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';

type EnrichmentSuggestion = {
  itemId: string;
  itemName: string;
  current: {
    brand?: string;
    description?: string;
    notes?: string;
    photoUrl?: string | null;
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
    photoCandidates?: Array<{ url: string; source: 'product_page' | 'search' }>;
  };
};

/** itemId -> the photo URL the owner picked; items left on "Keep current" are absent. */
export type PhotoSelections = Record<string, string>;

type EnrichmentPreviewProps = {
  suggestions: EnrichmentSuggestion[];
  onApprove: (approvedItems: string[], editedValues: Record<string, any>, photoSelections: PhotoSelections) => Promise<void>;
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
  const [editedSuggestions, setEditedSuggestions] = useState<Record<string, any>>({});
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  // An item with no photo starts on its own product page's photo, when there is one;
  // everything else starts on "Keep current" until the owner taps a photo.
  const [photoChoice, setPhotoChoice] = useState<PhotoSelections>(() => {
    const initial: PhotoSelections = {};
    for (const s of suggestions) {
      const fromPage = s.suggested.photoCandidates?.find(c => c.source === 'product_page');
      if (!s.current.photoUrl && fromPage) initial[s.itemId] = fromPage.url;
    }
    return initial;
  });
  const [brokenPhotos, setBrokenPhotos] = useState<Set<string>>(new Set());

  const currentSuggestion = suggestions[currentIndex];
  const isSelected = selectedItems.has(currentSuggestion.itemId);

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
      const photos: PhotoSelections = {};
      for (const [itemId, url] of Object.entries(photoChoice)) {
        if (selectedItems.has(itemId) && !brokenPhotos.has(url)) photos[itemId] = url;
      }
      await onApprove(Array.from(selectedItems), editedSuggestions, photos);
    } catch (error) {
      console.error('Error applying enrichments:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const selectedCount = selectedItems.size;
  const isSingleItem = suggestions.length === 1;
  const fieldKey = (field: string) => `${currentSuggestion.itemId}-${field}`;
  const candidates = (currentSuggestion.suggested.photoCandidates || []).filter(c => !brokenPhotos.has(c.url));
  const chosenPhoto = photoChoice[currentSuggestion.itemId];
  const choosePhoto = (url: string | null) => {
    setPhotoChoice(prev => {
      const next = { ...prev };
      if (url) next[currentSuggestion.itemId] = url;
      else delete next[currentSuggestion.itemId];
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white md:bg-black/50 md:items-center md:justify-center md:p-4">
      {/* Desktop backdrop */}
      <div className="hidden md:block fixed inset-0" onClick={onCancel} />

      {/* Modal - full screen mobile, centered desktop */}
      <div className="relative flex flex-col w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-xl md:shadow-2xl bg-white overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--sky-11)]" />
                <span className="truncate">AI Suggestions</span>
              </h2>
              {!isSingleItem && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Item {currentIndex + 1} of {suggestions.length}
                </p>
              )}
            </div>
            <button
              onClick={onCancel}
              className="ml-2 p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Progress bar */}
          {!isSingleItem && (
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--sky-5)] transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / suggestions.length) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Navigation arrows - inside header on mobile (hidden for single item) */}
        {!isSingleItem && (
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 active:bg-gray-200"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Item toggle in center */}
            <button
              onClick={() => toggleItem(currentSuggestion.itemId)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {isSelected ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Selected</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  <span>Skipped</span>
                </>
              )}
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex === suggestions.length - 1}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 active:bg-gray-200"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 md:p-6 space-y-4">
            {/* Item Name */}
            <div className="pb-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {currentSuggestion.itemName}
              </h3>
            </div>

            {/* Photo */}
            {candidates.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Photo</span>
                    {chosenPhoto && (
                      <span className="text-xs px-2 py-0.5 bg-[var(--sky-3)] text-[var(--sky-11)] rounded-full font-medium">
                        New
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">Tap one to use it</span>
                </div>
                <div className="p-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {/* Keep the current photo (or none) */}
                  <button
                    type="button"
                    onClick={() => choosePhoto(null)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      !chosenPhoto ? 'border-[var(--sky-9)] ring-2 ring-[var(--sky-4)]' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    aria-pressed={!chosenPhoto}
                  >
                    {currentSuggestion.current.photoUrl ? (
                      <img
                        src={currentSuggestion.current.photoUrl}
                        alt="Current photo"
                        className="w-full h-full object-contain bg-gray-50"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[11px] font-medium py-0.5 text-center">
                      {currentSuggestion.current.photoUrl ? 'Keep current' : 'No photo'}
                    </span>
                    {!chosenPhoto && (
                      <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--sky-9)] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </button>
                  {candidates.map((candidate) => {
                    const isChosen = chosenPhoto === candidate.url;
                    return (
                      <button
                        key={candidate.url}
                        type="button"
                        onClick={() => choosePhoto(candidate.url)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          isChosen ? 'border-[var(--sky-9)] ring-2 ring-[var(--sky-4)]' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        aria-pressed={isChosen}
                      >
                        <img
                          src={`/api/proxy-image?url=${encodeURIComponent(candidate.url)}`}
                          alt={candidate.source === 'product_page' ? 'Photo from the product page' : 'Photo option'}
                          loading="lazy"
                          className="w-full h-full object-contain bg-white"
                          onError={() => {
                            setBrokenPhotos(prev => new Set(prev).add(candidate.url));
                            if (isChosen) choosePhoto(null);
                          }}
                        />
                        {candidate.source === 'product_page' && (
                          <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[11px] font-medium py-0.5 text-center">
                            Product page
                          </span>
                        )}
                        {isChosen && (
                          <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--sky-9)] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Brand */}
            {currentSuggestion.suggested.brand && (
              <FieldCard
                label="Brand"
                isNew={!currentSuggestion.current.brand}
                isEditing={editingFields[fieldKey('brand')]}
                onToggleEdit={() => toggleEditing(fieldKey('brand'))}
                value={currentValues.brand || ''}
                oldValue={currentSuggestion.current.brand}
                onChange={(value) => handleEdit('brand', value)}
              />
            )}

            {/* Description */}
            {currentSuggestion.suggested.description && (
              <FieldCard
                label="Specs / Details"
                isNew={!currentSuggestion.current.description}
                isEditing={editingFields[fieldKey('description')]}
                onToggleEdit={() => toggleEditing(fieldKey('description'))}
                value={currentValues.description || ''}
                oldValue={currentSuggestion.current.description}
                onChange={(value) => handleEdit('description', value)}
              />
            )}

            {/* Notes */}
            {currentSuggestion.suggested.notes && (
              <FieldCard
                label="Fun Facts & Notes"
                isNew={!currentSuggestion.current.notes}
                isEditing={editingFields[fieldKey('notes')]}
                onToggleEdit={() => toggleEditing(fieldKey('notes'))}
                value={currentValues.notes || ''}
                oldValue={currentSuggestion.current.notes}
                onChange={(value) => handleEdit('notes', value)}
                multiline
              />
            )}

            {/* Product Link */}
            {currentSuggestion.suggested.link && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-800">
                    Smart Product Link
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                    {currentSuggestion.suggested.link.source}
                  </span>
                </div>
                <a
                  href={currentSuggestion.suggested.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-medium text-amber-900 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  {currentSuggestion.suggested.link.label}
                </a>
                <p className="text-xs text-amber-700 mt-2">
                  {currentSuggestion.suggested.link.reason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - sticky */}
        <div className="flex-shrink-0 px-4 py-4 md:px-6 border-t border-gray-200 bg-white safe-area-bottom">
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isApplying}
              className="flex-1 px-4 py-3.5 text-base font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApproveAll}
              disabled={selectedCount === 0 || isApplying}
              className="flex-[2] px-4 py-3.5 text-base font-medium text-[var(--sky-11)] bg-[var(--sky-5)] rounded-xl hover:bg-[var(--sky-6)] active:bg-[var(--sky-7)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {isSingleItem ? 'Apply Changes' : `Apply ${selectedCount} ${selectedCount === 1 ? 'Change' : 'Changes'}`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable field card component
function FieldCard({
  label,
  isNew,
  isEditing,
  onToggleEdit,
  value,
  oldValue,
  onChange,
  multiline = false,
}: {
  label: string;
  isNew: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  value: string;
  oldValue?: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {isNew && (
            <span className="text-xs px-2 py-0.5 bg-[var(--sky-3)] text-[var(--sky-11)] rounded-full font-medium">
              New
            </span>
          )}
        </div>
        <button
          onClick={onToggleEdit}
          className={`p-2 rounded-lg transition-colors ${
            isEditing
              ? 'bg-[var(--sky-3)] text-[var(--sky-11)]'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
          title={`Edit ${label.toLowerCase()}`}
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">
        {isEditing ? (
          multiline ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              autoFocus
              rows={4}
              className="w-full px-3 py-3 text-base border-2 border-[var(--sky-6)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--sky-4)]"
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              autoFocus
              className="w-full px-3 py-3 text-base border-2 border-[var(--sky-6)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--sky-4)]"
            />
          )
        ) : (
          <div className={multiline ? 'text-sm leading-relaxed' : 'font-medium'} style={{ color: 'var(--text-primary)' }}>
            {value}
            {oldValue && oldValue !== value && (
              <div className={`mt-2 text-sm line-through ${multiline ? 'pt-2 border-t border-gray-100' : ''}`} style={{ color: 'var(--text-tertiary)' }}>
                {oldValue}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
