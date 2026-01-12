'use client';

import { useCallback, useState, useEffect } from 'react';
import { ProfileBlock, ProfileTheme } from '@/lib/blocks/types';

// Grid layout item type (matches react-grid-layout LayoutItem)
type GridLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
};
import ProfileGridLayout from '@/components/blocks/ProfileGridLayout';
import EditModeHints from '@/components/blocks/EditModeHints';
import ProfileThemeProvider from './components/ProfileThemeProvider';
import { EditModeProvider, useEditMode } from './components/EditModeProvider';
import ProfileHub from './components/ProfileHub';
import BlockPicker from './components/BlockPicker';
import {
  BaseBlock,
  HeaderBlock,
  BioBlock,
  SocialLinksBlock,
  FeaturedBagsBlock,
  CustomTextBlock,
  SpacerBlock,
  DividerBlock,
  EmbedBlock,
  QuoteBlock,
  AffiliateDisclosureBlock,
  BlockSettingsPanel,
  ProfileStats,
  BlockContainer,
  DEVICE_WIDTHS,
} from '@/components/blocks';
import type { DeviceType } from '@/components/blocks';
import { ThemeEditor } from '@/components/theme';
import UniversalLinkAdder from './components/UniversalLinkAdder';
import CelebrationModal from '@/components/CelebrationModal';
import { FloatingEditButton } from '@/components/FloatingEditButton';
import { GlobalPasteHandler } from '@/components/GlobalPasteHandler';
import { CommandPalette } from '@/components/CommandPalette';
import { FloatingActionHub } from '@/components/FloatingActionHub';

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
  category?: string | null;
  created_at: string;
  updated_at: string | null;
  items?: BagItem[];
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
  blocks_enabled?: boolean;
  beta_tier?: 'founder' | 'influencer' | 'standard' | 'friend' | null;
};

interface UnifiedProfileViewProps {
  profile: Profile;
  bags: Bag[];
  blocks: ProfileBlock[];
  theme: ProfileTheme | null;
  isOwnProfile: boolean;
  showWelcome?: boolean;
  memberNumber?: number;
}

