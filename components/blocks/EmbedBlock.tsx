'use client';

import { parseEmbedUrl, getPlatformName } from '@/lib/embeds/parseEmbedUrl';
import YouTubeEmbed from '@/components/embeds/YouTubeEmbed';
import SpotifyEmbed from '@/components/embeds/SpotifyEmbed';
import TikTokEmbed from '@/components/embeds/TikTokEmbed';
import TwitterEmbed from '@/components/embeds/TwitterEmbed';
import InstagramEmbed from '@/components/embeds/InstagramEmbed';
import TwitchEmbed from '@/components/embeds/TwitchEmbed';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { EmbedBlockConfig } from '@/lib/blocks/types';

interface EmbedBlockProps {
  config: EmbedBlockConfig;
}

export default function EmbedBlock({ config }: EmbedBlockProps) {
  const { url, title } = config;

  if (!url) {
    return (
      <div className="px-4 py-8">
        <div className="flex items-center justify-center gap-2 p-6 bg-[var(--surface-elevated)] rounded-xl border border-dashed border-[var(--border-subtle)] text-[var(--text-tertiary)]">
          <AlertCircle className="w-5 h-5" />
          <span>No embed URL configured</span>
        </div>
      </div>
    );
  }

  const parsed = parseEmbedUrl(url);

  const renderEmbed = () => {
    switch (parsed.platform) {
      case 'youtube':
        return <YouTubeEmbed videoId={parsed.id} title={title} lite={true} />;

      case 'spotify':
        return (
          <SpotifyEmbed
            id={parsed.id}
            type={parsed.type as 'track' | 'album' | 'playlist' | 'episode' | 'show'}
          />
        );

      case 'tiktok':
        return <TikTokEmbed videoId={parsed.id} originalUrl={parsed.originalUrl} />;

      case 'twitter':
        return <TwitterEmbed tweetId={parsed.id} originalUrl={parsed.originalUrl} />;

      case 'instagram':
        return (
          <InstagramEmbed
            postId={parsed.id}
            originalUrl={parsed.originalUrl}
            type={parsed.type as 'post' | 'reel'}
          />
        );

      case 'twitch':
        return (
          <TwitchEmbed
            id={parsed.id}
            type={parsed.type as 'video' | 'clip' | 'channel'}
          />
        );

      default:
        // Unknown platform - show a link card
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--teed-green-7)] hover:bg-[var(--surface-hover)] transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-[var(--teed-green-2)] flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-6 h-6 text-[var(--teed-green-9)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--teed-green-9)] transition-colors">
                {title || 'External Link'}
              </p>
              <p className="text-sm text-[var(--text-tertiary)] truncate">{url}</p>
            </div>
          </a>
        );
    }
  };

  return (
    <div className="px-4 py-4 h-full flex flex-col justify-center">
      {/* Optional title above embed */}
      {title && parsed.platform !== 'unknown' && (
        <h3 className="text-lg font-semibold text-[var(--theme-text,var(--text-primary))] mb-3">{title}</h3>
      )}

      {/* The embed with frame effect */}
      <div className="embed-frame">
        {renderEmbed()}
      </div>

      {/* Platform badge */}
      {parsed.platform !== 'unknown' && (
        <div className="flex items-center justify-center mt-3">
          <span className="text-xs text-[var(--theme-text-tertiary,var(--text-tertiary))]">
            {getPlatformName(parsed.platform)}
          </span>
        </div>
      )}
    </div>
  );
}
