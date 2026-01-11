'use client';

import { useState, useEffect } from 'react';
import { X, FolderInput, Loader2, Check } from 'lucide-react';

type Bag = {
  id: string;
  code: string;
  title: string;
  category: string | null;
  is_public: boolean;
};

type MoveToBagModalProps = {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  currentBagId: string;
  onItemMoved: (targetBagId: string, targetBagTitle: string) => void;
};

export default function MoveToBagModal({
  isOpen,
  onClose,
  itemId,
  itemName,
  currentBagId,
  onItemMoved,
}: MoveToBagModalProps) {
  const [bags, setBags] = useState<Bag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [selectedBagId, setSelectedBagId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's bags when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchBags();
    }
  }, [isOpen]);

  const fetchBags = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bags');
      if (!response.ok) throw new Error('Failed to fetch bags');
      const data = await response.json();
      // Filter out the current bag
      const otherBags = data.filter((bag: Bag) => bag.id !== currentBagId);
      setBags(otherBags);
    } catch (err) {
      setError('Failed to load your curations');
      console.error('Error fetching bags:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMove = async () => {
    if (!selectedBagId) return;

    setIsMoving(true);
    setError(null);

    try {
      const response = await fetch(`/api/items/${itemId}/move-to-bag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_bag_id: selectedBagId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to move item');
      }

      const data = await response.json();
      onItemMoved(selectedBagId, data.targetBagTitle);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to move item');
    } finally {
      setIsMoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface)] rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--sky-3)] flex items-center justify-center">
              <FolderInput className="w-5 h-5 text-[var(--sky-11)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Move Item</h2>
              <p className="text-sm text-[var(--text-secondary)] line-clamp-1">{itemName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--text-tertiary)]" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-[var(--copper-9)]">{error}</p>
              <button
                onClick={fetchBags}
                className="mt-2 text-sm text-[var(--sky-11)] hover:underline"
              >
                Try again
              </button>
            </div>
          ) : bags.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-secondary)]">
                You don't have any other curations to move this item to.
              </p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                Create a new curation first, then come back here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Select a curation to move this item to:
              </p>
              {bags.map((bag) => (
                <button
                  key={bag.id}
                  onClick={() => setSelectedBagId(bag.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    selectedBagId === bag.id
                      ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-2)]'
                      : 'border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[var(--text-primary)] truncate">
                        {bag.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {bag.category && (
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {bag.category}
                          </span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          bag.is_public
                            ? 'bg-[var(--teed-green-3)] text-[var(--teed-green-11)]'
                            : 'bg-[var(--sky-3)] text-[var(--sky-11)]'
                        }`}>
                          {bag.is_public ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                    {selectedBagId === bag.id && (
                      <Check className="w-5 h-5 text-[var(--teed-green-9)] flex-shrink-0 ml-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {bags.length > 0 && (
          <div className="p-4 border-t border-[var(--border-subtle)] flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMove}
              disabled={!selectedBagId || isMoving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--teed-green-9)] text-white font-medium hover:bg-[var(--teed-green-10)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isMoving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Moving...
                </>
              ) : (
                <>
                  <FolderInput className="w-4 h-4" />
                  Move Item
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
