'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Check, X } from 'lucide-react';
import { GolfLoader } from '@/components/ui/GolfLoader';

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle availability state
  const [handleAvailability, setHandleAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string | null;
  }>({ checking: false, available: null, error: null });

  // Check handle availability with debouncing
  useEffect(() => {
    const checkHandleAvailability = async () => {
      const cleanHandle = handle.trim().toLowerCase();

      if (cleanHandle.length === 0) {
        setHandleAvailability({ checking: false, available: null, error: null });
        return;
      }

      if (cleanHandle.length < 3) {
        setHandleAvailability({
          checking: false,
          available: false,
          error: 'Handle must be at least 3 characters'
        });
        return;
      }

      if (!/^[a-z0-9_]+$/.test(cleanHandle)) {
        setHandleAvailability({
          checking: false,
          available: false,
          error: 'Handle can only contain lowercase letters, numbers, and underscores'
        });
        return;
      }

      setHandleAvailability({ checking: true, available: null, error: null });

      try {
        const response = await fetch(`/api/profile/handle-available/${cleanHandle}`);
        const data = await response.json();

        if (data.error) {
          setHandleAvailability({
            checking: false,
            available: false,
            error: data.error
          });
        } else {
          setHandleAvailability({
            checking: false,
            available: data.available,
            error: data.available ? null : 'Handle is already taken'
          });
        }
      } catch (err) {
        setHandleAvailability({
          checking: false,
          available: false,
          error: 'Failed to check availability'
        });
      }
    };

    const timeoutId = setTimeout(checkHandleAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [handle]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password || !handle || !displayName) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!handleAvailability.available) {
      setError('Please choose an available handle');
      return;
    }

    setIsLoading(true);

    try {
      // Sign up with Supabase Auth
      // Pass handle and display_name in user metadata for the trigger
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect_to=/dashboard`,
          data: {
            handle: handle.trim().toLowerCase(),
            display_name: displayName.trim(),
            bio: bio.trim() || null,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setError('Failed to create account');
        setIsLoading(false);
        return;
      }

      // Success! Redirect to dashboard
      // The database trigger will automatically create the profile
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="bg-[var(--copper-2)] border border-[var(--copper-6)] rounded-[var(--radius-md)] p-4">
          <p className="text-sm text-[var(--copper-11)]">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Email <span className="text-[var(--copper-9)]">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </div>

        {/* Handle */}
        <div>
          <label htmlFor="handle" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Username (Handle) <span className="text-[var(--copper-9)]">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-secondary)]">
              @
            </div>
            <input
              id="handle"
              name="handle"
              type="text"
              required
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              className="w-full pl-8 pr-12 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
              placeholder="your_handle"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              {handleAvailability.checking && (
                <GolfLoader size="md" />
              )}
              {!handleAvailability.checking && handleAvailability.available === true && (
                <Check className="w-5 h-5 text-[var(--teed-green-9)]" />
              )}
              {!handleAvailability.checking && handleAvailability.available === false && (
                <X className="w-5 h-5 text-[var(--copper-9)]" />
              )}
            </div>
          </div>
          {handleAvailability.error && (
            <p className="mt-1 text-xs text-[var(--copper-9)]">{handleAvailability.error}</p>
          )}
          {handleAvailability.available && (
            <p className="mt-1 text-xs text-[var(--teed-green-9)]">Handle is available!</p>
          )}
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            3-30 characters, lowercase letters, numbers, and underscores only
          </p>
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Display Name <span className="text-[var(--copper-9)]">*</span>
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
            placeholder="Your Name"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            This is how your name will appear on your profile
          </p>
        </div>

        {/* Bio (Optional) */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Bio (Optional)
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent resize-none transition-all"
            placeholder="Tell us about yourself..."
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            {bio.length}/500 characters
          </p>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Password <span className="text-[var(--copper-9)]">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
            placeholder="••••••••"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            At least 6 characters
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Confirm Password <span className="text-[var(--copper-9)]">*</span>
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <Button
          type="submit"
          variant="create"
          disabled={isLoading || !handleAvailability.available}
          className="w-full"
        >
          {isLoading ? (
            <>
              <GolfLoader size="md" className="mr-2" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </div>
    </form>
  );
}
