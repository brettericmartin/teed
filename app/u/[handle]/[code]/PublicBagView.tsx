'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Share2, ExternalLink, User, X, Package, Trophy } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';

interface ItemLink {
  id: string;
  url: string;
  kind: string;
  label: string | null;
  metadata: any;
  is_auto_generated?: boolean;
}

interface Item {
  id: string;
  custom_name: string | null;
  custom_description: string | null;
  notes: string | null;
  quantity: number;
  sort_index: number;
  photo_url: string | null;
  is_featured: boolean;
  links: ItemLink[];
}

interface Bag {
  id: string;
  code: string;
  title: string;
  description: string | null;
  is_public: boolean;
  hero_item_id: string | null;
  cover_photo_id: string | null;
  cover_photo_url: string | null;
  created_at: string;
}

interface PublicBagViewProps {
  bag: Bag;
  items: Item[];
  ownerHandle: string;
  ownerName: string;
  hasAffiliateLinks?: boolean;
  disclosureText?: string;
}

export default function PublicBagView({
  bag,
  items,
  ownerHandle,
  ownerName,
  hasAffiliateLinks = false,
  disclosureText,
}: PublicBagViewProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Track page view
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'bag_viewed',
            event_data: {
              bag_id: bag.id,
              bag_code: bag.code,
              owner_handle: ownerHandle,
              referrer: document.referrer || undefined,
            },
          }),
        });
      } catch (error) {
        // Silent failure - don't interrupt user experience
        console.log('[Analytics] View tracking failed:', error);
      }
    };

    trackView();
  }, [bag.id, bag.code, ownerHandle]);

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

  // Track link click
  const trackLinkClick = async (linkId: string, itemId: string, url: string) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'link_clicked',
          event_data: {
            link_id: linkId,
            item_id: itemId,
            bag_id: bag.id,
            url,
          },
        }),
      });
    } catch (error) {
      // Silent failure
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
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: ownerName, href: `/u/${ownerHandle}`, icon: <User className="w-4 h-4" /> },
              { label: bag.title },
            ]}
            showHome={false}
          />

          <div className="flex items-start justify-between mt-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-[var(--font-size-9)] font-semibold text-[var(--text-primary)]">
                  {bag.title}
                </h1>
                <button
                  onClick={handleShare}
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-[var(--radius-md)] transition-colors"
                  title="Share"
                  aria-label="Share this bag"
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

      {/* FTC Affiliate Disclosure */}
      {hasAffiliateLinks && (
        <div className="bg-[var(--copper-2)] border-y border-[var(--copper-6)]">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-[var(--copper-11)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-[var(--copper-12)] font-medium mb-1">
                  Affiliate Disclosure
                </p>
                <p className="text-sm text-[var(--copper-12)]">
                  {disclosureText || 'This page contains affiliate links. If you purchase through these links, the creator may earn a commission at no extra cost to you.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover Photo Banner */}
      {bag.cover_photo_url && (
        <div className="max-w-5xl mx-auto px-4 pt-8">
          <div className="rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-3)]">
            <img
              src={bag.cover_photo_url}
              alt={`${bag.title} cover`}
              className="w-full h-48 md:h-64 object-cover"
            />
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-[var(--sky-3)] w-20 h-20 rounded-full mx-auto flex items-center justify-center">
              <Package className="h-10 w-10 text-[var(--evergreen-10)]" />
            </div>
            <p className="text-[var(--text-secondary)] text-lg mt-6">No items in this bag yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {items.map((item) => {
              const isHero = bag.hero_item_id === item.id;
              return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] overflow-hidden hover:shadow-[var(--shadow-3)] transition-all cursor-pointer active:scale-[0.98] relative ${
                  isHero
                    ? 'ring-2 ring-[var(--amber-8)] border-2 border-[var(--amber-6)]'
                    : 'border border-[var(--border-subtle)]'
                }`}
              >
                {/* Hero Badge */}
                {isHero && (
                  <div className="absolute top-3 right-3 z-10 bg-[var(--amber-3)] text-[var(--amber-11)] px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Trophy className="w-3.5 h-3.5 fill-current" />
                    <span className="text-xs font-medium">Hero</span>
                  </div>
                )}
                {/* Item Photo */}
                {item.photo_url && (
                  <div className="aspect-square bg-[var(--sky-2)] overflow-hidden">
                    <img
                      src={item.photo_url}
                      alt={item.custom_name || 'Item photo'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="p-4 md:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base md:text-lg font-semibold text-[var(--text-primary)] flex-1 leading-tight">
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
              </div>
              );
            })}
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
            className="bg-[var(--modal-bg)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-6)] border border-[var(--modal-border)] max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-[var(--modal-bg)] border-b border-[var(--border-subtle)] px-4 sm:px-8 py-4 sm:py-6 flex items-start justify-between rounded-t-[var(--radius-2xl)]">
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
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ml-4 rounded-lg p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-[var(--surface-hover)]"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-4 sm:px-8 py-6 space-y-6">
              {/* Photo */}
              {selectedItem.photo_url && (
                <div className="flex justify-center">
                  <div className="max-w-md w-full bg-[var(--sky-2)] rounded-[var(--radius-lg)] overflow-hidden">
                    <img
                      src={selectedItem.photo_url}
                      alt={selectedItem.custom_name || 'Item photo'}
                      className="w-full h-auto object-contain max-h-80"
                    />
                  </div>
                </div>
              )}

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
                        onClick={() => trackLinkClick(link.id, selectedItem.id, link.url)}
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
                              {link.is_auto_generated && (
                                <span
                                  className="inline-flex items-center px-2 py-1 bg-[var(--teed-green-3)] text-[var(--teed-green-11)] rounded-lg text-xs font-medium"
                                  title="Auto-generated by Teed"
                                >
                                  TEED
                                </span>
                              )}
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

              {!selectedItem.notes && !selectedItem.photo_url && selectedItem.links.length === 0 && (
                <p className="text-[var(--text-secondary)] text-center py-8">No additional details</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-5xl mx-auto px-4 py-8 mt-12 border-t border-[var(--border-subtle)]">
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
