'use client';

import { useState } from 'react';

interface ItemImageProps {
  src: string;
  alt: string;
  /** Used for the fallback initial when the image fails to load (brand first, then name). */
  fallbackLabel?: string | null;
  className?: string;
  loading?: 'lazy' | 'eager';
}

const TINTS = [
  'bg-[var(--teed-green-3)] text-[var(--teed-green-11)]',
  'bg-[var(--sand-3)] text-[var(--sand-11)]',
  'bg-[var(--sky-3)] text-[var(--sky-11)]',
];

function tintFor(label: string) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
}

/**
 * <img> with a graceful fallback: when the file is missing (broken storage
 * path, deleted upload) render a tinted tile with the brand/name initial
 * instead of the browser's broken-image icon and raw alt text.
 */
export function ItemImage({ src, alt, fallbackLabel, className, loading = 'lazy' }: ItemImageProps) {
  const [failed, setFailed] = useState(false);
  const label = (fallbackLabel || alt || '').trim();

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`w-full h-full flex items-center justify-center ${tintFor(label)}`}
      >
        <span className="text-2xl font-semibold select-none">{label.charAt(0).toUpperCase() || '?'}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
}
