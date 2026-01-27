'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, User, FileText, Link, Video, Package, Type, Minus, MoreHorizontal,
  RectangleHorizontal, Square, Plus, Trash2, Edit2, Check, ExternalLink,
  Instagram, Twitter, Youtube, Globe, Music, Quote, Info, BookOpen, Camera
} from 'lucide-react';
import AvatarCropper from '@/components/ui/AvatarCropper';
import { ProfileBlock, BlockType, BlockConfig, BlockWidth, HeaderBlockConfig, BioBlockConfig, CustomTextBlockConfig, FeaturedBagsBlockConfig, SocialLinksBlockConfig, SpacerBlockConfig, DividerBlockConfig, EmbedBlockConfig, StoryBlockConfig, DEFAULT_BLOCK_GRID } from '@/lib/blocks/types';
import { useEditMode } from '@/app/u/[handle]/components/EditModeProvider';

// Social platform definitions
const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, placeholder: '@username or full URL', color: '#E4405F' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, placeholder: '@username or full URL', color: '#1DA1F2' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, placeholder: '@channel or full URL', color: '#FF0000' },
  { id: 'tiktok', name: 'TikTok', icon: Music, placeholder: '@username or full URL', color: '#000000' },
  { id: 'twitch', name: 'Twitch', icon: Video, placeholder: 'username or full URL', color: '#9146FF' },
  { id: 'website', name: 'Website', icon: Globe, placeholder: 'https://yoursite.com', color: '#4A90A4' },
  { id: 'linkedin', name: 'LinkedIn', icon: User, placeholder: 'linkedin.com/in/username', color: '#0A66C2' },
  { id: 'facebook', name: 'Facebook', icon: User, placeholder: 'facebook.com/username', color: '#1877F2' },
  { id: 'threads', name: 'Threads', icon: FileText, placeholder: '@username', color: '#000000' },
  { id: 'pinterest', name: 'Pinterest', icon: FileText, placeholder: 'pinterest.com/username', color: '#BD081C' },
  { id: 'discord', name: 'Discord', icon: FileText, placeholder: 'discord.gg/invite', color: '#5865F2' },
  { id: 'spotify', name: 'Spotify', icon: Music, placeholder: 'open.spotify.com/artist/...', color: '#1DB954' },
  { id: 'soundcloud', name: 'SoundCloud', icon: Music, placeholder: 'soundcloud.com/username', color: '#FF5500' },
  { id: 'github', name: 'GitHub', icon: FileText, placeholder: 'github.com/username', color: '#181717' },
  { id: 'patreon', name: 'Patreon', icon: FileText, placeholder: 'patreon.com/creator', color: '#FF424D' },
  { id: 'substack', name: 'Substack', icon: FileText, placeholder: 'username.substack.com', color: '#FF6719' },
  { id: 'email', name: 'Email', icon: FileText, placeholder: 'you@example.com', color: '#EA4335' },
];

// Profile type for settings panel
type SocialLinks = Record<string, string>;

interface ProfileData {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  social_links?: SocialLinks;
}

interface BlockSettingsPanelProps {
  block: ProfileBlock | null;
  isOpen: boolean;
  onClose: () => void;
  // Note: onSave removed - changes are now applied immediately via updateBlock() and auto-saved
  // New props for content editing
  profile?: ProfileData | null;
  onUpdateProfile?: (updates: Partial<ProfileData>) => Promise<void>;
}

// Block type info
const BLOCK_TYPE_INFO: Record<BlockType, { label: string; icon: typeof User }> = {
  header: { label: 'Header Block', icon: User },
  bio: { label: 'Bio Block', icon: FileText },
  social_links: { label: 'Social Links', icon: Link },
  embed: { label: 'Embed Block', icon: Video },
  featured_bags: { label: 'Featured Bags', icon: Package },
  custom_text: { label: 'Custom Text', icon: Type },
  spacer: { label: 'Spacer', icon: Minus },
  divider: { label: 'Divider', icon: Minus },
  destinations: { label: 'Destinations', icon: MoreHorizontal },
  quote: { label: 'Quote', icon: Quote },
  affiliate_disclosure: { label: 'Disclosure', icon: Info },
  story: { label: 'The Story', icon: BookOpen },
};

