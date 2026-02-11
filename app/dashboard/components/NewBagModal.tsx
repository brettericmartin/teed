'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { X, Link2, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { classifyUrl, isValidUrl } from '@/lib/linkIntelligence/classifier';
import { cn } from '@/lib/utils';

type NewBagModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string; is_public: boolean; initialUrl?: string }) => void;
  isLoading: boolean;
  /** Pre-filled URL from link paste workflow */
  initialUrl?: string;
};

export default function NewBagModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  initialUrl = '',
}: NewBagModalProps) {
  const { showError } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [quickStartUrl, setQuickStartUrl] = useState('');
  const [urlClassification, setUrlClassification] = useState<string | null>(null);

  // Set initial URL when modal opens with a URL (from link paste workflow)
  // We track the last processed URL to avoid re-processing
  const lastProcessedUrl = useRef<string | null>(null);

  useEffect(() => {
    // Only process if modal is open and we have a new URL to process
    // This initialization pattern is intentional - we want to pre-fill the URL field
    if (isOpen && initialUrl && initialUrl !== lastProcessedUrl.current) {
      lastProcessedUrl.current = initialUrl;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuickStartUrl(initialUrl);
      if (isValidUrl(initialUrl)) {
        const result = classifyUrl(initialUrl);
        const platform = result.platform.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        setUrlClassification(`${platform} ${result.type}`);
      }
    }

    // Reset when modal closes
    if (!isOpen) {
      lastProcessedUrl.current = null;
    }
  }, [isOpen, initialUrl]);

  // Validate and classify URL as user types
  const handleUrlChange = (url: string) => {
    setQuickStartUrl(url);
    if (url && isValidUrl(url)) {
      const result = classifyUrl(url);
      const platform = result.platform.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      setUrlClassification(`${platform} ${result.type}`);
    } else {
      setUrlClassification(null);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showError('Title is required');
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      is_public: isPublic,
      initialUrl: quickStartUrl.trim() || undefined,
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      setTitle('');
      setDescription('');
      setIsPublic(true);
      setQuickStartUrl('');
      setUrlClassification(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[var(--overlay-bg)] transition-opacity backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-[var(--modal-bg)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-6)] max-w-md w-full border border-[var(--modal-border)]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-[var(--border-subtle)] gap-2">
            <h2 className="text-[var(--font-size-6)] font-semibold text-[var(--text-primary)] flex-1 min-w-0 truncate">
              Create New Bag
            </h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 rounded-lg p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-[var(--surface-hover)] flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-4 sm:px-8 py-6 space-y-6">
              {/* Title Field */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                >
                  Title <span className="text-[var(--error-text)]">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Camping Gear"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 text-base bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent disabled:bg-[var(--input-bg-disabled)] disabled:cursor-not-allowed transition-all"
                  autoFocus
                />
              </div>

              {/* Description Field */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Everything I bring on camping trips"
                  rows={3}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent resize-none disabled:bg-[var(--input-bg-disabled)] disabled:cursor-not-allowed transition-all"
                />
              </div>

              {/* Quick Start: Add First Link */}
              <div className={cn(
                'p-4 rounded-[var(--radius-md)] border transition-all',
                quickStartUrl && urlClassification
                  ? 'bg-teed-green-50 border-teed-green-200'
                  : 'bg-[var(--surface-secondary)] border-[var(--border-subtle)]'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[var(--teed-green-8)]" />
                  <label
                    htmlFor="quickStartUrl"
                    className="text-sm font-medium text-[var(--text-primary)]"
                  >
                    Quick Start
                  </label>
                  <span className="text-xs text-[var(--text-tertiary)]">(optional)</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-3">
                  Paste a link to add your first item immediately
                </p>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                  <input
                    type="url"
                    id="quickStartUrl"
                    name="quickStartUrl"
                    value={quickStartUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://amazon.com/product..."
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent disabled:bg-[var(--input-bg-disabled)] disabled:cursor-not-allowed transition-all"
                    data-no-paste-handler
                  />
                </div>
                {/* URL Classification Feedback */}
                {quickStartUrl && urlClassification && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-teed-green-700">
                    <Check className="w-4 h-4" />
                    <span>{urlClassification} detected</span>
                  </div>
                )}
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center justify-between p-4 bg-[var(--sky-2)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
                <div className="flex-1">
                  <label htmlFor="is_public" className="block text-sm font-medium text-[var(--text-primary)]">
                    Make Public
                  </label>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Anyone with the link can view
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPublic}
                  onClick={() => setIsPublic(!isPublic)}
                  disabled={isLoading}
                  className={`${
                    isPublic ? 'bg-[var(--teed-green-8)]' : 'bg-[var(--grey-5)]'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0`}
                >
                  <span
                    className={`${
                      isPublic ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 px-4 sm:px-6 py-4 sm:py-6 border-t border-[var(--border-subtle)]">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="create"
                disabled={isLoading || !title.trim()}
              >
                {isLoading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
