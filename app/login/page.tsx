'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { analytics } from '@/lib/analytics';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect_to');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    analytics.pageViewed('login');
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        analytics.userLoggedIn('email');
        const destination = redirectTo || '/dashboard';
        window.location.href = destination;
      } else {
        setError('No session created. Please try again.');
      }
    } catch (err: any) {
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
              placeholder="you@example.com"
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

        <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] text-center">
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
