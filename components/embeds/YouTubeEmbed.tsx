'use client';

import { useState } from 'react';
import EmbedContainer from './EmbedContainer';
import { Play } from 'lucide-react';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  /** Use lite mode (thumbnail + click to load) for better performance */
  lite?: boolean;
}

export default function YouTubeEmbed({
  videoId,
  title,
  lite = true,
}: YouTubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(!lite);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;

  if (!isLoaded && lite) {
    return (
      <button
        onClick={() => setIsLoaded(true)}
        className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group cursor-pointer"
        aria-label={`Play ${title || 'YouTube video'}`}
      >
        <img
          src={thumbnailUrl}
          alt={title || 'YouTube video thumbnail'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          {/* YouTube-style play button */}
          <div className="w-[68px] h-[48px] bg-[#FF0000] rounded-xl flex items-center justify-center group-hover:bg-[#CC0000] transition-colors shadow-lg">
            <svg
              className="w-6 h-6 text-white ml-0.5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {title && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-sm font-medium line-clamp-2">{title}</p>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
      <iframe
        src={embedUrl}
        title={title || 'YouTube video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        loading="lazy"
      />
    </div>
  );
}
