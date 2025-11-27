'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { User, Loader2, Check, X, Upload, Trash2, Camera, ArrowLeft, Instagram, Twitter, Youtube, Globe, Video } from 'lucide-react';
import { useConfirm } from '@/components/ui/ConfirmDialog';

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
  updated_at: string;
};

type SettingsClientProps = {
  initialProfile: Profile;
  userEmail: string;
};

export default function SettingsClient({ initialProfile, userEmail }: SettingsClientProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio || '');
  const [socialLinks, setSocialLinks] = useState({
    instagram: profile.social_links?.instagram || '',
    twitter: profile.social_links?.twitter || '',
    youtube: profile.social_links?.youtube || '',
    tiktok: profile.social_links?.tiktok || '',
    website: profile.social_links?.website || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle availability state (only check if handle changed)
  const [handleAvailability, setHandleAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string | null;
  }>({ checking: false, available: null, error: null });

  const handleChanged = handle !== profile.handle;

  // Check handle availability with debouncing (only if handle changed)
  useEffect(() => {
    if (!handleChanged) {
      setHandleAvailability({ checking: false, available: null, error: null });
      return;
    }

    const checkHandleAvailability = async () => {
      const cleanHandle = handle.trim().toLowerCase();

      if (cleanHandle.length < 3) {
        setHandleAvailability({
          checking: false,
          available: false,
          error: 'Handle must be at least 3 characters'
        });
        return;
      }

      if (!/^[a-z0-9_]+$/.test(cleanHandle)) {
        setHandleAvailability({
          checking: false,
          available: false,
          error: 'Handle can only contain lowercase letters, numbers, and underscores'
        });
        return;
      }

      setHandleAvailability({ checking: true, available: null, error: null });

      try {
        const response = await fetch(`/api/profile/handle-available/${cleanHandle}`);
        const data = await response.json();

        if (data.error) {
          setHandleAvailability({
            checking: false,
            available: false,
            error: data.error
          });
        } else {
          setHandleAvailability({
            checking: false,
            available: data.available,
            error: data.available ? null : 'Handle is already taken'
          });
        }
      } catch (err) {
        setHandleAvailability({
          checking: false,
          available: false,
          error: 'Failed to check availability'
        });
      }
    };

    const timeoutId = setTimeout(checkHandleAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [handle, handleChanged, profile.handle]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaveSuccess(false);

    // Validation
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    if (!handle.trim()) {
      setError('Handle is required');
      return;
    }

    if (handleChanged && !handleAvailability.available) {
      setError('Please choose an available handle');
      return;
    }

    setIsSaving(true);

    try {
      // Clean up social links - only include non-empty values
      const cleanedSocialLinks: Record<string, string> = {};
      Object.entries(socialLinks).forEach(([key, value]) => {
        if (value.trim()) {
          cleanedSocialLinks[key] = value.trim();
        }
      });

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim(),
          handle: handle.trim().toLowerCase(),
          bio: bio.trim() || null,
          social_links: cleanedSocialLinks,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setSaveSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload avatar
    uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    setIsUploadingAvatar(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload avatar');
      }

      const data = await response.json();
      setProfile(data.profile);
      setAvatarPreview(data.avatar_url);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar');
      setAvatarPreview(profile.avatar_url);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    const confirmed = await confirm({
      title: 'Remove Avatar',
      message: 'Remove your profile photo? You can always upload a new one later.',
      confirmText: 'Remove',
      cancelText: 'Keep',
      variant: 'warning',
    });

    if (!confirmed) return;

    setIsUploadingAvatar(true);
    setError('');

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove avatar');
      }

      const data = await response.json();
      setProfile(data.profile);
      setAvatarPreview(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </button>
              <h1 className="text-[var(--font-size-8)] font-semibold text-[var(--text-primary)]">
                Settings
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Manage your profile and account settings
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-[var(--copper-2)] border border-[var(--copper-6)] rounded-[var(--radius-md)] p-4">
            <p className="text-sm text-[var(--copper-11)]">{error}</p>
          </div>
        )}

        {saveSuccess && (
          <div className="mb-6 bg-[var(--teed-green-2)] border border-[var(--teed-green-6)] rounded-[var(--radius-md)] p-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[var(--teed-green-11)]" />
              <p className="text-sm text-[var(--teed-green-11)]">Changes saved successfully!</p>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Avatar Section */}
          <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] border border-[var(--border-subtle)] p-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Profile Picture</h2>

            <div className="flex items-start gap-6">
              {/* Avatar Preview */}
              <div className="relative flex-shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full border-4 border-[var(--border-subtle)] object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-[var(--border-subtle)] bg-gradient-to-br from-[var(--teed-green-6)] to-[var(--sky-6)] flex items-center justify-center">
                    <User className="w-12 h-12 text-[var(--evergreen-12)]" />
                  </div>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Avatar Actions */}
              <div className="flex-1">
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Upload a profile picture. Recommended size: 256x256px. Max 2MB.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="secondary"
                    size="sm"
                    disabled={isUploadingAvatar}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New
                  </Button>
                  {avatarPreview && (
                    <Button
                      onClick={handleRemoveAvatar}
                      variant="ghost"
                      size="sm"
                      disabled={isUploadingAvatar}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit}>
            <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] border border-[var(--border-subtle)] p-6 space-y-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Profile Information</h2>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full px-4 py-3 text-base bg-[var(--input-bg-disabled)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--text-secondary)] cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Email cannot be changed
                </p>
              </div>

              {/* Handle */}
              <div>
                <label htmlFor="handle" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Username (Handle) <span className="text-[var(--copper-9)]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-secondary)]">
                    @
                  </div>
                  <input
                    id="handle"
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase())}
                    className="w-full pl-8 pr-12 py-3 text-base bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
                    disabled={isSaving}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    {handleAvailability.checking && (
                      <Loader2 className="w-5 h-5 text-[var(--text-tertiary)] animate-spin" />
                    )}
                    {!handleAvailability.checking && handleAvailability.available === true && (
                      <Check className="w-5 h-5 text-[var(--teed-green-9)]" />
                    )}
                    {!handleAvailability.checking && handleAvailability.available === false && (
                      <X className="w-5 h-5 text-[var(--copper-9)]" />
                    )}
                  </div>
                </div>
                {handleAvailability.error && (
                  <p className="mt-1 text-xs text-[var(--copper-9)]">{handleAvailability.error}</p>
                )}
                {handleAvailability.available && (
                  <p className="mt-1 text-xs text-[var(--teed-green-9)]">Handle is available!</p>
                )}
              </div>

              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Display Name <span className="text-[var(--copper-9)]">*</span>
                </label>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  className="w-full px-4 py-3 text-base bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
                  disabled={isSaving}
                />
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  {displayName.length}/50 characters
                </p>
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent resize-none transition-all"
                  placeholder="Tell the world about yourself..."
                  disabled={isSaving}
                />
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  {bio.length}/500 characters
                </p>
              </div>

              {/* Social Links */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-4">
                  Social Links
                </label>
                <div className="space-y-3">
                  {/* Instagram */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Instagram className="w-4 h-4 text-[var(--text-secondary)]" />
                    </div>
                    <input
                      type="text"
                      value={socialLinks.instagram}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                      placeholder="Instagram username"
                      className="w-full pl-11 pr-4 py-3 text-base bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Twitter/X */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Twitter className="w-4 h-4 text-[var(--text-secondary)]" />
                    </div>
                    <input
                      type="text"
                      value={socialLinks.twitter}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                      placeholder="Twitter/X handle"
                      className="w-full pl-11 pr-4 py-3 text-base bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
                      disabled={isSaving}
                    />
                  </div>

                  {/* YouTube */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Youtube className="w-4 h-4 text-[var(--text-secondary)]" />
                    </div>
                    <input
                      type="text"
                      value={socialLinks.youtube}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, youtube: e.target.value }))}
                      placeholder="YouTube channel URL or @handle"
                      className="w-full pl-11 pr-4 py-3 text-base bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
                      disabled={isSaving}
                    />
                  </div>

                  {/* TikTok */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Video className="w-4 h-4 text-[var(--text-secondary)]" />
                    </div>
                    <input
                      type="text"
                      value={socialLinks.tiktok}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, tiktok: e.target.value }))}
                      placeholder="TikTok username"
                      className="w-full pl-11 pr-4 py-3 text-base bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Website */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Globe className="w-4 h-4 text-[var(--text-secondary)]" />
                    </div>
                    <input
                      type="url"
                      value={socialLinks.website}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="Your website URL"
                      className="w-full pl-11 pr-4 py-3 text-base bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                  These links will appear on your public profile page
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="create"
                  disabled={isSaving || (handleChanged && !handleAvailability.available)}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Account Info */}
          <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] border border-[var(--border-subtle)] p-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Account created:</span>
                <span className="text-[var(--text-primary)] font-medium">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Public profile:</span>
                <a
                  href={`/u/${profile.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] font-medium hover:underline"
                >
                  teed.com/u/{profile.handle}
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
