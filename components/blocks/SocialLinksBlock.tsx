'use client';

import {
  Instagram, Twitter, Youtube, Globe, Video, Twitch,
  Linkedin, Facebook, Music, MessageCircle, Github,
  Mail, AtSign, Palette, Disc3
} from 'lucide-react';
import { SocialLinksBlockConfig } from '@/lib/blocks/types';

// Social links can have any string key
type SocialLinks = Record<string, string | undefined>;

interface SocialLinksBlockProps {
  socialLinks: SocialLinks;
  config?: SocialLinksBlockConfig;
}

const platformIcons: Record<string, any> = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Video,
  website: Globe,
  twitch: Twitch,
  linkedin: Linkedin,
  facebook: Facebook,
  threads: AtSign,
  pinterest: Palette,
  discord: MessageCircle,
  spotify: Music,
  soundcloud: Disc3,
  github: Github,
  patreon: AtSign,
  substack: Mail,
  email: Mail,
  telegram: MessageCircle,
  whatsapp: MessageCircle,
  snapchat: AtSign,
  behance: Palette,
  dribbble: Palette,
};

const platformColors: Record<string, string> = {
  instagram: 'hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#E1306C] hover:to-[#FCAF45] hover:text-white',
  twitter: 'hover:bg-[#1DA1F2] hover:text-white',
  youtube: 'hover:bg-[#FF0000] hover:text-white',
  tiktok: 'hover:bg-[#000000] hover:text-white',
  website: 'hover:bg-[var(--theme-primary,var(--teed-green-9))] hover:text-white',
  twitch: 'hover:bg-[#9146FF] hover:text-white',
  linkedin: 'hover:bg-[#0A66C2] hover:text-white',
  facebook: 'hover:bg-[#1877F2] hover:text-white',
  threads: 'hover:bg-[#000000] hover:text-white',
  pinterest: 'hover:bg-[#BD081C] hover:text-white',
  discord: 'hover:bg-[#5865F2] hover:text-white',
  spotify: 'hover:bg-[#1DB954] hover:text-white',
  soundcloud: 'hover:bg-[#FF5500] hover:text-white',
  github: 'hover:bg-[#181717] hover:text-white',
  patreon: 'hover:bg-[#FF424D] hover:text-white',
  substack: 'hover:bg-[#FF6719] hover:text-white',
  email: 'hover:bg-[#EA4335] hover:text-white',
  telegram: 'hover:bg-[#0088CC] hover:text-white',
  whatsapp: 'hover:bg-[#25D366] hover:text-white',
  snapchat: 'hover:bg-[#FFFC00] hover:text-black',
  behance: 'hover:bg-[#1769FF] hover:text-white',
  dribbble: 'hover:bg-[#EA4C89] hover:text-white',
};

// Friendly display names
const platformNames: Record<string, string> = {
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  soundcloud: 'SoundCloud',
  whatsapp: 'WhatsApp',
};

function getSocialUrl(platform: string, value: string): string {
  // If it's already a full URL, return as-is
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  // Special handling for email
  if (platform === 'email') {
    return value.includes('@') ? `mailto:${value}` : value;
  }

  const urlMap: Record<string, string> = {
    instagram: `https://instagram.com/${value.replace('@', '')}`,
    twitter: `https://twitter.com/${value.replace('@', '')}`,
    youtube: value.startsWith('@') ? `https://youtube.com/${value}` : `https://youtube.com/@${value}`,
    tiktok: `https://tiktok.com/@${value.replace('@', '')}`,
    twitch: `https://twitch.tv/${value}`,
    linkedin: `https://linkedin.com/in/${value}`,
    facebook: `https://facebook.com/${value}`,
    threads: `https://threads.net/@${value.replace('@', '')}`,
    pinterest: `https://pinterest.com/${value}`,
    discord: value, // Discord invites are typically full URLs
    spotify: value, // Spotify links are typically full URLs
    soundcloud: `https://soundcloud.com/${value}`,
    github: `https://github.com/${value}`,
    patreon: `https://patreon.com/${value}`,
    substack: value.includes('.') ? `https://${value}` : `https://${value}.substack.com`,
    telegram: `https://t.me/${value}`,
    whatsapp: `https://wa.me/${value.replace(/\D/g, '')}`,
    snapchat: `https://snapchat.com/add/${value}`,
    behance: `https://behance.net/${value}`,
    dribbble: `https://dribbble.com/${value}`,
    website: value.startsWith('http') ? value : `https://${value}`,
  };
  return urlMap[platform] || value;
}

// Button size configurations
const BUTTON_SIZES = {
  sm: { outer: 'w-9 h-9', inner: 'w-4 h-4', gap: 'gap-2' },
  md: { outer: 'w-11 h-11', inner: 'w-5 h-5', gap: 'gap-3' },
  lg: { outer: 'w-14 h-14', inner: 'w-7 h-7', gap: 'gap-3' },
  xl: { outer: 'w-16 h-16', inner: 'w-8 h-8', gap: 'gap-4' },
};

