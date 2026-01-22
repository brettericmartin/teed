'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Package,
  ChevronRight,
  Plus,
  Search,
  Camera,
  Link2,
  ArrowLeft,
  Loader2,
  Check,
  ImagePlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Bag = {
  id: string;
  code: string;
  title: string;
  itemCount?: number;
  backgroundImage?: string | null;
};

type AddItemStep = 'select-bag' | 'add-method' | 'enter-url' | 'uploading';

interface AddItemFlowProps {
  isOpen: boolean;
  onClose: () => void;
  bags: Bag[];
  onCreateBag: () => void;
  /** Callback when item should be added via URL */
  onAddViaUrl: (bagCode: string, url: string) => Promise<void>;
  /** Callback to navigate to bag editor for photo upload */
  onAddViaPhoto: (bagCode: string) => void;
  /** User handle for navigation */
  userHandle: string;
}

export function AddItemFlow({
  isOpen,
  onClose,
  bags,
  onCreateBag,
  onAddViaUrl,
  onAddViaPhoto,
  userHandle,
}: AddItemFlowProps) {
  const [step, setStep] = useState<AddItemStep>('select-bag');
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('select-bag');
        setSelectedBag(null);
        setSearchQuery('');
        setUrl('');
        setError(null);
      }, 300);
    }
  }, [isOpen]);

  // Filter bags by search
  const filteredBags = bags.filter(bag =>
    bag.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBag = useCallback((bag: Bag) => {
    setSelectedBag(bag);
    setStep('add-method');
  }, []);

  const handleBack = useCallback(() => {
    if (step === 'add-method') {
      setStep('select-bag');
      setSelectedBag(null);
    } else if (step === 'enter-url') {
      setStep('add-method');
      setUrl('');
      setError(null);
    }
  }, [step]);

  const handleAddViaUrl = useCallback(async () => {
    if (!selectedBag || !url.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      await onAddViaUrl(selectedBag.code, url.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedBag, url, onAddViaUrl, onClose]);

  const handleAddViaPhoto = useCallback(() => {
    if (!selectedBag) return;
    onAddViaPhoto(selectedBag.code);
    onClose();
  }, [selectedBag, onAddViaPhoto, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className={cn(
          'fixed z-[101]',
          'inset-x-4 bottom-24 sm:inset-auto',
          'sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
          'bg-[var(--surface)] rounded-2xl shadow-2xl',
          'max-w-md w-full mx-auto overflow-hidden',
          'border border-[var(--border-subtle)]',
          'max-h-[80vh] flex flex-col'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center gap-3">
            {step !== 'select-bag' && (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-[var(--sky-3)] flex items-center justify-center">
              <Package className="w-6 h-6 text-[var(--sky-10)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {step === 'select-bag' && 'Add Item'}
                {step === 'add-method' && `Add to ${selectedBag?.title}`}
                {step === 'enter-url' && 'Paste Product URL'}
              </h2>
              <p className="text-sm text-[var(--text-tertiary)]">
                {step === 'select-bag' && 'Choose which bag to add to'}
                {step === 'add-method' && 'How do you want to add it?'}
                {step === 'enter-url' && "We'll extract product details"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Bag */}
            {step === 'select-bag' && (
              <motion.div
                key="select-bag"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 space-y-3"
              >
                {/* Search */}
                {bags.length > 3 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search bags..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--sky-7)]"
                    />
                  </div>
                )}

                {/* Bag List */}
                {filteredBags.length > 0 ? (
                  <div className="space-y-2">
                    {filteredBags.map((bag) => (
                      <button
                        key={bag.id}
                        onClick={() => handleSelectBag(bag)}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--surface-hover)] transition-colors group text-left"
                      >
                        {/* Bag thumbnail */}
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--sky-4)] to-[var(--teed-green-4)] flex items-center justify-center overflow-hidden">
                          {bag.backgroundImage ? (
                            <img
                              src={bag.backgroundImage}
                              alt={bag.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-[var(--sky-10)]" />
                          )}
                        </div>

                        {/* Bag info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[var(--text-primary)] truncate">
                            {bag.title}
                          </div>
                          <div className="text-sm text-[var(--text-tertiary)]">
                            {bag.itemCount || 0} items
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                ) : bags.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" />
                    <p className="text-[var(--text-secondary)] mb-4">
                      You don't have any bags yet
                    </p>
                    <button
                      onClick={onCreateBag}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create Your First Bag
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-[var(--text-tertiary)]">
                    No bags match "{searchQuery}"
                  </div>
                )}

                {/* Create new bag option */}
                {bags.length > 0 && (
                  <button
                    onClick={onCreateBag}
                    className="w-full flex items-center gap-4 p-3 rounded-xl border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--teed-green-7)] hover:bg-[var(--teed-green-2)] transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[var(--teed-green-3)] flex items-center justify-center">
                      <Plus className="w-6 h-6 text-[var(--teed-green-9)]" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-[var(--teed-green-10)]">
                        Create New Bag
                      </div>
                      <div className="text-sm text-[var(--text-tertiary)]">
                        Start a new collection
                      </div>
                    </div>
                  </button>
                )}
              </motion.div>
            )}

            {/* Step 2: Choose Method */}
            {step === 'add-method' && (
              <motion.div
                key="add-method"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-3"
              >
                {/* Paste URL */}
                <button
                  onClick={() => setStep('enter-url')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[var(--copper-3)] hover:bg-[var(--copper-4)] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center">
                    <Link2 className="w-6 h-6 text-[var(--copper-10)]" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-[var(--copper-10)]">
                      Paste Product URL
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      We'll extract product details automatically
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--copper-10)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Take Photo */}
                <button
                  onClick={handleAddViaPhoto}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[var(--sky-3)] hover:bg-[var(--sky-4)] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-[var(--sky-10)]" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-[var(--sky-10)]">
                      Take or Upload Photo
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      Our AI will identify the product
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--sky-10)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Manual entry hint */}
                <div className="text-center text-sm text-[var(--text-tertiary)] pt-2">
                  Or go to the bag editor for more options
                </div>
              </motion.div>
            )}

            {/* Step 3: Enter URL */}
            {step === 'enter-url' && (
              <motion.div
                key="enter-url"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Product URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError(null);
                    }}
                    placeholder="https://amazon.com/dp/..."
                    autoFocus
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border bg-[var(--surface)] text-[var(--text-primary)]',
                      'placeholder:text-[var(--text-tertiary)]',
                      'focus:outline-none focus:ring-2',
                      error
                        ? 'border-[var(--copper-7)] focus:ring-[var(--copper-7)]'
                        : 'border-[var(--border-subtle)] focus:ring-[var(--teed-green-7)]'
                    )}
                  />
                  {error && (
                    <p className="mt-2 text-sm text-[var(--copper-9)]">{error}</p>
                  )}
                </div>

                <div className="text-sm text-[var(--text-tertiary)]">
                  Supported: Amazon, REI, Golf Galaxy, Dick's, Best Buy, and more
                </div>

                <button
                  onClick={handleAddViaUrl}
                  disabled={!url.trim() || isProcessing}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium',
                    'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors'
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Add Item
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

export default AddItemFlow;
