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
  StoryBlock,
  BlockSettingsPanel,
  ProfileStats,
  BlockContainer,
  DEVICE_WIDTHS,
} from '@/components/blocks';
import type { DeviceType } from '@/components/blocks';
import { ThemeEditor } from '@/components/theme';
import UniversalLinkAdder from './components/UniversalLinkAdder';
import CelebrationModal from '@/components/CelebrationModal';
import { GlobalPasteHandler } from '@/components/GlobalPasteHandler';
import { CommandPalette } from '@/components/CommandPalette';
import { ProfileActionBar } from '@/components/ProfileActionBar';
import { AddSocialFlow } from '@/components/add';
import { useRouter } from 'next/navigation';

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
  /** Auto-open a modal based on URL action param */
  initialAction?: 'link' | 'block' | 'social';
  /** Start in edit mode from URL param */
  startInEditMode?: boolean;
}

function BlockRenderer({
  block,
  profile,
  bags,
  isOwner,
  isDragging = false,
}: {
  block: ProfileBlock;
  profile: Profile;
  bags: Bag[];
  isOwner: boolean;
  isDragging?: boolean;
}) {
  const { isEditMode, setEditMode, toggleBlockVisibility, deleteBlock, duplicateBlock, selectedBlockId, selectBlock } = useEditMode();

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
              onAvatarClick={(_rect) => {
                // Enable edit mode if not already, then select block to open settings
                if (!isEditMode) {
                  setEditMode(true);
                }
                selectBlock(block.id);
              }}
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
            onEdit={isEditMode ? handleOpenSettings : undefined}
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
            onEdit={isEditMode ? handleOpenSettings : undefined}
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
            onEdit={isEditMode ? handleOpenSettings : undefined}
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
            onEdit={isEditMode ? handleOpenSettings : undefined}
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
            onEdit={isEditMode ? handleOpenSettings : undefined}
          >
            <div className="px-4 py-4 text-center text-[var(--text-tertiary)]">
              Destinations block (coming soon)
            </div>
          </BlockContainer>
        );

      case 'story':
        return (
          <BlockContainer
            blockId={block.id}
            blockType={block.block_type}
            title={config.title || 'History'}
            showTitle={config.showTitle}
            isOwner={isOwner}
            onEdit={isEditMode ? handleOpenSettings : undefined}
          >
            <StoryBlock
              profileId={profile.id}
              profileHandle={profile.handle}
              bags={bags}
              config={config}
              isOwner={isOwner}
            />
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
  editingLayout,
}: {
  profile: Profile;
  bags: Bag[];
  isOwnProfile: boolean;
  onOpenThemeEditor?: () => void;
  onUpdateProfile?: (updates: { social_links?: Record<string, string> }) => Promise<void>;
  previewDevice: DeviceType;
  editingLayout: 'desktop' | 'mobile';
}) {
  const { blocks, isEditMode, updateBlockLayout, selectBlock, reorderBlocks } = useEditMode();

  // Sort blocks for mobile view (by sort_order)
  const sortedBlocks = [...blocks].sort((a, b) => a.sort_order - b.sort_order);

  // Calculate preview width based on device
  const previewWidth = DEVICE_WIDTHS[previewDevice];
  // Mobile/tablet portrait use constrained layouts, tablet_landscape and desktop use full layouts
  const isMobilePreview = previewDevice === 'mobile' || previewDevice === 'tablet';

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
      />
    ),
    [profile, bags, isOwnProfile]
  );

  // Handle mobile reorder (arrow buttons)
  const handleReorderBlock = useCallback(
    (blockId: string, direction: 'up' | 'down') => {
      const currentIndex = sortedBlocks.findIndex((b) => b.id === blockId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= sortedBlocks.length) return;

      reorderBlocks(currentIndex, newIndex);
    },
    [sortedBlocks, reorderBlocks]
  );

  // Render blocks using ProfileGridLayout
  const renderBlocks = () => {
    return (
      <ProfileGridLayout
        blocks={sortedBlocks}
        isEditMode={isEditMode && isOwnProfile}
        editingLayout={editingLayout}
        onLayoutChange={handleLayoutChange}
        onReorderBlock={handleReorderBlock}
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
            Your profile is empty. Click the Edit button to add panels.
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
  initialAction,
  startInEditMode,
}: UnifiedProfileViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [theme, setTheme] = useState<ProfileTheme | null>(initialTheme);
  const [previewTheme, setPreviewTheme] = useState<ProfileTheme | null>(null);
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');
  const [showCelebration, setShowCelebration] = useState(showWelcome);
  const [editingLayout, setEditingLayout] = useState<'desktop' | 'mobile'>('desktop');

  // Use preview theme while editing, otherwise saved theme
  const displayTheme = previewTheme ?? theme;

  // Modal states for ProfileHub control - initialize based on URL params
  const [isBlockPickerOpen, setIsBlockPickerOpen] = useState(initialAction === 'block');
  const [isLinkAdderOpen, setIsLinkAdderOpen] = useState(initialAction === 'link');
  const [isSocialFlowOpen, setIsSocialFlowOpen] = useState(initialAction === 'social');

  // Clean up URL params after handling the initial action
  useEffect(() => {
    if (initialAction || startInEditMode) {
      // Remove action and edit params from URL without triggering navigation
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('action');
        url.searchParams.delete('edit');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [initialAction, startInEditMode]);

  // Handlers for ProminentAddBar
  const handleAddBag = useCallback(() => {
    router.push('/bags/new');
  }, [router]);

  const handleSaveSocialLinks = useCallback(async (links: Record<string, string>) => {
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ social_links: links }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save social links');
    }

    // Update local state
    setProfile(prev => ({ ...prev, social_links: links }));
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
        initialEditMode={startInEditMode}
      >
        {/* Profile Action Bar - Three main actions: Customize | ADD | Analyze */}
        {isOwnProfile && (
          <ProfileActionBarConnected
            onAddBag={handleAddBag}
            onAddBlock={() => setIsBlockPickerOpen(true)}
            onAddLink={() => setIsLinkAdderOpen(true)}
            onAddSocial={() => setIsSocialFlowOpen(true)}
            onCustomizeTheme={() => setIsThemeEditorOpen(true)}
            onViewStats={() => router.push(`/u/${profile.handle}/stats`)}
            profileHandle={profile.handle}
            editingLayout={editingLayout}
            onToggleEditingLayout={() => setEditingLayout(l => l === 'desktop' ? 'mobile' : 'desktop')}
          />
        )}

        {/* Preview container with device frame when mobile/tablet */}
        <ProfilePreviewContainer
          previewDevice={previewDevice}
          profile={profile}
          bags={bags}
          isOwnProfile={isOwnProfile}
          onOpenThemeEditor={() => setIsThemeEditorOpen(true)}
          onUpdateProfile={handleUpdateProfile}
          editingLayout={editingLayout}
        />

        {/* Block Settings Panel - uses provider state */}
        {isOwnProfile && (
          <BlockSettingsPanelConnected
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {/* BlockPicker Modal */}
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
            profileHandle={profile.handle}
            onUpdateProfile={handleUpdateProfile}
            isOpen={isLinkAdderOpen}
            onClose={() => setIsLinkAdderOpen(false)}
            bags={bags.map(bag => ({
              id: bag.id,
              code: bag.code,
              title: bag.title,
              itemCount: bag.items?.length || 0,
              updatedAt: bag.updated_at || bag.created_at,
            }))}
          />
        )}

        {/* AddSocialFlow Modal - for managing social links */}
        {isOwnProfile && (
          <AddSocialFlow
            isOpen={isSocialFlowOpen}
            onClose={() => setIsSocialFlowOpen(false)}
            currentSocialLinks={profile.social_links || {}}
            onSave={handleSaveSocialLinks}
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

// Connected ProfileActionBar that uses EditModeProvider
function ProfileActionBarConnected({
  onAddBag,
  onAddBlock,
  onAddLink,
  onAddSocial,
  onCustomizeTheme,
  onViewStats,
  profileHandle,
  editingLayout,
  onToggleEditingLayout,
}: {
  onAddBag: () => void;
  onAddBlock: () => void;
  onAddLink: () => void;
  onAddSocial: () => void;
  onCustomizeTheme: () => void;
  onViewStats: () => void;
  profileHandle: string;
  editingLayout: 'desktop' | 'mobile';
  onToggleEditingLayout: () => void;
}) {
  const { setEditMode, isEditMode, blocks, selectBlock } = useEditMode();

  // Handle "Profile Info" menu item - opens header block settings
  const handleCustomizeProfile = useCallback(() => {
    const headerBlock = blocks.find(b => b.block_type === 'header');
    setEditMode(true);
    if (headerBlock) {
      selectBlock(headerBlock.id);
    }
  }, [blocks, setEditMode, selectBlock]);

  return (
    <ProfileActionBar
      onAddBag={onAddBag}
      onAddBlock={onAddBlock}
      onAddLink={onAddLink}
      onAddSocial={onAddSocial}
      onCustomizeTheme={onCustomizeTheme}
      onCustomizeProfile={handleCustomizeProfile}
      onEditBlocks={() => setEditMode(true)}
      onViewStats={onViewStats}
      profileHandle={profileHandle}
      isEditMode={isEditMode}
      editingLayout={editingLayout}
      onToggleEditingLayout={onToggleEditingLayout}
    />
  );
}

// Preview container with device frame
function ProfilePreviewContainer({
  previewDevice,
  profile,
  bags,
  isOwnProfile,
  onOpenThemeEditor,
  onUpdateProfile,
  editingLayout,
}: {
  previewDevice: DeviceType;
  profile: Profile;
  bags: Bag[];
  isOwnProfile: boolean;
  onOpenThemeEditor: () => void;
  onUpdateProfile: (updates: { social_links?: Record<string, string> }) => Promise<void>;
  editingLayout: 'desktop' | 'mobile';
}) {
  const { isEditMode } = useEditMode();

  // Show device frame when:
  // - In edit mode with non-desktop preview device, OR
  // - In edit mode on desktop editing mobile layout (show phone frame)
  const showMobileFrame = isEditMode && editingLayout === 'mobile';
  const showDeviceFrame = isEditMode && (previewDevice !== 'desktop' || showMobileFrame);

  // Get appropriate min height for each device type
  const getDeviceMinHeight = () => {
    if (showMobileFrame && previewDevice === 'desktop') {
      return '667px'; // iPhone SE height for mobile preview on desktop
    }
    switch (previewDevice) {
      case 'mobile': return '667px'; // iPhone SE
      case 'tablet': return '1024px'; // iPad portrait
      case 'tablet_landscape': return '768px'; // iPad landscape
      default: return '800px';
    }
  };

  // Get frame width - use mobile width when editing mobile layout on desktop
  const getFrameWidth = () => {
    if (showMobileFrame && previewDevice === 'desktop') {
      return DEVICE_WIDTHS['mobile']; // 375px
    }
    return DEVICE_WIDTHS[previewDevice];
  };

  if (showDeviceFrame) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen py-8">
        <div className="flex justify-center">
          <div
            className="bg-[var(--surface)] rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800"
            style={{
              width: getFrameWidth(),
              minHeight: getDeviceMinHeight(),
            }}
          >
            <ProfileContent
              profile={profile}
              bags={bags}
              isOwnProfile={isOwnProfile}
              onOpenThemeEditor={onOpenThemeEditor}
              onUpdateProfile={onUpdateProfile}
              previewDevice={previewDevice}
              editingLayout={editingLayout}
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
      editingLayout={editingLayout}
    />
  );
}

