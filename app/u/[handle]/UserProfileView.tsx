'use client';

import { useRouter } from 'next/navigation';
import { Calendar, Package, User } from 'lucide-react';

type Bag = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  background_image: string | null;
  is_public: boolean;
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

type UserProfileViewProps = {
  profile: Profile;
  bags: Bag[];
};

export default function UserProfileView({ profile, bags }: UserProfileViewProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="min-h-screen">
      {/* Profile Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-24 h-24 rounded-full border-4 border-[var(--border-subtle)] object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-[var(--border-subtle)] bg-gradient-to-br from-[var(--teed-green-6)] to-[var(--sky-6)] flex items-center justify-center">
                  <User className="w-12 h-12 text-[var(--evergreen-12)]" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-[var(--text-primary)] truncate">
                {profile.display_name}
              </h1>
              <p className="text-lg text-[var(--text-secondary)] mt-1">
                @{profile.handle}
              </p>

              {profile.bio && (
                <p className="mt-3 text-[var(--text-primary)] max-w-2xl">
                  {profile.bio}
                </p>
              )}

              {/* Stats */}
              <div className="mt-4 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Package className="w-4 h-4" />
                  <span>
                    <span className="font-semibold text-[var(--text-primary)]">{bags.length}</span> public {bags.length === 1 ? 'bag' : 'bags'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDate(profile.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Bags Grid */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {bags.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <Package className="mx-auto h-16 w-16 text-[var(--text-tertiary)]" />
            <h3 className="mt-4 text-lg font-medium text-[var(--text-primary)]">No public bags yet</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {profile.display_name} hasn't shared any bags publicly yet.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
              Public Bags
            </h2>
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
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--teed-green-9)] transition-colors line-clamp-1">
                      {bag.title}
                    </h3>
                    {bag.description && (
                      <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">
                        {bag.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                      <span>/{bag.code}</span>
                      <span>{bag.updated_at ? formatDate(bag.updated_at) : formatDate(bag.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
