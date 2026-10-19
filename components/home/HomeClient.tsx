'use client';

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
import { SiteFooter } from '@/components/layout/SiteFooter';

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

      {/* 7. Footer (shared with /for/*; see components/layout/SiteFooter.tsx) */}
      <SiteFooter />
    </div>
  );
}
