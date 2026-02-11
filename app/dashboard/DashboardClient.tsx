'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Package, Eye, Sparkles, ArrowRight } from 'lucide-react';
import NewBagModal from './components/NewBagModal';
import { Button } from '@/components/ui/Button';
import ProfileStats from '@/components/ProfileStats';
import { useCelebration } from '@/lib/celebrations';
import { useToast } from '@/components/ui/Toast';
import { staggerContainer, cardVariants } from '@/lib/animations';
import { PageContainer, PageHeader, ContentContainer } from '@/components/layout/PageContainer';
import { UniversalAddMenu, AddItemFlow, AddSocialFlow } from '@/components/add';

type BagItem = {
  id: string;
  custom_name: string | null;
  photo_url: string | null;
  is_featured: boolean;
  featured_position: number | null;
};

type Bag = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  is_public: boolean;
  background_image: string | null;
  is_pinned: boolean;
  pinned_at: string | null;
  created_at: string;
  updated_at: string | null;
  items?: BagItem[];
};

type ProfileStats = {
  totalViews: number;
  totalBags: number;
  totalFollowers: number;
  statsUpdatedAt: string | null;
};

type DashboardClientProps = {
  initialBags: Bag[];
  userHandle: string;
  displayName: string;
  profileStats: ProfileStats;
};

// Diversified gradient options for bag cards
const GRADIENT_OPTIONS = [
  'from-[var(--teed-green-6)] to-[var(--sky-6)]', // Green to Sky (original)
  'from-[var(--copper-4)] to-[var(--sky-5)]', // Copper to Sky (warm to cool)
  'from-[var(--sand-5)] to-[var(--copper-5)]', // Sand to Copper (warm gradient)
  'from-[var(--sky-5)] to-[var(--teed-green-5)]', // Sky to Green (cool gradient)
  'from-[var(--evergreen-6)] to-[var(--teed-green-6)]', // Evergreen to Green (monochrome depth)
];

// Hash function to deterministically select gradient based on bag ID
const getBagGradient = (bagId: string) => {
  let hash = 0;
  for (let i = 0; i < bagId.length; i++) {
    hash = ((hash << 5) - hash) + bagId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % GRADIENT_OPTIONS.length;
  return GRADIENT_OPTIONS[index];
};

// Placeholder background colors
const PLACEHOLDER_COLORS = [
  'bg-[var(--copper-2)]',
  'bg-[var(--sky-2)]',
  'bg-[var(--sand-2)]',
];

const getPlaceholderColor = (index: number) => {
  return PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];
};

