'use client';

import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

const inputClass =
  'w-full px-4 py-3 text-base bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent disabled:bg-[var(--input-bg-disabled)] transition-all';
const buttonClass =
  'w-full bg-[var(--button-create-bg)] hover:bg-[var(--button-create-bg-hover)] active:bg-[var(--button-create-bg-active)] text-[var(--button-create-text)] font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98]';

// Reached from the reset email: /auth/callback signs the person in with the link's
// code, then sends them here to choose a new password.
export default function ResetPasswordPage() {
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords don’t match.');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-6)] border border-[var(--border-subtle)] max-w-md w-full p-8">
        <h1 className="text-center text-[var(--font-size-6)] font-semibold text-[var(--text-primary)] mb-6">
          Choose a new password
        </h1>

        {hasSession === false ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              This reset link has expired or was already used.
            </p>
            <a
              href="/forgot-password"
              className="inline-block text-sm font-medium text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] transition-colors"
            >
              Send a new link
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                New password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={isLoading || hasSession === null}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Confirm new password
              </label>
              <input
                type="password"
                id="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                disabled={isLoading || hasSession === null}
                className={inputClass}
              />
            </div>
            {error && (
              <div className="bg-[var(--copper-2)] border border-[var(--copper-6)] rounded-[var(--radius-md)] p-4">
                <p className="text-sm text-[var(--copper-11)]">{error}</p>
              </div>
            )}
            <button type="submit" disabled={isLoading || hasSession === null} className={buttonClass}>
              {isLoading ? 'Saving...' : 'Save new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
