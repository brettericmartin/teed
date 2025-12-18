'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Share2, ExternalLink, User, X, Package, Trophy, Copy, CheckCheck, ChevronDown, Tag, Bookmark, UserPlus, UserCheck, LayoutGrid, List, Plus, GitFork } from 'lucide-react';
import { GolfLoader } from '@/components/ui/GolfLoader';
import Breadcrumbs from '@/components/Breadcrumbs';
import QRCodeDisplay from '@/components/ui/QRCodeDisplay';
import PublicShareModal from './PublicShareModal';
import ViewToggle from './components/ViewToggle';
import ListViewItem from './components/ListViewItem';
import AddToBagModal from './components/AddToBagModal';
import { useToast } from '@/components/ui/Toast';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { CloneSuccessModal } from '@/components/modals/CloneSuccessModal';
import { CuratorNote } from '@/components/ui/CuratorNote';
import { useCelebration } from '@/lib/celebrations';
import { PageContainer, ContentContainer } from '@/components/layout/PageContainer';
import { analytics } from '@/lib/analytics';

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
  cover_photo_aspect: string | null;
  created_at: string;
  tags?: string[];
  category?: string;
}

interface PublicBagViewProps {
  bag: Bag;
  items: Item[];
  ownerHandle: string;
  ownerName: string;
  ownerId: string;
  hasAffiliateLinks?: boolean;
  disclosureText?: string;
}

