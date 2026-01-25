'use client';

/**
 * ProfileHub - Avatar-triggered radial menu for profile editing
 *
 * When owners click their profile avatar, a radial menu appears with options:
 * - Edit Profile (enters edit mode)
 * - Add Panel
 * - Add Links
 * - Customize (theme)
 *
 * Only rendered when viewing your own profile.
 */

import ProfileHub from './ProfileHub';
import type { DeviceType } from '@/components/blocks';

interface ProfileHubWrapperProps {
  isOwnProfile: boolean;
  profileId: string;
  profileHandle: string;
  onOpenThemeEditor: () => void;
  onOpenBlockPicker: () => void;
  onOpenLinkAdder: () => void;
  previewDevice: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  // Avatar-triggered menu state
  isMenuOpen: boolean;
  onMenuClose: () => void;
  avatarRect: DOMRect | null;
}

export default function ProfileHubWrapper({
  isOwnProfile,
  profileId,
  profileHandle,
  onOpenThemeEditor,
  onOpenBlockPicker,
  onOpenLinkAdder,
  previewDevice,
  onDeviceChange,
  isMenuOpen,
  onMenuClose,
  avatarRect,
}: ProfileHubWrapperProps) {
  // Completely absent for non-owners
  if (!isOwnProfile) {
    return null;
  }

  return (
    <ProfileHub
      profileId={profileId}
      profileHandle={profileHandle}
      onOpenThemeEditor={onOpenThemeEditor}
      onOpenBlockPicker={onOpenBlockPicker}
      onOpenLinkAdder={onOpenLinkAdder}
      previewDevice={previewDevice}
      onDeviceChange={onDeviceChange}
      isMenuOpen={isMenuOpen}
      onMenuClose={onMenuClose}
      avatarRect={avatarRect}
      isOwnProfile={isOwnProfile}
    />
  );
}
