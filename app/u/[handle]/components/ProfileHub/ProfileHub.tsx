'use client';

import { useCallback } from 'react';
import { Plus, Link2, Palette, Check, Loader2, Pencil } from 'lucide-react';
import { useEditMode } from '../EditModeProvider';
import RadialMenu, { type RadialMenuItem } from './RadialMenu';
import type { DeviceType } from '@/components/blocks';

interface ProfileHubProps {
  profileId: string;
  onOpenThemeEditor: () => void;
  onOpenBlockPicker: () => void;
  onOpenLinkAdder: () => void;
  previewDevice: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  // Avatar-triggered menu
  isMenuOpen: boolean;
  onMenuClose: () => void;
  avatarRect: DOMRect | null;
}

export default function ProfileHub({
  profileId,
  onOpenThemeEditor,
  onOpenBlockPicker,
  onOpenLinkAdder,
  previewDevice,
  onDeviceChange,
  isMenuOpen,
  onMenuClose,
  avatarRect,
}: ProfileHubProps) {
  const {
    isEditMode,
    toggleEditMode,
    isDirty,
    isSaving,
    saveBlocks,
  } = useEditMode();

  // Handle entering edit mode
  const handleEnterEditMode = useCallback(() => {
    toggleEditMode();
    onMenuClose();
  }, [toggleEditMode, onMenuClose]);

  // Handle exiting edit mode (Done button)
  const handleExitEditMode = useCallback(async () => {
    if (isDirty) {
      try {
        await saveBlocks();
      } catch (error) {
        // Error is logged in provider
      }
    }
    toggleEditMode();
    onMenuClose();
  }, [isDirty, saveBlocks, toggleEditMode, onMenuClose]);

  // Define menu items - different based on edit mode
  const menuItems: RadialMenuItem[] = isEditMode
    ? [
        {
          key: 'add-block',
          icon: <Plus className="w-4 h-4" />,
          label: 'Add Block',
          onClick: onOpenBlockPicker,
        },
        {
          key: 'add-links',
          icon: <Link2 className="w-4 h-4" />,
          label: 'Add Links',
          onClick: onOpenLinkAdder,
        },
        {
          key: 'customize',
          icon: <Palette className="w-4 h-4" />,
          label: 'Customize',
          onClick: onOpenThemeEditor,
        },
        {
          key: 'done',
          icon: isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />,
          label: isSaving ? 'Saving...' : 'Done',
          onClick: handleExitEditMode,
          disabled: isSaving,
        },
      ]
    : [
        {
          key: 'edit',
          icon: <Pencil className="w-4 h-4" />,
          label: 'Edit Profile',
          onClick: handleEnterEditMode,
        },
        {
          key: 'add-links',
          icon: <Link2 className="w-4 h-4" />,
          label: 'Add Links',
          onClick: () => {
            handleEnterEditMode();
            setTimeout(onOpenLinkAdder, 100);
          },
        },
        {
          key: 'customize',
          icon: <Palette className="w-4 h-4" />,
          label: 'Customize',
          onClick: onOpenThemeEditor,
        },
        {
          key: 'add-block',
          icon: <Plus className="w-4 h-4" />,
          label: 'Add Block',
          onClick: () => {
            handleEnterEditMode();
            setTimeout(onOpenBlockPicker, 100);
          },
        },
      ];

  return (
    <RadialMenu
      isOpen={isMenuOpen}
      onClose={onMenuClose}
      items={menuItems}
      anchorRect={avatarRect}
    />
  );
}
