'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Share2, ExternalLink, User, X, Package, BookOpen } from 'lucide-react';
import StoryTimeline from '@/components/story/StoryTimeline';

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
  custom_description: string | null;
  notes: string | null;
  quantity: number;
  sort_index: number;
  links: ItemLink[];
}

interface Bag {
  id: string;
  code: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

interface PublicBagViewProps {
  bag: Bag;
  items: Item[];
  ownerHandle: string;
  ownerName: string;
  isOwner?: boolean;
}

export default function PublicBagView({
  bag,
  items,
  ownerHandle,
  ownerName,
  isOwner = false,
}: PublicBagViewProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: bag.title,
          text: bag.description || `Check out ${ownerName}'s ${bag.title} on Teed`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const getLinkTypeColor = (kind: string) => {
    const colors: Record<string, string> = {
      product: 'bg-[var(--sky-3)] text-[var(--evergreen-12)]',
      review: 'bg-[var(--sand-3)] text-[var(--evergreen-12)]',
      video: 'bg-[var(--copper-2)] text-[var(--copper-11)]',
      article: 'bg-[var(--teed-green-3)] text-[var(--evergreen-12)]',
      other: 'bg-[var(--grey-2)] text-[var(--text-secondary)]',
    };
    return colors[kind] || colors.other;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[var(--surface)] shadow-[var(--shadow-2)] border-b border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-[var(--font-size-9)] font-semibold text-[var(--text-primary)]">
                  {bag.title}
                </h1>
                <button
                  onClick={handleShare}
                  className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-[var(--radius-md)] transition-colors"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
              {bag.description && (
                <p className="text-[var(--text-secondary)] text-lg">{bag.description}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-3">
                <User className="w-4 h-4" />
                <span>by</span>
                <Link
                  href={`/u/${ownerHandle}`}
                  className="font-medium text-[var(--text-primary)] hover:text-[var(--teed-green-9)] hover:underline transition-colors"
                >
                  @{ownerHandle}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-[var(--sky-3)] w-20 h-20 rounded-full mx-auto flex items-center justify-center">
              <Package className="h-10 w-10 text-[var(--evergreen-10)]" />
            </div>
            <p className="text-[var(--text-secondary)] text-lg mt-6">No items in this bag yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] border border-[var(--border-subtle)] p-6 hover:shadow-[var(--shadow-3)] transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] flex-1">
                    {item.custom_name}
                  </h3>
                  {item.quantity > 1 && (
                    <span className="ml-2 px-2 py-1 bg-[var(--sky-3)] text-[var(--evergreen-12)] text-xs font-medium rounded-lg">
                      ×{item.quantity}
                    </span>
                  )}
                </div>

                {item.custom_description && (
                  <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                    {item.custom_description}
                  </p>
                )}

                {item.links.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                    <ExternalLink className="w-3 h-3" />
                    <span>
                      {item.links.length} {item.links.length === 1 ? 'link' : 'links'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-[var(--overlay-bg)] flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-[var(--modal-bg)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-6)] border border-[var(--modal-border)] max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-[var(--modal-bg)] border-b border-[var(--border-subtle)] px-8 py-6 flex items-start justify-between rounded-t-[var(--radius-2xl)]">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-[var(--font-size-6)] font-semibold text-[var(--text-primary)]">
                    {selectedItem.custom_name}
                  </h2>
                  {selectedItem.quantity > 1 && (
                    <span className="px-2 py-1 bg-[var(--sky-3)] text-[var(--evergreen-12)] text-sm font-medium rounded-lg">
                      ×{selectedItem.quantity}
                    </span>
                  )}
                </div>
                {selectedItem.custom_description && (
                  <p className="mt-2 text-[var(--text-secondary)]">{selectedItem.custom_description}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ml-4 rounded-lg p-1 hover:bg-[var(--surface-hover)]"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-6 space-y-6">
              {/* Notes */}
              {selectedItem.notes && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Notes</h3>
                  <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{selectedItem.notes}</p>
                </div>
              )}

              {/* Links */}
              {selectedItem.links.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Links</h3>
                  <div className="space-y-3">
                    {selectedItem.links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 border border-[var(--border-subtle)] rounded-[var(--radius-md)] hover:border-[var(--teed-green-8)] hover:bg-[var(--surface-hover)] transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getLinkTypeColor(
                                  link.kind
                                )}`}
                              >
                                {link.kind.charAt(0).toUpperCase() + link.kind.slice(1)}
                              </span>
                            </div>
                            <p className="text-[var(--text-primary)] group-hover:text-[var(--teed-green-9)] font-medium break-all transition-colors">
                              {link.label || (() => { try { return new URL(link.url).hostname; } catch { return link.url; } })()}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-1 break-all">
                              {link.url}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--teed-green-9)] ml-2 flex-shrink-0 transition-colors" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!selectedItem.notes && selectedItem.links.length === 0 && (
                <p className="text-[var(--text-secondary)] text-center py-8">No additional details</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* The Story Section */}
      <div className="max-w-5xl mx-auto px-4 py-8 mt-8 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-[var(--text-secondary)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            The Story
          </h3>
        </div>
        <StoryTimeline
          bagCode={bag.code}
          maxItems={5}
          showFilters={true}
          groupByTimePeriod={true}
          isOwner={isOwner}
        />
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto px-4 py-12 mt-8 border-t border-[var(--border-subtle)]">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-2">Created with</p>
          <h2 className="text-[var(--font-size-8)] font-semibold text-[var(--text-primary)]">
            Teed
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Curations, Made Shareable
          </p>
        </div>
      </div>
    </div>
  );
}
