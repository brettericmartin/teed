'use client';

import { useRef } from 'react';
import { Pencil } from 'lucide-react';
import { HeaderBlockConfig } from '@/lib/blocks/types';

interface Profile {
  display_name: string;
  handle: string;
  avatar_url?: string | null;
}

interface HeaderBlockProps {
  profile: Profile;
  config?: HeaderBlockConfig;
  isOwner?: boolean;
  onAvatarClick?: (rect: DOMRect) => void;
}

// Size-specific styling
const SIZE_CONFIG = {
  minimal: {
    banner: { height: '0', show: false },
    avatar: { size: 'w-14 h-14 sm:w-16 sm:h-16', ring: 'ring-2', initial: 'text-xl' },
    name: 'text-lg sm:text-xl',
    handle: 'text-sm',
    spacing: { container: 'py-4 px-4', nameMargin: 'mt-2' },
  },
  standard: {
    banner: { height: 'h-32 sm:h-40', show: true },
    avatar: { size: 'w-20 h-20 sm:w-24 sm:h-24', ring: 'ring-4', initial: 'text-2xl sm:text-3xl' },
    name: 'text-xl sm:text-2xl',
    handle: 'text-sm sm:text-base',
    spacing: { container: 'px-4', nameMargin: 'mt-3' },
  },
  hero: {
    banner: { height: 'h-44 sm:h-64 md:h-80', show: true },
    avatar: { size: 'w-28 h-28 sm:w-32 sm:h-32', ring: 'ring-4 sm:ring-[6px]', initial: 'text-4xl' },
    name: 'text-2xl sm:text-3xl md:text-4xl',
    handle: 'text-base sm:text-lg',
    spacing: { container: 'px-4 sm:px-6', nameMargin: 'mt-4' },
  },
};

export default function HeaderBlock({ profile, config = {}, isOwner, onAvatarClick }: HeaderBlockProps) {
  const avatarRef = useRef<HTMLDivElement>(null);

  const {
    show_avatar = true,
    show_display_name = true,
    show_handle = true,
    alignment = 'center',
    size = 'standard',
    useSerifFont = false,
  } = config;

  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.standard;

  const handleAvatarClick = () => {
    if (isOwner && onAvatarClick && avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      onAvatarClick(rect);
    }
  };

  const alignmentClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  return (
    <div className="w-full h-full relative flex flex-col">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 header-pattern-dots pointer-events-none" />

      {/* Avatar and Name - flex-1 to fill available height, justify-center to center content */}
      <div className={`
        flex-1 flex flex-col justify-center ${alignmentClasses[alignment]} ${sizeConfig.spacing.container} py-4 relative z-10
      `}>
        {/* Avatar with glow ring */}
        {show_avatar && (
          <div
            ref={avatarRef}
            onClick={handleAvatarClick}
            className={`
              relative
              rounded-full
              ${isOwner ? 'cursor-pointer group' : ''}
            `}
          >
            {/* Animated glow ring behind avatar */}
            <div
              className="absolute inset-[-4px] rounded-full opacity-60 animate-pulse-slow"
              style={{
                background: `linear-gradient(135deg, var(--theme-primary, #7A9770) 0%, var(--theme-accent, #CFE3E8) 50%, var(--theme-primary, #7A9770) 100%)`,
                filter: 'blur(8px)',
              }}
            />
            {/* Secondary glow for depth */}
            <div
              className="absolute inset-[-2px] rounded-full"
              style={{
                background: `linear-gradient(135deg, var(--theme-primary, #7A9770), var(--theme-accent, #CFE3E8))`,
                opacity: 0.3,
              }}
            />
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className={`
                  ${sizeConfig.avatar.size} rounded-full object-cover relative z-10
                  ring-4 ring-[var(--surface)]
                  ${isOwner ? 'group-hover:brightness-90 transition-all' : ''}
                `}
              />
            ) : (
              <div className={`
                ${sizeConfig.avatar.size}
                rounded-full bg-gradient-to-br relative z-10
                ring-4 ring-[var(--surface)]
                from-[var(--theme-primary,var(--teed-green-6))]
                to-[var(--theme-accent,var(--sky-6))]
                flex items-center justify-center
                ${isOwner ? 'group-hover:brightness-90 transition-all' : ''}
              `}>
                <span className={`${sizeConfig.avatar.initial} font-bold text-white`}>
                  {profile.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {/* Edit badge for owners - explicit button for reliable clicks */}
            {isOwner && (
              <button
                onClick={handleAvatarClick}
                className="
                  absolute -bottom-1 -right-1 z-20
                  w-7 h-7 rounded-full
                  bg-[var(--teed-green-9)] text-white
                  flex items-center justify-center
                  shadow-md border-2 border-[var(--theme-background,#F9F5EE)]
                  group-hover:scale-110 transition-transform
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--teed-green-7)]
                "
                aria-label="Edit profile"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Name and Handle */}
        <div className={`${sizeConfig.spacing.nameMargin} ${!show_avatar ? 'pt-2' : ''}`}>
          {show_display_name && (
            <h1 className={`
              ${sizeConfig.name}
              ${useSerifFont ? 'header-display-serif' : 'font-bold'}
              text-[var(--theme-text,var(--text-primary))]
            `}>
              {profile.display_name}
            </h1>
          )}
          {show_handle && (
            <p className={`${sizeConfig.handle} text-[var(--theme-text-secondary,var(--text-secondary))] mt-0.5`}>
              @{profile.handle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
