'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Crown, Zap, TrendingUp, Sparkles, Lock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import BetaCapacityCounter from '@/components/BetaCapacityCounter';
import BetaCountdown from '@/components/BetaCountdown';
import HeroSection from './components/HeroSection';
import SocialProofBar from './components/SocialProofBar';
import RecentApprovalsFeed from './components/RecentApprovalsFeed';
import BenefitsGrid from './components/BenefitsGrid';
import FeaturePreview from './components/FeaturePreview';
import BetaCodeEntry from './components/BetaCodeEntry';

export default function JoinContent() {
  const searchParams = useSearchParams();
  const fromRoute = searchParams.get('from');
  const [showCodeEntry, setShowCodeEntry] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-page)] via-white to-[var(--teed-green-1)]">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Redirected message */}
          {fromRoute && (
            <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-[var(--sky-2)] border border-[var(--sky-6)] rounded-full text-sm text-[var(--sky-11)]">
              <Lock className="w-4 h-4" />
              <span>That feature requires beta access</span>
            </div>
          )}

          <HeroSection />

          {/* Capacity Counter & Countdown - The stars of the show */}
          <div className="mt-10 max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 border border-[var(--border-subtle)]">
            <BetaCapacityCounter showDetails />

            {/* Deadline countdown */}
            <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
              <BetaCountdown />
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/apply">
              <Button variant="create" size="lg" className="px-8">
                Apply for Founding Access
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>

            <button
              onClick={() => setShowCodeEntry(!showCodeEntry)}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline-offset-4 hover:underline"
            >
              Have an invite code?
            </button>
          </div>

          {/* Beta Code Entry (expandable) */}
          {showCodeEntry && (
            <div className="mt-6 max-w-md mx-auto">
              <BetaCodeEntry />
            </div>
          )}

          {/* Exclusivity message */}
          <p className="mt-6 text-sm text-[var(--text-tertiary)]">
            Applications are reviewed weekly. Not everyone who applies will be accepted.
          </p>
        </div>
      </section>

      {/* Social Proof Bar */}
      <SocialProofBar />

      {/* Recent Approvals Feed - Social proof */}
      <section className="py-12 px-4">
        <div className="max-w-md mx-auto">
          <RecentApprovalsFeed />
        </div>
      </section>

      {/* Founder Benefits */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
              Founding Member Benefits
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              Join now and lock in exclusive perks forever
            </p>
          </div>

          <BenefitsGrid />
        </div>
      </section>

      {/* Feature Preview - What they're missing */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent to-[var(--sand-2)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
              What You'll Get Access To
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              A glimpse of what's waiting for you inside
            </p>
          </div>

          <FeaturePreview />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
            Ready to join the founding cohort?
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-8">
            Complete a quick application and we'll review it within the week.
          </p>

          <Link href="/apply">
            <Button variant="create" size="lg" className="px-12">
              Apply Now
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>

          <p className="mt-8 text-sm text-[var(--text-tertiary)]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[var(--teed-green-9)] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
