'use client';

import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

const inputClass =
  'w-full px-4 py-3 text-base bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent disabled:bg-[var(--input-bg-disabled)] transition-all';
const buttonClass =
  'w-full bg-[var(--button-create-bg)] hover:bg-[var(--button-create-bg-hover)] active:bg-[var(--button-create-bg-active)] text-[var(--button-create-text)] font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98]';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) {
        setError(error.message);
        return;
      }
      // Same message whether or not the address has an account.
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-6)] border border-[var(--border-subtle)] max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-[var(--font-size-6)] font-semibold text-[var(--text-primary)]">Reset your password</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Enter the email you signed up with and we&apos;ll send you a link to set a new password.
          </p>
        </div>

        {sent ? (
          <div className="bg-[var(--teed-green-2)] border border-[var(--teed-green-6)] rounded-[var(--radius-md)] p-4">
            <p className="text-sm text-[var(--text-primary)]">
              If an account uses {email.trim()}, a reset link is on its way. Check your inbox and spam folder.
            </p>
          </div>
        ) : (
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
                autoComplete="email"
                required
                disabled={isLoading}
                className={inputClass}
              />
            </div>
            {error && (
              <div className="bg-[var(--copper-2)] border border-[var(--copper-6)] rounded-[var(--radius-md)] p-4">
                <p className="text-sm text-[var(--copper-11)]">{error}</p>
              </div>
            )}
            <button type="submit" disabled={isLoading} className={buttonClass}>
              {isLoading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] text-center">
          <a
            href="/login"
            className="text-sm font-medium text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] transition-colors"
          >
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