export default function DashboardClient({
  initialBags,
  userHandle,
  displayName,
  profileStats,
}: DashboardClientProps) {
  const router = useRouter();
  const { showError } = useToast();
  const [bags, setBags] = useState<Bag[]>(initialBags);
  const [showNewBagModal, setShowNewBagModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { celebrateFirstBag, celebrateBagCreated } = useCelebration();

  // Add flow states
  const [showAddItemFlow, setShowAddItemFlow] = useState(false);
  const [showAddSocialFlow, setShowAddSocialFlow] = useState(false);

  // Add menu handlers
  const handleAddItem = useCallback(() => {
    setShowAddItemFlow(true);
  }, []);

  const handleAddBlock = useCallback(() => {
    // Navigate to profile in edit mode
    router.push(`/u/${userHandle}?edit=true&action=block`);
  }, [router, userHandle]);

  const handleAddLink = useCallback(() => {
    // Navigate to profile in edit mode with link adder
    router.push(`/u/${userHandle}?edit=true&action=link`);
  }, [router, userHandle]);

  const handleAddSocial = useCallback(() => {
    setShowAddSocialFlow(true);
  }, []);

  const handleAddViaUrl = useCallback(async (bagCode: string, url: string) => {
    // Call API to process link and add to bag
    const response = await fetch(`/api/bags/${bagCode}/items/from-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add item');
    }

    // Redirect to bag editor to see/edit the new item
    router.push(`/u/${userHandle}/${bagCode}/edit`);
  }, [router, userHandle]);

  const handleAddViaPhoto = useCallback((bagCode: string) => {
    // Navigate to bag editor for photo upload
    router.push(`/u/${userHandle}/${bagCode}/edit?action=photo`);
  }, [router, userHandle]);

  const handleSaveSocialLinks = useCallback(async (links: Record<string, string>) => {
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ social_links: links }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save social links');
    }
  }, []);

  const handleCreateBag = async (data: { title: string; description?: string; is_public: boolean }) => {
    setIsCreating(true);
    const isFirstBag = bags.length === 0;

    try {
      const response = await fetch('/api/bags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create bag');
      }

      const newBag = await response.json();
      setBags([newBag, ...bags]);
      setShowNewBagModal(false);

      // Celebrate bag creation with confetti
      if (isFirstBag) {
        celebrateFirstBag();
      } else {
        celebrateBagCreated();
      }

      // Redirect to bag editor
      router.push(`/u/${userHandle}/${newBag.code}/edit`);
    } catch (error) {
      console.error('Error creating bag:', error);
      showError('Failed to create bag. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const handlePinToggle = async (bagId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to bag editor

    try {
      const response = await fetch(`/api/bags/${bagId}/pin`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || 'Failed to toggle pin');
        return;
      }

      // Update local state
      setBags(prevBags =>
        prevBags.map(bag =>
          bag.id === bagId
            ? { ...bag, is_pinned: data.isPinned, pinned_at: data.isPinned ? new Date().toISOString() : null }
            : bag
        ).sort((a, b) => {
          // Sort: pinned first, then by pinned_at DESC, then by created_at DESC
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          if (a.is_pinned && b.is_pinned) {
            return new Date(b.pinned_at!).getTime() - new Date(a.pinned_at!).getTime();
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
      );
    } catch (error) {
      console.error('Error toggling pin:', error);
      showError('Failed to toggle pin. Please try again.');
    }
  };

  return (
    <PageContainer variant="warm">
      {/* Top section with background that extends to navbar */}
      <div className="bg-[var(--surface)] pt-12">
        <ContentContainer className="pb-4">
          <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/u/${userHandle}`}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline transition-colors"
            >
              View Profile
            </Link>
            <span className="text-[var(--text-tertiary)]">•</span>
            <Link
              href="/settings"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline transition-colors"
            >
              Settings
            </Link>
          </div>
          <Button
            variant="featured"
            onClick={() => setShowNewBagModal(true)}
            className="w-auto"
          >
            <Plus className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Create New Bag</span>
            <span className="sm:hidden">New Bag</span>
          </Button>
        </div>
        <ProfileStats
          totalBags={bags.length}
          totalViews={profileStats.totalViews}
          totalFollowers={profileStats.totalFollowers}
          statsUpdatedAt={profileStats.statsUpdatedAt}
        />
        </ContentContainer>
      </div>

      {/* Main Content */}
      <ContentContainer className="pb-8">
        {bags.length === 0 ? (
          // Welcome State for new users
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mx-auto"
          >
            {/* Welcome Card */}
            <div className="bg-gradient-to-br from-[var(--teed-green-2)] via-[var(--surface)] to-[var(--sky-2)] rounded-2xl border border-[var(--border-subtle)] p-8 shadow-lg">
              {/* Greeting */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--teed-green-9)] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                    Welcome to Teed{displayName ? `, ${displayName.split(' ')[0]}` : ''}!
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Your curation journey starts here
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--teed-green-3)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[var(--teed-green-11)]">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Create a bag</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      A bag is a collection of items — your golf clubs, desk setup, travel kit, or anything you want to share
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--sky-3)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[var(--sky-11)]">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Add items with photos</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Snap photos or upload images — our AI will identify products automatically
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--copper-3)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[var(--copper-11)]">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Share your bag</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Get a unique link to share on social, embed in your bio, or send to friends
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA with attention-grabbing pulse animation */}
              <motion.button
                onClick={() => setShowNewBagModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] relative overflow-hidden"
                animate={{
                  boxShadow: [
                    '0 4px 6px -1px rgba(31, 58, 46, 0.1), 0 2px 4px -1px rgba(31, 58, 46, 0.06)',
                    '0 10px 25px -5px rgba(31, 58, 46, 0.25), 0 8px 10px -6px rgba(31, 58, 46, 0.15)',
                    '0 4px 6px -1px rgba(31, 58, 46, 0.1), 0 2px 4px -1px rgba(31, 58, 46, 0.06)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Plus className="w-5 h-5" />
                Create Your First Bag
                <ArrowRight className="w-4 h-4 ml-1" />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          // Bags Grid with stagger animation
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {bags.map((bag) => (
              <motion.div
                key={bag.id}
                variants={cardVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={() => router.push(`/u/${userHandle}/${bag.code}/edit`)}
                className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] border border-[var(--border-subtle)] overflow-hidden hover:shadow-glow-teed transition-all duration-300 cursor-pointer group"
              >
                {/* Cover Image or Featured Items Grid - Flexible Hero Layout */}
                <div className={`h-[180px] bg-gradient-to-br ${getBagGradient(bag.id)} relative overflow-hidden`}>
                  {(() => {
                    // Get all items with photos
                    const allItemsWithPhotos = bag.items?.filter(item => item.photo_url) || [];

                    // Prioritize featured items, then add non-featured to fill slots
                    const featuredItems = allItemsWithPhotos
                      .filter(item => item.is_featured)
                      .sort((a, b) => (a.featured_position || 0) - (b.featured_position || 0));
                    const nonFeaturedItems = allItemsWithPhotos
                      .filter(item => !item.is_featured);

                    const hasBagPhoto = !!bag.background_image;

                    if (hasBagPhoto && allItemsWithPhotos.length > 0) {
                      // Layout 1: Bag photo as hero + up to 6 item photos
                      // Prioritize featured, fill remaining with non-featured
                      const itemsToShow = [...featuredItems, ...nonFeaturedItems].slice(0, 6);
                      return (
                        <>
                          <div className="grid grid-cols-4 grid-rows-3 gap-1.5 p-2 h-full">
                            {/* Hero: Bag photo (2x2 space) */}
                            <div className="col-span-2 row-span-2 relative bg-white rounded-lg overflow-hidden shadow-sm">
                              <img
                                src={bag.background_image!}
                                alt={bag.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>

                            {/* Item photos (6 smaller tiles) */}
                            {itemsToShow.map((item) => (
                              <div key={item.id} className="relative bg-white rounded overflow-hidden shadow-sm">
                                <img
                                  src={item.photo_url!}
                                  alt={item.custom_name || 'Item'}
                                  className="w-full h-full object-contain"
                                  loading="lazy"
                                />
                              </div>
                            ))}

                            {/* Fill empty slots with placeholders */}
                            {Array.from({ length: Math.max(0, 6 - itemsToShow.length) }).map((_, i) => (
                              <div key={`placeholder-${i}`} className={`${getPlaceholderColor(i)} rounded opacity-40`}></div>
                            ))}
                          </div>

                          {/* Hover overlay with description */}
                          {bag.description && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                              <div className="absolute bottom-3 left-3 right-3">
                                <p className="text-white text-sm font-medium line-clamp-3 drop-shadow-lg">
                                  {bag.description}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    } else if (allItemsWithPhotos.length > 0) {
                      // Layout 2: No bag photo, show up to 8 equal-sized item photos
                      // Prioritize featured, fill remaining with non-featured
                      const itemsToShow = [...featuredItems, ...nonFeaturedItems].slice(0, 8);
                      return (
                        <>
                          <div className="grid grid-cols-4 gap-1.5 p-2 h-full">
                            {itemsToShow.map((item) => (
                              <div key={item.id} className="relative bg-white rounded overflow-hidden shadow-sm">
                                <img
                                  src={item.photo_url!}
                                  alt={item.custom_name || 'Item'}
                                  className="w-full h-full object-contain"
                                  loading="lazy"
                                />
                              </div>
                            ))}

                            {/* Fill empty slots with placeholders */}
                            {Array.from({ length: Math.max(0, 8 - itemsToShow.length) }).map((_, i) => (
                              <div key={`placeholder-${i}`} className={`${getPlaceholderColor(i)} rounded opacity-40`}></div>
                            ))}
                          </div>

                          {/* Hover overlay with description */}
                          {bag.description && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                              <div className="absolute bottom-3 left-3 right-3">
                                <p className="text-white text-sm font-medium line-clamp-3 drop-shadow-lg">
                                  {bag.description}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    } else if (bag.background_image) {
                      // Layout 3: Only bag photo, no items
                      return (
                        <>
                          <img
                            src={bag.background_image}
                            alt={bag.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {/* Hover overlay with description */}
                          {bag.description && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                              <div className="absolute bottom-3 left-3 right-3">
                                <p className="text-white text-sm font-medium line-clamp-3 drop-shadow-lg">
                                  {bag.description}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    } else {
                      // Layout 4: No photos at all, show placeholder
                      return (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="w-16 h-16 text-[var(--evergreen-12)] opacity-20" />
                        </div>
                      );
                    }
                  })()}

                  {/* Privacy Badge (top-right) */}
                  <div className="absolute top-3 right-3">
                    {bag.is_public ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--sky-9)] text-white backdrop-blur-sm shadow-sm">
                        <Eye className="w-3 h-3" />
                        Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/70 text-[var(--text-secondary)] backdrop-blur-sm">
                        Private
                      </span>
                    )}
                  </div>
                </div>

                {/* Bag Info - Compressed */}
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] group-hover:text-[var(--teed-green-9)] transition-colors line-clamp-1 mb-2">
                    {bag.title}
                  </h3>

                  {/* Icon-based metadata */}
                  <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[var(--sky-10)]">
                        <Package className="w-3.5 h-3.5" />
                        <span className="font-medium">{bag.items?.length || 0} {bag.items?.length === 1 ? 'item' : 'items'}</span>
                      </span>
                      <span className="font-medium text-[var(--text-secondary)]">/{bag.code}</span>
                    </div>
                    <span>{formatDate(bag.created_at)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </ContentContainer>

      {/* New Bag Modal */}
      {showNewBagModal && (
        <NewBagModal
          isOpen={showNewBagModal}
          onClose={() => setShowNewBagModal(false)}
          onSubmit={handleCreateBag}
          isLoading={isCreating}
        />
      )}

      {/* Universal Add Menu - Prominent FAB */}
      <UniversalAddMenu
        hasBags={bags.length > 0}
        isProfileView={false}
        onAddItem={handleAddItem}
        onAddLink={handleAddLink}
        onAddSocial={handleAddSocial}
      />

      {/* Add Item Flow */}
      <AddItemFlow
        isOpen={showAddItemFlow}
        onClose={() => setShowAddItemFlow(false)}
        bags={bags.map(bag => ({
          id: bag.id,
          code: bag.code,
          title: bag.title,
          itemCount: bag.items?.length || 0,
          backgroundImage: bag.background_image,
        }))}
        onCreateBag={() => {
          setShowAddItemFlow(false);
          setShowNewBagModal(true);
        }}
        onAddViaUrl={handleAddViaUrl}
        onAddViaPhoto={handleAddViaPhoto}
        userHandle={userHandle}
      />

      {/* Add Social Flow */}
      <AddSocialFlow
        isOpen={showAddSocialFlow}
        onClose={() => setShowAddSocialFlow(false)}
        currentSocialLinks={{}}
        onSave={handleSaveSocialLinks}
      />
    </PageContainer>
  );
}
