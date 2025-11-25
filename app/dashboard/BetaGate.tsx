'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';

interface BetaGateProps {
  userEmail: string;
  userName: string;
}

export default function BetaGate({ userEmail, userName }: BetaGateProps) {
  const [hasApplied, setHasApplied] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has already applied
    async function checkApplication() {
      const { data } = await supabase
        .from('beta_applications')
        .select('waitlist_position, status')
        .eq('email', userEmail)
        .single();

      if (data) {
        setHasApplied(true);
        setWaitlistPosition(data.waitlist_position);
      }
      setIsLoading(false);
    }
    checkApplication();
  }, [userEmail]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
        <div className="animate-pulse text-[var(--text-secondary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-page)] to-[var(--sky-2)]">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
            Welcome to the Beta
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            {hasApplied
              ? "Thanks for signing up! We'll let you know when it's your turn."
              : "Teed is currently in private beta. Apply for early access below."}
          </p>
        </div>

        {hasApplied ? (
          // Already applied - show status
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-[var(--teed-green-2)] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[var(--teed-green-9)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">You're on the list!</h2>
            {waitlistPosition && (
              <p className="text-3xl font-bold text-[var(--teed-green-9)] mb-4">
                Position #{waitlistPosition}
              </p>
            )}
            <p className="text-[var(--text-secondary)] mb-6">
              We're reviewing applications and inviting users in waves.
              Keep an eye on your inbox at <span className="font-medium">{userEmail}</span>
            </p>

            <div className="bg-[var(--sky-2)] dark:bg-[var(--sky-3)] rounded-xl p-6 text-left mb-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">While you wait:</h3>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)]">1.</span>
                  <span>Follow us on social media for updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)]">2.</span>
                  <span>Share with friends - referrals move you up the list</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)]">3.</span>
                  <span>Start thinking about what you want to curate!</span>
                </li>
              </ul>
            </div>

            <Button variant="secondary" onClick={() => supabase.auth.signOut()}>
              Sign Out
            </Button>
          </div>
        ) : (
          // Not applied yet - show embedded apply form
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--teed-green-9)] to-[var(--teed-green-8)] p-6 text-center text-white">
              <h2 className="text-2xl font-bold">Apply for Beta Access</h2>
              <p className="text-white/80 mt-1">Fill out a quick survey to join the waitlist</p>
            </div>

            <div className="p-6">
              <p className="text-[var(--text-secondary)] mb-6">
                Hi {userName || 'there'}! Since you already have an account, we just need a few more details to process your beta application.
              </p>

              <div className="space-y-4">
                <a
                  href="/apply"
                  className="block w-full"
                >
                  <Button variant="create" className="w-full">
                    Complete Application
                  </Button>
                </a>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => supabase.auth.signOut()}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Features Preview */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white/50 dark:bg-zinc-900/50 rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">📸</div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">AI-Powered</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Upload a photo and let AI identify all your items
            </p>
          </div>
          <div className="bg-white/50 dark:bg-zinc-900/50 rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Share Anywhere</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Beautiful shareable pages for your curated collections
            </p>
          </div>
          <div className="bg-white/50 dark:bg-zinc-900/50 rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Monetize</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Earn from your recommendations with built-in affiliate links
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
