'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabaseClient';
import { Check, Loader2, X, Bookmark, UserCircle, Copy, Eye, EyeOff } from 'lucide-react';
import { analytics } from '@/lib/analytics';

export default function SignupForm() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    analytics.pageViewed('signup');
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    handle: '',
  });

  const [handleAvailability, setHandleAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string | null;
  }>({ checking: false, available: null, error: null });

  // Check handle availability with debouncing
  useEffect(() => {
    const cleanHandle = formData.handle.trim().toLowerCase();

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
  }, [formData.handle]);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const passwordError = formData.password && formData.password.length < 8
    ? 'Password must be at least 8 characters'
    : null;

  const canSubmit =
    formData.email &&
    formData.name &&
    formData.password.length >= 8 &&
    formData.handle.length >= 3 &&
    handleAvailability.available === true;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          handle: formData.handle.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      // Sign in to establish client session
      await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      analytics.userSignedUp('email');

      // Preserve ref param for onboarding survey
      const ref = searchParams.get('ref');
      const dashboardUrl = ref ? `/dashboard?ref=${encodeURIComponent(ref)}` : '/dashboard';
      window.location.href = dashboardUrl;
    } catch (err) {
      console.error('Signup error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanHandle = formData.handle.trim().toLowerCase();

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Start collecting</h2>
        <p className="mt-1 text-[var(--text-secondary)]">
          Curate and share the products you swear by.
        </p>

        {/* Compact value props */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:gap-4">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Bookmark className="w-4 h-4 text-[var(--teed-green-9)] shrink-0" />
            <span>Save &amp; follow bags</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <UserCircle className="w-4 h-4 text-[var(--teed-green-9)] shrink-0" />
            <span>Claim teed.co/@you</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Copy className="w-4 h-4 text-[var(--teed-green-9)] shrink-0" />
            <span>Curate your own</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-6 pb-8">
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="Alex Johnson"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="alex@example.com"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
          />

          {/* Password with show/hide toggle */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2 pr-10 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-gray-400 dark:hover:border-zinc-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordError}</p>
            )}
          </div>

          {/* Handle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Choose your handle
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                @
              </div>
              <input
                type="text"
                value={formData.handle}
                onChange={(e) => updateField('handle', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full pl-8 pr-12 px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-gray-400 dark:hover:border-zinc-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="your_handle"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {handleAvailability.checking && (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
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
              <p className="mt-1 text-xs text-gray-400">
                Your profile lives at teed.co/@you
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-6">
          <Button
            variant="create"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating @{cleanHandle}...
              </>
            ) : cleanHandle.length >= 3 && handleAvailability.available ? (
              `Claim @${cleanHandle}`
            ) : (
              'Claim your @handle'
            )}
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--text-secondary)]">
          Free forever. No credit card needed.
        </p>
      </div>
    </div>
  );
}
