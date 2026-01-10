'use client';

import { useState } from 'react';
import { Copy, Check, Youtube, Mail, FileText, Rss, Zap } from 'lucide-react';

type ExportFormat = 'youtube' | 'newsletter' | 'markdown' | 'text';

interface PlatformExportsProps {
  bagCode: string;
  bagTitle: string;
  ownerHandle: string;
}

const formats: { id: ExportFormat; label: string; icon: React.ElementType; description: string }[] = [
  {
    id: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    description: 'Description with gear links',
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    icon: Mail,
    description: 'HTML email template',
  },
  {
    id: 'markdown',
    label: 'Markdown',
    icon: FileText,
    description: 'For blogs & docs',
  },
];

export default function PlatformExports({
  bagCode,
  bagTitle,
  ownerHandle,
}: PlatformExportsProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('youtube');
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = 'https://teed.club';
  const bagUrl = `${baseUrl}/u/${ownerHandle}/${bagCode}`;
  const rssUrl = `${bagUrl}/feed.xml`;

  const fetchExport = async (format: ExportFormat) => {
    setIsLoading(true);
    setError(null);
    setSelectedFormat(format);

    try {
      const response = await fetch(`/api/export/${bagCode}?format=${format}`);
      if (!response.ok) throw new Error('Failed to generate export');
      const text = await response.text();
      setContent(text);
    } catch (err) {
      setError('Failed to generate export. Please try again.');
      setContent('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Value intro */}
      <div className="flex gap-3 p-3 bg-[var(--sky-2)] border border-[var(--sky-6)] rounded-lg">
        <div className="flex-shrink-0 w-8 h-8 bg-[var(--sky-4)] rounded-full flex items-center justify-center">
          <Zap className="w-4 h-4 text-[var(--sky-11)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Ready-to-use formats
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Export your collection for YouTube descriptions, newsletters, or blog posts. Links stay up to date.
          </p>
        </div>
      </div>

      {/* Format buttons */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Choose a format
        </label>
        <div className="grid grid-cols-3 gap-2">
          {formats.map((format) => (
            <button
              key={format.id}
              onClick={() => fetchExport(format.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                selectedFormat === format.id
                  ? 'bg-[var(--teed-green-3)] border-[var(--teed-green-6)] text-[var(--teed-green-11)]'
                  : 'bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]'
              }`}
            >
              <format.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{format.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
          {formats.find((f) => f.id === selectedFormat)?.description}
        </p>
      </div>

      {/* Generated content */}
      {content && !isLoading && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Generated Content
            </label>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                copied
                  ? 'bg-[var(--teed-green-3)] text-[var(--teed-green-11)]'
                  : 'bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="relative">
            <pre className="p-3 bg-[var(--grey-2)] border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-secondary)] overflow-auto max-h-[200px] whitespace-pre-wrap font-mono">
              {selectedFormat === 'newsletter' ? (
                <span className="text-[var(--text-tertiary)]">[HTML - Copy to use in email]</span>
              ) : (
                content
              )}
            </pre>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-[var(--teed-green-6)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Initial state */}
      {!content && !isLoading && !error && (
        <div className="text-center py-6 text-[var(--text-tertiary)] text-sm">
          Select a format to generate export
        </div>
      )}

      {/* RSS feed link */}
      <div className="pt-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-sm">
          <Rss className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-secondary)]">RSS Feed:</span>
          <a
            href={rssUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--teed-green-9)] hover:underline truncate"
          >
            {rssUrl}
          </a>
        </div>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          Subscribe to get updates when this collection changes
        </p>
      </div>
    </div>
  );
}
