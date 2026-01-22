'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Share2,
  Check,
  Loader2,
  Instagram,
  Twitter,
  Youtube,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// TikTok icon (not in lucide)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>
);

// Twitch icon (not in lucide)
const TwitchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
  </svg>
);

type SocialPlatform = 'instagram' | 'twitter' | 'youtube' | 'tiktok' | 'twitch' | 'website';

interface SocialOption {
  id: SocialPlatform;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  color: string;
  bgColor: string;
  prefix?: string;
}

const SOCIAL_OPTIONS: SocialOption[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    icon: <Instagram className="w-5 h-5" />,
    placeholder: 'username',
    prefix: 'instagram.com/',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    icon: <Twitter className="w-5 h-5" />,
    placeholder: 'username',
    prefix: 'x.com/',
    color: 'text-gray-900 dark:text-gray-100',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    icon: <Youtube className="w-5 h-5" />,
    placeholder: '@channel',
    prefix: 'youtube.com/',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: <TikTokIcon className="w-5 h-5" />,
    placeholder: '@username',
    prefix: 'tiktok.com/',
    color: 'text-black dark:text-white',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  {
    id: 'twitch',
    label: 'Twitch',
    icon: <TwitchIcon className="w-5 h-5" />,
    placeholder: 'username',
    prefix: 'twitch.tv/',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  {
    id: 'website',
    label: 'Website',
    icon: <Globe className="w-5 h-5" />,
    placeholder: 'https://yoursite.com',
    color: 'text-[var(--teed-green-10)]',
    bgColor: 'bg-[var(--teed-green-2)]',
  },
];

interface AddSocialFlowProps {
  isOpen: boolean;
  onClose: () => void;
  currentSocialLinks: Record<string, string>;
  onSave: (links: Record<string, string>) => Promise<void>;
}

export function AddSocialFlow({
  isOpen,
  onClose,
  currentSocialLinks,
  onSave,
}: AddSocialFlowProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize values from current links
  useEffect(() => {
    if (isOpen) {
      setValues({ ...currentSocialLinks });
      setError(null);
    }
  }, [isOpen, currentSocialLinks]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Clean up values - remove empty strings
      const cleanedValues: Record<string, string> = {};
      for (const [key, value] of Object.entries(values)) {
        if (value.trim()) {
          cleanedValues[key] = value.trim();
        }
      }
      await onSave(cleanedValues);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [values, onSave, onClose]);

  // Check if anything changed
  const hasChanges = Object.keys(values).some(
    key => (values[key] || '') !== (currentSocialLinks[key] || '')
  ) || Object.keys(currentSocialLinks).some(
    key => (values[key] || '') !== (currentSocialLinks[key] || '')
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className={cn(
          'fixed z-[101]',
          'inset-x-4 bottom-24 sm:inset-auto',
          'sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
          'bg-[var(--surface)] rounded-2xl shadow-2xl',
          'max-w-md w-full mx-auto overflow-hidden',
          'border border-[var(--border-subtle)]',
          'max-h-[85vh] flex flex-col'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--sand-3)] flex items-center justify-center">
              <Share2 className="w-6 h-6 text-[var(--sand-11)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Social Links
              </h2>
              <p className="text-sm text-[var(--text-tertiary)]">
                Connect your social accounts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {SOCIAL_OPTIONS.map((social) => (
            <div key={social.id} className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                <span className={social.color}>{social.icon}</span>
                {social.label}
              </label>
              <div className="relative">
                {social.prefix && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-tertiary)]">
                    {social.prefix}
                  </span>
                )}
                <input
                  type={social.id === 'website' ? 'url' : 'text'}
                  value={values[social.id] || ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [social.id]: e.target.value }))
                  }
                  placeholder={social.placeholder}
                  className={cn(
                    'w-full py-2.5 rounded-xl border border-[var(--border-subtle)]',
                    'bg-[var(--surface)] text-[var(--text-primary)]',
                    'placeholder:text-[var(--text-tertiary)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)]',
                    social.prefix ? 'pl-[120px] pr-4' : 'px-4'
                  )}
                />
              </div>
            </div>
          ))}

          {error && (
            <p className="text-sm text-[var(--copper-9)] px-1">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--border-subtle)] flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium',
              'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors'
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Links
              </>
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}

export default AddSocialFlow;
