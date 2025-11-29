'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Share2, ExternalLink, User, X, Package, Trophy, Copy, CheckCheck, ChevronDown, Tag, Quote } from 'lucide-react';
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

  // Get hero item and regular items
  const heroItem = items.find(item => bag.hero_item_id === item.id);
  const regularItems = items.filter(item => bag.hero_item_id !== item.id);

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

  // Render a single item card
  const renderItemCard = (item: Item, isHero: boolean = false, isSpotlight: boolean = false) => {
    const primaryLink = getPrimaryLink(item.links);
    const secondaryLinks = item.links.filter(l => l.id !== primaryLink?.id);
    const isLinksExpanded = expandedLinks.has(item.id);

    // Spotlight (hero) treatment - full width editorial style
    if (isSpotlight && isHero) {
      return (
        <article className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Large Photo */}
            <div className="relative">
              {item.photo_url && (
                <div
                  className="aspect-[4/5] bg-[var(--sand-1)] rounded-sm overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedItem(item)}
                >
                  <img
                    src={item.photo_url}
                    alt={item.custom_name || 'Hero item'}
                    className="w-full h-full object-contain p-8 transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="eager"
                  />
                </div>
              )}
              {/* Hero Badge */}
              <div className="absolute top-4 left-4 bg-[var(--copper-9)] text-white px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <Trophy className="w-3.5 h-3.5" />
                <span>Featured</span>
              </div>
              {item.quantity > 1 && (
                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-[var(--text-primary)] text-sm font-semibold border border-[var(--border-subtle)]">
                  ×{item.quantity}
                </div>
              )}
            </div>

            {/* Right: Editorial Content */}
            <div className="flex flex-col justify-center">
              {/* Brand */}
              {item.brand && (
                <p className="text-xs font-semibold text-[var(--copper-11)] uppercase tracking-[0.15em] mb-3">
                  {item.brand}
                </p>
              )}

              {/* Product Name */}
              <h2
                className="text-3xl lg:text-4xl font-semibold text-[var(--text-primary)] leading-tight tracking-tight mb-4 cursor-pointer hover:text-[var(--teed-green-9)] transition-colors"
                onClick={() => setSelectedItem(item)}
              >
                {item.custom_name}
              </h2>

              {/* Specs */}
              {item.custom_description && (
                <p className="text-base text-[var(--text-secondary)] mb-6 leading-relaxed">
                  {item.custom_description}
                </p>
              )}

              {/* Creator's Take - Pull Quote Style */}
              {item.notes && (
                <div className="relative mb-8 pl-6 border-l-3 border-[var(--copper-8)]">
                  <Quote className="absolute -left-3 -top-2 w-6 h-6 text-[var(--copper-8)] opacity-30" />
                  <p className="text-lg text-[var(--text-primary)] italic leading-relaxed font-serif">
                    "{item.notes}"
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)] mt-3 font-medium">
                    — {ownerName}
                  </p>
                </div>
              )}

              {/* Promo Code - Prominent */}
              {item.promo_codes && (
                <div className="mb-6 p-5 bg-gradient-to-br from-[var(--amber-2)] to-[var(--copper-2)] border border-[var(--copper-6)]">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-[var(--copper-11)]" />
                    <span className="text-xs font-semibold text-[var(--copper-11)] uppercase tracking-wide">
                      Exclusive Code
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPromo(item.id, item.promo_codes!);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-[var(--copper-7)] font-mono font-bold text-lg text-[var(--text-primary)] tracking-widest transition-all hover:border-[var(--copper-9)] hover:bg-[var(--copper-1)] active:scale-[0.98]"
                  >
                    <span>{item.promo_codes}</span>
                    {copiedPromoId === item.id ? (
                      <CheckCheck className="w-5 h-5 text-[var(--teed-green-9)]" />
                    ) : (
                      <Copy className="w-5 h-5 text-[var(--copper-9)]" />
                    )}
                  </button>
                  {copiedPromoId === item.id && (
                    <p className="text-xs text-[var(--teed-green-9)] font-medium mt-2 text-center">
                      Copied!
                    </p>
                  )}
                </div>
              )}

              {/* CTA Buttons */}
              {primaryLink && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={primaryLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackLinkClick(primaryLink.id, item.id, primaryLink.url);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[var(--evergreen-12)] hover:bg-[var(--evergreen-11)] text-white font-medium transition-all active:scale-[0.98]"
                  >
                    <span>Shop Now</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="px-6 py-4 border-2 border-[var(--border-default)] hover:border-[var(--evergreen-8)] text-[var(--text-primary)] font-medium transition-colors"
                  >
                    View Details
                  </button>
                </div>
              )}

              {/* Secondary Links */}
              {secondaryLinks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {secondaryLinks.slice(0, 3).map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackLinkClick(link.id, item.id, link.url)}
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--teed-green-9)] underline underline-offset-2 decoration-[var(--border-subtle)] hover:decoration-[var(--teed-green-9)] transition-colors"
                    >
                      {getLinkDomain(link.url)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </article>
      );
    }

    // Regular card - refined luxury style
    return (
      <article
        key={item.id}
        className={`group bg-white border transition-all duration-300 flex flex-col hover:-translate-y-1 ${
          isHero
            ? 'border-[var(--copper-6)] shadow-[0_0_0_1px_var(--copper-6)]'
            : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:shadow-[0_8px_30px_rgba(31,58,46,0.08)]'
        }`}
      >
        {/* Hero Badge */}
        {isHero && (
          <div className="absolute top-3 right-3 z-10 bg-[var(--copper-9)] text-white px-2.5 py-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase">
            <Trophy className="w-3 h-3" />
            <span>Featured</span>
          </div>
        )}

        {/* Quantity Badge */}
        {item.quantity > 1 && (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-white/95 backdrop-blur-sm text-[var(--text-primary)] text-xs font-semibold border border-[var(--border-subtle)]">
            ×{item.quantity}
          </div>
        )}

        {/* Item Photo */}
        {item.photo_url && (
          <div
            className="aspect-[4/5] bg-[var(--sand-1)] overflow-hidden cursor-pointer relative"
            onClick={() => setSelectedItem(item)}
          >
            <img
              src={item.photo_url}
              alt={item.custom_name || 'Item photo'}
              className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </div>
        )}

        {/* Card Content */}
        <div className="p-5 flex flex-col flex-1">
          {/* Brand Name */}
          {item.brand && (
            <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.12em] mb-2">
              {item.brand}
            </p>
          )}

          {/* Product Name */}
          <h3
            className="text-base font-semibold text-[var(--text-primary)] leading-snug mb-2 cursor-pointer hover:text-[var(--teed-green-9)] transition-colors line-clamp-2"
            onClick={() => setSelectedItem(item)}
          >
            {item.custom_name}
          </h3>

          {/* Description/Specs */}
          {item.custom_description && (
            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-3">
              {item.custom_description}
            </p>
          )}

          {/* Creator Notes Preview */}
          {item.notes && (
            <p className="text-sm text-[var(--text-tertiary)] italic line-clamp-2 border-l-2 border-[var(--copper-6)] pl-3 py-1 mb-3">
              {item.notes}
            </p>
          )}

          {/* Promo Code - Compact */}
          {item.promo_codes && (
            <div className="mb-4 p-3 bg-[var(--sand-1)] border border-[var(--copper-6)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-[var(--copper-11)]" />
                  <span className="font-mono font-bold text-sm tracking-wide text-[var(--text-primary)]">
                    {item.promo_codes}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyPromo(item.id, item.promo_codes!);
                  }}
                  className="p-2 hover:bg-[var(--copper-2)] rounded transition-colors"
                  aria-label="Copy code"
                >
                  {copiedPromoId === item.id ? (
                    <CheckCheck className="w-4 h-4 text-[var(--teed-green-9)]" />
                  ) : (
                    <Copy className="w-4 h-4 text-[var(--copper-9)]" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Purchase Links Section */}
          {primaryLink && (
            <div className="space-y-2 pt-4 border-t border-[var(--border-subtle)]">
              {/* Primary CTA */}
              <a
                href={primaryLink.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  trackLinkClick(primaryLink.id, item.id, primaryLink.url);
                }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[var(--evergreen-12)] hover:bg-[var(--evergreen-11)] text-white text-sm font-medium transition-all active:scale-[0.98]"
              >
                <span>Shop on {getLinkDomain(primaryLink.url)}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Secondary Links */}
              {secondaryLinks.length > 0 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpandedLinks(item.id);
                    }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-[var(--text-secondary)] text-sm font-medium hover:text-[var(--text-primary)] transition-colors"
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
                          className="flex items-center justify-between w-full px-4 py-2.5 border border-[var(--border-subtle)] hover:border-[var(--evergreen-8)] text-[var(--text-primary)] text-sm transition-all"
                        >
                          <span className="truncate">{getLinkDomain(link.url)}</span>
                          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 ml-2" />
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* No Links - Just View Details */}
          {item.links.length === 0 && (
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => setSelectedItem(item)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-[var(--border-default)] hover:border-[var(--evergreen-8)] text-[var(--text-primary)] text-sm font-medium transition-all"
              >
                View Details
              </button>
            </div>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--sand-1)]">
      {/* Masthead */}
      <header className="bg-white border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-8 lg:py-12">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: ownerName, href: `/u/${ownerHandle}`, icon: <User className="w-4 h-4" /> },
              { label: bag.title },
            ]}
            showHome={false}
          />

          {/* Title Section */}
          <div className="mt-8 max-w-3xl">
            {/* Eyebrow */}
            <p className="text-xs font-semibold text-[var(--copper-11)] uppercase tracking-[0.2em] mb-4">
              What's In My Bag
            </p>

            {/* Title */}
            <div className="flex items-start gap-4">
              <h1 className="text-4xl lg:text-5xl font-semibold text-[var(--text-primary)] tracking-tight leading-[1.1]">
                {bag.title}
              </h1>
              <button
                onClick={handleShare}
                className="mt-2 p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--sand-2)] rounded-sm transition-colors"
                title="Share"
                aria-label="Share this bag"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Creator Byline */}
            <div className="flex items-center gap-3 mt-6">
              <div className="w-10 h-10 rounded-full bg-[var(--teed-green-3)] flex items-center justify-center">
                <User className="w-5 h-5 text-[var(--teed-green-11)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Curated by</p>
                <Link
                  href={`/u/${ownerHandle}`}
                  className="font-semibold text-[var(--text-primary)] hover:text-[var(--teed-green-9)] transition-colors"
                >
                  {ownerName}
                </Link>
              </div>
            </div>

            {/* Tags */}
            {bag.tags && bag.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {bag.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/discover?tags=${encodeURIComponent(tag)}`}
                    className="px-3 py-1.5 bg-[var(--sand-2)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--sand-3)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* FTC Affiliate Disclosure - Refined */}
      {hasAffiliateLinks && (
        <div className="bg-[var(--copper-2)] border-b border-[var(--copper-5)]">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 py-3">
            <p className="text-sm text-[var(--copper-12)]">
              <span className="font-medium">Disclosure:</span>{' '}
              {disclosureText || 'This page contains affiliate links. Purchases through these links may earn the creator a commission.'}
            </p>
          </div>
        </div>
      )}

      {/* Cover Photo - Edge to edge feel */}
      {bag.cover_photo_url && (
        <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-12">
          <div className="overflow-hidden">
            <img
              src={bag.cover_photo_url}
              alt={`${bag.title} cover`}
              className="w-full h-56 md:h-72 lg:h-80 object-cover"
            />
          </div>
        </div>
      )}

      {/* Description as Pull Quote */}
      {bag.description && (
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12 lg:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <Quote className="w-10 h-10 text-[var(--copper-8)] opacity-40 mx-auto mb-4" />
            <p className="text-xl lg:text-2xl text-[var(--text-primary)] leading-relaxed font-serif italic">
              {bag.description}
            </p>
            <div className="w-16 h-px bg-[var(--copper-8)] mx-auto mt-8"></div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-12 pb-16">
        {items.length === 0 ? (
          <div className="text-center py-24">
            <div className="bg-white w-24 h-24 mx-auto flex items-center justify-center border border-[var(--border-subtle)]">
              <Package className="h-12 w-12 text-[var(--text-tertiary)]" />
            </div>
            <p className="text-[var(--text-secondary)] text-lg mt-8">No items in this bag yet</p>
          </div>
        ) : (
          <>
            {/* Hero Item Spotlight */}
            {heroItem && renderItemCard(heroItem, true, true)}

            {/* Section Divider */}
            {heroItem && regularItems.length > 0 && (
              <div className="flex items-center gap-6 mb-12">
                <div className="flex-1 h-px bg-[var(--border-subtle)]"></div>
                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.15em]">
                  {regularItems.length} More {regularItems.length === 1 ? 'Item' : 'Items'}
                </p>
                <div className="flex-1 h-px bg-[var(--border-subtle)]"></div>
              </div>
            )}

            {/* Regular Items Grid */}
            {regularItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {regularItems.map((item) => (
                  <div key={item.id} className="relative">
                    {renderItemCard(item, false, false)}
                  </div>
                ))}
              </div>
            )}

            {/* If no hero, show all items in grid */}
            {!heroItem && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {items.map((item) => (
                  <div key={item.id} className="relative">
                    {renderItemCard(item, bag.hero_item_id === item.id, false)}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Item Detail Modal - Refined */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-[var(--border-subtle)] px-6 lg:px-8 py-6 flex items-start justify-between">
              <div className="flex-1">
                {selectedItem.brand && (
                  <p className="text-xs font-semibold text-[var(--copper-11)] uppercase tracking-[0.12em] mb-2">
                    {selectedItem.brand}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                    {selectedItem.custom_name}
                  </h2>
                  {selectedItem.quantity > 1 && (
                    <span className="px-2.5 py-1 bg-[var(--sand-2)] text-[var(--text-primary)] text-sm font-medium">
                      ×{selectedItem.quantity}
                    </span>
                  )}
                </div>
                {selectedItem.custom_description && (
                  <p className="mt-3 text-[var(--text-secondary)] leading-relaxed">
                    {selectedItem.custom_description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ml-4 p-2"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 lg:px-8 py-8 space-y-8">
              {/* Photo */}
              {selectedItem.photo_url && (
                <div className="flex justify-center">
                  <div className="max-w-md w-full bg-[var(--sand-1)] overflow-hidden">
                    <img
                      src={selectedItem.photo_url}
                      alt={selectedItem.custom_name || 'Item photo'}
                      className="w-full h-auto object-contain max-h-96 p-6"
                    />
                  </div>
                </div>
              )}

              {/* Notes - Editorial Style */}
              {selectedItem.notes && (
                <div className="border-l-3 border-[var(--copper-8)] pl-6">
                  <p className="text-sm font-semibold text-[var(--copper-11)] uppercase tracking-wide mb-3">
                    Creator's Notes
                  </p>
                  <p className="text-lg text-[var(--text-primary)] italic font-serif leading-relaxed">
                    "{selectedItem.notes}"
                  </p>
                </div>
              )}

              {/* Promo Code */}
              {selectedItem.promo_codes && (
                <div className="p-6 bg-gradient-to-br from-[var(--amber-2)] to-[var(--copper-2)] border border-[var(--copper-6)]">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-4 h-4 text-[var(--copper-11)]" />
                    <span className="text-xs font-semibold text-[var(--copper-11)] uppercase tracking-wide">
                      Use at checkout
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyPromo(selectedItem.id, selectedItem.promo_codes!)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-white border-2 border-[var(--copper-6)] font-mono font-bold text-xl text-[var(--text-primary)] tracking-widest transition-all hover:border-[var(--copper-9)] active:scale-[0.98]"
                  >
                    <span>{selectedItem.promo_codes}</span>
                    {copiedPromoId === selectedItem.id ? (
                      <CheckCheck className="w-6 h-6 text-[var(--teed-green-9)]" />
                    ) : (
                      <Copy className="w-6 h-6 text-[var(--copper-9)]" />
                    )}
                  </button>
                  {copiedPromoId === selectedItem.id && (
                    <p className="text-sm text-[var(--teed-green-9)] font-medium mt-3 text-center">
                      Copied to clipboard!
                    </p>
                  )}
                </div>
              )}

              {/* Links */}
              {selectedItem.links.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
                    Where to Buy
                  </p>
                  <div className="space-y-3">
                    {selectedItem.links.map((link, index) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackLinkClick(link.id, selectedItem.id, link.url)}
                        className={`block p-4 border transition-all group ${
                          index === 0
                            ? 'bg-[var(--evergreen-12)] border-[var(--evergreen-12)] hover:bg-[var(--evergreen-11)]'
                            : 'border-[var(--border-subtle)] hover:border-[var(--evergreen-8)] bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${index === 0 ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                              {link.label || getLinkDomain(link.url)}
                            </p>
                            <p className={`text-sm truncate mt-1 ${index === 0 ? 'text-white/70' : 'text-[var(--text-tertiary)]'}`}>
                              {link.url}
                            </p>
                          </div>
                          <ExternalLink className={`w-5 h-5 ml-4 flex-shrink-0 ${index === 0 ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer - Refined */}
      <footer className="bg-white border-t border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-16">
          <div className="text-center">
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-4">
              Created with
            </p>
            <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
              <h2 className="text-3xl font-semibold text-[var(--text-primary)] tracking-tight">
                Teed
              </h2>
            </Link>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Curations, Made Shareable
            </p>

            {/* CTA - Minimal & Elegant */}
            <div className="mt-10 pt-10 border-t border-[var(--border-subtle)] max-w-md mx-auto">
              <p className="text-[var(--text-primary)] font-medium mb-4">
                Create your own curated collection
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--evergreen-12)] hover:bg-[var(--evergreen-11)] text-white font-medium transition-colors"
              >
                Get Started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <p className="text-xs text-[var(--text-tertiary)] mt-4">
                Free to use
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
