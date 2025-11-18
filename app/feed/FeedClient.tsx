'use client';

import { useRouter } from 'next/navigation';
import { Heart, Package, User } from 'lucide-react';
import Link from 'next/link';

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

type FeedClientProps = {
  initialBags: Bag[];
};

export default function FeedClient({ initialBags }: FeedClientProps) {
  const router = useRouter();

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                Feed
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Bags from people you follow
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {initialBags.length === 0 ? (
          // Empty State
          <div className="text-center py-20">
            <div className="bg-[var(--sky-3)] w-20 h-20 rounded-full mx-auto flex items-center justify-center">
              <Heart className="h-10 w-10 text-[var(--evergreen-10)]" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-[var(--text-primary)]">
              Your feed is empty
            </h3>
            <p className="mt-2 text-base text-[var(--text-secondary)]">
              Follow other users to see their bags in your feed.
            </p>
            <div className="mt-8">
              <Link
                href="/discover"
                className="inline-flex items-center px-6 py-3 bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] rounded-lg hover:bg-[var(--button-primary-bg-hover)] transition-colors font-medium"
              >
                Discover Users
              </Link>
            </div>
          </div>
        ) : (
          // Bags Grid
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {initialBags.map((bag) => (
              <div
                key={bag.id}
                className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] border border-[var(--border-subtle)] overflow-hidden hover:shadow-[var(--shadow-3)] transition-all group"
              >
                {/* Cover Image or Featured Items Grid */}
                <div
                  onClick={() => router.push(`/u/${bag.owner.handle}/${bag.code}`)}
                  className="h-40 bg-gradient-to-br from-[var(--teed-green-6)] to-[var(--sky-6)] relative overflow-hidden cursor-pointer"
                >
                  {(() => {
                    const featuredItems = bag.items?.filter(item => item.is_featured && item.photo_url)
                      .sort((a, b) => (a.featured_position || 0) - (b.featured_position || 0))
                      .slice(0, 8) || [];

                    if (featuredItems.length > 0) {
                      return (
                        <div className="grid grid-cols-4 gap-1 p-2 h-full">
                          {featuredItems.map((item) => (
                            <div key={item.id} className="relative bg-white rounded overflow-hidden">
                              <img
                                src={item.photo_url!}
                                alt={item.custom_name || 'Item'}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ))}
                          {Array.from({ length: Math.max(0, 8 - featuredItems.length) }).map((_, i) => (
                            <div key={`placeholder-${i}`} className="bg-white/20 rounded"></div>
                          ))}
                        </div>
                      );
                    } else if (bag.background_image) {
                      return (
                        <img
                          src={bag.background_image}
                          alt={bag.title}
                          className="w-full h-full object-cover"
                        />
                      );
                    } else {
                      return (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="w-16 h-16 text-[var(--evergreen-12)] opacity-20" />
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Bag Info */}
                <div className="p-6">
                  {/* Owner Info */}
                  <Link
                    href={`/u/${bag.owner.handle}`}
                    className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
                  >
                    {bag.owner.avatar_url ? (
                      <img
                        src={bag.owner.avatar_url}
                        alt={bag.owner.display_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--teed-green-7)] to-[var(--teed-green-9)] flex items-center justify-center text-white text-xs font-medium">
                        {getInitials(bag.owner.display_name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {bag.owner.display_name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">
                        @{bag.owner.handle}
                      </p>
                    </div>
                  </Link>

                  {/* Bag Title */}
                  <h3
                    onClick={() => router.push(`/u/${bag.owner.handle}/${bag.code}`)}
                    className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--teed-green-9)] transition-colors line-clamp-1 cursor-pointer"
                  >
                    {bag.title}
                  </h3>
                  {bag.description && (
                    <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2">
                      {bag.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                    <span className="font-medium">/{bag.code}</span>
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
