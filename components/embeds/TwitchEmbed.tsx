'use client';

import { useEffect, useState } from 'react';

interface TwitchEmbedProps {
  id: string;
  type: 'video' | 'clip' | 'channel';
}

export default function TwitchEmbed({ id, type }: TwitchEmbedProps) {
  const [parent, setParent] = useState<string>('');

  useEffect(() => {
    // Twitch requires the parent domain
    setParent(window.location.hostname);
  }, []);

  if (!parent) {
    return (
      <div className="w-full aspect-video bg-[var(--surface-elevated)] rounded-xl flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--border-subtle)] border-t-[var(--teed-green-9)] rounded-full animate-spin" />
      </div>
    );
  }

  const getEmbedUrl = () => {
    const baseParams = `parent=${parent}&autoplay=false`;

    switch (type) {
      case 'video':
        return `https://player.twitch.tv/?video=${id}&${baseParams}`;
      case 'clip':
        return `https://clips.twitch.tv/embed?clip=${id}&${baseParams}`;
      case 'channel':
        return `https://player.twitch.tv/?channel=${id}&${baseParams}`;
      default:
        return '';
    }
  };

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden">
      <iframe
        src={getEmbedUrl()}
        height="100%"
        width="100%"
        allowFullScreen
        title={`Twitch ${type}`}
        className="border-0"
      />
    </div>
  );
}
