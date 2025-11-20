'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Compass, Package, Search, Filter, X, Heart, Eye, Layers } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

type BagItem = {
  id: string;
  custom_name: string | null;
  photo_url: string | null;
  is_featured: boolean;
  featured_position: number | null;
};

type BagOwner = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
};

type Bag = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  is_public: boolean;
  background_image: string | null;
  created_at: string;
  updated_at: string | null;
  items?: BagItem[];
  owner: BagOwner;
};

type DiscoverClientProps = {
  initialBags: Bag[];
};

const CATEGORIES = [
  { value: 'golf', label: '⛳ Golf', icon: '⛳' },
  { value: 'travel', label: '✈️ Travel', icon: '✈️' },
  { value: 'outdoor', label: '🏔️ Outdoor', icon: '🏔️' },
  { value: 'tech', label: '💻 Tech', icon: '💻' },
  { value: 'fashion', label: '👔 Fashion', icon: '👔' },
  { value: 'fitness', label: '💪 Fitness', icon: '💪' },
  { value: 'photography', label: '📷 Photography', icon: '📷' },
  { value: 'gaming', label: '🎮 Gaming', icon: '🎮' },
  { value: 'music', label: '🎵 Music', icon: '🎵' },
  { value: 'other', label: '📦 Other', icon: '📦' },
];

export default function DiscoverClient({ initialBags }: DiscoverClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bags, setBags] = useState<Bag[]>(initialBags);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Filter states
  const [showFollowing, setShowFollowing] = useState(searchParams.get('following') === 'true');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    fetchBags();
  }, [showFollowing, selectedCategory, searchQuery]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(!!data.user);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const fetchBags = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (showFollowing) params.append('following', 'true');
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/discover?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setBags(data.bags || []);
      }
    } catch (error) {
      console.error('Error fetching bags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const clearFilters = () => {
    setShowFollowing(false);
    setSelectedCategory(null);
    setSearchQuery('');
    setSearchInput('');
  };

  const hasActiveFilters = showFollowing || selectedCategory || searchQuery;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                Discover
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Explore public bags from the Teed community
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3">
              {/* Search and Following */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search bags..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-8)] focus:border-transparent"
                    />
                  </div>
                </form>

                {/* Following Toggle */}
                {isAuthenticated && (
                  <button
                    onClick={() => setShowFollowing(!showFollowing)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                      showFollowing
                        ? 'bg-[var(--teed-green-8)] text-white'
                        : 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${showFollowing ? 'fill-current' : ''}`} />
                    <span>Following</span>
                  </button>
                )}

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all whitespace-nowrap"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(
                      selectedCategory === category.value ? null : category.value
                    )}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category.value
                        ? 'bg-[var(--teed-green-8)] text-white'
                        : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span className="ml-1.5">{category.label.split(' ')[1]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[var(--teed-green-8)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Results */}
        {!isLoading && bags.length === 0 ? (
          // Empty State
          <div className="text-center py-20">
            <div className="bg-[var(--sky-3)] w-20 h-20 rounded-full mx-auto flex items-center justify-center">
              {hasActiveFilters ? (
                <Filter className="h-10 w-10 text-[var(--evergreen-10)]" />
              ) : (
                <Compass className="h-10 w-10 text-[var(--evergreen-10)]" />
              )}
            </div>
            <h3 className="mt-6 text-xl font-semibold text-[var(--text-primary)]">
              {hasActiveFilters ? 'No bags match your filters' : 'No public bags yet'}
            </h3>
            <p className="mt-2 text-base text-[var(--text-secondary)]">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Be the first to share a public bag!'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-6 px-6 py-3 bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] rounded-lg hover:bg-[var(--button-primary-bg-hover)] transition-colors font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : !isLoading && (
          // Bags Grid
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bags.map((bag) => (
              <div
                key={bag.id}
                className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] border border-[var(--border-subtle)] overflow-hidden hover:shadow-[var(--shadow-5)] hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Cover Image or Featured Items Grid - Flexible Hero Layout */}
                <div
                  onClick={() => router.push(`/u/${bag.owner.handle}/${bag.code}`)}
                  className="h-[200px] bg-gradient-to-br from-[var(--teed-green-6)] to-[var(--sky-6)] relative overflow-hidden cursor-pointer border-b border-[var(--border-subtle)]"
                >
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
                              <div key={`placeholder-${i}`} className="bg-white/20 rounded"></div>
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
                              <div key={`placeholder-${i}`} className="bg-white/20 rounded"></div>
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

                  {/* Owner Badge (bottom-left) */}
                  <Link
                    href={`/u/${bag.owner.handle}`}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1.5 shadow-sm hover:bg-white transition-colors group/owner"
                  >
                    {bag.owner.avatar_url ? (
                      <img
                        src={bag.owner.avatar_url}
                        alt={bag.owner.display_name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--teed-green-7)] to-[var(--teed-green-9)] flex items-center justify-center text-white text-[10px] font-medium">
                        {getInitials(bag.owner.display_name)}
                      </div>
                    )}
                    <span className="text-xs font-medium text-[var(--text-primary)] group-hover/owner:text-[var(--teed-green-9)] transition-colors max-w-[120px] truncate">
                      {bag.owner.display_name}
                    </span>
                  </Link>
                </div>

                {/* Bag Info - Compressed */}
                <div className="p-4">
                  <h3
                    onClick={() => router.push(`/u/${bag.owner.handle}/${bag.code}`)}
                    className="text-xl font-semibold text-[var(--text-primary)] group-hover:text-[var(--teed-green-9)] transition-colors line-clamp-1 mb-2 cursor-pointer"
                  >
                    {bag.title}
                  </h3>

                  {/* Icon-based metadata */}
                  <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        {bag.items?.length || 0} {bag.items?.length === 1 ? 'item' : 'items'}
                      </span>
                      <span className="font-medium text-[var(--text-secondary)]">/{bag.code}</span>
                    </div>
                    <span>{formatDate(bag.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
