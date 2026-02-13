import { Metadata } from 'next';
import { createServerSupabase } from '@/lib/serverSupabase';
import InviteRedemption from './InviteRedemption';

export const metadata: Metadata = {
  title: 'Redeem Invite - Teed.club',
  description: 'Redeem your exclusive Teed beta invite code',
};

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { code } = await params;
  const supabase = await createServerSupabase();

  // Check if the invite code is valid
  const { data: invite } = await supabase
    .from('beta_invite_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  const isValid = invite && !invite.claimed_at && !invite.is_revoked;
  const isExpired = invite?.expires_at && new Date(invite.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-page)] to-[var(--sky-2)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block mb-4">
            <span className="text-[var(--font-size-8)] font-semibold text-[var(--text-primary)]">
              Teed
            </span>
          </a>
        </div>

        {!invite ? (
          // Invalid code
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Invalid Invite Code</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              This invite code doesn't exist. Double-check your link or request a new invite.
            </p>
            <a
              href="/apply"
              className="inline-flex items-center justify-center px-6 py-3 bg-[var(--teed-green-9)] text-white font-medium rounded-xl hover:bg-[var(--teed-green-10)] transition-colors"
            >
              Apply for Access
            </a>
          </div>
        ) : invite.claimed_at ? (
          // Already claimed
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Already Claimed</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              This invite has already been used. If this was you, sign in to continue.
            </p>
            <a
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-[var(--teed-green-9)] text-white font-medium rounded-xl hover:bg-[var(--teed-green-10)] transition-colors"
            >
              Sign In
            </a>
          </div>
        ) : isExpired ? (
          // Expired
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Invite Expired</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              This invite code has expired. Request a new one or join the waitlist.
            </p>
            <a
              href="/apply"
              className="inline-flex items-center justify-center px-6 py-3 bg-[var(--teed-green-9)] text-white font-medium rounded-xl hover:bg-[var(--teed-green-10)] transition-colors"
            >
              Apply for Access
            </a>
          </div>
        ) : (
          // Valid - show redemption form
          <InviteRedemption code={code.toUpperCase()} tier={invite.tier} invitedBy={invite.created_by} />
        )}
      </div>
    </div>
  );
}
