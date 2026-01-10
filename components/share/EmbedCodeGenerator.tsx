'use client';

import { useState } from 'react';
import { Copy, Check, Code, ExternalLink } from 'lucide-react';

type EmbedStyle = 'compact' | 'grid' | 'minimal';

interface EmbedCodeGeneratorProps {
  type: 'bag' | 'profile';
  handle: string;
  code?: string; // Only needed for bags
  title: string;
}

export default function EmbedCodeGenerator({
  type,
  handle,
  code,
  title,
}: EmbedCodeGeneratorProps) {
  const [style, setStyle] = useState<EmbedStyle>('compact');
  const [copied, setCopied] = useState(false);

  const baseUrl = 'https://teed.club';
  const embedPath = type === 'bag' ? `/embed/bag/${handle}/${code}` : `/embed/profile/${handle}`;
  const embedUrl = `${baseUrl}${embedPath}`;
  const fullUrl = type === 'bag' ? `${baseUrl}/u/${handle}/${code}` : `${baseUrl}/u/${handle}`;

  // Dimensions based on style
  const dimensions = {
    compact: { width: 400, height: 320 },
    grid: { width: 600, height: 450 },
    minimal: { width: 320, height: 240 },
  };

  const { width, height } = dimensions[style];

  const embedCode = `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" scrolling="no" style="border-radius: 12px; border: 1px solid #e5e7eb;" title="${title}"></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Value intro */}
      <div className="flex gap-3 p-3 bg-[var(--teed-green-1)] border border-[var(--teed-green-4)] rounded-lg">
        <div className="flex-shrink-0 w-8 h-8 bg-[var(--teed-green-3)] rounded-full flex items-center justify-center">
          <Code className="w-4 h-4 text-[var(--teed-green-11)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Display your collection anywhere
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Add this to your blog, newsletter, or Notion page. Updates automatically when you edit your collection.
          </p>
        </div>
      </div>

      {/* Style selector */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Choose a style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['compact', 'grid', 'minimal'] as EmbedStyle[]).map((s) => (
            <button
              key={s}
              onClick={() => setStyle(s)}
              className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                style === s
                  ? 'bg-[var(--teed-green-3)] border-[var(--teed-green-6)] text-[var(--teed-green-11)]'
                  : 'bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
          {style === 'compact' && 'Perfect for YouTube descriptions and blog sidebars'}
          {style === 'grid' && 'Best for blog posts and newsletters'}
          {style === 'minimal' && 'Great for bios and footers'}
        </p>
      </div>

      {/* Preview */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Preview
        </label>
        <div
          className="bg-[var(--grey-2)] rounded-lg p-4 overflow-auto"
          style={{ maxHeight: '280px' }}
        >
          <div
            className="mx-auto bg-white rounded-xl border border-[var(--border-subtle)] overflow-hidden"
            style={{ width: Math.min(width, 320), height: Math.min(height, 240) }}
          >
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              title={`${title} preview`}
              style={{ transform: `scale(${Math.min(320 / width, 240 / height)})`, transformOrigin: 'top left' }}
            />
          </div>
        </div>
      </div>

      {/* Embed code */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          <Code className="w-4 h-4 inline-block mr-1" />
          Embed Code
        </label>
        <div className="relative">
          <pre className="px-3 py-2.5 bg-[var(--grey-2)] border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap break-all font-mono">
            {embedCode}
          </pre>
          <button
            onClick={handleCopy}
            className={`absolute top-2 right-2 p-2 rounded-md transition-all ${
              copied
                ? 'bg-[var(--teed-green-3)] text-[var(--teed-green-11)]'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
            title={copied ? 'Copied!' : 'Copy code'}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        {copied && (
          <p className="mt-1.5 text-sm text-[var(--teed-green-11)] font-medium">
            Copied!
          </p>
        )}
      </div>

      {/* oEmbed info */}
      <div className="pt-2 border-t border-[var(--border-subtle)]">
        <p className="text-xs text-[var(--text-tertiary)]">
          <span className="font-medium">Tip:</span> Paste the link directly in WordPress, Medium, or Notion for automatic embedding.
        </p>
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-1 text-xs text-[var(--teed-green-9)] hover:underline"
        >
          {fullUrl}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
