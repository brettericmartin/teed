'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, UserPlus, UserMinus, Instagram, Twitter, Youtube, Globe, Video, Settings, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import * as authApi from '@/lib/api/domains/auth';
import * as followsApi from '@/lib/api/domains/follows';
import { analytics } from '@/lib/analytics';

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
  isOwnProfile?: boolean;
};

export default function UserProfileClient({ profile, bags, isOwnProfile: isOwnProfileProp = false }: UserProfileClientProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(isOwnProfileProp);
  const [isOwnProfile, setIsOwnProfile] = useState(isOwnProfileProp);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    // Only check client-side auth if server didn't tell us we own the profile
    if (!isOwnProfileProp) {
      checkFollowStatus();
      analytics.profileViewed(profile.id, profile.handle);
    }
    fetchFollowCounts();
  }, [profile.id, isOwnProfileProp]);

  const checkFollowStatus = async () => {
    try {
      const sessionData = await authApi.getSession();
      setIsAuthenticated(!!sessionData.user);
      setIsOwnProfile(sessionData.user?.id === profile.id);

      // Only check follow status if authenticated and not own profile
      if (sessionData.user && sessionData.user.id !== profile.id) {
        const data = await followsApi.getStatus(profile.id);
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      setIsAuthenticated(false);
      console.error('Error checking follow status:', error);
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const data = await followsApi.getCounts(profile.id);
      setFollowerCount(data.followers);
      setFollowingCount(data.following);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
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
        await followsApi.unfollow(profile.id);
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        analytics.userUnfollowed(profile.id, profile.handle);
      } else {
        await followsApi.follow(profile.id);
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        analytics.userFollowed(profile.id, profile.handle);
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

                  {/* Follower/Following Stats */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[var(--text-primary)]">{followerCount}</span>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {followerCount === 1 ? 'Follower' : 'Followers'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[var(--text-primary)]">{followingCount}</span>
                      <span className="text-sm text-[var(--text-secondary)]">Following</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[var(--text-primary)]">{bags.length}</span>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {bags.length === 1 ? 'Bag' : 'Bags'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit Profile Button (own profile) */}
                {isOwnProfile && (
                  <Link href="/settings">
                    <Button variant="secondary" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </Link>
                )}

                {/* Follow Button (other profiles) */}
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
                        onClick={() => analytics.socialLinkClicked(platform, profile.handle)}
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

      {/* Bags Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
          {isOwnProfile ? 'Your Bags' : 'Public Bags'} {bags.length > 0 && `(${bags.length})`}
        </h2>

        {bags.length === 0 ? (
          // Empty State
          <div className="text-center py-20">
            <div className="bg-[var(--sky-3)] w-20 h-20 rounded-full mx-auto flex items-center justify-center">
              <Package className="h-10 w-10 text-[var(--evergreen-10)]" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-[var(--text-primary)]">
              {isOwnProfile ? 'No bags yet' : 'No public bags yet'}
            </h3>
            <p className="mt-2 text-base text-[var(--text-secondary)]">
              {isOwnProfile
                ? 'Create your first bag to start sharing your gear!'
                : `${profile.display_name} hasn't shared any bags publicly.`}
            </p>
            {isOwnProfile && (
              <Link href="/dashboard">
                <Button variant="create" className="mt-6">
                  Create a Bag
                </Button>
              </Link>
            )}
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
                  {/* Private indicator */}
                  {!bag.is_public && isOwnProfile && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-white text-xs">
                      <Lock className="w-3 h-3" />
                      <span>Private</span>
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
