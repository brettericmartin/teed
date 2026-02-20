'use client';

import Link from 'next/link';
import { ArrowRight, Crown, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, smoothTransition } from '@/lib/animations';
import { analytics } from '@/lib/analytics';
import type { Variants } from 'framer-motion';

// Icon entrance animations
const crownSpin: Variants = {
  hidden: { opacity: 0, rotate: -180 },
  visible: {
    opacity: 1,
    rotate: 0,
    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
  },
};

const sparklesPulse: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: [0, 1.2, 1],
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
};

const zapFlash: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: [0, 1, 0.7, 1],
    scale: [0.5, 1.3, 1],
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
};

const benefits = [
  {
    icon: Crown,
    title: 'Founding Member Badge',
    description: "A permanent badge on your profile. You'll always be recognized as an original.",
    iconVariant: crownSpin,
    iconColor: 'text-[var(--copper-5)]',
  },
  {
    icon: Sparkles,
    title: 'Permanent Perks',
    description: 'The most generous free tier we\'ll ever offer — AI identification, analytics, and more included at no cost.',
    iconVariant: sparklesPulse,
    iconColor: 'text-[var(--sky-5)]',
  },
  {
    icon: Zap,
    title: 'Shape the Product',
    description: 'Direct input on what we build next. Your feedback drives our roadmap.',
    iconVariant: zapFlash,
    iconColor: 'text-[var(--teed-green-4)]',
  },
];

export default function FoundingMemberCTA() {
  return (
    <section className="dark-section relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[var(--evergreen-12)]">
      <div className="relative max-w-4xl mx-auto">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={smoothTransition}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Join during launch. <span className="font-serif italic text-[var(--copper-5)]">Stay free forever.</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Sign up now and lock in Founding Member status — the best free tier we&apos;ll ever offer.
            When we introduce paid plans, Founding Members keep permanent perks everyone else pays for.
          </p>
        </motion.div>

        {/* Benefit Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12"
        >
          {benefits.map((benefit) => (
            <motion.div
              key={benefit.title}
              variants={staggerItem}
              className="text-center p-6 rounded-2xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)]"
            >
              <motion.div
                variants={benefit.iconVariant}
                viewport={{ once: true }}
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.1)] ${benefit.iconColor} mb-4`}
              >
                <benefit.icon className="w-6 h-6" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...smoothTransition, delay: 0.2 }}
          className="text-center"
        >
          <span className="inline-block animate-cta-glow rounded-xl">
            <Link
              href="/signup"
              onClick={() => analytics.ctaClicked('founding_member', 'founding_cta', '/signup')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#fff] text-[var(--evergreen-12)] text-lg font-semibold rounded-xl hover:bg-[rgba(255,255,255,0.9)] transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Create Your Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </span>
          <p className="mt-3 text-sm text-[var(--text-tertiary)]">
            No credit card. No catch. We just want you here early.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
