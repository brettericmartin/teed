'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, X, Loader2 } from 'lucide-react';
import { useCelebration } from '@/lib/celebrations';
import * as authApi from '@/lib/api/domains/auth';
import * as bagsApi from '@/lib/api/domains/bags';

/**
 * /bags/new - Quick bag creation page
 *
 * Provides a focused UI for creating a new bag.
 * After creation, redirects to the bag editor.
 */
export default function NewBagPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const { celebrateFirstBag, celebrateBagCreated } = useCelebration();

  // Fetch user handle on mount
  useEffect(() => {
    async function fetchHandle() {
      try {
        const { user, profile } = await authApi.getSession();
        if (!user) {
          router.push('/login');
          return;
        }
        if (!profile?.handle) {
          router.push('/settings');
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
      let isFirstBag = false;
      try {
        const bagsData = await bagsApi.listMine();
        isFirstBag = (bagsData.bags || []).length === 0;
      } catch (err) {
        console.error('Failed to check bag count:', err);
      }

      // Create the bag
      const newBag = await bagsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
      });

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