// Size options per block type
const BLOCK_SIZES: Record<string, Array<{ value: string; label: string; description: string }>> = {
  header: [
    { value: 'minimal', label: 'Minimal', description: 'Avatar + name only, compact' },
    { value: 'standard', label: 'Standard', description: 'Avatar, name, and banner' },
    { value: 'hero', label: 'Hero', description: 'Large banner, prominent display' },
  ],
  bio: [
    { value: 'compact', label: 'Compact', description: '2 lines, truncated' },
    { value: 'standard', label: 'Standard', description: '4 lines visible' },
    { value: 'expanded', label: 'Expanded', description: 'Full text, no truncation' },
  ],
  featured_bags: [
    { value: 'thumbnail', label: 'Thumbnail', description: 'Small grid, 6 bags max' },
    { value: 'standard', label: 'Standard', description: 'Medium cards, 6 bags' },
    { value: 'showcase', label: 'Showcase', description: 'Large cards, detailed view' },
  ],
  custom_text: [
    { value: 'sm', label: 'Small', description: '14px text' },
    { value: 'md', label: 'Medium', description: '16px text' },
    { value: 'lg', label: 'Large', description: '20px text' },
    { value: 'xl', label: 'Extra Large', description: '28px text' },
  ],
  spacer: [
    { value: 'sm', label: 'Small', description: '16px space' },
    { value: 'md', label: 'Medium', description: '32px space' },
    { value: 'lg', label: 'Large', description: '48px space' },
    { value: 'xl', label: 'Extra Large', description: '64px space' },
  ],
};

// Block types that support half width
const SUPPORTS_HALF_WIDTH: BlockType[] = [
  'header',
  'bio',
  'social_links',
  'custom_text',
  'spacer',
  'divider',
  'embed',
  'featured_bags',
  'story',
];

