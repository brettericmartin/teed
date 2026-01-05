'use client';

import { useMemo } from 'react';
import { ShoppingBag, User, Video, Music, ExternalLink } from 'lucide-react';
import { classifyUrl, type LinkClassification } from '@/lib/links/classifyUrl';

interface LinkInputStepProps {
  inputText: string;
  onInputChange: (text: string) => void;
  parsedUrls: string[];
}

// Platform-specific icons with brand colors
function PlatformIcon({ classification }: { classification: LinkClassification }) {
  if (classification.type === 'embed') {
    switch (classification.platform) {
      case 'youtube':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#FF0000] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
        );
      case 'tiktok':
        return (
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
            </svg>
          </div>
        );
      case 'spotify':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#1DB954] flex items-center justify-center flex-shrink-0">
            <Music className="w-4 h-4 text-white" />
          </div>
        );
      case 'instagram':
        return (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </div>
        );
      case 'twitter':
        return (
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
        );
      case 'twitch':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#9146FF] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-[var(--teed-green-9)] flex items-center justify-center flex-shrink-0">
            <Video className="w-4 h-4 text-white" />
          </div>
        );
    }
  }

  if (classification.type === 'social') {
    // Social profile icons
    switch (classification.platform) {
      case 'instagram':
        return (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
        );
      case 'twitter':
        return (
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
        );
      case 'linkedin':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#0A66C2] flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
        );
      case 'github':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#24292F] flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
        );
      case 'facebook':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
        );
      case 'tiktok':
        return (
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-[var(--sky-9)] flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
        );
    }
  }

  // Product
  return (
    <div className="w-8 h-8 rounded-lg bg-[var(--copper-8)] flex items-center justify-center flex-shrink-0">
      <ShoppingBag className="w-4 h-4 text-white" />
    </div>
  );
}

function getClassificationLabel(classification: LinkClassification): string {
  if (classification.type === 'embed') {
    const labels: Record<string, string> = {
      youtube: 'YouTube Video',
      tiktok: 'TikTok Video',
      spotify: 'Spotify Track',
      instagram: 'Instagram Post',
      twitter: 'X/Twitter Post',
      twitch: 'Twitch Stream',
    };
    return labels[classification.platform] || 'Embed';
  }
  if (classification.type === 'social') {
    return `${classification.displayName} Profile`;
  }
  return 'Product Link';
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'embed':
      return 'text-[var(--teed-green-10)]';
    case 'social':
      return 'text-[var(--sky-10)]';
    case 'product':
      return 'text-[var(--copper-9)]';
    default:
      return 'text-[var(--text-secondary)]';
  }
}

export default function LinkInputStep({
  inputText,
  onInputChange,
  parsedUrls,
}: LinkInputStepProps) {
  // Classify URLs in real-time for instant feedback
  const classifiedUrls = useMemo(() => {
    return parsedUrls.map(url => ({
      url,
      classification: classifyUrl(url)
    }));
  }, [parsedUrls]);

  // Count by type
  const counts = useMemo(() => {
    const result = { embeds: 0, socials: 0, products: 0 };
    classifiedUrls.forEach(({ classification }) => {
      if (classification.type === 'embed') result.embeds++;
      else if (classification.type === 'social') result.socials++;
      else result.products++;
    });
    return result;
  }, [classifiedUrls]);

  return (
    <div className="p-5 space-y-4">
      {/* Input area */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          Paste your links
        </label>
        <textarea
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Paste any link here - we'll automatically detect what it is"
          rows={4}
          className="
            w-full px-4 py-3 rounded-xl
            border border-[var(--border-subtle)]
            bg-[var(--surface)]
            text-[var(--text-primary)]
            placeholder:text-[var(--text-tertiary)]
            focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]
            resize-none text-sm
          "
          autoFocus
        />
      </div>

      {/* Real-time classified URLs with platform icons */}
      {classifiedUrls.length > 0 && (
        <div className="space-y-3">
          {/* Summary pills */}
          <div className="flex flex-wrap gap-2">
            {counts.embeds > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--teed-green-2)] text-[var(--teed-green-10)] text-sm font-medium">
                <Video className="w-3.5 h-3.5" />
                {counts.embeds} embed{counts.embeds !== 1 ? 's' : ''}
              </span>
            )}
            {counts.socials > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--sky-2)] text-[var(--sky-10)] text-sm font-medium">
                <User className="w-3.5 h-3.5" />
                {counts.socials} profile{counts.socials !== 1 ? 's' : ''}
              </span>
            )}
            {counts.products > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--copper-2)] text-[var(--copper-9)] text-sm font-medium">
                <ShoppingBag className="w-3.5 h-3.5" />
                {counts.products} product{counts.products !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Link cards */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {classifiedUrls.map(({ url, classification }, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)]"
              >
                <PlatformIcon classification={classification} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${getTypeColor(classification.type)}`}>
                    {getClassificationLabel(classification)}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                    {url}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {parsedUrls.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF0000] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[var(--copper-8)] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Paste YouTube, TikTok, Instagram, or product links
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            We'll automatically detect and categorize them
          </p>
        </div>
      )}
    </div>
  );
}