export default function PublicBagView({
  bag,
  items,
  ownerHandle,
  ownerName,
  ownerId,
  hasAffiliateLinks = false,
  disclosureText,
}: PublicBagViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // View mode from URL parameter (default: grid)
  const viewMode = searchParams.get('view') === 'list' ? 'list' : 'grid';

  const handleViewToggle = (newView: 'grid' | 'list') => {
    const params = new URLSearchParams(searchParams.toString());
    if (newView === 'grid') {
      params.delete('view'); // Grid is default, clean URL
    } else {
      params.set('view', 'list');
    }
    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [copiedPromoId, setCopiedPromoId] = useState<string | null>(null);
  const [expandedLinks, setExpandedLinks] = useState<Set<string>>(new Set());
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Engagement states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isCopyLoading, setIsCopyLoading] = useState(false);
  const [isAddToBagModalOpen, setIsAddToBagModalOpen] = useState(false);

  const { showSuccess, showError } = useToast();
  const { celebrateClone, celebrateSave, celebrateShare } = useCelebration();
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isOwnBag = currentUserId === ownerId;

  // Clone success modal state
  const [isCloneSuccessOpen, setIsCloneSuccessOpen] = useState(false);
  const [clonedBagData, setClonedBagData] = useState<{ code: string; handle: string } | null>(null);

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

  // Helper to get the CTA verb based on link type/domain
  const getLinkCTA = (link: ItemLink) => {
    const domain = getLinkDomain(link.url).toLowerCase();
    const url = link.url.toLowerCase();

    // Video platforms - check both kind and URL
    const videoKinds = ['video', 'youtube'];
    const videoPatterns = ['youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv', 'dailymotion.com', 'tiktok.com'];
    if (videoKinds.includes(link.kind) || videoPatterns.some(pattern => url.includes(pattern))) {
      return 'Watch on';
    }

    // Article/blog platforms
    const articleHosts = ['medium.com', 'substack.com', 'blog.', 'news.'];
    if (link.kind === 'article' || articleHosts.some(host => domain.includes(host.replace('.com', '')))) {
      return 'Read on';
    }

    // Review sites
    if (link.kind === 'review') {
      return 'Read review on';
    }

    // Default to shop for products and everything else
    return 'Shop on';
  };

  // Track page view
  useEffect(() => {
    analytics.bagViewed(bag.id, bag.code, ownerHandle);
  }, [bag.id, bag.code, ownerHandle]);

  // Check auth, save, and follow status
  useEffect(() => {
    const checkEngagementStatus = async () => {
      try {
        // Check if user is authenticated
        const sessionResponse = await fetch('/api/auth/session');
        if (!sessionResponse.ok) {
          setIsAuthenticated(false);
          return;
        }

        const sessionData = await sessionResponse.json();
        setIsAuthenticated(!!sessionData.user);
        setCurrentUserId(sessionData.user?.id || null);

        if (sessionData.user) {
          // Check save status
          const saveResponse = await fetch(`/api/bags/${bag.code}/save`);
          if (saveResponse.ok) {
            const saveData = await saveResponse.json();
            setIsSaved(saveData.isSaved);
          }

          // Check follow status (if not own profile)
          if (sessionData.user.id !== ownerId) {
            const followResponse = await fetch(`/api/follows/${ownerId}`);
            if (followResponse.ok) {
              const followData = await followResponse.json();
              setIsFollowing(followData.isFollowing);
            }
          }
        }
      } catch (error) {
        console.error('Error checking engagement status:', error);
      }
    };

    checkEngagementStatus();
  }, [bag.id, ownerId]);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Handle copy bag
  const handleCopyBag = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setIsCopyLoading(true);
    try {
      const response = await fetch(`/api/bags/${bag.code}/copy`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Track clone event
        analytics.bagCloned(bag.id, bag.code, data.id, data.code);
        // Trigger celebration
        celebrateClone();
        // Store cloned bag data and show success modal
        setClonedBagData({ code: data.code, handle: data.ownerHandle });
        setIsCloneSuccessOpen(true);
      } else {
        const errorData = await response.json();
        console.error('Copy error:', errorData.error);
        showError('Failed to clone bag. Please try again.');
      }
    } catch (error) {
      console.error('Error copying bag:', error);
      showError('Failed to clone bag. Please try again.');
    } finally {
      setIsCopyLoading(false);
    }
  };

  // Handle save/unsave
  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setIsSaveLoading(true);
    try {
      if (isSaved) {
        // Unsave
        const response = await fetch(`/api/bags/${bag.code}/save`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setIsSaved(false);
          analytics.bagUnsaved(bag.id, bag.code);
        }
      } else {
        // Save
        const response = await fetch(`/api/bags/${bag.code}/save`, {
          method: 'POST',
        });
        if (response.ok) {
          setIsSaved(true);
          analytics.bagSaved(bag.id, bag.code, ownerHandle);
          // Trigger subtle haptic celebration for save
          celebrateSave();
          showSuccess('Bag saved!');
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsSaveLoading(false);
    }
  };

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/follows/${ownerId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setIsFollowing(false);
          analytics.userUnfollowed(ownerId, ownerHandle);
        }
      } else {
        // Follow
        const response = await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ following_id: ownerId }),
        });
        if (response.ok) {
          setIsFollowing(true);
          analytics.userFollowed(ownerId, ownerHandle);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Handle add to bag
  const handleAddToBag = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsAddToBagModalOpen(true);
  };

  // Track link click
  const trackLinkClick = (linkId: string, itemId: string, url: string, linkType?: string) => {
    analytics.linkClicked(linkId, itemId, bag.id, url, linkType);
  };

  // Track item view when modal is opened
  const handleItemClick = (item: Item) => {
    analytics.itemViewed(item.id, item.custom_name, bag.id, bag.code);
    setSelectedItem(item);
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

  const hasCover = Boolean(bag.cover_photo_url);

  return (
    <PageContainer variant="cool">
      {/* Header Section with ambient background */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--sky-2)] via-[var(--teed-green-1)] to-transparent opacity-50" />
        <div className="relative bg-[var(--surface)] border-b border-[var(--border-subtle)]">
          <ContentContainer size="md" className="py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: ownerName, href: `/u/${ownerHandle}`, icon: <User className="w-4 h-4" /> },
              { label: bag.title },
            ]}
            showHome={false}
          />

          <div className="flex flex-col md:flex-row items-start justify-between gap-6 mt-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-[var(--font-size-9)] font-semibold text-[var(--text-primary)]">
                  {bag.title}
                </h1>
                {/* Save Button */}
                <button
                  onClick={handleSaveToggle}
                  disabled={isSaveLoading}
                  className={`p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[var(--radius-md)] transition-all ${
                    isSaved
                      ? 'text-[var(--amber-9)] hover:text-[var(--amber-10)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  } hover:bg-[var(--surface-hover)]`}
                  title={isSaved ? 'Unsave' : 'Save'}
                  aria-label={isSaved ? 'Unsave this bag' : 'Save this bag'}
                >
                  {isSaveLoading ? (
                    <GolfLoader size="md" />
                  ) : (
                    <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                  )}
                </button>
                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-[var(--radius-md)] transition-colors"
                  title="Share"
                  aria-label="Share this bag"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                {/* Copy Button - only show if not own bag */}
                {!isOwnBag && (
                  <button
                    onClick={handleCopyBag}
                    disabled={isCopyLoading}
                    className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--teed-green-9)] hover:bg-[var(--teed-green-2)] rounded-[var(--radius-md)] transition-colors disabled:opacity-50"
                    title="Copy this bag to your account"
                    aria-label="Copy this bag to your account"
                  >
                    {isCopyLoading ? (
                      <GolfLoader size="md" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
              {bag.description && (
                <CuratorNote
                  note={bag.description}
                  curatorName={ownerName || `@${ownerHandle}`}
                  variant="inline"
                  className="mt-4"
                />
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
                {/* Follow Button - only show if not own bag */}
                {!isOwnBag && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    className={`ml-1 p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-full transition-all ${
                      isFollowing
                        ? 'text-[var(--teed-green-9)] bg-[var(--teed-green-2)] hover:bg-[var(--teed-green-3)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--teed-green-9)] hover:bg-[var(--teed-green-2)]'
                    }`}
                    title={isFollowing ? 'Unfollow' : 'Follow'}
                    aria-label={isFollowing ? `Unfollow @${ownerHandle}` : `Follow @${ownerHandle}`}
                  >
                    {isFollowLoading ? (
                      <GolfLoader size="sm" />
                    ) : isFollowing ? (
                      <UserCheck className="w-4 h-4" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                  </button>
                )}
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

            {/* QR Code Section */}
            <div className="flex-shrink-0 hidden md:block">
              <QRCodeDisplay
                url={shareUrl}
                size={100}
                downloadable={true}
                label="Scan to view"
                downloadFileName={`${ownerHandle}-${bag.code}-qr`}
                compact={true}
              />
            </div>
          </div>
          </ContentContainer>
        </div>
      </div>

      {/* Cover Photo Banner - Between header and items */}
      {hasCover && (
        <ContentContainer size="md" className="pt-8">
          <div
            className="relative w-full rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-3)]"
            style={{ aspectRatio: (bag.cover_photo_aspect || '21/9').replace('/', ' / ') }}
          >
            <img
              src={bag.cover_photo_url!}
              alt={`${bag.title} cover`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </ContentContainer>
      )}

      {/* FTC Affiliate Disclosure */}
      {hasAffiliateLinks && (
        <div className="bg-[var(--copper-2)] border-y border-[var(--copper-6)]">
          <ContentContainer size="md" className="py-4">
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
          </ContentContainer>
        </div>
      )}

      {/* Items Section */}
      <ContentContainer size="md" className="py-10">
        {/* View Toggle Header */}
        {items.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[var(--text-secondary)]">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
            <ViewToggle viewMode={viewMode} onViewChange={handleViewToggle} />
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState
            variant="no-items"
            title="This bag is empty"
            description={`@${ownerHandle} hasn't added any items yet. Check back later!`}
            hideCta={true}
          />
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="flex flex-col bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] border border-[var(--border-subtle)] overflow-hidden">
            {items.map((item) => (
              <ListViewItem
                key={item.id}
                item={item}
                isHero={bag.hero_item_id === item.id}
                onItemClick={() => handleItemClick(item)}
                onLinkClick={trackLinkClick}
                getLinkCTA={getLinkCTA}
                getLinkDomain={getLinkDomain}
              />
            ))}
          </div>
        ) : (
          /* Grid View */
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
                      onClick={() => handleItemClick(item)}
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
                      onClick={() => handleItemClick(item)}
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
                          <span>{getLinkCTA(primaryLink)} {getLinkDomain(primaryLink.url)}</span>
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
                          onClick={() => handleItemClick(item)}
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
                          onClick={() => handleItemClick(item)}
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
      </ContentContainer>

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
            <div className="bg-[var(--modal-bg)] border-b border-[var(--border-subtle)] px-4 sm:px-8 py-4 sm:py-6 flex items-start justify-between rounded-t-[var(--radius-2xl)]">
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
                <div className="flex justify-center -mx-4 sm:mx-0">
                  <div className="w-full sm:max-w-xl bg-[var(--sky-2)] sm:rounded-[var(--radius-lg)] overflow-hidden">
                    <img
                      src={selectedItem.photo_url}
                      alt={selectedItem.custom_name || 'Item photo'}
                      className="w-full h-auto object-contain max-h-[50vh] sm:max-h-[60vh]"
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

              {/* Add to My Bag Action */}
              {!isOwnBag && (
                <div className="border-t border-[var(--border-subtle)] pt-6 mt-6">
                  <button
                    onClick={handleAddToBag}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 min-h-[48px] bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white font-medium rounded-lg transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
                  >
                    <Plus className="w-5 h-5" />
                    Add to My Bag
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer with CTA */}
      <div className="border-t border-[var(--border-subtle)] mt-12">
        <ContentContainer size="md" className="py-16">
          <div className="text-center">
            <p className="text-[var(--text-secondary)] mb-2 font-serif italic">Created with</p>
            <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
              <h2 className="text-[var(--font-size-8)] font-bold text-[var(--text-primary)]">
                Teed
              </h2>
            </Link>
            <p className="text-sm text-[var(--text-secondary)] mt-2 mb-8 font-serif italic">
              Curations, Made Shareable
            </p>

            {/* CTA for visitors */}
            <div className="bg-gradient-to-br from-[var(--teed-green-2)] via-[var(--sky-2)] to-[var(--sand-2)] rounded-2xl p-8 max-w-md mx-auto border border-[var(--teed-green-6)] shadow-[var(--shadow-3)]">
              <p className="text-[var(--text-primary)] font-medium mb-4 text-lg">
                Want to create your own curated bags?
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white font-medium rounded-lg transition-all hover:shadow-glow-teed"
              >
                Create Your Bag
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <p className="text-xs text-[var(--text-tertiary)] mt-4">
                Free to use • Share with anyone
              </p>
            </div>
          </div>
        </ContentContainer>
      </div>

      {/* Share Modal */}
      <PublicShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        bagId={bag.id}
        bagCode={bag.code}
        bagTitle={bag.title}
        ownerHandle={ownerHandle}
        ownerName={ownerName}
      />

      {/* Add to Bag Modal */}
      <AddToBagModal
        isOpen={isAddToBagModalOpen}
        onClose={() => setIsAddToBagModalOpen(false)}
        item={selectedItem}
        onSuccess={(bagTitle) => {
          showSuccess(`Item added to ${bagTitle}`);
          setIsAddToBagModalOpen(false);
          setSelectedItem(null);
        }}
      />

      {/* Clone Success Modal */}
      <CloneSuccessModal
        isOpen={isCloneSuccessOpen}
        onClose={() => {
          setIsCloneSuccessOpen(false);
          setClonedBagData(null);
        }}
        clonedBag={clonedBagData ? {
          code: clonedBagData.code,
          name: bag.title,
          itemCount: items.length,
          handle: clonedBagData.handle
        } : null}
      />

      {/* Sticky Action Bar for Mobile - shows on scroll */}
      <StickyActionBar
        bagName={bag.title}
        itemCount={items.length}
        creatorHandle={ownerHandle}
        onClone={handleCopyBag}
        onShare={handleShare}
        onSave={handleSaveToggle}
        isSaved={isSaved}
        isOwner={isOwnBag}
        threshold={400}
      />
    </PageContainer>
  );
}
