'use client';

import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';

type Bag = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  is_public: boolean;
  background_image: string | null;
  created_at: string;
  updated_at: string | null;
};

type Profile = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

type UserProfileClientProps = {
  profile: Profile;
  bags: Bag[];
};

export default function UserProfileClient({ profile, bags }: UserProfileClientProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="min-h-screen">
      {/* Profile Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-[var(--border-subtle)]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--teed-green-6)] to-[var(--sky-6)] flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                {profile.display_name}
              </h1>
              <p className="text-lg text-[var(--text-secondary)] mt-1">
                @{profile.handle}
              </p>
              {profile.bio && (
                <p className="text-base text-[var(--text-secondary)] mt-4 max-w-2xl">
                  {profile.bio}
                </p>
              )}
              <p className="text-sm text-[var(--text-tertiary)] mt-4">
                Joined {formatDate(profile.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Public Bags Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
          Public Bags {bags.length > 0 && `(${bags.length})`}
        </h2>

        {bags.length === 0 ? (
          // Empty State
          <div className="text-center py-20">
            <div className="bg-[var(--sky-3)] w-20 h-20 rounded-full mx-auto flex items-center justify-center">
              <Package className="h-10 w-10 text-[var(--evergreen-10)]" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-[var(--text-primary)]">No public bags yet</h3>
            <p className="mt-2 text-base text-[var(--text-secondary)]">
              {profile.display_name} hasn't shared any bags publicly.
            </p>
          </div>
        ) : (
          // Bags Grid
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bags.map((bag) => (
              <div
                key={bag.id}
                onClick={() => router.push(`/u/${profile.handle}/${bag.code}`)}
                className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] border border-[var(--border-subtle)] overflow-hidden hover:shadow-[var(--shadow-3)] transition-all cursor-pointer group"
              >
                {/* Cover Image or Placeholder */}
                <div className="h-40 bg-gradient-to-br from-[var(--teed-green-6)] to-[var(--sky-6)] relative overflow-hidden">
                  {bag.background_image ? (
                    <img
                      src={bag.background_image}
                      alt={bag.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-16 h-16 text-[var(--evergreen-12)] opacity-20" />
                    </div>
                  )}
                </div>

                {/* Bag Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--teed-green-9)] transition-colors line-clamp-1">
                    {bag.title}
                  </h3>
                  {bag.description && (
                    <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2">
                      {bag.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                    <span className="font-medium">/{bag.code}</span>
                    <span>{formatDate(bag.updated_at || bag.created_at)}</span>
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
