'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Simplified Item type for selection modal - only requires fields used for display
interface Item {
  id: string;
  custom_name: string;
  brand: string | null;
  custom_description: string | null;
  currentPhotoUrl?: string | null;
  hasDetails?: boolean; // For enrichment mode - indicates item already has details
}

interface ItemSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  onConfirm: (selectedItems: Item[]) => void;
  title?: string;
  description?: string;
  mode?: 'photo' | 'enrichment'; // Mode for different behaviors
}

export default function ItemSelectionModal({
  isOpen,
  onClose,
  items,
  onConfirm,
  title = 'Select Items',
  description = 'Choose which items you want to search for photos',
  mode = 'photo',
}: ItemSelectionModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(items.map(item => item.id)) // All selected by default
  );

  if (!isOpen) return null;

  const toggleSelection = (itemId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  };

  const deselectItemsWithPhotos = () => {
    const newSelected = new Set(selectedIds);
    items.forEach(item => {
      if (item.currentPhotoUrl) {
        newSelected.delete(item.id);
      }
    });
    setSelectedIds(newSelected);
  };

  const deselectItemsWithDetails = () => {
    const newSelected = new Set(selectedIds);
    items.forEach(item => {
      if (item.hasDetails) {
        newSelected.delete(item.id);
      }
    });
    setSelectedIds(newSelected);
  };

  const itemsWithPhotosCount = items.filter(item => item.currentPhotoUrl).length;
  const itemsWithDetailsCount = items.filter(item => item.hasDetails).length;

  const handleConfirm = () => {
    const selectedItems = items.filter(item => selectedIds.has(item.id));
    onConfirm(selectedItems);
  };

  const allSelected = selectedIds.size === items.length;
  const selectedCount = selectedIds.size;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[var(--overlay-bg)] transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-start md:items-center justify-center md:p-4">
        <div className="relative bg-[var(--modal-bg)] md:rounded-[var(--radius-xl)] shadow-[var(--shadow-6)] border border-[var(--modal-border)] w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {title}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors rounded-lg hover:bg-[var(--surface-hover)]"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Select All */}
          <div className="px-6 py-3 bg-[var(--sky-2)] border-b border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 text-[var(--teed-green-9)] rounded border-[var(--border-default)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Select All ({items.length})
                </span>
              </label>
              {mode === 'photo' && itemsWithPhotosCount > 0 && (
                <button
                  onClick={deselectItemsWithPhotos}
                  className="text-sm text-[var(--sky-11)] hover:text-[var(--sky-12)] hover:underline transition-colors"
                >
                  Skip {itemsWithPhotosCount} with photos
                </button>
              )}
              {mode === 'enrichment' && itemsWithDetailsCount > 0 && (
                <button
                  onClick={deselectItemsWithDetails}
                  className="text-sm text-[var(--sky-11)] hover:text-[var(--sky-12)] hover:underline transition-colors"
                >
                  Skip {itemsWithDetailsCount} with details
                </button>
              )}
            </div>
            <span className="text-sm text-[var(--text-secondary)]">
              {selectedCount} selected
            </span>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)]">No items to select</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedIds.has(item.id)
                        ? 'border-[var(--teed-green-8)] bg-[var(--teed-green-2)]'
                        : 'border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-default)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="mt-0.5 w-5 h-5 text-[var(--teed-green-9)] rounded border-[var(--border-default)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                    />

                    {/* Item photo thumbnail if available */}
                    {item.currentPhotoUrl && (
                      <img
                        src={item.currentPhotoUrl}
                        alt={item.custom_name}
                        className="w-12 h-12 object-cover rounded border border-[var(--border-subtle)] flex-shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {item.custom_name}
                      </p>
                      {item.brand && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {item.brand}
                        </p>
                      )}
                      {item.custom_description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                          {item.custom_description}
                        </p>
                      )}
                      {mode === 'photo' && item.currentPhotoUrl && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-[var(--copper-3)] text-[var(--copper-11)] rounded">
                          Has photo - will replace
                        </span>
                      )}
                      {mode === 'enrichment' && item.hasDetails && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-[var(--teed-green-3)] text-[var(--teed-green-11)] rounded">
                          Has details - will regenerate
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-6 border-t border-[var(--border-subtle)] bg-[var(--sky-1)]">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              variant="create"
              className="flex-1 sm:flex-none"
            >
              <Check className="w-4 h-4 mr-2" />
              {mode === 'photo'
                ? `Search for ${selectedCount} ${selectedCount === 1 ? 'Photo' : 'Photos'}`
                : `Auto-Fill ${selectedCount} ${selectedCount === 1 ? 'Item' : 'Items'}`
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
