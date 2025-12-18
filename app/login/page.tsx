'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect_to');
  const [email, setEmail] = useState('test@teed-test.com');
  const [password, setPassword] = useState('test-password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Debug: Check if environment variables are loaded
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Has Supabase Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('Redirect to:', redirectTo);
  }, [redirectTo]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting sign in with:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign in response:', { data, error });

      if (error) {
        console.error('Sign in error:', error);
        setError(error.message);
        return;
      }

      if (data.session) {
        console.log('Session created, redirecting...');
        // Force a hard navigation to ensure cookies are sent
        // Use redirect_to if provided, otherwise go to dashboard
        const destination = redirectTo || '/dashboard';
        window.location.href = destination;
      } else {
        console.error('No session created');
        setError('No session created. Please try again.');
      }
    } catch (err: any) {
      console.error('Caught error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-6)] border border-[var(--border-subtle)] max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-[var(--font-size-9)] font-semibold text-[var(--text-primary)]">Teed</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Curations, Made Shareable</p>
          <h2 className="mt-6 text-[var(--font-size-6)] font-semibold text-[var(--text-primary)]">
            Sign in to continue
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 text-base bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent disabled:bg-[var(--input-bg-disabled)] transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 text-base bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent disabled:bg-[var(--input-bg-disabled)] transition-all"
            />
          </div>

          {error && (
            <div className="bg-[var(--copper-2)] border border-[var(--copper-6)] rounded-[var(--radius-md)] p-4">
              <p className="text-sm text-[var(--copper-11)]">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--button-create-bg)] hover:bg-[var(--button-create-bg-hover)] active:bg-[var(--button-create-bg-active)] text-[var(--button-create-text)] font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-secondary)] text-center">
            Test credentials are pre-filled
          </p>
          <p className="text-xs text-[var(--text-tertiary)] text-center mt-1">
            test@teed-test.com / test-password
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Don't have an account?{' '}
            <a
              href="/signup"
              className="font-medium text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] transition-colors"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