function BlockRenderer({
  block,
  profile,
  bags,
  isOwner,
  isDragging = false,
  onAvatarClick,
}: {
  block: ProfileBlock;
  profile: Profile;
  bags: Bag[];
  isOwner: boolean;
  isDragging?: boolean;
  onAvatarClick?: (rect: DOMRect) => void;
}) {
  const { isEditMode, toggleBlockVisibility, deleteBlock, duplicateBlock, selectedBlockId, selectBlock } = useEditMode();

  const isSelected = selectedBlockId === block.id;

  const handleOpenSettings = (id: string) => {
    // Dispatch custom event for settings panel
    window.dispatchEvent(new CustomEvent('openBlockSettings', { detail: id }));
  };

  // Calculate stats for the ProfileStats component
  const totalItems = bags.reduce((sum, bag) => sum + (bag.items?.length || 0), 0);
  const featuredItems = bags.reduce(
    (sum, bag) => sum + (bag.items?.filter((i) => i.is_featured)?.length || 0),
    0
  );

  const renderBlockContent = () => {
    const config = block.config as any;

    switch (block.block_type) {
      case 'header':
        return (
          <div className="h-full flex flex-col">
            <HeaderBlock
              profile={profile}
              config={config}
              isOwner={isOwner}
              onAvatarClick={onAvatarClick}
            />
            {/* Compact stats below header */}
            {bags.length > 0 && (
              <ProfileStats
                bagsCount={bags.length}
                totalItems={totalItems}
                compact={true}
              />
            )}
          </div>
        );

      case 'bio':
        return profile.bio ? (
          <BlockContainer
            blockId={block.id}
            blockType={block.block_type}
            title={config.title}
            showTitle={config.showTitle}
            isOwner={isOwner}
            onEdit={handleOpenSettings}
          >
            <BioBlock bio={profile.bio} config={config} />
          </BlockContainer>
        ) : null;

      case 'social_links':
        return profile.social_links ? (
          <BlockContainer
            blockId={block.id}
            blockType={block.block_type}
            title={config.title}
            showTitle={config.showTitle}
            isOwner={isOwner}
            onEdit={handleOpenSettings}
          >
            <SocialLinksBlock
              socialLinks={profile.social_links}
              config={config}
            />
          </BlockContainer>
        ) : null;

      case 'featured_bags':
        const currentBagIds: string[] = config.bag_ids || [];

        const handleToggleFeatured = (bagId: string) => {
          const newBagIds = currentBagIds.includes(bagId)
            ? currentBagIds.filter((id: string) => id !== bagId)
            : [...currentBagIds, bagId];

          // Update block config via EditModeProvider
          window.dispatchEvent(
            new CustomEvent('updateBlockConfig', {
              detail: {
                blockId: block.id,
                config: { ...config, bag_ids: newBagIds },
              },
            })
          );
        };

        return (
          <BlockContainer
            blockId={block.id}
            blockType={block.block_type}
            title={config.title}
            showTitle={config.showTitle}
            count={bags.length}
            isOwner={isOwner}
            onEdit={handleOpenSettings}
            allowOverflow={true}
          >
            <FeaturedBagsBlock
              bags={bags}
              handle={profile.handle}
              config={config}
              isOwner={isOwner}
              onToggleFeatured={isEditMode ? handleToggleFeatured : undefined}
            />
          </BlockContainer>
        );

      case 'custom_text':
        return <CustomTextBlock config={config} />;

      case 'spacer':
        return <SpacerBlock config={config} />;

      case 'divider':
        return <DividerBlock config={config} />;

      case 'quote':
        return <QuoteBlock config={config} />;

      case 'affiliate_disclosure':
        return <AffiliateDisclosureBlock config={config} />;

      case 'embed':
        return (
          <BlockContainer
            blockId={block.id}
            blockType={block.block_type}
            title={config.title}
            showTitle={config.showTitle}
            isOwner={isOwner}
            onEdit={handleOpenSettings}
          >
            <EmbedBlock config={config} />
          </BlockContainer>
        );

      case 'destinations':
        return (
          <BlockContainer
            blockId={block.id}
            blockType={block.block_type}
            title={config.title}
            showTitle={config.showTitle}
            isOwner={isOwner}
            onEdit={handleOpenSettings}
          >
            <div className="px-4 py-4 text-center text-[var(--text-tertiary)]">
              Destinations block (coming soon)
            </div>
          </BlockContainer>
        );

      default:
        return null;
    }
  };

  return (
    <BaseBlock
      block={block}
      isEditMode={isEditMode}
      isSelected={isSelected}
      isDragging={isDragging}
      onSelect={selectBlock}
      onToggleVisibility={toggleBlockVisibility}
      onDelete={deleteBlock}
      onDuplicate={duplicateBlock}
      onOpenSettings={handleOpenSettings}
    >
      {renderBlockContent()}
    </BaseBlock>
  );
}

