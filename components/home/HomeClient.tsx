'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import HeroSection from '@/components/home/HeroSection';
import SocialProofBar from '@/components/home/SocialProofBar';
import ProblemSection from '@/components/home/ProblemSection';
import FeaturedBagsSection from '@/components/home/FeaturedBagsSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import BetaSection from '@/components/home/BetaSection';
import { analytics } from '@/lib/analytics';
import type { FeaturedBag } from '@/components/home/FeaturedBagCard';

export default function HomeClient() {
  const [previewBag, setPreviewBag] = useState<FeaturedBag | null>(null);

  useEffect(() => {
    analytics.pageViewed('home');
  }, []);

  // Fetch featured bags for hero preview
  useEffect(() => {
    fetch('/api/featured-bags')
      .then(res => res.json())
      .then(data => {
        const bags = data.bags || [];
        if (bags.length > 0) {
          setPreviewBag(bags[0]);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden">
      {/* 1. Hero */}
      <HeroSection previewBag={previewBag} />

      {/* 2. Social Proof Bar */}
      <SocialProofBar />

      {/* 3. Problem/Agitation */}
      <ProblemSection />

      {/* 4. Featured Collections */}
      <FeaturedBagsSection />

      {/* 5. How It Works */}
      <HowItWorksSection />

      {/* 6. Features */}
      <FeaturesSection />

      {/* 7. Testimonials */}
      <TestimonialsSection />

      {/* 8. Founding Member CTA */}
      <BetaSection />

      {/* 9. Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[var(--surface)] border-t border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-3xl font-bold text-[var(--text-primary)] mb-4">Teed.club</div>
          <p className="text-[var(--text-secondary)] mb-6">
            Organize. Curate. Share.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--text-tertiary)]">
            <Link href="/join" className="hover:text-[var(--text-primary)] transition-colors">
              Apply to Join
            </Link>
            <Link href="/discover" className="hover:text-[var(--text-primary)] transition-colors">
              Discover
            </Link>
            <Link href="/blog" className="hover:text-[var(--text-primary)] transition-colors">
              Blog
            </Link>
            <Link href="/login" className="hover:text-[var(--text-primary)] transition-colors">
              Sign In
            </Link>
            {/* Use case pages as footer links */}
            <Link href="/for/golfers" className="hover:text-[var(--text-primary)] transition-colors">
              Golfers
            </Link>
            <Link href="/for/creators" className="hover:text-[var(--text-primary)] transition-colors">
              Creators
            </Link>
            <Link href="/for/travelers" className="hover:text-[var(--text-primary)] transition-colors">
              Travelers
            </Link>
            <Link href="/for/tech" className="hover:text-[var(--text-primary)] transition-colors">
              Tech
            </Link>
          </div>
          <p className="mt-8 text-xs text-[var(--text-tertiary)]">
            &copy; 2026 Teed. Made with care for organizers everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
}
