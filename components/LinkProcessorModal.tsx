'use client';

import { useState, useCallback } from 'react';
import {
  X,
  Link2,
  Video,
  User,
  ShoppingBag,
  Loader2,
  Check,
  ExternalLink,
  LayoutGrid,
  FolderPlus,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClassifiedUrl } from '@/lib/linkIntelligence/types';

type Step = 'choose' | 'select-bag' | 'processing' | 'success';
type Action = 'profile' | 'existing-bag' | 'new-bag' | 'social';

interface Bag {
  id: string;
  title: string;
  code: string;
}

interface LinkProcessorModalProps {
  isOpen: boolean;
  classification: ClassifiedUrl;
  onClose: () => void;
  onAddToProfile?: () => Promise<void>;
  onAddToBag?: (bagId: string | null) => Promise<void>;
  onAddToSocialLinks?: () => Promise<void>;
  userBags?: Bag[];
}

/**
 * LinkProcessorModal - Modal-driven link workflow
 *
 * When a link is pasted, this modal guides the user through what to do:
 * 1. Shows instant classification (embed/product/social)
 * 2. Presents clear action choices
 * 3. For "Add to Bag", shows bag selector or new bag option
 * 4. Confirms success with celebration
 */
export function LinkProcessorModal({
  isOpen,
  classification,
  onClose,
  onAddToProfile,
  onAddToBag,
  onAddToSocialLinks,
  userBags = [],
}: LinkProcessorModalProps) {
  const [step, setStep] = useState<Step>('choose');
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [selectedBagId, setSelectedBagId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  const handleClose = useCallback(() => {
    if (isProcessing) return;
    setStep('choose');
    setSelectedAction(null);
    setSelectedBagId(null);
    setError(null);
    onClose();
  }, [isProcessing, onClose]);

  // Get icon and colors for type
  const getTypeInfo = () => {
    switch (classification.type) {
      case 'embed':
        return {
          icon: Video,
          color: 'bg-purple-100 text-purple-600',
          label: 'Embed',
          description: 'Video, music, or rich media'
        };
      case 'social':
        return {
          icon: User,
          color: 'bg-blue-100 text-blue-600',
          label: 'Social Profile',
          description: 'Connect your social presence'
        };
      case 'product':
        return {
          icon: ShoppingBag,
          color: 'bg-amber-100 text-amber-600',
          label: 'Product',
          description: 'Item or gear to add'
        };
    }
  };

  const typeInfo = getTypeInfo();
  const TypeIcon = typeInfo.icon;

  // Get platform display name
  const getPlatformName = () => {
    return classification.platform
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get domain for display
  const getDomain = () => {
    try {
      const url = new URL(classification.normalizedUrl);
      return url.hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

  // Handle action selection
  const handleSelectAction = async (action: Action) => {
    setSelectedAction(action);
    setError(null);

    if (action === 'existing-bag') {
      if (userBags.length === 0) {
        // No bags, go straight to new bag flow
        await handleCreateNewBag();
      } else {
        setStep('select-bag');
      }
    } else if (action === 'new-bag') {
      await handleCreateNewBag();
    } else if (action === 'profile') {
      await handleAddToProfile();
    } else if (action === 'social') {
      await handleAddToSocialLinks();
    }
  };

  // Handle add to profile (embeds)
  const handleAddToProfile = async () => {
    if (!onAddToProfile) return;

    setIsProcessing(true);
    setStep('processing');
    try {
      await onAddToProfile();
      setStep('success');
    } catch {
      setError('Failed to add to profile. Please try again.');
      setStep('choose');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle add to existing bag
  const handleAddToExistingBag = async (bagId: string) => {
    if (!onAddToBag) return;

    setSelectedBagId(bagId);
    setIsProcessing(true);
    setStep('processing');
    try {
      await onAddToBag(bagId);
      setStep('success');
    } catch {
      setError('Failed to add to bag. Please try again.');
      setStep('select-bag');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle create new bag
  const handleCreateNewBag = async () => {
    if (!onAddToBag) return;

    setIsProcessing(true);
    setStep('processing');
    try {
      await onAddToBag(null); // null signals new bag creation
      // Note: This typically redirects, so success state may not show
      setStep('success');
    } catch {
      setError('Failed to create bag. Please try again.');
      setStep('choose');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle add to social links
  const handleAddToSocialLinks = async () => {
    if (!onAddToSocialLinks) return;

    setIsProcessing(true);
    setStep('processing');
    try {
      await onAddToSocialLinks();
      setStep('success');
    } catch {
      setError('Failed to add social link. Please try again.');
      setStep('choose');
    } finally {
      setIsProcessing(false);
    }
  };

  // Go back to choose step
  const handleBack = () => {
    setStep('choose');
    setSelectedAction(null);
    setSelectedBagId(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div className={cn(
          'relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl',
          'animate-in fade-in slide-in-from-bottom-4 duration-300'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {step === 'select-bag' && (
                <button
                  onClick={handleBack}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                typeInfo.color
              )}>
                <TypeIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{getPlatformName()}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  {getDomain()}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Step: Choose action */}
            {step === 'choose' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  What would you like to do with this link?
                </p>

                {/* Embed: Add to Profile */}
                {classification.type === 'embed' && onAddToProfile && (
                  <button
                    onClick={() => handleSelectAction('profile')}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                      'border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300'
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                      <LayoutGrid className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">Add to Profile</p>
                      <p className="text-sm text-gray-500">Embed as a profile block</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </button>
                )}

                {/* Social: Add to Social Links */}
                {classification.type === 'social' && onAddToSocialLinks && (
                  <button
                    onClick={() => handleSelectAction('social')}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                      'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300'
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">Add to Social Links</p>
                      <p className="text-sm text-gray-500">Show on your profile</p>
                    </div>
                  </button>
                )}

                {/* All types: Add to Existing Bag */}
                {onAddToBag && (
                  <button
                    onClick={() => handleSelectAction('existing-bag')}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                      'border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300'
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">Add to a Bag</p>
                      <p className="text-sm text-gray-500">
                        {userBags.length > 0
                          ? `Choose from ${userBags.length} bag${userBags.length > 1 ? 's' : ''}`
                          : 'Create your first bag'
                        }
                      </p>
                    </div>
                  </button>
                )}

                {/* All types: Create New Bag */}
                {onAddToBag && userBags.length > 0 && (
                  <button
                    onClick={() => handleSelectAction('new-bag')}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                      'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                      <FolderPlus className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">Create New Bag</p>
                      <p className="text-sm text-gray-500">Start a new collection with this item</p>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Step: Select bag */}
            {step === 'select-bag' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Choose a bag for this item:
                </p>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {userBags.map(bag => (
                    <button
                      key={bag.id}
                      onClick={() => handleAddToExistingBag(bag.id)}
                      disabled={isProcessing}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                        'border-gray-200 hover:border-teed-green-300 hover:bg-teed-green-50',
                        selectedBagId === bag.id && 'border-teed-green-500 bg-teed-green-50',
                        isProcessing && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <ShoppingBag className="w-5 h-5 text-gray-400" />
                      <span className="flex-1 text-left font-medium text-gray-700 truncate">
                        {bag.title}
                      </span>
                      {selectedBagId === bag.id && isProcessing && (
                        <Loader2 className="w-4 h-4 animate-spin text-teed-green-600" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={handleCreateNewBag}
                    disabled={isProcessing}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 p-3 rounded-xl',
                      'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium',
                      'transition-all',
                      isProcessing && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <FolderPlus className="w-5 h-5" />
                    Create New Bag Instead
                  </button>
                </div>
              </div>
            )}

            {/* Step: Processing */}
            {step === 'processing' && (
              <div className="py-8 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-teed-green-600 mb-4" />
                <p className="text-gray-600">Adding your link...</p>
              </div>
            )}

            {/* Step: Success */}
            {step === 'success' && (
              <div className="py-8 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-teed-green-100 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-teed-green-600" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">Added!</p>
                <p className="text-sm text-gray-500 mb-6">
                  {selectedAction === 'profile' && 'Link added to your profile'}
                  {selectedAction === 'social' && 'Social link connected'}
                  {(selectedAction === 'existing-bag' || selectedAction === 'new-bag') && 'Item added to your bag'}
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-teed-green-600 hover:bg-teed-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Footer: Link preview */}
          {step !== 'success' && step !== 'processing' && (
            <div className="px-4 pb-4">
              <a
                href={classification.normalizedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 truncate group"
              >
                <span className="truncate">{classification.normalizedUrl}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          )}

          {/* Safe area for mobile */}
          <div className="h-safe-area-inset-bottom sm:hidden" />
        </div>
      </div>
    </div>
  );
}
