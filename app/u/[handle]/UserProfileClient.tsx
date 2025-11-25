'use client';

import { useRouter } from 'next/navigation';
import { Package, UserPlus, UserMinus, Instagram, Twitter, Youtube, Globe, Video } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  banner_url?: string | null;
  bio: string | null;
  social_links?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
    twitch?: string;
  };
  created_at: string;
};

type UserProfileClientProps = {
  profile: Profile;
  bags: Bag[];
};

export default function UserProfileClient({ profile, bags }: UserProfileClientProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    checkFollowStatus();
  }, [profile.id]);

  const checkFollowStatus = async () => {
    try {
      // Check if user is authenticated and if this is their own profile
      const sessionResponse = await fetch('/api/auth/session');
      if (!sessionResponse.ok) {
        setIsAuthenticated(false);
        return;
      }

      const sessionData = await sessionResponse.json();
      setIsAuthenticated(!!sessionData.user);
      setIsOwnProfile(sessionData.user?.id === profile.id);

      // Only check follow status if authenticated and not own profile
      if (sessionData.user && sessionData.user.id !== profile.id) {
        const response = await fetch(`/api/follows/${profile.id}`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        }
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/follows/${profile.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsFollowing(false);
        }
      } else {
        // Follow
        const response = await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ following_id: profile.id }),
        });

        if (response.ok) {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
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

  const getSocialIcon = (platform: string) => {
    const iconMap: Record<string, any> = {
      instagram: Instagram,
      twitter: Twitter,
      youtube: Youtube,
      tiktok: Video,
      website: Globe,
      twitch: Video,
    };
    return iconMap[platform] || Globe;
  };

  const getSocialUrl = (platform: string, value: string) => {
    // If value is already a URL, use it
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    // Otherwise, construct the URL based on platform
    const urlMap: Record<string, string> = {
      instagram: `https://instagram.com/${value.replace('@', '')}`,
      twitter: `https://twitter.com/${value.replace('@', '')}`,
      youtube: value.startsWith('@') ? `https://youtube.com/${value}` : value,
      tiktok: `https://tiktok.com/@${value.replace('@', '')}`,
      twitch: `https://twitch.tv/${value}`,
      website: value,
    };
    return urlMap[platform] || value;
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                    {profile.display_name}
                  </h1>
                  <p className="text-lg text-[var(--text-secondary)] mt-1">
                    @{profile.handle}
                  </p>
                </div>

                {/* Follow Button */}
                {isAuthenticated && !isOwnProfile && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isLoading}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all min-h-[44px] ${
                      isFollowing
                        ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--sand-3)] hover:border-[var(--sand-7)]'
                        : 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-bg-hover)]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="w-5 h-5" />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {profile.bio && (
                <p className="text-base text-[var(--text-secondary)] mt-4 max-w-2xl">
                  {profile.bio}
                </p>
              )}

              {/* Social Links */}
              {profile.social_links && Object.keys(profile.social_links).length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {Object.entries(profile.social_links).map(([platform, value]) => {
                    if (!value) return null;
                    const Icon = getSocialIcon(platform);
                    const url = getSocialUrl(platform, value);
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-hover)] hover:bg-[var(--sand-3)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        title={`${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${value}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="capitalize">{platform}</span>
                      </a>
                    );
                  })}
                </div>
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