export default function SocialLinksBlock({ socialLinks, config = {} }: SocialLinksBlockProps) {
  const { style = 'icons', platforms, showLabel = false, useCard = false, title = 'Connect', buttonSize = 'md' } = config;

  // Filter platforms if specified
  const filteredLinks = Object.entries(socialLinks).filter(([platform, value]) => {
    if (!value) return false;
    if (platforms && platforms.length > 0 && !platforms.includes(platform)) {
      return false;
    }
    return true;
  });

  if (filteredLinks.length === 0) {
    return null;
  }

  // Wrapper component for optional card styling - fills height and centers content
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (useCard) {
      return (
        <div className="px-4 py-4 h-full flex flex-col justify-center">
          <div className="social-links-card bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-5 shadow-sm">
            {showLabel && title && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--border-subtle)]" />
                <span className="text-xs font-medium text-[var(--theme-text-tertiary,var(--text-tertiary))]">
                  {title}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--border-subtle)]" />
              </div>
            )}
            {children}
          </div>
        </div>
      );
    }
    return (
      <div className="px-4 py-4 h-full flex flex-col justify-center">
        {showLabel && title && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-transparent to-[var(--border-subtle)]" />
            <span className="text-xs font-medium text-[var(--theme-text-tertiary,var(--text-tertiary))]">
              {title}
            </span>
            <div className="h-px flex-1 max-w-[60px] bg-gradient-to-l from-transparent to-[var(--border-subtle)]" />
          </div>
        )}
        {children}
      </div>
    );
  };

  if (style === 'icons') {
    // Get size configuration - use larger size for single link unless custom size specified
    const isSingleLink = filteredLinks.length === 1;
    const effectiveSize = buttonSize || (isSingleLink ? 'lg' : 'md');
    const sizeConfig = BUTTON_SIZES[effectiveSize] || BUTTON_SIZES.md;

    return (
      <Wrapper>
        <div className={`flex flex-wrap justify-center ${sizeConfig.gap}`}>
          {filteredLinks.map(([platform, value]) => {
            const Icon = platformIcons[platform] || Globe;
            const url = getSocialUrl(platform, value!);
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  ${sizeConfig.outer} rounded-full flex items-center justify-center
                  bg-[var(--surface-hover,#f5f5f5)] text-[var(--theme-text-secondary,var(--text-secondary))]
                  social-icon-glow border border-transparent
                  hover:border-[var(--border-subtle)]
                  ${platformColors[platform] || 'hover:bg-[var(--theme-primary)] hover:text-white'}
                `}
                title={platformNames[platform] || platform.charAt(0).toUpperCase() + platform.slice(1)}
              >
                <Icon className={sizeConfig.inner} />
              </a>
            );
          })}
        </div>
        {/* Show platform name label for single link */}
        {isSingleLink && (
          <p className="text-center text-sm text-[var(--theme-text-tertiary,var(--text-tertiary))] mt-2">
            {platformNames[filteredLinks[0][0]] || filteredLinks[0][0].charAt(0).toUpperCase() + filteredLinks[0][0].slice(1)}
          </p>
        )}
      </Wrapper>
    );
  }

  if (style === 'list') {
    // List style: icon button + clickable link text
    const listSizeConfig = BUTTON_SIZES[buttonSize] || BUTTON_SIZES.md;

    return (
      <Wrapper>
        <div className="flex flex-col gap-3">
          {filteredLinks.map(([platform, value]) => {
            const Icon = platformIcons[platform] || Globe;
            const url = getSocialUrl(platform, value!);
            const displayName = platformNames[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
            // Get a clean display URL (remove https://, www., trailing slashes)
            const displayUrl = url
              .replace(/^https?:\/\//, '')
              .replace(/^www\./, '')
              .replace(/\/$/, '');

            return (
              <div
                key={platform}
                className="flex items-center gap-3 group/link"
              >
                {/* Icon button */}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    ${listSizeConfig.outer} rounded-xl flex items-center justify-center flex-shrink-0
                    bg-[var(--surface-hover,#f5f5f5)] text-[var(--theme-text-secondary,var(--text-secondary))]
                    social-icon-glow border border-transparent
                    hover:border-[var(--border-subtle)]
                    ${platformColors[platform] || 'hover:bg-[var(--theme-primary)] hover:text-white'}
                  `}
                  title={displayName}
                >
                  <Icon className={listSizeConfig.inner} />
                </a>
                {/* Link text */}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 group-hover/link:text-[var(--theme-primary,var(--teed-green-9))] transition-colors"
                >
                  <span className="text-sm font-medium text-[var(--theme-text,var(--text-primary))] block truncate">
                    {displayName}
                  </span>
                  <span className="text-xs text-[var(--theme-text-tertiary,var(--text-tertiary))] block truncate">
                    {displayUrl}
                  </span>
                </a>
              </div>
            );
          })}
        </div>
      </Wrapper>
    );
  }

  // Pills style (default fallback)
  // Size config for pills - affects padding and icon size
  const pillSizes = {
    sm: { padding: 'px-2.5 py-1', icon: 'w-3 h-3', text: 'text-xs', gap: 'gap-1' },
    md: { padding: 'px-3 py-1.5', icon: 'w-3.5 h-3.5', text: 'text-sm', gap: 'gap-1.5' },
    lg: { padding: 'px-4 py-2', icon: 'w-4 h-4', text: 'text-base', gap: 'gap-2' },
    xl: { padding: 'px-5 py-2.5', icon: 'w-5 h-5', text: 'text-lg', gap: 'gap-2' },
  };
  const pillSizeConfig = pillSizes[buttonSize] || pillSizes.md;

  return (
    <div className="px-4 py-4 h-full flex flex-col justify-center">
      <div className="flex flex-wrap justify-center gap-2">
        {filteredLinks.map(([platform, value]) => {
          const Icon = platformIcons[platform] || Globe;
          const url = getSocialUrl(platform, value!);
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                flex items-center ${pillSizeConfig.gap} ${pillSizeConfig.padding} rounded-full
                bg-[var(--surface-hover,#f5f5f5)] text-[var(--theme-text-secondary,var(--text-secondary))]
                ${pillSizeConfig.text} transition-all duration-200
                ${platformColors[platform] || 'hover:bg-[var(--theme-primary)] hover:text-white'}
              `}
            >
              <Icon className={pillSizeConfig.icon} />
              <span>{platformNames[platform] || platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
