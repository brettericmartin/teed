'use client';

import { useState } from 'react';
import { X, Plus, FolderPlus, Link2, Video, User, ShoppingBag, Loader2, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClassifiedUrl } from '@/lib/linkIntelligence/types';

interface SmartLinkToastProps {
  classification: ClassifiedUrl;
  onAddToProfile?: () => void;
  onAddToBag?: (bagId: string | null) => void; // null = create new bag
  onAddToSocialLinks?: () => void;
  onDismiss: () => void;
  isProcessing?: boolean;
  userBags?: Array<{ id: string; title: string; code: string }>;
}

/**
 * SmartLinkToast - Shows when user pastes a link anywhere
 *
 * Displays instant classification and action buttons:
 * - Embeds: Add to Profile, Add to Bag
 * - Products: Add to Bag (with bag selector)
 * - Social: Add to Social Links
 */
export function SmartLinkToast({
  classification,
  onAddToProfile,
  onAddToBag,
  onAddToSocialLinks,
  onDismiss,
  isProcessing = false,
  userBags = [],
}: SmartLinkToastProps) {
  const [showBagSelector, setShowBagSelector] = useState(false);
  const [selectedBagId, setSelectedBagId] = useState<string | null>(null);

  // Get icon for type
  const TypeIcon = classification.type === 'embed'
    ? Video
    : classification.type === 'social'
      ? User
      : ShoppingBag;

  // Get display label
  const getTypeLabel = () => {
    const platform = classification.platform.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    switch (classification.type) {
      case 'embed':
        return `${platform} detected`;
      case 'social':
        return `${platform} Profile`;
      case 'product':
        return 'Product Link';
    }
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

  const handleAddToBag = (bagId: string | null) => {
    setSelectedBagId(bagId);
    onAddToBag?.(bagId);
    setShowBagSelector(false);
  };

  return (
    <div className={cn(
      'fixed bottom-24 left-1/2 -translate-x-1/2 z-50',
      'w-full max-w-md mx-auto px-4',
      'animate-in fade-in slide-in-from-bottom-4 duration-300'
    )}>
      <div className={cn(
        'bg-white rounded-2xl shadow-2xl border border-gray-200',
        'overflow-hidden'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              classification.type === 'embed' && 'bg-purple-100 text-purple-600',
              classification.type === 'social' && 'bg-blue-100 text-blue-600',
              classification.type === 'product' && 'bg-amber-100 text-amber-600',
            )}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{getTypeLabel()}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                {getDomain()}
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            disabled={isProcessing}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-3">
          {/* Bag Selector (shown when clicked "Add to Bag...") */}
          {showBagSelector ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Choose a bag:</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {userBags.map(bag => (
                  <button
                    key={bag.id}
                    onClick={() => handleAddToBag(bag.id)}
                    disabled={isProcessing}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left',
                      'text-sm text-gray-700 hover:bg-gray-100 transition-colors',
                      selectedBagId === bag.id && 'bg-teed-green-50 text-teed-green-900',
                      isProcessing && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {selectedBagId === bag.id && isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : selectedBagId === bag.id ? (
                      <Check className="w-4 h-4 text-teed-green-600" />
                    ) : (
                      <ShoppingBag className="w-4 h-4" />
                    )}
                    <span className="truncate">{bag.title}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleAddToBag(null)}
                disabled={isProcessing}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-2.5',
                  'bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700',
                  'transition-colors',
                  isProcessing && 'opacity-50 cursor-not-allowed'
                )}
              >
                <FolderPlus className="w-4 h-4" />
                Create New Bag
              </button>
              <button
                onClick={() => setShowBagSelector(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            /* Primary Actions */
            <div className="flex gap-2">
              {/* Embed: Can add to profile as block */}
              {classification.type === 'embed' && onAddToProfile && (
                <button
                  onClick={onAddToProfile}
                  disabled={isProcessing}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5',
                    'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white',
                    'rounded-xl font-medium text-sm transition-all',
                    isProcessing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add to Profile
                </button>
              )}

              {/* All types can go to a bag */}
              {onAddToBag && (
                <button
                  onClick={() => userBags.length > 0 ? setShowBagSelector(true) : handleAddToBag(null)}
                  disabled={isProcessing}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5',
                    classification.type === 'embed'
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white',
                    'rounded-xl font-medium text-sm transition-all',
                    isProcessing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {userBags.length > 0 ? 'Add to Bag...' : 'Create Bag'}
                </button>
              )}

              {/* Social: Can add to social links */}
              {classification.type === 'social' && onAddToSocialLinks && (
                <button
                  onClick={onAddToSocialLinks}
                  disabled={isProcessing}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5',
                    'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white',
                    'rounded-xl font-medium text-sm transition-all',
                    isProcessing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  Add to Social Links
                </button>
              )}
            </div>
          )}

          {/* Link preview (truncated) */}
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
      </div>
    </div>
  );
}
