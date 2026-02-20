'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const AUTO_HANDLE_PATTERN = /^user_[a-f0-9]{8}$/;

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');

  const [handleAvailability, setHandleAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string | null;
  }>({ checking: false, available: null, error: null });

  // Load current user data
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('handle, display_name')
        .eq('id', user.id)
        .single();

      if (!profile || !AUTO_HANDLE_PATTERN.test(profile.handle)) {
        // Already has a real handle — go to dashboard
        router.replace('/dashboard');
        return;
      }

      setDisplayName(profile.display_name || '');
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  // Debounced handle availability check
  useEffect(() => {
    const cleanHandle = handle.trim().toLowerCase();

    if (cleanHandle.length === 0) {
      setHandleAvailability({ checking: false, available: null, error: null });
      return;
    }

    if (cleanHandle.length < 3) {
      setHandleAvailability({
        checking: false,
        available: false,
        error: 'Handle must be at least 3 characters',
      });
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanHandle)) {
      setHandleAvailability({
        checking: false,
        available: false,
        error: 'Only lowercase letters, numbers, and underscores',
      });
      return;
    }

    setHandleAvailability({ checking: true, available: null, error: null });

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/profile/handle-available/${cleanHandle}`);
        const data = await response.json();

        if (data.error) {
          setHandleAvailability({ checking: false, available: false, error: data.error });
        } else {
          setHandleAvailability({
            checking: false,
            available: data.available,
            error: data.available ? null : 'Handle is already taken',
          });
        }
      } catch {
        setHandleAvailability({ checking: false, available: false, error: 'Failed to check availability' });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [handle]);

  const cleanHandle = handle.trim().toLowerCase();

  const canSubmit =
    displayName.trim().length > 0 &&
    cleanHandle.length >= 3 &&
    handleAvailability.available === true &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: cleanHandle,
          display_name: displayName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-6)] border border-[var(--border-subtle)] max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-[var(--font-size-9)] font-semibold text-[var(--text-primary)]">Teed</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Curations, Made Shareable</p>
          <h2 className="mt-6 text-[var(--font-size-6)] font-semibold text-[var(--text-primary)]">
            Finish setting up your profile
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Choose a handle for your public profile.
          </p>
        </div>

        <div className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 text-base bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
            />
          </div>

          {/* Handle */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Choose your handle
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                @
              </div>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full pl-8 pr-12 py-3 text-base bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
                placeholder="your_handle"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {handleAvailability.checking && (
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />
                )}
                {!handleAvailability.checking && handleAvailability.available === true && (
                  <Check className="w-5 h-5 text-[var(--teed-green-9)]" />
                )}
                {!handleAvailability.checking && handleAvailability.available === false && (
                  <X className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
            {handleAvailability.error && (
              <p className="mt-1 text-xs text-red-500">{handleAvailability.error}</p>
            )}
            {handleAvailability.available && (
              <p className="mt-1 text-xs text-[var(--teed-green-9)]">
                teed.co/@{cleanHandle} is yours!
              </p>
            )}
            {!handleAvailability.available && !handleAvailability.error && cleanHandle.length === 0 && (
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Your profile lives at teed.co/@you
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-[var(--copper-2)] border border-[var(--copper-6)] rounded-[var(--radius-md)] p-4">
            <p className="text-sm text-[var(--copper-11)]">{error}</p>
          </div>
        )}

        <div className="mt-6">
          <Button
            variant="create"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up @{cleanHandle}...
              </>
            ) : cleanHandle.length >= 3 && handleAvailability.available ? (
              `Claim @${cleanHandle}`
            ) : (
              'Claim your @handle'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