function ProfileContent({
  profile,
  bags,
  isOwnProfile,
  onOpenThemeEditor,
  onUpdateProfile,
  previewDevice,
  onAvatarClick,
}: {
  profile: Profile;
  bags: Bag[];
  isOwnProfile: boolean;
  onOpenThemeEditor?: () => void;
  onUpdateProfile?: (updates: { social_links?: Record<string, string> }) => Promise<void>;
  previewDevice: DeviceType;
  onAvatarClick?: (rect: DOMRect) => void;
}) {
  const { blocks, isEditMode, updateBlockLayout, selectBlock } = useEditMode();

  // Sort blocks by grid position (y first, then x)
  const sortedBlocks = [...blocks].sort((a, b) => {
    const aY = a.gridY ?? a.sort_order;
    const bY = b.gridY ?? b.sort_order;
    if (aY !== bY) return aY - bY;
    return (a.gridX ?? 0) - (b.gridX ?? 0);
  });

  // Calculate preview width based on device
  const previewWidth = DEVICE_WIDTHS[previewDevice];
  const isMobilePreview = previewDevice !== 'desktop';

  // Handle layout changes from react-grid-layout
  const handleLayoutChange = useCallback(
    (layout: GridLayoutItem[]) => {
      console.log('[UnifiedProfileView] handleLayoutChange called', {
        isEditMode,
        layoutCount: layout.length,
        blocksCount: blocks.length,
      });

      if (!isEditMode) {
        console.log('[UnifiedProfileView] NOT in edit mode, skipping');
        return;
      }

      let changesDetected = 0;
      layout.forEach((item) => {
        const block = blocks.find((b) => b.id === item.i);
        if (block) {
          const hasChanged =
            block.gridX !== item.x ||
            block.gridY !== item.y ||
            block.gridW !== item.w ||
            block.gridH !== item.h;

          if (hasChanged) {
            changesDetected++;
            console.log('[UnifiedProfileView] Layout change detected for block:', {
              blockId: item.i,
              old: { x: block.gridX, y: block.gridY, w: block.gridW, h: block.gridH },
              new: { x: item.x, y: item.y, w: item.w, h: item.h },
            });
            updateBlockLayout(item.i, {
              gridX: item.x,
              gridY: item.y,
              gridW: item.w,
              gridH: item.h,
            });
          }
        }
      });
      console.log('[UnifiedProfileView] Total changes detected:', changesDetected);
    },
    [blocks, isEditMode, updateBlockLayout]
  );

  // Render block callback for ProfileGridLayout
  const renderBlock = useCallback(
    (block: ProfileBlock, isDragging: boolean) => (
      <BlockRenderer
        block={block}
        profile={profile}
        bags={bags}
        isOwner={isOwnProfile}
        isDragging={isDragging}
        onAvatarClick={onAvatarClick}
      />
    ),
    [profile, bags, isOwnProfile, onAvatarClick]
  );

  // Render blocks using ProfileGridLayout
  const renderBlocks = () => {
    return (
      <ProfileGridLayout
        blocks={sortedBlocks}
        isEditMode={isEditMode && isOwnProfile}
        onLayoutChange={handleLayoutChange}
        renderBlock={renderBlock}
      />
    );
  };

  // Click outside to deselect
  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectBlock(null);
    }
  };

  return (
    <div
      className={`
        mx-auto py-8 transition-all duration-300
        ${isEditMode && isMobilePreview ? 'px-4' : 'px-4 sm:px-6 lg:px-8'}
      `}
      style={{
        maxWidth: isEditMode ? `${previewWidth}px` : '72rem',
      }}
      onClick={handleContainerClick}
    >
      {/* Blocks */}
      {renderBlocks()}

      {/* Empty state when no blocks */}
      {sortedBlocks.length === 0 && isOwnProfile && (
        <div className="text-center py-12">
          <p className="text-[var(--text-secondary)] mb-4">
            Your profile is empty. Click the Edit button to add blocks.
          </p>
        </div>
      )}
    </div>
  );
}