export default function BlockSettingsPanel({
  block,
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}: BlockSettingsPanelProps) {
  // Get updateBlock and updateBlockLayout from provider for immediate updates (auto-saved via debounce)
  const { updateBlock, updateBlockLayout } = useEditMode();

  // Use block's config directly - no local state needed for live preview
  const config = block?.config || {};
  const width = block?.width || 'full';

  // Profile editing state
  const [editingBio, setEditingBio] = useState('');
  const [editingDisplayName, setEditingDisplayName] = useState('');
  const [editingSocialLinks, setEditingSocialLinks] = useState<SocialLinks>({});
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync profile data when it changes
  useEffect(() => {
    if (profile) {
      setEditingBio(profile.bio || '');
      setEditingDisplayName(profile.display_name || '');
      setEditingSocialLinks(profile.social_links || {});
    }
  }, [profile]);

  // Reset platform picker state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setShowPlatformPicker(false);
      setEditingPlatform(null);
    }
  }, [isOpen]);

  // Add body class to coordinate with mobile navigation
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('settings-panel-open');
    } else {
      document.body.classList.remove('settings-panel-open');
    }
    return () => document.body.classList.remove('settings-panel-open');
  }, [isOpen]);

  // Save profile updates
  const handleSaveProfileField = useCallback(async (updates: Partial<ProfileData>) => {
    if (!onUpdateProfile) return;

    setIsSavingProfile(true);
    try {
      await onUpdateProfile(updates);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSavingProfile(false);
    }
  }, [onUpdateProfile]);

  // Handle adding a new social link
  const handleAddSocialLink = (platformId: string, value: string) => {
    const newLinks = { ...editingSocialLinks, [platformId]: value };
    setEditingSocialLinks(newLinks);
    handleSaveProfileField({ social_links: newLinks });
    setShowPlatformPicker(false);
    setEditingPlatform(null);
  };

  // Handle removing a social link
  const handleRemoveSocialLink = (platformId: string) => {
    const newLinks = { ...editingSocialLinks };
    delete newLinks[platformId];
    setEditingSocialLinks(newLinks);
    handleSaveProfileField({ social_links: newLinks });
  };

  // Handle updating a social link
  const handleUpdateSocialLink = (platformId: string, value: string) => {
    const newLinks = { ...editingSocialLinks, [platformId]: value };
    setEditingSocialLinks(newLinks);
    handleSaveProfileField({ social_links: newLinks });
    setEditingPlatform(null);
  };

  if (!isOpen || !block) return null;

  const blockInfo = BLOCK_TYPE_INFO[block.block_type] || { label: 'Block', icon: Package };
  const BlockIcon = blockInfo.icon;
  const sizes = BLOCK_SIZES[block.block_type];
  const supportsHalfWidth = SUPPORTS_HALF_WIDTH.includes(block.block_type);

  // Update config immediately - changes go straight to provider and trigger auto-save
  const updateConfig = (key: string, value: any) => {
    if (!block) return;
    updateBlock(block.id, {
      config: { ...block.config, [key]: value }
    });
  };

  // Update block width immediately
  const updateWidth = (newWidth: BlockWidth) => {
    if (!block) return;
    updateBlock(block.id, { width: newWidth });
  };

  // Render settings based on block type
  const renderSettings = () => {
    switch (block.block_type) {
      case 'header':
        return renderHeaderSettings();
      case 'bio':
        return renderBioSettings();
      case 'custom_text':
        return renderCustomTextSettings();
      case 'featured_bags':
        return renderFeaturedBagsSettings();
      case 'social_links':
        return renderSocialLinksSettings();
      case 'spacer':
        return renderSpacerSettings();
      case 'divider':
        return renderDividerSettings();
      case 'embed':
        return renderEmbedSettings();
      case 'story':
        return renderStorySettings();
      default:
        return <p className="text-[var(--text-tertiary)] text-sm">No settings available for this block type.</p>;
    }
  };

  const renderHeaderSettings = () => {
    const headerConfig = config as HeaderBlockConfig;
    return (
      <>
        {/* Display Name Editing */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={editingDisplayName}
            onChange={(e) => setEditingDisplayName(e.target.value)}
            onBlur={() => {
              if (editingDisplayName.trim() && editingDisplayName !== profile?.display_name) {
                handleSaveProfileField({ display_name: editingDisplayName.trim() });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editingDisplayName.trim()) {
                handleSaveProfileField({ display_name: editingDisplayName.trim() });
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Your name"
            maxLength={50}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]"
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-[var(--text-tertiary)]">
              {isSavingProfile ? 'Saving...' : 'Press Enter or click outside to save'}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {editingDisplayName.length} / 50
            </span>
          </div>
        </div>

        {/* Avatar Upload */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Profile Picture
          </label>
          <AvatarUploadSection
            avatarUrl={profile?.avatar_url}
            onAvatarChange={async (blob) => {
              if (!onUpdateProfile) return;
              // Upload the avatar
              const file = new File([blob], 'avatar.jpg', { type: blob.type || 'image/jpeg' });
              const formData = new FormData();
              formData.append('file', file);

              try {
                const response = await fetch('/api/profile/avatar', {
                  method: 'POST',
                  body: formData,
                });

                if (!response.ok) {
                  const data = await response.json();
                  throw new Error(data.error || 'Failed to upload avatar');
                }

                const data = await response.json();
                // Update the profile with new avatar URL
                await onUpdateProfile({ avatar_url: data.avatar_url });
              } catch (error) {
                console.error('Failed to upload avatar:', error);
              }
            }}
          />
        </div>

        {/* Size selector */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          {renderSizeSelector()}
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Display Options
          </label>
          <div className="space-y-3">
            <ToggleOption
              label="Show Avatar"
              checked={headerConfig.show_avatar !== false}
              onChange={(v) => updateConfig('show_avatar', v)}
            />
            <ToggleOption
              label="Show Display Name"
              checked={headerConfig.show_display_name !== false}
              onChange={(v) => updateConfig('show_display_name', v)}
            />
            <ToggleOption
              label="Show Handle (@username)"
              checked={headerConfig.show_handle !== false}
              onChange={(v) => updateConfig('show_handle', v)}
            />
          </div>
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Alignment
          </label>
          <AlignmentSelector
            value={headerConfig.alignment || 'center'}
            onChange={(v) => updateConfig('alignment', v)}
          />
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Vertical Alignment
          </label>
          <VerticalAlignmentSelector
            value={(config as any).verticalAlign || 'center'}
            onChange={(v) => updateConfig('verticalAlign', v)}
          />
        </div>
      </>
    );
  };

  const renderBioSettings = () => {
    const bioConfig = config as BioBlockConfig;
    const bioCharLimit = 500;

    return (
      <>
        {/* Section Title Settings */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Section Title
          </label>
          <input
            type="text"
            value={bioConfig.title ?? 'About'}
            onChange={(e) => updateConfig('title', e.target.value)}
            placeholder="About"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]"
          />
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <ToggleOption
            label="Show Section Title"
            description="Display the section header above this block"
            checked={bioConfig.showTitle !== false}
            onChange={(v) => updateConfig('showTitle', v)}
          />
        </div>

        {/* Bio Text Editing */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Bio Text
          </label>
          <textarea
            value={editingBio}
            onChange={(e) => setEditingBio(e.target.value)}
            onBlur={() => {
              if (editingBio !== profile?.bio) {
                handleSaveProfileField({ bio: editingBio || null });
              }
            }}
            placeholder="Tell people about yourself..."
            rows={4}
            maxLength={bioCharLimit}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)] resize-none"
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-[var(--text-tertiary)]">
              {isSavingProfile ? 'Saving...' : 'Press Tab or click outside to save'}
            </span>
            <span className={`text-xs ${editingBio.length >= bioCharLimit * 0.9 ? 'text-[var(--copper-9)]' : 'text-[var(--text-tertiary)]'}`}>
              {editingBio.length} / {bioCharLimit}
            </span>
          </div>
        </div>

        {/* Size selector */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          {renderSizeSelector()}
        </div>

        {/* Text alignment */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Alignment
          </label>
          <AlignmentSelector
            value={(bioConfig as any).alignment || 'left'}
            onChange={(v) => updateConfig('alignment', v)}
          />
        </div>

        {/* Vertical alignment */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Vertical Alignment
          </label>
          <VerticalAlignmentSelector
            value={(config as any).verticalAlign || 'center'}
            onChange={(v) => updateConfig('verticalAlign', v)}
          />
        </div>

        {/* Font weight */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Font Weight
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['normal', 'medium', 'semibold', 'bold'].map((weight) => (
              <button
                key={weight}
                onClick={() => updateConfig('fontWeight', weight)}
                className={`py-2 px-2 rounded-lg text-xs transition-colors capitalize ${
                  (bioConfig as any).fontWeight === weight || (!(bioConfig as any).fontWeight && weight === 'normal')
                    ? 'bg-[var(--teed-green-9)] text-white'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
                style={{ fontWeight: weight === 'normal' ? 400 : weight === 'medium' ? 500 : weight === 'semibold' ? 600 : 700 }}
              >
                {weight}
              </button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Font Size
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'sm', label: 'S', size: '14px' },
              { value: 'base', label: 'M', size: '16px' },
              { value: 'lg', label: 'L', size: '18px' },
              { value: 'xl', label: 'XL', size: '20px' },
            ].map(({ value, label, size }) => (
              <button
                key={value}
                onClick={() => updateConfig('fontSize', value)}
                className={`py-2 px-2 rounded-lg text-xs transition-colors ${
                  (bioConfig as any).fontSize === value || (!(bioConfig as any).fontSize && value === 'base')
                    ? 'bg-[var(--teed-green-9)] text-white'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <span className="font-medium">{label}</span>
                <span className="block text-[10px] opacity-70">{size}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Show full toggle */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <ToggleOption
            label="Show Full Bio"
            description="Display entire bio without truncation"
            checked={bioConfig.show_full === true}
            onChange={(v) => updateConfig('show_full', v)}
          />
        </div>
      </>
    );
  };

  const renderCustomTextSettings = () => {
    const textConfig = config as CustomTextBlockConfig;
    return (
      <>
        {/* Size selector */}
        {renderSizeSelector()}

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Text Style
          </label>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => updateConfig('variant', 'heading')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                textConfig.variant === 'heading'
                  ? 'bg-[var(--teed-green-9)] text-white'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              Heading
            </button>
            <button
              onClick={() => updateConfig('variant', 'paragraph')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                textConfig.variant === 'paragraph'
                  ? 'bg-[var(--teed-green-9)] text-white'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              Paragraph
            </button>
          </div>
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Text Content
          </label>
          <textarea
            value={textConfig.text || ''}
            onChange={(e) => updateConfig('text', e.target.value)}
            placeholder="Enter your text..."
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)] resize-none"
          />
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Alignment
          </label>
          <AlignmentSelector
            value={textConfig.alignment || 'center'}
            onChange={(v) => updateConfig('alignment', v)}
          />
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Vertical Alignment
          </label>
          <VerticalAlignmentSelector
            value={(config as any).verticalAlign || 'center'}
            onChange={(v) => updateConfig('verticalAlign', v)}
          />
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Font Weight
          </label>
          <div className="flex gap-2">
            {['normal', 'medium', 'semibold', 'bold'].map((weight) => (
              <button
                key={weight}
                onClick={() => updateConfig('fontWeight', weight)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs transition-colors capitalize ${
                  (textConfig as any).fontWeight === weight || (!((textConfig as any).fontWeight) && weight === 'normal')
                    ? 'bg-[var(--teed-green-9)] text-white'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
                style={{ fontWeight: weight === 'normal' ? 400 : weight === 'medium' ? 500 : weight === 'semibold' ? 600 : 700 }}
              >
                {weight}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  };

  const renderFeaturedBagsSettings = () => {
    const bagsConfig = config as FeaturedBagsBlockConfig;
    return (
      <>
        {/* Section Title Settings */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Section Title
          </label>
          <input
            type="text"
            value={bagsConfig.title ?? 'Collections'}
            onChange={(e) => updateConfig('title', e.target.value)}
            placeholder="Collections"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]"
          />
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <ToggleOption
            label="Show Section Title"
            description="Display the section header above this block"
            checked={bagsConfig.showTitle !== false}
            onChange={(v) => updateConfig('showTitle', v)}
          />
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          {renderSizeSelector()}
        </div>
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Max Bags to Display
          </label>
          <select
            value={bagsConfig.max_display || 6}
            onChange={(e) => updateConfig('max_display', parseInt(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)]"
          >
            {[3, 6, 9, 12].map((n) => (
              <option key={n} value={n}>{n} bags</option>
            ))}
          </select>
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Vertical Alignment
          </label>
          <VerticalAlignmentSelector
            value={(config as any).verticalAlign || 'center'}
            onChange={(v) => updateConfig('verticalAlign', v)}
          />
        </div>
      </>
    );
  };

  const renderSocialLinksSettings = () => {
    const socialConfig = config as SocialLinksBlockConfig;
    const existingPlatforms = Object.keys(editingSocialLinks).filter(k => editingSocialLinks[k]);
    const availablePlatforms = SOCIAL_PLATFORMS.filter(p => !existingPlatforms.includes(p.id));

    return (
      <>
        {/* Section Title Settings */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Section Title
          </label>
          <input
            type="text"
            value={socialConfig.title ?? 'Connect'}
            onChange={(e) => updateConfig('title', e.target.value)}
            placeholder="Connect"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]"
          />
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <ToggleOption
            label="Show Section Title"
            description="Display the section header above this block"
            checked={socialConfig.showTitle !== false}
            onChange={(v) => updateConfig('showTitle', v)}
          />
        </div>

        {/* Display Style */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Display Style
          </label>
          <div className="flex gap-2">
            {[
              { value: 'icons', label: 'Icons' },
              { value: 'pills', label: 'Pills' },
              { value: 'list', label: 'List' },
            ].map((style) => (
              <button
                key={style.value}
                onClick={() => updateConfig('style', style.value)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  socialConfig.style === style.value || (!socialConfig.style && style.value === 'icons')
                    ? 'bg-[var(--teed-green-9)] text-white'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        {/* Button Size */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Button Size
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'sm', label: 'S', desc: 'Small' },
              { value: 'md', label: 'M', desc: 'Medium' },
              { value: 'lg', label: 'L', desc: 'Large' },
              { value: 'xl', label: 'XL', desc: 'X-Large' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => updateConfig('buttonSize', value)}
                className={`py-2 px-2 rounded-lg text-xs transition-colors ${
                  socialConfig.buttonSize === value || (!socialConfig.buttonSize && value === 'md')
                    ? 'bg-[var(--teed-green-9)] text-white'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <span className="font-medium">{label}</span>
                <span className="block text-[10px] opacity-70">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Vertical Alignment */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Vertical Alignment
          </label>
          <VerticalAlignmentSelector
            value={(config as any).verticalAlign || 'center'}
            onChange={(v) => updateConfig('verticalAlign', v)}
          />
        </div>

        {/* Social Links Manager */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Your Social Links
          </label>

          {/* Current links list */}
          {existingPlatforms.length > 0 ? (
            <div className="space-y-2 mb-4">
              {existingPlatforms.map((platformId) => {
                const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
                const PlatformIcon = platform?.icon || Globe;
                const isEditing = editingPlatform === platformId;

                return (
                  <div
                    key={platformId}
                    className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)]"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${platform?.color}20` }}
                    >
                      <PlatformIcon className="w-4 h-4" style={{ color: platform?.color }} />
                    </div>

                    {isEditing ? (
                      <input
                        type="text"
                        defaultValue={editingSocialLinks[platformId]}
                        autoFocus
                        onBlur={(e) => handleUpdateSocialLink(platformId, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateSocialLink(platformId, e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            setEditingPlatform(null);
                          }
                        }}
                        className="flex-1 px-2 py-1 text-sm rounded border border-[var(--teed-green-7)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none"
                      />
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-[var(--text-tertiary)]">
                            {platform?.name || platformId}
                          </div>
                          <div className="text-sm text-[var(--text-primary)] truncate">
                            {editingSocialLinks[platformId]}
                          </div>
                        </div>

                        <button
                          onClick={() => setEditingPlatform(platformId)}
                          className="p-1.5 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveSocialLink(platformId)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-500"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] mb-4">
              No social links added yet. Add your first link below.
            </p>
          )}

          {/* Add Social Link Button / Platform Picker */}
          {!showPlatformPicker ? (
            <button
              onClick={() => setShowPlatformPicker(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--teed-green-7)] hover:text-[var(--teed-green-9)] hover:bg-[var(--teed-green-1)] transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add Social Link</span>
            </button>
          ) : (
            <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)]">
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  Choose Platform
                </span>
                <button
                  onClick={() => setShowPlatformPicker(false)}
                  className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 max-h-64 overflow-y-auto">
                {availablePlatforms.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availablePlatforms.map((platform) => {
                      const PlatformIcon = platform.icon;
                      return (
                        <SocialLinkAdder
                          key={platform.id}
                          platform={platform}
                          onAdd={(value) => handleAddSocialLink(platform.id, value)}
                          onCancel={() => setShowPlatformPicker(false)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
                    All platforms have been added!
                  </p>
                )}
              </div>
            </div>
          )}

          {isSavingProfile && (
            <p className="text-xs text-[var(--teed-green-9)] mt-2">Saving...</p>
          )}
        </div>
      </>
    );
  };

  const renderSpacerSettings = () => {
    return renderSizeSelector();
  };

  const renderDividerSettings = () => {
    const dividerConfig = config as DividerBlockConfig;
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Style
          </label>
          <div className="flex gap-2">
            {['solid', 'dashed', 'dotted'].map((style) => (
              <button
                key={style}
                onClick={() => updateConfig('style', style)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors ${
                  dividerConfig.style === style || (!dividerConfig.style && style === 'solid')
                    ? 'bg-[var(--teed-green-9)] text-white'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Width
          </label>
          <div className="flex gap-2">
            {[
              { value: 'full', label: 'Full' },
              { value: 'half', label: 'Half' },
              { value: 'third', label: 'Third' },
            ].map((width) => (
              <button
                key={width.value}
                onClick={() => updateConfig('width', width.value)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  dividerConfig.width === width.value || (!dividerConfig.width && width.value === 'half')
                    ? 'bg-[var(--teed-green-9)] text-white'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {width.label}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  };

  const renderEmbedSettings = () => {
    const embedConfig = config as EmbedBlockConfig;

    // Detect platform from URL
    const detectPlatform = (url: string): string => {
      if (!url) return 'unknown';
      if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
      if (url.includes('spotify.com')) return 'Spotify';
      if (url.includes('tiktok.com')) return 'TikTok';
      if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter/X';
      if (url.includes('instagram.com')) return 'Instagram';
      if (url.includes('twitch.tv')) return 'Twitch';
      return 'unknown';
    };

    const detectedPlatform = detectPlatform(embedConfig.url || '');

    return (
      <>
        {/* Section Title Settings */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Section Title
          </label>
          <input
            type="text"
            value={embedConfig.title ?? 'Featured'}
            onChange={(e) => updateConfig('title', e.target.value)}
            placeholder="Featured"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]"
          />
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <ToggleOption
            label="Show Section Title"
            description="Display the section header above this block"
            checked={embedConfig.showTitle !== false}
            onChange={(v) => updateConfig('showTitle', v)}
          />
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Embed URL
          </label>
          <input
            type="url"
            value={embedConfig.url || ''}
            onChange={(e) => updateConfig('url', e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]"
          />
          {detectedPlatform !== 'unknown' && (
            <p className="mt-2 text-xs text-[var(--teed-green-9)] flex items-center gap-1">
              <Video className="w-3 h-3" />
              Detected: {detectedPlatform}
            </p>
          )}
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">
            Supports YouTube, Spotify, TikTok, Twitter/X, Instagram, Twitch
          </p>
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Description <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
          </label>
          <textarea
            value={embedConfig.description || ''}
            onChange={(e) => updateConfig('description', e.target.value)}
            placeholder="Why I recommend this..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)] resize-none"
          />
        </div>
      </>
    );
  };

  const renderStorySettings = () => {
    const storyConfig = config as StoryBlockConfig;
    return (
      <>
        {/* Section Title Settings */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Section Title
          </label>
          <input
            type="text"
            value={storyConfig.title ?? 'The Story'}
            onChange={(e) => updateConfig('title', e.target.value)}
            placeholder="The Story"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]"
          />
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <ToggleOption
            label="Show Section Title"
            description="Display the section header above this block"
            checked={storyConfig.showTitle !== false}
            onChange={(v) => updateConfig('showTitle', v)}
          />
        </div>

        {/* Max Items */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Maximum Events to Show
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 10, 15].map((count) => (
              <button
                key={count}
                onClick={() => updateConfig('maxItems', count)}
                className={`py-2 px-2 rounded-lg text-sm font-medium transition-colors ${
                  storyConfig.maxItems === count || (!storyConfig.maxItems && count === 5)
                    ? 'bg-[var(--teed-green-9)] text-white'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Display Options */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Display Options
          </label>
          <div className="space-y-3">
            <ToggleOption
              label="Show Filter Bar"
              description="Let viewers filter by action type (Added, Retired, etc.)"
              checked={storyConfig.showFiltersBar !== false}
              onChange={(v) => updateConfig('showFiltersBar', v)}
            />
            <ToggleOption
              label="Group by Time Period"
              description="Organize events into This Week, This Month, Earlier"
              checked={storyConfig.groupByTimePeriod !== false}
              onChange={(v) => updateConfig('groupByTimePeriod', v)}
            />
          </div>
        </div>

        {/* Content Sources */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Content Sources
          </label>
          <div className="space-y-3">
            <ToggleOption
              label="Profile Changes"
              description="Include bio, social links, theme changes"
              checked={storyConfig.showProfileChanges !== false}
              onChange={(v) => updateConfig('showProfileChanges', v)}
            />
            <ToggleOption
              label="Bag Changes"
              description="Include items added/retired from bags"
              checked={storyConfig.showBagChanges !== false}
              onChange={(v) => updateConfig('showBagChanges', v)}
            />
          </div>
        </div>

        {/* Info about visibility controls */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <div className="p-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-medium">Tip:</span> Hover over individual events to show/hide them from viewers.
              You can also manage default visibility in <strong>Settings → Story Preferences</strong>.
            </p>
          </div>
        </div>
      </>
    );
  };

  const renderSizeSelector = () => {
    if (!sizes) return null;
    const currentSize = (config as any).size || sizes[1]?.value || sizes[0]?.value;

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
          Size
        </label>
        <div className="grid gap-2">
          {sizes.map((size) => (
            <button
              key={size.value}
              onClick={() => updateConfig('size', size.value)}
              className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                currentSize === size.value
                  ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-1)]'
                  : 'border-[var(--border-subtle)] hover:border-[var(--teed-green-7)] bg-[var(--surface)]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                currentSize === size.value
                  ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-9)]'
                  : 'border-[var(--border-subtle)]'
              }`}>
                {currentSize === size.value && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div>
                <div className="font-medium text-[var(--text-primary)]">{size.label}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{size.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`
        fixed z-50 bg-[var(--surface)] shadow-2xl overflow-hidden flex flex-col
        transition-transform duration-300 ease-out

        /* Mobile: Bottom sheet */
        inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl

        /* Desktop: Right sidebar */
        lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[380px] lg:max-h-none lg:rounded-none lg:rounded-l-2xl
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--teed-green-2)] flex items-center justify-center">
              <BlockIcon className="w-4 h-4 text-[var(--teed-green-9)]" />
            </div>
            <span className="font-semibold text-[var(--text-primary)]">
              {blockInfo.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile drag handle */}
        <div className="flex justify-center py-2 lg:hidden">
          <div className="w-10 h-1 rounded-full bg-[var(--border-subtle)]" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {renderSettings()}

          {/* Grid Size Controls */}
          {supportsHalfWidth && (
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                Block Size
              </label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { w: 12, label: 'Full', desc: '100%' },
                  { w: 6, label: 'Half', desc: '50%' },
                  { w: 4, label: 'Third', desc: '33%' },
                ].map((opt) => (
                  <button
                    key={opt.w}
                    onClick={() => {
                      if (block) {
                        updateBlockLayout(block.id, {
                          gridX: opt.w === 12 ? 0 : block.gridX,
                          gridY: block.gridY,
                          gridW: opt.w,
                          gridH: block.gridH,
                        });
                      }
                    }}
                    className={`
                      flex flex-col items-center py-2.5 px-3 rounded-lg border-2 transition-all
                      ${block?.gridW === opt.w
                        ? 'border-[var(--teed-green-9)] bg-[var(--teed-green-1)]'
                        : 'border-[var(--border-subtle)] hover:border-[var(--teed-green-7)] bg-[var(--surface)]'
                      }
                    `}
                  >
                    <div className={`text-sm font-medium ${block?.gridW === opt.w ? 'text-[var(--teed-green-9)]' : 'text-[var(--text-primary)]'}`}>
                      {opt.label}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">{opt.desc}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                Drag block edges to resize, or drag to reposition on the grid.
              </p>
            </div>
          )}

        </div>

        {/* Footer - changes are auto-saved, so just close */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
          <span className="text-xs text-[var(--text-tertiary)]">
            Changes save automatically
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--teed-green-9)] text-white rounded-lg text-sm font-medium hover:bg-[var(--teed-green-10)] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}

// Toggle option component
function ToggleOption({
  label,
  description,
  icon,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <div className="flex items-center gap-2">
        {icon && <span className="text-[var(--text-tertiary)]">{icon}</span>}
        <div>
          <span className="text-sm text-[var(--text-primary)] group-hover:text-[var(--teed-green-9)]">
            {label}
          </span>
          {description && (
            <p className="text-xs text-[var(--text-tertiary)]">{description}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${checked ? 'bg-[var(--teed-green-9)]' : 'bg-[var(--border-subtle)]'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </label>
  );
}

// Horizontal alignment selector component
function AlignmentSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {[
        { value: 'left', icon: '⬛' },
        { value: 'center', icon: '◼️' },
        { value: 'right', icon: '◻️' },
      ].map((align) => (
        <button
          key={align.value}
          onClick={() => onChange(align.value)}
          className={`
            flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors
            ${value === align.value
              ? 'bg-[var(--teed-green-9)] text-white'
              : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }
          `}
        >
          {align.value}
        </button>
      ))}
    </div>
  );
}

// Vertical alignment selector component
function VerticalAlignmentSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {[
        { value: 'top', label: 'Top' },
        { value: 'center', label: 'Center' },
        { value: 'bottom', label: 'Bottom' },
      ].map((align) => (
        <button
          key={align.value}
          onClick={() => onChange(align.value)}
          className={`
            flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
            ${value === align.value
              ? 'bg-[var(--teed-green-9)] text-white'
              : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }
          `}
        >
          {align.label}
        </button>
      ))}
    </div>
  );
}

// Social Link Adder component - click platform then enter URL
function SocialLinkAdder({
  platform,
  onAdd,
  onCancel,
}: {
  platform: typeof SOCIAL_PLATFORMS[0];
  onAdd: (value: string) => void;
  onCancel: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [value, setValue] = useState('');
  const PlatformIcon = platform.icon;

  if (isExpanded) {
    return (
      <div className="col-span-3 flex items-center gap-2 p-2 rounded-lg bg-[var(--surface)] border border-[var(--teed-green-7)]">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${platform.color}20` }}
        >
          <PlatformIcon className="w-4 h-4" style={{ color: platform.color }} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={platform.placeholder}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) {
              onAdd(value.trim());
            } else if (e.key === 'Escape') {
              setIsExpanded(false);
              setValue('');
            }
          }}
          className="flex-1 px-2 py-1 text-sm bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
        />
        <button
          onClick={() => {
            if (value.trim()) {
              onAdd(value.trim());
            }
          }}
          disabled={!value.trim()}
          className="p-1.5 rounded bg-[var(--teed-green-9)] text-white disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setIsExpanded(false);
            setValue('');
          }}
          className="p-1.5 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsExpanded(true)}
      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${platform.color}20` }}
      >
        <PlatformIcon className="w-5 h-5" style={{ color: platform.color }} />
      </div>
      <span className="text-xs text-[var(--text-secondary)]">{platform.name}</span>
    </button>
  );
}

// Avatar Upload Section component
function AvatarUploadSection({
  avatarUrl,
  onAvatarChange,
}: {
  avatarUrl?: string | null;
  onAvatarChange: (blob: Blob) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // Use local preview when available for immediate feedback
  const displayUrl = localPreviewUrl || avatarUrl;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB for cropping)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    // Read file and open cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);

    // Clear input for re-selection
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setImageToCrop(null);
    setIsUploading(true);

    // Create immediate preview from blob
    const previewUrl = URL.createObjectURL(croppedBlob);
    setLocalPreviewUrl(previewUrl);

    try {
      await onAvatarChange(croppedBlob);
      // Success - clear local preview, let prop take over
      setLocalPreviewUrl(null);
      URL.revokeObjectURL(previewUrl);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      // Revert on failure
      setLocalPreviewUrl(null);
      URL.revokeObjectURL(previewUrl);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Avatar Preview */}
        <div className="relative flex-shrink-0">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Avatar"
              className="w-16 h-16 rounded-full border-2 border-[var(--border-subtle)] object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-[var(--border-subtle)] bg-gradient-to-br from-[var(--teed-green-6)] to-[var(--sky-6)] flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="
              flex items-center gap-2 px-4 py-2 rounded-lg
              bg-[var(--surface-elevated)] border border-[var(--border-subtle)]
              text-sm font-medium text-[var(--text-primary)]
              hover:bg-[var(--surface-hover)] hover:border-[var(--teed-green-7)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all
            "
          >
            <Camera className="w-4 h-4" />
            {avatarUrl ? 'Change Photo' : 'Upload Photo'}
          </button>
          <p className="text-xs text-[var(--text-tertiary)] mt-1.5">
            Max 5MB. Square recommended.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Avatar Cropper Modal */}
      {showCropper && imageToCrop && (
        <AvatarCropper
          imageSrc={imageToCrop}
          onComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setImageToCrop(null);
          }}
        />
      )}
    </>
  );
}
