'use client';

import { useState } from 'react';
import {
  Plus,
  Check,
  Package,
  Calendar,
  Video,
  User,
  ShoppingBag,
} from 'lucide-react';
import type { BagOption } from '@/lib/types/universalLink';

interface DestinationStepProps {
  bags: BagOption[];
  selectedBagCode: string | null;
  newBagTitle: string;
  onSelectBag: (code: string | null) => void;
  onNewBagTitleChange: (title: string) => void;
  // Summary counts
  embedCount: number;
  socialCount: number;
  productCount: number;
  isLoading: boolean;
}

export default function DestinationStep({
  bags,
  selectedBagCode,
  newBagTitle,
  onSelectBag,
  onNewBagTitleChange,
  embedCount,
  socialCount,
  productCount,
  isLoading,
}: DestinationStepProps) {
  const [showNewBagInput, setShowNewBagInput] = useState(selectedBagCode === 'new');

  const handleSelectNewBag = () => {
    setShowNewBagInput(true);
    onSelectBag('new');
  };

  const handleSelectExistingBag = (code: string) => {
    setShowNewBagInput(false);
    onSelectBag(code);
  };

  return (
    <div className="p-5 space-y-6">
      {/* Summary */}
      <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
          Ready to add
        </h3>
        <div className="flex gap-4">
          {embedCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Video className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <span className="text-lg font-bold text-[var(--text-primary)]">{embedCount}</span>
                <span className="text-xs text-[var(--text-tertiary)] ml-1">embed{embedCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
          {socialCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="text-lg font-bold text-[var(--text-primary)]">{socialCount}</span>
                <span className="text-xs text-[var(--text-tertiary)] ml-1">social</span>
              </div>
            </div>
          )}
          {productCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <span className="text-lg font-bold text-[var(--text-primary)]">{productCount}</span>
                <span className="text-xs text-[var(--text-tertiary)] ml-1">product{productCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product destination - only show if there are products */}
      {productCount > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Where should we add the products?
          </h3>

          {/* Create new bag option */}
          <button
            onClick={handleSelectNewBag}
            disabled={isLoading}
            className={`
              w-full p-4 rounded-xl border-2 text-left transition-all
              ${selectedBagCode === 'new'
                ? 'border-[var(--teed-green-7)] bg-[var(--teed-green-1)]'
                : 'border-dashed border-[var(--border-default)] hover:border-[var(--border-hover)] bg-[var(--surface)]'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${selectedBagCode === 'new'
                  ? 'bg-[var(--teed-green-9)]'
                  : 'bg-[var(--surface-elevated)]'
                }
              `}>
                <Plus className={`w-5 h-5 ${selectedBagCode === 'new' ? 'text-white' : 'text-[var(--text-tertiary)]'}`} />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Create new bag</p>
                <p className="text-sm text-[var(--text-tertiary)]">Start a fresh collection</p>
              </div>
              {selectedBagCode === 'new' && (
                <Check className="w-5 h-5 text-[var(--teed-green-9)] ml-auto" />
              )}
            </div>
          </button>

          {/* New bag title input */}
          {showNewBagInput && selectedBagCode === 'new' && (
            <div className="pl-4">
              <input
                type="text"
                value={newBagTitle}
                onChange={(e) => onNewBagTitleChange(e.target.value)}
                placeholder="Enter bag title..."
                disabled={isLoading}
                className="
                  w-full px-4 py-3 rounded-xl
                  border border-[var(--border-subtle)]
                  bg-[var(--surface)]
                  text-[var(--text-primary)]
                  placeholder:text-[var(--text-tertiary)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]
                  disabled:opacity-50
                "
                autoFocus
              />
            </div>
          )}

          {/* Existing bags */}
          {bags.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
                Or add to existing bag
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {bags.map((bag) => (
                  <button
                    key={bag.id}
                    onClick={() => handleSelectExistingBag(bag.code)}
                    disabled={isLoading}
                    className={`
                      w-full p-3 rounded-xl border text-left transition-all
                      ${selectedBagCode === bag.code
                        ? 'border-[var(--teed-green-7)] bg-[var(--teed-green-1)]'
                        : 'border-[var(--border-subtle)] hover:border-[var(--border-hover)] bg-[var(--surface)]'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center">
                        <Package className="w-5 h-5 text-[var(--text-tertiary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text-primary)] truncate">
                          {bag.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                          <span>{bag.itemCount} item{bag.itemCount !== 1 ? 's' : ''}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatRelativeDate(bag.updatedAt)}
                          </span>
                        </div>
                      </div>
                      {selectedBagCode === bag.code && (
                        <Check className="w-5 h-5 text-[var(--teed-green-9)] flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info when no products */}
      {productCount === 0 && (embedCount > 0 || socialCount > 0) && (
        <div className="p-4 rounded-xl bg-[var(--teed-green-1)] border border-[var(--teed-green-4)]">
          <p className="text-sm text-[var(--teed-green-11)]">
            {embedCount > 0 && socialCount > 0
              ? 'Embeds will be added as profile panels and social links will be added to your profile.'
              : embedCount > 0
                ? 'Embeds will be added as panels to your profile.'
                : 'Social links will be added to your profile.'
            }
          </p>
        </div>
      )}
    </div>
  );
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
