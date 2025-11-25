'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabaseClient';

interface InviteRedemptionProps {
  code: string;
  tier: string;
  invitedBy: string | null;
}

const TIER_BENEFITS: Record<string, { title: string; perks: string[] }> = {
  founder: {
    title: 'Founding Member',
    perks: [
      'Lifetime Pro access',
      'Founding Member badge',
      'Direct line to the team',
      'Shape the product roadmap',
    ],
  },
  influencer: {
    title: 'Influencer Access',
    perks: [
      '6 months Pro access',
      'Influencer badge',
      'Priority support',
      'Early feature access',
    ],
  },
  standard: {
    title: 'Beta Access',
    perks: [
      '3 months Pro access',
      'Beta tester badge',
      'Feature voting',
      'Community access',
    ],
  },
  friend: {
    title: 'Friend Invite',
    perks: [
      '1 month Pro access',
      'Early access',
      'Shape features',
      'Priority support',
    ],
  },
};

export default function InviteRedemption({ code, tier, invitedBy }: InviteRedemptionProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const benefits = TIER_BENEFITS[tier] || TIER_BENEFITS.standard;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {

      // 1. Create the user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            handle,
            beta_invite_code: code,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create account');

      // 2. Claim the invite code
      const { error: claimError } = await supabase.rpc('claim_invite_code', {
        invite_code: code,
        claiming_user_id: authData.user.id,
      });

      if (claimError) {
        console.error('Claim error:', claimError);
        // Don't fail the whole flow if claim fails - user is already created
      }

      // 3. Update profile with beta tier
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          beta_tier: tier,
          beta_approved_at: new Date().toISOString(),
          invited_by_id: invitedBy,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Redirect to dashboard
      router.push('/dashboard?welcome=true');
    } catch (err) {
      console.error('Redemption error:', err);
      if (err instanceof Error) {
        if (err.message.includes('already registered')) {
          setError('This email is already registered. Try signing in instead.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--teed-green-9)] to-[var(--teed-green-8)] p-6 text-center text-white">
        <div className="text-sm font-medium opacity-90 mb-1">You've been invited!</div>
        <h2 className="text-2xl font-bold">{benefits.title}</h2>
      </div>

      {/* Benefits */}
      <div className="px-6 py-4 bg-[var(--teed-green-2)] dark:bg-[var(--teed-green-3)]">
        <div className="flex flex-wrap gap-2">
          {benefits.perks.map((perk, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-zinc-800 rounded-full text-sm text-[var(--text-primary)]"
            >
              <svg className="w-4 h-4 text-[var(--teed-green-9)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {perk}
            </span>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          minLength={8}
          required
        />
        <Input
          label="Choose your handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          placeholder="yourhandle"
          pattern="[a-z0-9_]+"
          required
        />
        <p className="text-xs text-[var(--text-secondary)]">
          Your public URL: teed.club/u/<span className="font-medium">{handle || 'yourhandle'}</span>
        </p>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="create"
          disabled={isLoading || !email || !password || !handle}
          className="w-full"
        >
          {isLoading ? 'Creating Account...' : 'Claim Your Access'}
        </Button>

        <p className="text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{' '}
          <a href="/login" className="text-[var(--teed-green-9)] hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}
