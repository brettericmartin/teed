'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, X, Loader2, Link2, Sparkles, Check } from 'lucide-react';
import { useCelebration } from '@/lib/celebrations';
import { classifyUrl, isValidUrl } from '@/lib/linkIntelligence/classifier';
import { cn } from '@/lib/utils';

/**
 * /bags/new - Quick bag creation page
 *
 * Provides a focused UI for creating a new bag.
 * Supports ?url= query param from link paste workflow.
 * After creation, redirects to the bag editor.
 */
export default function NewBagPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const [quickStartUrl, setQuickStartUrl] = useState('');
  const [urlClassification, setUrlClassification] = useState<string | null>(null);
  const { celebrateFirstBag, celebrateBagCreated } = useCelebration();

  // Check for URL param (from link paste workflow)
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam && isValidUrl(urlParam)) {
      setQuickStartUrl(urlParam);
      const result = classifyUrl(urlParam);
      const platform = result.platform.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      setUrlClassification(`${platform} ${result.type}`);
    }
  }, [searchParams]);

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

  // Fetch user handle on mount
  useEffect(() => {
    async function fetchHandle() {
      try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
          router.push('/login');
          return;
        }
        const { user, profile } = await response.json();
        if (!user || !profile?.handle) {
          router.push('/login');
          return;
        }
        setUserHandle(profile.handle);
      } catch {
        router.push('/login');
      }
    }
    fetchHandle();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please enter a title for your bag');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if this is the first bag
      const bagsResponse = await fetch('/api/bags');
      const existingBags = bagsResponse.ok ? await bagsResponse.json() : [];
      const isFirstBag = existingBags.length === 0;

      // Create the bag
      const response = await fetch('/api/bags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          is_public: isPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create bag');
      }

      const newBag = await response.json();

      // If there's a quick start URL, add it as the first item
      if (quickStartUrl && isValidUrl(quickStartUrl)) {
        try {
          await fetch('/api/universal-links/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: quickStartUrl,
              destination: {
                type: 'bag',
                bagId: newBag.id,
              },
            }),
          });
        } catch (e) {
          console.error('Failed to add initial URL:', e);
          // Don't block bag creation if URL add fails
        }
      }

      // Celebrate
      if (isFirstBag) {
        celebrateFirstBag();
      } else {
        celebrateBagCreated();
      }

      // Redirect to bag editor
      router.push(`/u/${userHandle}/${newBag.code}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bag');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Go back or to profile
    if (window.history.length > 1) {
      router.back();
    } else if (userHandle) {
      router.push(`/u/${userHandle}`);
    } else {
      router.push('/');
    }
  };

  if (!userHandle) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[var(--surface)] rounded-2xl shadow-xl border border-[var(--border-subtle)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--teed-green-3)] flex items-center justify-center">
                <Package className="w-5 h-5 text-[var(--teed-green-9)]" />
              </div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                Create a New Bag
              </h1>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
              >
                What are you curating?
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., My Golf Bag, Desk Setup, Travel Kit"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)] focus:border-transparent transition-all"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* Description (optional) */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
              >
                Description{' '}
                <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this collection..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)] focus:border-transparent transition-all resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Quick Start: Add First Link */}
            <div className={cn(
              'p-4 rounded-xl border transition-all',
              quickStartUrl && urlClassification
                ? 'bg-[var(--teed-green-2)] border-[var(--teed-green-6)]'
                : 'bg-[var(--surface-secondary)] border-[var(--border-subtle)]'
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[var(--teed-green-9)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Quick Start
                </span>
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
                  value={quickStartUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://amazon.com/product..."
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white rounded-lg border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-7)] focus:border-transparent transition-all disabled:opacity-50"
                  data-no-paste-handler
                />
              </div>
              {quickStartUrl && urlClassification && (
                <div className="mt-2 flex items-center gap-2 text-sm text-[var(--teed-green-9)]">
                  <Check className="w-4 h-4" />
                  <span>{urlClassification} detected</span>
                </div>
              )}
            </div>

            {/* Privacy Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Make it public
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {isPublic
                    ? 'Anyone can view this bag'
                    : 'Only you can see this bag'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                onClick={() => setIsPublic(!isPublic)}
                disabled={isLoading}
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${isPublic ? 'bg-[var(--teed-green-9)]' : 'bg-[var(--border-subtle)]'}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm
                    transition-transform duration-200
                    ${isPublic ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--teed-green-9)] disabled:hover:shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Bag'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
