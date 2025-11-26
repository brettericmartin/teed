'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Compass, Package, Search, Filter, X, Heart, Eye, Layers, ChevronDown, User, Tag, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';

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
  category: string | null;
  tags: string[];
  created_at: string;
  updated_at: string | null;
  item_count?: number;
  items?: BagItem[];
  owner: BagOwner;
};

type Suggestion = {
  bags: Array<{
    type: 'bag';
    id: string;
    title: string;
    code: string;
    category: string | null;
    owner: { handle: string; display_name: string };
  }>;
  users: Array<{
    type: 'user';
    id: string;
    handle: string;
    display_name: string;
    avatar_url: string | null;
  }>;
  tags: Array<{
    type: 'tag';
    tag: string;
  }>;
};

type DiscoverClientProps = {
  initialBags: Bag[];
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First', icon: '🆕' },
  { value: 'oldest', label: 'Oldest First', icon: '📅' },
  { value: 'most_items', label: 'Most Items', icon: '📦' },
  { value: 'popular', label: 'Most Active', icon: '🔥' },
];

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

// Color mapping for categories based on semantic meaning
const getCategoryColor = (categoryValue: string) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    golf: { bg: 'bg-[var(--teed-green-8)]', text: 'text-white' },
    outdoor: { bg: 'bg-[var(--evergreen-9)]', text: 'text-white' },
    travel: { bg: 'bg-[var(--sky-6)]', text: 'text-white' },
    tech: { bg: 'bg-[var(--sky-7)]', text: 'text-white' },
    fashion: { bg: 'bg-[var(--copper-7)]', text: 'text-white' },
    fitness: { bg: 'bg-[var(--copper-8)]', text: 'text-white' },
    gaming: { bg: 'bg-[var(--copper-6)]', text: 'text-white' },
    photography: { bg: 'bg-[var(--sand-9)]', text: 'text-white' },
    music: { bg: 'bg-[var(--sand-8)]', text: 'text-white' },
    other: { bg: 'bg-[var(--grey-7)]', text: 'text-white' },
  };
  return colorMap[categoryValue] || { bg: 'bg-[var(--teed-green-8)]', text: 'text-white' };
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

