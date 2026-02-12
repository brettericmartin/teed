'use client';

import { useState, useEffect } from 'react';
import { X, FolderInput, Copy, Loader2, Check } from 'lucide-react';
import * as bagsApi from '@/lib/api/domains/bags';
import * as itemsApi from '@/lib/api/domains/items';
import { ApiError } from '@/lib/api/errors';

type Bag = {
  id: string;
  code: string;
  title: string;
  item_count: number;
};

type MoveToBagModalProps = {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  currentBagId: string;
  item: any;
  itemLinks: any[];
  onItemMoved: (targetBagId: string, targetBagTitle: string) => void;
};

export default function MoveToBagModal({
  isOpen,
  onClose,
  itemId,
  itemName,
  currentBagId,
  item,
  itemLinks,
  onItemMoved,
}: MoveToBagModalProps) {
  const [bags, setBags] = useState<Bag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [selectedBagId, setSelectedBagId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'copy' | 'move'>('copy');

  // Fetch user's bags when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchBags();
      setSelectedBagId(null);
      setError(null);
      setMode('copy');
    }
  }, [isOpen]);

  const fetchBags = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bagsApi.listMine();
      // Filter out the current bag
      const otherBags = (data.bags || []).filter((bag: Bag) => bag.id !== currentBagId);
      setBags(otherBags);
    } catch (err) {
      setError('Failed to load your curations');
      console.error('Error fetching bags:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedBagId) return;

    const selectedBag = bags.find(b => b.id === selectedBagId);
    if (!selectedBag) return;

    setIsWorking(true);
    setError(null);

    try {
      if (mode === 'move') {
        const data = await itemsApi.moveToBag(itemId, selectedBagId);
        onItemMoved(selectedBagId, data.targetBagTitle);
      } else {
        await itemsApi.copyToBag({
          target_bag_code: selectedBag.code,
          source_item: {
            custom_name: item.custom_name,
            brand: item.brand,
            custom_description: item.custom_description,
            notes: item.notes,
            quantity: item.quantity,
            photo_url: item.photo_url,
            custom_photo_id: item.custom_photo_id,
            promo_codes: item.promo_codes,
            links: (itemLinks || []).map((l: any) => ({
              url: l.url,
              kind: l.kind,
              label: l.label,
              metadata: l.metadata,
            })),
          },
        });
      }
      onClose();
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : `Failed to ${mode} item`);
    } finally {
      setIsWorking(false);
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
              {mode === 'copy' ? (
                <Copy className="w-5 h-5 text-[var(--sky-11)]" />
              ) : (
                <FolderInput className="w-5 h-5 text-[var(--sky-11)]" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {mode === 'copy' ? 'Copy' : 'Move'} Item
              </h2>
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
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-[var(--surface-alt)] rounded-lg mb-4">
            <button
              onClick={() => setMode('copy')}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'copy'
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Copy
            </button>
            <button
              onClick={() => setMode('move')}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'move'
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Move
            </button>
          </div>

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
                You don't have any other curations to {mode} this item to.
              </p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                Create a new curation first, then come back here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Select a curation to {mode} this item to:
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
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {bag.item_count} item{bag.item_count !== 1 ? 's' : ''}
                      </span>
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
              onClick={handleAction}
              disabled={!selectedBagId || isWorking}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--teed-green-9)] text-white font-medium hover:bg-[var(--teed-green-10)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isWorking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'copy' ? 'Copying...' : 'Moving...'}
                </>
              ) : (
                <>
                  {mode === 'copy' ? (
                    <Copy className="w-4 h-4" />
                  ) : (
                    <FolderInput className="w-4 h-4" />
                  )}
                  {mode === 'copy' ? 'Copy Item' : 'Move Item'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
