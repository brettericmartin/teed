'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { ExternalLink, Play } from 'lucide-react';

interface EmbedContainerProps {
  /** Placeholder content to show before the embed loads */
  placeholder?: ReactNode;
  /** Thumbnail URL for facade pattern (click to load real embed) */
  thumbnailUrl?: string;
  /** Title for the embed */
  title?: string;
  /** Original URL for fallback link */
  originalUrl?: string;
  /** Platform name for display */
  platform?: string;
  /** Use facade pattern (show thumbnail, load embed on click) */
  useFacade?: boolean;
  /** Children to render (the actual embed) */
  children: ReactNode;
  /** Aspect ratio class (default: aspect-video) */
  aspectRatio?: string;
}

export default function EmbedContainer({
  placeholder,
  thumbnailUrl,
  title,
  originalUrl,
  platform,
  useFacade = false,
  children,
  aspectRatio = 'aspect-video',
}: EmbedContainerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(!useFacade);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy load using Intersection Observer
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Load when 100px from viewport
        threshold: 0,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const handleLoadEmbed = () => {
    setIsLoaded(true);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${aspectRatio} bg-[var(--surface-elevated)] rounded-xl overflow-hidden`}
    >
      {!isVisible ? (
        // Placeholder while not in viewport
        placeholder || (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--border-subtle)] border-t-[var(--teed-green-9)] rounded-full animate-spin" />
          </div>
        )
      ) : !isLoaded && useFacade && thumbnailUrl ? (
        // Facade pattern: show thumbnail with play button
        <button
          onClick={handleLoadEmbed}
          className="absolute inset-0 group cursor-pointer"
          aria-label={`Play ${title || platform} embed`}
        >
          <img
            src={thumbnailUrl}
            alt={title || ''}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
            </div>
          </div>
          {title && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-white text-sm font-medium line-clamp-2">{title}</p>
            </div>
          )}
        </button>
      ) : (
        // Actual embed
        <>
          {children}
          {/* Fallback link */}
          {originalUrl && (
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
              aria-label={`Open in ${platform || 'new tab'}`}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </>
      )}
    </div>
  );
}
