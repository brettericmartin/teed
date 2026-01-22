'use client';

import { useState } from 'react';
import {
  Plus,
  X,
  User,
  FileText,
  Link,
  Video,
  Package,
  Type,
  Minus,
  MoreHorizontal,
  Youtube,
  Music,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { useEditMode } from './EditModeProvider';
import { BlockType, BlockConfig, DEFAULT_BLOCK_GRID } from '@/lib/blocks/types';
import { parseEmbedUrlDetailed } from '@/lib/links/classifyUrl';

interface BlockOption {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultConfig: BlockConfig;
}

const BLOCK_OPTIONS: BlockOption[] = [
  {
    type: 'header',
    label: 'Header',
    description: 'Avatar, name, and banner',
    icon: <User className="w-5 h-5" />,
    defaultConfig: {
      show_avatar: true,
      show_banner: true,
      show_display_name: true,
      show_handle: true,
      alignment: 'center',
    },
  },
  {
    type: 'bio',
    label: 'Bio',
    description: 'Your bio text',
    icon: <FileText className="w-5 h-5" />,
    defaultConfig: {
      show_full: false,
    },
  },
  {
    type: 'social_links',
    label: 'Social Links',
    description: 'Links to your social platforms',
    icon: <Link className="w-5 h-5" />,
    defaultConfig: {
      style: 'icons',
    },
  },
  {
    type: 'embed',
    label: 'Embed',
    description: 'YouTube, Spotify, TikTok, etc.',
    icon: <Video className="w-5 h-5" />,
    defaultConfig: {
      platform: 'youtube',
      url: '',
      title: '',
    },
  },
  {
    type: 'featured_bags',
    label: 'Featured Bags',
    description: 'Showcase your bags',
    icon: <Package className="w-5 h-5" />,
    defaultConfig: {
      bag_ids: [],
      style: 'grid',
      max_display: 6,
    },
  },
  {
    type: 'custom_text',
    label: 'Custom Text',
    description: 'Heading or paragraph',
    icon: <Type className="w-5 h-5" />,
    defaultConfig: {
      variant: 'heading',
      text: 'Your text here',
      alignment: 'center',
      size: 'md',
    },
  },
  // Destinations block hidden until fully implemented
  // {
  //   type: 'destinations',
  //   label: 'Destinations',
  //   description: 'Explained outbound links',
  //   icon: <MoreHorizontal className="w-5 h-5" />,
  //   defaultConfig: {
  //     destinations: [],
  //     style: 'list',
  //   },
  // },
  {
    type: 'spacer',
    label: 'Spacer',
    description: 'Add vertical space',
    icon: <Minus className="w-5 h-5 rotate-90" />,
    defaultConfig: {
      size: 'md',
    },
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Horizontal line separator',
    icon: <Minus className="w-5 h-5" />,
    defaultConfig: {
      style: 'solid',
      width: 'half',
    },
  },
  {
    type: 'story',
    label: 'The Story',
    description: 'Timeline of your journey',
    icon: <BookOpen className="w-5 h-5" />,
    defaultConfig: {
      title: 'The Story',
      showTitle: true,
      maxItems: 5,
      showFiltersBar: true,
      groupByTimePeriod: true,
      showProfileChanges: true,
      showBagChanges: true,
    },
  },
];

interface BlockPickerProps {
  profileId: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function BlockPicker({ profileId, isOpen: externalIsOpen, onClose: externalOnClose }: BlockPickerProps) {
  // Determine if externally controlled (by ProfileHub)
  const isExternallyControlled = externalOnClose !== undefined;

  // Internal state for legacy standalone usage
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [showEmbedInput, setShowEmbedInput] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [embedTitle, setEmbedTitle] = useState('');
  const [embedError, setEmbedError] = useState<string | null>(null);
  const { isEditMode, addBlock } = useEditMode();

  // When externally controlled, only render when explicitly opened
  // This prevents any FABs or UI from leaking
  if (isExternallyControlled && !externalIsOpen) {
    return null;
  }

  const isOpen = isExternallyControlled ? externalIsOpen : internalIsOpen;
  const setIsOpen = (value: boolean) => {
    if (isExternallyControlled) {
      if (!value) externalOnClose();
    } else {
      setInternalIsOpen(value);
    }
  };

  // For standalone mode, only render in edit mode
  if (!isExternallyControlled && !isEditMode) {
    return null;
  }

  const handleAddBlock = (option: BlockOption) => {
    // Always close the picker first
    setIsOpen(false);

    if (option.type === 'embed') {
      // Show embed input dialog after picker closes
      setShowEmbedInput(true);
      return;
    }

    const gridDefaults = DEFAULT_BLOCK_GRID[option.type];
    addBlock({
      profile_id: profileId,
      block_type: option.type,
      sort_order: 0, // Will be set by addBlock
      is_visible: true,
      width: 'full',
      gridX: 0,
      gridY: 0, // Will be positioned at top, then auto-compacted
      gridW: gridDefaults.w,
      gridH: gridDefaults.h,
      config: option.defaultConfig,
    });
  };

  const handleAddEmbed = () => {
    if (!embedUrl.trim()) {
      setEmbedError('Please enter a URL');
      return;
    }

    const parsed = parseEmbedUrlDetailed(embedUrl);

    if (!parsed) {
      setEmbedError('URL not recognized. Supported: YouTube, Spotify, TikTok, Twitter/X, Instagram, Twitch, Vimeo, and more');
      return;
    }

    const embedGridDefaults = DEFAULT_BLOCK_GRID.embed;
    addBlock({
      profile_id: profileId,
      block_type: 'embed',
      sort_order: 0,
      is_visible: true,
      width: 'full',
      gridX: 0,
      gridY: 0,
      gridW: embedGridDefaults.w,
      gridH: embedGridDefaults.h,
      config: {
        platform: parsed.platform,
        url: embedUrl,
        title: embedTitle.trim() || undefined,
      },
    });

    // Reset and close
    setEmbedUrl('');
    setEmbedTitle('');
    setEmbedError(null);
    setShowEmbedInput(false);
    setIsOpen(false);
  };

  const handleCloseEmbedInput = () => {
    setShowEmbedInput(false);
    setEmbedUrl('');
    setEmbedTitle('');
    setEmbedError(null);
  };

  // Preview the parsed URL
  const urlPreview = embedUrl.trim() ? parseEmbedUrlDetailed(embedUrl) : null;

  return (
    <>
      {/* Add Block Button - Only shown in standalone mode (not externally controlled) */}
      {!isExternallyControlled && (
        <button
          onClick={() => setIsOpen(true)}
          className="
            fixed bottom-24 left-1/2 -translate-x-1/2 z-[100]
            flex items-center gap-2 px-6 py-3.5 rounded-full
            bg-[var(--teed-green-9)] text-white
            shadow-2xl hover:shadow-[0_8px_30px_rgb(122,151,112,0.4)]
            hover:scale-105 active:scale-95
            transition-all duration-200
          "
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
          <span className="font-semibold text-base">Add Block</span>
        </button>
      )}

      {/* Embed URL Input Dialog */}
      {showEmbedInput && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleCloseEmbedInput}
          />
          <div className="
            fixed z-50
            inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
            bg-[var(--surface)] rounded-2xl
            max-w-md w-full mx-auto
            overflow-hidden shadow-2xl
          ">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Add Embed
              </h2>
              <button
                onClick={handleCloseEmbedInput}
                className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Paste URL
                </label>
                <input
                  type="url"
                  value={embedUrl}
                  onChange={(e) => {
                    setEmbedUrl(e.target.value);
                    setEmbedError(null);
                  }}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]"
                  autoFocus
                />
                {embedError && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-[var(--copper-9)]">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{embedError}</span>
                  </div>
                )}
                {urlPreview && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-[var(--teed-green-9)]">
                    <span>Detected: {urlPreview.platformName}</span>
                  </div>
                )}
              </div>

              {/* Title Input (optional) */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Title <span className="text-[var(--text-tertiary)]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={embedTitle}
                  onChange={(e) => setEmbedTitle(e.target.value)}
                  placeholder="e.g., My favorite song"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]"
                />
              </div>

              {/* Supported Platforms */}
              <div className="text-xs text-[var(--text-tertiary)]">
                Supports: YouTube, Spotify, TikTok, Twitter/X, Instagram, Twitch
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddEmbed}
                disabled={!embedUrl.trim()}
                className="w-full py-3 px-4 bg-[var(--teed-green-9)] text-white rounded-lg font-medium hover:bg-[var(--teed-green-10)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Embed
              </button>
            </div>
          </div>
        </>
      )}

      {/* Block Picker Modal/Sheet */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Sheet - slides up from bottom on mobile, centered on desktop */}
          <div className="
            fixed z-50
            inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
            bg-[var(--surface)] rounded-t-2xl sm:rounded-2xl
            max-h-[85vh] sm:max-h-[70vh] sm:max-w-md w-full
            overflow-hidden shadow-2xl
            animate-in slide-in-from-bottom duration-300 sm:fade-in sm:zoom-in-95
          ">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Add Block
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drag Handle (mobile) */}
            <div className="flex justify-center py-2 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-[var(--border-subtle)]" />
            </div>

            {/* Block Options */}
            <div className="px-4 pb-6 pt-2 overflow-y-auto max-h-[calc(85vh-60px)] sm:max-h-[calc(70vh-60px)]">
              <div className="grid grid-cols-2 gap-3">
                {BLOCK_OPTIONS.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => handleAddBlock(option)}
                    className="
                      flex flex-col items-center gap-2 p-4
                      bg-[var(--surface-elevated)] rounded-xl
                      border border-[var(--border-subtle)]
                      hover:border-[var(--teed-green-7)] hover:bg-[var(--teed-green-2)]
                      transition-all group text-left
                    "
                  >
                    <div className="
                      w-10 h-10 rounded-lg flex items-center justify-center
                      bg-[var(--teed-green-3)] text-[var(--teed-green-9)]
                      group-hover:bg-[var(--teed-green-4)]
                      transition-colors
                    ">
                      {option.icon}
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-sm text-[var(--text-primary)]">
                        {option.label}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {option.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
