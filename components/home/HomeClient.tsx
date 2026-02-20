'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import HeroSection from '@/components/home/HeroSection';
import ProblemSection from '@/components/home/ProblemSection';
import FeaturedBagsSection from '@/components/home/FeaturedBagsSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import FoundingMemberCTA from '@/components/home/FoundingMemberCTA';
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

      {/* 2. Problem/Agitation (dark navy) */}
      <ProblemSection />

      {/* 3. Featured Collections */}
      <FeaturedBagsSection />

      {/* 4. How It Works */}
      <HowItWorksSection />

      {/* 5. Features */}
      <FeaturesSection />

      {/* Giant text divider before CTA */}
      <div className="py-12 sm:py-20 text-center overflow-hidden bg-[var(--surface-elevated)]">
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-5xl sm:text-7xl lg:text-8xl font-serif italic font-medium tracking-tight text-[var(--teed-green-3)] select-none"
        >
          Your gear. Your way.
        </motion.p>
      </div>

      {/* 6. Founding Member CTA (dark green) */}
      <FoundingMemberCTA />

      {/* 7. Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[var(--surface)] border-t border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-3xl font-serif font-medium tracking-tight text-[var(--text-primary)] mb-4">Teed.club</div>
          <p className="font-serif italic text-[var(--text-secondary)] mb-6">
            Organize. Curate. Share.
          </p>
          <div className="divider-gradient mx-auto mb-6" />
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--text-tertiary)]">
            <Link href="/signup" className="hover:text-[var(--text-primary)] transition-colors">
              Sign Up Free
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
