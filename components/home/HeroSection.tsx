'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { smoothTransition } from '@/lib/animations';
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
  return (
    <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Aurora gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--teed-green-1)] to-[var(--background)]" />

      {/* Aurora blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--teed-green-4) 0%, transparent 70%)',
            animation: 'aurora-drift-1 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--sky-4) 0%, transparent 70%)',
            animation: 'aurora-drift-2 20s ease-in-out infinite',
            animationDelay: '3s',
          }}
        />
        <div
          className="absolute bottom-[-5%] left-[20%] w-[45%] h-[45%] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--sand-4) 0%, transparent 70%)',
            animation: 'aurora-drift-3 16s ease-in-out infinite',
            animationDelay: '7s',
          }}
        />
      </div>

      {/* Floating decorative elements - hidden on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <div className="absolute top-[15%] left-[8%] w-3 h-3 rounded-full bg-[var(--teed-green-6)] opacity-30 animate-float" />
        <div className="absolute top-[25%] right-[12%] w-2 h-2 rounded-full bg-[var(--sky-6)] opacity-25 animate-float animation-delay-200" />
        <div className="absolute bottom-[30%] left-[15%] w-4 h-4 rounded-full border-2 border-[var(--teed-green-5)] opacity-20 animate-float animation-delay-400" />
        <div className="absolute top-[60%] right-[8%] w-2.5 h-2.5 rounded-full bg-[var(--sand-6)] opacity-30 animate-float animation-delay-600" />
      </div>

      <div className="relative max-w-7xl mx-auto">
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
                Free During Launch — Founding Members Stay Free Forever
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={heroItem}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] tracking-tight mb-6"
            >
              Your gear deserves <span className="font-serif italic text-[var(--teed-green-11)]">a better</span> home.
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
              <span className="animate-cta-glow rounded-xl">
                <Link
                  href="/signup"
                  onClick={() => analytics.ctaClicked('founding_member', 'hero', '/signup')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--teed-green-9)] text-white text-lg font-semibold rounded-xl hover:bg-[var(--teed-green-10)] transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Create Your Free Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </span>

              <p className="text-sm text-[var(--text-tertiary)]">
                No credit card required. Takes 30 seconds.
              </p>
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
