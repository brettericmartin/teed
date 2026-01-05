'use client';

import { useState } from 'react';
import { XEmbed } from 'react-social-media-embed';
import { ExternalLink, Loader2 } from 'lucide-react';

interface TwitterEmbedProps {
  tweetId: string;
  originalUrl: string;
}

export default function TwitterEmbed({ tweetId, originalUrl }: TwitterEmbedProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <a
        href={originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="
          flex flex-col items-center justify-center gap-3
          w-full py-12 max-w-[550px] mx-auto
          bg-black rounded-xl text-white
          hover:bg-gray-900 transition-colors
        "
      >
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>View on X</span>
          <ExternalLink className="w-4 h-4" />
        </div>
      </a>
    );
  }

  return (
    <div className="twitter-embed-wrapper relative flex justify-center w-full">
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-elevated)] rounded-xl z-10 min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--text-tertiary)]" />
        </div>
      )}

      <XEmbed
        url={originalUrl}
        width="100%"
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
