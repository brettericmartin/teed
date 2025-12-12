'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Package, Check } from 'lucide-react';
import { GolfLoader } from '@/components/ui/GolfLoader';
import { Button } from '@/components/ui/Button';

interface ItemLink {
  id: string;
  url: string;
  kind: string;
  label: string | null;
  metadata: any;
}

interface Item {
  id: string;
  custom_name: string | null;
  brand: string | null;
  custom_description: string | null;
  notes: string | null;
  quantity: number;
  photo_url: string | null;
  promo_codes: string | null;
  links: ItemLink[];
}

interface Bag {
  id: string;
  code: string;
  title: string;
}

interface AddToBagModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  onSuccess: (bagTitle: string) => void;
}

export default function AddToBagModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}: AddToBagModalProps) {
  const [bags, setBags] = useState<Bag[]>([]);
  const [selectedBagCode, setSelectedBagCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBags, setIsFetchingBags] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New bag creation state
  const [isCreatingNewBag, setIsCreatingNewBag] = useState(false);
  const [newBagTitle, setNewBagTitle] = useState('');
  const [isCreatingBag, setIsCreatingBag] = useState(false);

  // Fetch user's bags when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchBags();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedBagCode(null);
      setIsCreatingNewBag(false);
      setNewBagTitle('');
      setError(null);
    }
  }, [isOpen]);

  const fetchBags = async () => {
    setIsFetchingBags(true);
    setError(null);
    try {
      const response = await fetch('/api/user/bags');
      if (!response.ok) {
        throw new Error('Failed to fetch bags');
      }
      const data = await response.json();
      setBags(data.bags || []);

      // Auto-select first bag if exists
      if (data.bags?.length > 0 && !selectedBagCode) {
        setSelectedBagCode(data.bags[0].code);
      }
    } catch (err) {
      console.error('Error fetching bags:', err);
      setError('Failed to load your bags');
    } finally {
      setIsFetchingBags(false);
    }
  };

  const handleCreateBag = async () => {
    if (!newBagTitle.trim()) {
      setError('Please enter a bag title');
      return;
    }

    setIsCreatingBag(true);
    setError(null);
    try {
      const response = await fetch('/api/bags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newBagTitle.trim(),
          is_public: false, // Start as private
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create bag');
      }

      const newBag = await response.json();

      // Add new bag to list and select it
      setBags(prev => [{ id: newBag.id, code: newBag.code, title: newBag.title }, ...prev]);
      setSelectedBagCode(newBag.code);
      setIsCreatingNewBag(false);
      setNewBagTitle('');
    } catch (err: any) {
      console.error('Error creating bag:', err);
      setError(err.message || 'Failed to create bag');
    } finally {
      setIsCreatingBag(false);
    }
  };

  const handleAddToBag = async () => {
    if (!selectedBagCode || !item) {
      setError('Please select a bag');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/items/copy-to-bag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_bag_code: selectedBagCode,
          source_item: {
            custom_name: item.custom_name,
            brand: item.brand,
            custom_description: item.custom_description,
            notes: item.notes,
            quantity: item.quantity,
            photo_url: item.photo_url,
            promo_codes: item.promo_codes,
            links: item.links.map(link => ({
              url: link.url,
              kind: link.kind,
              label: link.label,
              metadata: link.metadata,
            })),
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add item');
      }

      const selectedBag = bags.find(b => b.code === selectedBagCode);
      onSuccess(selectedBag?.title || 'your bag');
    } catch (err: any) {
      console.error('Error adding item to bag:', err);
      setError(err.message || 'Failed to add item to bag');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !isCreatingBag) {
      onClose();
    }
  };

  if (!isOpen || !item) return null;

  const selectedBag = bags.find(b => b.code === selectedBagCode);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[var(--overlay-bg)] transition-opacity backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-[var(--modal-bg)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-6)] max-w-md w-full border border-[var(--modal-border)]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--border-subtle)] gap-2">
            <h2 className="text-[var(--font-size-5)] font-semibold text-[var(--text-primary)]">
              Add to Bag
            </h2>
            <button
              onClick={handleClose}
              disabled={isLoading || isCreatingBag}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 rounded-lg p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-[var(--surface-hover)] flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Item Preview */}
          <div className="px-4 sm:px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--sky-2)]">
            <div className="flex items-center gap-3">
              {item.photo_url ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0">
                  <img
                    src={item.photo_url}
                    alt={item.custom_name || 'Item'}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-[var(--grey-3)] flex items-center justify-center flex-shrink-0">
                  <Package className="w-8 h-8 text-[var(--text-tertiary)]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {item.brand && (
                  <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                    {item.brand}
                  </p>
                )}
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {item.custom_name}
                </p>
                {item.links.length > 0 && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {item.links.length} link{item.links.length !== 1 ? 's' : ''} included
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-4 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-lg">
                <p className="text-sm text-[var(--error-text)]">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {isFetchingBags ? (
              <div className="flex items-center justify-center py-8">
                <GolfLoader size="lg" />
              </div>
            ) : bags.length === 0 && !isCreatingNewBag ? (
              /* No Bags State */
              <div className="text-center py-6">
                <Package className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" />
                <p className="text-[var(--text-secondary)] mb-4">
                  You don't have any bags yet
                </p>
                <Button
                  onClick={() => setIsCreatingNewBag(true)}
                  variant="create"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Bag
                </Button>
              </div>
            ) : isCreatingNewBag ? (
              /* New Bag Form */
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="newBagTitle"
                    className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                  >
                    Bag Title <span className="text-[var(--error-text)]">*</span>
                  </label>
                  <input
                    type="text"
                    id="newBagTitle"
                    value={newBagTitle}
                    onChange={(e) => setNewBagTitle(e.target.value)}
                    placeholder="My New Bag"
                    disabled={isCreatingBag}
                    className="w-full px-4 py-3 text-base bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent disabled:bg-[var(--input-bg-disabled)] disabled:cursor-not-allowed transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newBagTitle.trim()) {
                        handleCreateBag();
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    New bags are private by default
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setIsCreatingNewBag(false);
                      setNewBagTitle('');
                    }}
                    variant="ghost"
                    disabled={isCreatingBag}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateBag}
                    variant="create"
                    disabled={isCreatingBag || !newBagTitle.trim()}
                    className="flex-1"
                  >
                    {isCreatingBag ? (
                      <>
                        <GolfLoader size="sm" className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Bag'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Bag Selection */
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Select a bag
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bags.map((bag) => (
                    <button
                      key={bag.id}
                      onClick={() => setSelectedBagCode(bag.code)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left ${
                        selectedBagCode === bag.code
                          ? 'border-[var(--teed-green-8)] bg-[var(--teed-green-2)]'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {bag.title}
                      </span>
                      {selectedBagCode === bag.code && (
                        <Check className="w-5 h-5 text-[var(--teed-green-9)] flex-shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsCreatingNewBag(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] hover:bg-[var(--teed-green-2)] rounded-lg border border-dashed border-[var(--teed-green-6)] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create New Bag
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {!isCreatingNewBag && bags.length > 0 && (
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 px-4 sm:px-6 py-4 border-t border-[var(--border-subtle)]">
              <Button
                onClick={handleClose}
                variant="ghost"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddToBag}
                variant="create"
                disabled={isLoading || !selectedBagCode}
              >
                {isLoading ? (
                  <>
                    <GolfLoader size="sm" className="mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to {selectedBag?.title || 'Bag'}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