export default function UnifiedProfileView({
  profile: initialProfile,
  bags,
  blocks,
  theme: initialTheme,
  isOwnProfile,
  showWelcome = false,
  memberNumber,
}: UnifiedProfileViewProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [theme, setTheme] = useState<ProfileTheme | null>(initialTheme);
  const [previewTheme, setPreviewTheme] = useState<ProfileTheme | null>(null);
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');
  const [showCelebration, setShowCelebration] = useState(showWelcome);

  // Use preview theme while editing, otherwise saved theme
  const displayTheme = previewTheme ?? theme;

  // Modal states for ProfileHub control
  const [isBlockPickerOpen, setIsBlockPickerOpen] = useState(false);
  const [isLinkAdderOpen, setIsLinkAdderOpen] = useState(false);

  // Avatar-triggered radial menu state
  const [isRadialMenuOpen, setIsRadialMenuOpen] = useState(false);
  const [avatarRect, setAvatarRect] = useState<DOMRect | null>(null);

  // Handle avatar click - opens radial menu
  const handleAvatarClick = useCallback((rect: DOMRect) => {
    setAvatarRect(rect);
    setIsRadialMenuOpen(true);
  }, []);

  // Listen for openRadialMenu events from block edit buttons
  useEffect(() => {
    const handleOpenRadialMenu = (e: CustomEvent<{ rect: DOMRect; blockId: string }>) => {
      setAvatarRect(e.detail.rect);
      setIsRadialMenuOpen(true);
    };

    window.addEventListener('openRadialMenu', handleOpenRadialMenu as EventListener);
    return () => {
      window.removeEventListener('openRadialMenu', handleOpenRadialMenu as EventListener);
    };
  }, []);

  // Handle profile updates from block settings
  const handleUpdateProfile = useCallback(async (updates: Partial<Profile>) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();

      // Update local state
      setProfile((prev) => ({
        ...prev,
        ...updatedProfile,
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, []);

  return (
    <ProfileThemeProvider theme={displayTheme}>
      <EditModeProvider
        initialBlocks={blocks}
        profileId={profile.id}
        isOwner={isOwnProfile}
      >
        {/* Preview container with device frame when mobile/tablet */}
        <ProfilePreviewContainer
          previewDevice={previewDevice}
          profile={profile}
          bags={bags}
          isOwnProfile={isOwnProfile}
          onOpenThemeEditor={() => setIsThemeEditorOpen(true)}
          onUpdateProfile={handleUpdateProfile}
          onAvatarClick={handleAvatarClick}
        />

        {/* Block Settings Panel - uses provider state */}
        {isOwnProfile && (
          <BlockSettingsPanelConnected
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {/* ProfileHub - Avatar-triggered radial menu */}
        <ProfileHub
          isOwnProfile={isOwnProfile}
          profileId={profile.id}
          profileHandle={profile.handle}
          onOpenThemeEditor={() => setIsThemeEditorOpen(true)}
          onOpenBlockPicker={() => setIsBlockPickerOpen(true)}
          onOpenLinkAdder={() => setIsLinkAdderOpen(true)}
          previewDevice={previewDevice}
          onDeviceChange={setPreviewDevice}
          isMenuOpen={isRadialMenuOpen}
          onMenuClose={() => setIsRadialMenuOpen(false)}
          avatarRect={avatarRect}
        />

        {/* BlockPicker Modal - controlled by ProfileHub */}
        {isOwnProfile && (
          <BlockPicker
            profileId={profile.id}
            isOpen={isBlockPickerOpen}
            onClose={() => setIsBlockPickerOpen(false)}
          />
        )}

        {/* UniversalLinkAdder Modal - controlled by ProfileHub */}
        {isOwnProfile && (
          <UniversalLinkAdder
            profileId={profile.id}
            onUpdateProfile={handleUpdateProfile}
            isOpen={isLinkAdderOpen}
            onClose={() => setIsLinkAdderOpen(false)}
          />
        )}

        {/* Theme Editor */}
        {isOwnProfile && (
          <ThemeEditor
            isOpen={isThemeEditorOpen}
            onClose={() => {
              setIsThemeEditorOpen(false);
              setPreviewTheme(null);  // Clear preview on close
            }}
            profileId={profile.id}
            currentTheme={theme}
            onPreviewChange={setPreviewTheme}  // Live preview on every change
            onThemeChange={(savedTheme) => {
              setTheme(savedTheme);
              setPreviewTheme(null);  // Clear preview after save
            }}
          />
        )}

        {/* Edit Mode Hints - onboarding tooltips */}
        {isOwnProfile && <EditModeHintsConnected />}

        {/* Welcome Celebration Modal */}
        {isOwnProfile && (
          <CelebrationModal
            isOpen={showCelebration}
            onClose={() => {
              setShowCelebration(false);
              // Remove welcome param from URL
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.delete('welcome');
                window.history.replaceState({}, '', url.toString());
              }
            }}
            memberNumber={memberNumber}
            displayName={profile.display_name}
            handle={profile.handle}
            tier={profile.beta_tier || 'founder'}
          />
        )}

        {/* Floating Action Hub - Quick creation menu */}
        <FloatingActionHub
          onOpenBlockPicker={() => setIsBlockPickerOpen(true)}
          onOpenLinkAdder={() => setIsLinkAdderOpen(true)}
        />

        {/* Floating Edit Button - Showcase Mode toggle */}
        <FloatingEditButton />

        {/* Command Palette - Power user keyboard interface */}
        <CommandPalette
          profileHandle={profile.handle}
          isOwner={isOwnProfile}
          onOpenBlockPicker={() => setIsBlockPickerOpen(true)}
          onOpenThemeEditor={() => setIsThemeEditorOpen(true)}
        />

        {/* Global Paste Handler - Universal link drop */}
        <GlobalPasteHandler
          profileHandle={profile.handle}
          isOwner={isOwnProfile}
          onAddEmbedBlock={async (url, classification) => {
            // Add embed block to profile
            const response = await fetch('/api/profile/blocks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                profile_id: profile.id,
                block_type: 'embed',
                config: {
                  url,
                  platform: classification.platform,
                  showTitle: true,
                },
              }),
            });
            if (!response.ok) throw new Error('Failed to add embed block');
          }}
          onAddSocialLink={async (url, platform) => {
            // Add to profile social links
            const currentLinks = profile.social_links || {};
            await handleUpdateProfile({
              social_links: {
                ...currentLinks,
                [platform]: url,
              },
            });
          }}
        />
      </EditModeProvider>
    </ProfileThemeProvider>
  );
}

// Connected BlockSettingsPanel that uses EditModeProvider
function BlockSettingsPanelConnected({
  profile,
  onUpdateProfile,
}: {
  profile: Profile;
  onUpdateProfile: (updates: Partial<Profile>) => Promise<void>;
}) {
  const { blocks, isEditMode, selectedBlockId, selectBlock } = useEditMode();
  const [isOpen, setIsOpen] = useState(false);

  // Show settings for whichever block is selected
  const selectedBlock = selectedBlockId
    ? blocks.find((b) => b.id === selectedBlockId) || null
    : null;

  // Auto-open panel when a block is selected
  useEffect(() => {
    if (selectedBlockId) {
      setIsOpen(true);
    }
  }, [selectedBlockId]);

  // Also listen for explicit settings open events (from toolbar button)
  useEffect(() => {
    const handleOpenSettings = (e: CustomEvent<string>) => {
      setIsOpen(true);
    };
    window.addEventListener('openBlockSettings', handleOpenSettings as EventListener);
    return () => {
      window.removeEventListener('openBlockSettings', handleOpenSettings as EventListener);
    };
  }, []);

  if (!isEditMode) return null;

  return (
    <BlockSettingsPanel
      block={selectedBlock}
      isOpen={isOpen && !!selectedBlock}
      onClose={() => {
        setIsOpen(false);
        selectBlock(null); // Deselect block when panel closes
      }}
      profile={profile}
      onUpdateProfile={onUpdateProfile}
    />
  );
}

// Connected EditModeHints that uses EditModeProvider
function EditModeHintsConnected() {
  const { isEditMode } = useEditMode();
  return <EditModeHints isEditMode={isEditMode} />;
}

// Preview container with device frame
function ProfilePreviewContainer({
  previewDevice,
  profile,
  bags,
  isOwnProfile,
  onOpenThemeEditor,
  onUpdateProfile,
  onAvatarClick,
}: {
  previewDevice: DeviceType;
  profile: Profile;
  bags: Bag[];
  isOwnProfile: boolean;
  onOpenThemeEditor: () => void;
  onUpdateProfile: (updates: { social_links?: Record<string, string> }) => Promise<void>;
  onAvatarClick?: (rect: DOMRect) => void;
}) {
  const { isEditMode } = useEditMode();

  // Only show device frame in edit mode
  const showDeviceFrame = isEditMode && previewDevice !== 'desktop';

  if (showDeviceFrame) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen py-8">
        <div className="flex justify-center">
          <div
            className="bg-[var(--surface)] rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800"
            style={{
              width: DEVICE_WIDTHS[previewDevice],
              minHeight: previewDevice === 'mobile' ? '667px' : '1024px',
            }}
          >
            <ProfileContent
              profile={profile}
              bags={bags}
              isOwnProfile={isOwnProfile}
              onOpenThemeEditor={onOpenThemeEditor}
              onUpdateProfile={onUpdateProfile}
              previewDevice={previewDevice}
              onAvatarClick={onAvatarClick}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProfileContent
      profile={profile}
      bags={bags}
      isOwnProfile={isOwnProfile}
      onOpenThemeEditor={onOpenThemeEditor}
      onUpdateProfile={onUpdateProfile}
      previewDevice={previewDevice}
      onAvatarClick={onAvatarClick}
    />
  );
}