export default function DiscoverClient({ initialBags }: DiscoverClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [bags, setBags] = useState<Bag[]>(initialBags);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Filter states
  const [showFollowing, setShowFollowing] = useState(searchParams.get('following') === 'true');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(searchParams.get('tags')?.split(',').filter(Boolean) || []);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    fetchBags();
  }, [showFollowing, selectedCategory, searchQuery, selectedTags, sortBy]);

  // Debounced autocomplete
  useEffect(() => {
    if (searchInput.length < 2) {
      setSuggestions(null);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`/api/discover/suggestions?q=${encodeURIComponent(searchInput)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
      if (sortBy) params.append('sort', sortBy);

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
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (type: 'bag' | 'user' | 'tag', value: any) => {
    setShowSuggestions(false);
    if (type === 'bag') {
      router.push(`/u/${value.owner.handle}/${value.code}`);
    } else if (type === 'user') {
      router.push(`/u/${value.handle}`);
    } else if (type === 'tag') {
      toggleTag(value.tag);
      setSearchInput('');
    }
  };

  const clearFilters = () => {
    setShowFollowing(false);
    setSelectedCategory(null);
    setSearchQuery('');
    setSearchInput('');
    setSelectedTags([]);
    setSortBy('newest');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Get all unique tags from current bags for filter suggestions
  const getAllTags = () => {
    const tagSet = new Set<string>();
    bags.forEach(bag => {
      bag.tags?.forEach((tag: string) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  const hasActiveFilters = showFollowing || selectedCategory || searchQuery || selectedTags.length > 0 || sortBy !== 'newest';

  const hasSuggestions = suggestions && (
    suggestions.bags.length > 0 ||
    suggestions.users.length > 0 ||
    suggestions.tags.length > 0
  );

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
              {/* Search, Sort, and Following */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Search Bar with Autocomplete */}
                <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onFocus={() => hasSuggestions && setShowSuggestions(true)}
                      placeholder="Search bags, users, or tags..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--sky-6)] focus:border-transparent"
                    />
                    {isLoadingSuggestions && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-[var(--sky-6)] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showSuggestions && hasSuggestions && (
                    <div
                      ref={suggestionsRef}
                      className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
                    >
                      {/* Bag suggestions */}
                      {suggestions.bags.length > 0 && (
                        <div className="p-2">
                          <div className="text-xs font-medium text-[var(--text-tertiary)] px-2 py-1">Bags</div>
                          {suggestions.bags.map((bag) => (
                            <button
                              key={bag.id}
                              type="button"
                              onClick={() => handleSuggestionClick('bag', bag)}
                              className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[var(--surface-hover)] text-left"
                            >
                              <Package className="w-4 h-4 text-[var(--text-tertiary)]" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-[var(--text-primary)] truncate">{bag.title}</div>
                                <div className="text-xs text-[var(--text-tertiary)]">by {bag.owner.display_name}</div>
                              </div>
                              {bag.category && (
                                <span className="text-xs px-1.5 py-0.5 bg-[var(--surface-elevated)] rounded">
                                  {CATEGORIES.find(c => c.value === bag.category)?.icon}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* User suggestions */}
                      {suggestions.users.length > 0 && (
                        <div className="p-2 border-t border-[var(--border-subtle)]">
                          <div className="text-xs font-medium text-[var(--text-tertiary)] px-2 py-1">Users</div>
                          {suggestions.users.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleSuggestionClick('user', user)}
                              className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[var(--surface-hover)] text-left"
                            >
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-[var(--teed-green-8)] flex items-center justify-center">
                                  <User className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-[var(--text-primary)] truncate">{user.display_name}</div>
                                <div className="text-xs text-[var(--text-tertiary)]">@{user.handle}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Tag suggestions */}
                      {suggestions.tags.length > 0 && (
                        <div className="p-2 border-t border-[var(--border-subtle)]">
                          <div className="text-xs font-medium text-[var(--text-tertiary)] px-2 py-1">Tags</div>
                          <div className="flex flex-wrap gap-1 px-2">
                            {suggestions.tags.map((item) => (
                              <button
                                key={item.tag}
                                type="button"
                                onClick={() => handleSuggestionClick('tag', item)}
                                className="px-2 py-1 bg-[var(--sky-2)] text-[var(--sky-11)] rounded text-sm hover:bg-[var(--sky-3)]"
                              >
                                #{item.tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </form>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-all whitespace-nowrap"
                  >
                    <span>{SORT_OPTIONS.find(o => o.value === sortBy)?.icon}</span>
                    <span className="hidden sm:inline">{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showSortMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg shadow-lg z-50 min-w-[160px]">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setShowSortMenu(false);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[var(--surface-hover)] first:rounded-t-lg last:rounded-b-lg ${
                            sortBy === option.value ? 'bg-[var(--sky-2)] text-[var(--sky-11)]' : 'text-[var(--text-primary)]'
                          }`}
                        >
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Following Toggle */}
                {isAuthenticated && (
                  <button
                    onClick={() => setShowFollowing(!showFollowing)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                      showFollowing
                        ? 'bg-[var(--sky-6)] text-white'
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
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-[var(--copper-9)] hover:text-[var(--copper-10)] hover:bg-[var(--copper-2)] transition-all whitespace-nowrap"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>

              {/* Category Filters */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-[var(--text-tertiary)]">Categories:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => {
                    const colors = getCategoryColor(category.value);
                    const isSelected = selectedCategory === category.value;
                    return (
                      <button
                        key={category.value}
                        onClick={() => setSelectedCategory(
                          selectedCategory === category.value ? null : category.value
                        )}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          isSelected
                            ? `${colors.bg} ${colors.text}`
                            : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <span>{category.icon}</span>
                        <span className="ml-1.5">{category.label.split(' ')[1]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tag Filters (show popular tags from current results) */}
              {getAllTags().length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-[var(--text-tertiary)]">Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getAllTags().slice(0, 15).map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-[var(--sky-6)] text-white'
                              : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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
                  className={`h-[200px] bg-gradient-to-br ${getBagGradient(bag.id)} relative overflow-hidden cursor-pointer border-b border-[var(--border-subtle)]`}
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
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3
                      onClick={() => router.push(`/u/${bag.owner.handle}/${bag.code}`)}
                      className="text-xl font-semibold text-[var(--text-primary)] group-hover:text-[var(--teed-green-9)] transition-colors line-clamp-1 cursor-pointer flex-1"
                    >
                      {bag.title}
                    </h3>
                    {/* Category Badge */}
                    {bag.category && (
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-medium ${getCategoryColor(bag.category).bg} ${getCategoryColor(bag.category).text}`}>
                        {CATEGORIES.find(c => c.value === bag.category)?.icon || '📦'}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {bag.tags && bag.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {bag.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTag(tag);
                          }}
                          className="px-1.5 py-0.5 bg-[var(--sky-2)] text-[var(--sky-11)] rounded text-xs font-medium hover:bg-[var(--sky-3)] cursor-pointer transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                      {bag.tags.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[var(--text-tertiary)] text-xs">
                          +{bag.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

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
