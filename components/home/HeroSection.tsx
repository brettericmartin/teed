'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, smoothTransition } from '@/lib/animations';
import { analytics } from '@/lib/analytics';
import PhoneMockup from './PhoneMockup';
import type { FeaturedBag } from './FeaturedBagCard';

interface HeroSectionProps {
  previewBag?: FeaturedBag | null;
}

const heroStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

const heroItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: smoothTransition
  }
};

export default function HeroSection({ previewBag }: HeroSectionProps) {
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/beta/capacity')
      .then(res => res.json())
      .then(data => {
        if (data.available != null) {
          setSpotsRemaining(data.available);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[var(--teed-green-1)] to-[var(--background)]">
      <div className="max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          {/* Left: Copy + CTA */}
          <motion.div
            variants={heroStagger}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left mb-12 lg:mb-0"
          >
            {/* Pill badge */}
            <motion.div variants={heroItem} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--teed-green-2)] border border-[var(--teed-green-6)] text-sm font-medium text-[var(--teed-green-11)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--teed-green-9)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--teed-green-9)]" />
                </span>
                Founding Member Applications Open
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={heroItem}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] tracking-tight mb-6"
            >
              Your gear deserves a better home.
            </motion.h1>

            {/* Subhead */}
            <motion.p
              variants={heroItem}
              className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mx-auto lg:mx-0 mb-8"
            >
              Create beautiful, shareable collections of everything you use.
              One link for your golf bag, camera kit, travel setup, or desk gear.
            </motion.p>

            {/* CTA */}
            <motion.div variants={heroItem} className="flex flex-col items-center lg:items-start gap-3">
              <Link
                href="/join"
                onClick={() => analytics.ctaClicked('founding_member', 'hero', '/join')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--teed-green-9)] text-white text-lg font-semibold rounded-xl hover:bg-[var(--teed-green-10)] transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Become a Founding Member
                <ArrowRight className="w-5 h-5" />
              </Link>

              {/* Urgency line */}
              {spotsRemaining !== null && spotsRemaining > 0 && (
                <p className="text-sm text-[var(--text-tertiary)]">
                  <span className="font-semibold text-[var(--teed-green-11)]">{spotsRemaining} of 50</span> founding spots remaining
                </p>
              )}
            </motion.div>
          </motion.div>

          {/* Right: Phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup bag={previewBag || null} />
          </div>
        </div>
      </div>
    </section>
  );
}
