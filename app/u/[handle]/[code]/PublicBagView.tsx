'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Share2, ExternalLink, User, X, Package, Trophy, Copy, CheckCheck, ChevronDown, Tag } from 'lucide-react';
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
  brand: string | null;
  custom_description: string | null;
  notes: string | null;
  quantity: number;
  sort_index: number;
  photo_url: string | null;
  promo_codes: string | null;
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
  tags?: string[];
  category?: string;
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
  const [copiedPromoId, setCopiedPromoId] = useState<string | null>(null);
  const [expandedLinks, setExpandedLinks] = useState<Set<string>>(new Set());

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Helper to copy promo code
  const handleCopyPromo = async (itemId: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedPromoId(itemId);
    setTimeout(() => setCopiedPromoId(null), 2000);
  };

  // Helper to toggle expanded links
  const toggleExpandedLinks = (itemId: string) => {
    setExpandedLinks(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Helper to get primary link (prefer 'product' type)
  const getPrimaryLink = (links: ItemLink[]) => {
    return links.find(l => l.kind === 'product') || links[0];
  };

  // Helper to get link domain for display
  const getLinkDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'View';
    }
  };

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
        console.log('Share cancelled');
      }
    } else {
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

              {/* Tags */}
              {bag.tags && bag.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {bag.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/discover?tags=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 bg-[var(--sky-2)] text-[var(--sky-11)] text-sm rounded-full hover:bg-[var(--sky-3)] transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
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
              const primaryLink = getPrimaryLink(item.links);
              const secondaryLinks = item.links.filter(l => l.id !== primaryLink?.id);
              const isLinksExpanded = expandedLinks.has(item.id);

              return (
                <article
                  key={item.id}
                  className={`bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] overflow-hidden hover:shadow-[var(--shadow-3)] transition-all relative flex flex-col card-lift ${
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

                  {/* Quantity Badge */}
                  {item.quantity > 1 && (
                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-[var(--sky-3)] text-[var(--evergreen-12)] text-xs font-medium rounded-lg shadow-sm">
                      ×{item.quantity}
                    </div>
                  )}

                  {/* Item Photo */}
                  {item.photo_url && (
                    <div
                      className="aspect-square bg-[var(--sky-2)] overflow-hidden cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <img
                        src={item.photo_url}
                        alt={item.custom_name || 'Item photo'}
                        className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-4 md:p-5 flex flex-col flex-1 gap-2">
                    {/* Brand Name */}
                    {item.brand && (
                      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        {item.brand}
                      </p>
                    )}

                    {/* Product Name */}
                    <h3
                      className="text-base md:text-lg font-semibold text-[var(--text-primary)] leading-tight line-clamp-2 cursor-pointer hover:text-[var(--teed-green-9)] transition-colors"
                      onClick={() => setSelectedItem(item)}
                    >
                      {item.custom_name}
                    </h3>

                    {/* Description/Specs */}
                    {item.custom_description && (
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {item.custom_description}
                      </p>
                    )}

                    {/* Creator Notes Preview */}
                    {item.notes && (
                      <p className="text-sm text-[var(--text-tertiary)] italic line-clamp-2 border-l-2 border-[var(--teed-green-6)] pl-3 py-1">
                        {item.notes}
                      </p>
                    )}

                    {/* Promo Code */}
                    {item.promo_codes && (
                      <div className="mt-2 bg-gradient-to-r from-[var(--amber-2)] to-[var(--amber-3)] border border-dashed border-[var(--amber-6)] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-3.5 h-3.5 text-[var(--amber-11)]" />
                          <span className="text-xs font-medium text-[var(--amber-11)] uppercase tracking-wide">
                            Promo Code
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPromo(item.id, item.promo_codes!);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 min-h-[44px] bg-white border border-[var(--amber-6)] rounded-lg font-mono font-bold text-sm text-[var(--text-primary)] tracking-wider transition-all active:scale-[0.98] hover:bg-[var(--amber-1)]"
                        >
                          <span>{item.promo_codes}</span>
                          {copiedPromoId === item.id ? (
                            <CheckCheck className="w-4 h-4 text-[var(--teed-green-9)]" />
                          ) : (
                            <Copy className="w-4 h-4 text-[var(--amber-11)]" />
                          )}
                        </button>
                        {copiedPromoId === item.id && (
                          <p className="text-xs text-[var(--teed-green-9)] font-medium mt-1 text-center">
                            Copied!
                          </p>
                        )}
                      </div>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Purchase Links Section */}
                    {primaryLink && (
                      <div className="space-y-2 pt-3 mt-2 border-t border-[var(--border-subtle)]">
                        {/* Primary CTA */}
                        <a
                          href={primaryLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            trackLinkClick(primaryLink.id, item.id, primaryLink.url);
                          }}
                          className="flex items-center justify-center gap-2 w-full px-4 py-3 min-h-[48px] bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white font-medium rounded-lg transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
                        >
                          <span>Shop on {getLinkDomain(primaryLink.url)}</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* Secondary Links */}
                        {secondaryLinks.length > 0 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandedLinks(item.id);
                              }}
                              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 min-h-[44px] bg-[var(--surface)] border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] text-sm font-medium rounded-lg transition-colors"
                            >
                              <span>{secondaryLinks.length} more {secondaryLinks.length === 1 ? 'option' : 'options'}</span>
                              <ChevronDown className={`w-4 h-4 transition-transform ${isLinksExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {isLinksExpanded && (
                              <div className="space-y-2">
                                {secondaryLinks.map((link) => (
                                  <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      trackLinkClick(link.id, item.id, link.url);
                                    }}
                                    className="flex items-center justify-between w-full px-4 py-2.5 min-h-[44px] bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--teed-green-8)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-sm rounded-lg transition-all"
                                  >
                                    <span className="truncate">{getLinkDomain(link.url)}</span>
                                    <ExternalLink className="w-4 h-4 flex-shrink-0 ml-2" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </>
                        )}

                        {/* View Details Link */}
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="w-full text-center text-xs text-[var(--text-tertiary)] hover:text-[var(--teed-green-9)] transition-colors py-1"
                        >
                          View full details →
                        </button>
                      </div>
                    )}

                    {/* No Links - Just View Details */}
                    {item.links.length === 0 && (
                      <div className="pt-3 mt-2 border-t border-[var(--border-subtle)]">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="flex items-center justify-center gap-2 w-full px-4 py-3 min-h-[44px] bg-[var(--surface-hover)] hover:bg-[var(--grey-3)] text-[var(--text-primary)] font-medium rounded-lg border border-[var(--border-subtle)] transition-all"
                        >
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-[var(--overlay-bg)] flex items-center justify-center p-4 z-50 backdrop-blur-sm modal-backdrop-enter"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-[var(--modal-bg)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-6)] border border-[var(--modal-border)] max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4 modal-content-enter"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-[var(--modal-bg)] border-b border-[var(--border-subtle)] px-4 sm:px-8 py-4 sm:py-6 flex items-start justify-between rounded-t-[var(--radius-2xl)]">
              <div className="flex-1">
                {selectedItem.brand && (
                  <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    {selectedItem.brand}
                  </p>
                )}
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

              {/* Promo Code */}
              {selectedItem.promo_codes && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Promo Code</h3>
                  <div className="bg-gradient-to-r from-[var(--amber-2)] to-[var(--amber-3)] border border-dashed border-[var(--amber-6)] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-[var(--amber-11)]" />
                      <span className="text-xs font-medium text-[var(--amber-11)] uppercase tracking-wide">
                        Use at checkout
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyPromo(selectedItem.id, selectedItem.promo_codes!)}
                      className="w-full flex items-center justify-between px-4 py-3 min-h-[48px] bg-white border border-[var(--amber-6)] rounded-lg font-mono font-bold text-lg text-[var(--text-primary)] tracking-wider transition-all active:scale-[0.98] hover:bg-[var(--amber-1)]"
                    >
                      <span>{selectedItem.promo_codes}</span>
                      {copiedPromoId === selectedItem.id ? (
                        <CheckCheck className="w-5 h-5 text-[var(--teed-green-9)]" />
                      ) : (
                        <Copy className="w-5 h-5 text-[var(--amber-11)]" />
                      )}
                    </button>
                    {copiedPromoId === selectedItem.id && (
                      <p className="text-sm text-[var(--teed-green-9)] font-medium mt-2 text-center">
                        Copied to clipboard!
                      </p>
                    )}
                  </div>
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

              {!selectedItem.notes && !selectedItem.photo_url && selectedItem.links.length === 0 && !selectedItem.promo_codes && (
                <p className="text-[var(--text-secondary)] text-center py-8">No additional details</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer with CTA */}
      <div className="max-w-5xl mx-auto px-4 py-12 mt-12 border-t border-[var(--border-subtle)]">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-2">Created with</p>
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <h2 className="text-[var(--font-size-8)] font-semibold text-[var(--text-primary)]">
              Teed
            </h2>
          </Link>
          <p className="text-sm text-[var(--text-secondary)] mt-2 mb-6">
            Curations, Made Shareable
          </p>

          {/* CTA for visitors */}
          <div className="bg-gradient-to-r from-[var(--teed-green-2)] to-[var(--sky-2)] rounded-2xl p-6 max-w-md mx-auto border border-[var(--teed-green-6)]">
            <p className="text-[var(--text-primary)] font-medium mb-3">
              Want to create your own curated bags?
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white font-medium rounded-lg transition-colors"
            >
              Create Your Bag
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <p className="text-xs text-[var(--text-tertiary)] mt-3">
              Free to use • Share with anyone
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
