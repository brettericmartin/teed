'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem } from '@/lib/animations';
import { analytics } from '@/lib/analytics';
import BetaCapacityCounter from '@/components/BetaCapacityCounter';
import BetaCountdown from '@/components/BetaCountdown';

export default function BetaSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--teed-green-2)] via-[var(--teed-green-3)] to-[var(--sky-2)]">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="max-w-3xl mx-auto text-center"
      >
        <motion.h2
          variants={staggerItem}
          className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4"
        >
          Founding spots are filling up.
        </motion.h2>
        <motion.p
          variants={staggerItem}
          className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto mb-8"
        >
          Join the first 50 curators shaping the future of gear sharing.
          Founding members get lifetime perks that will never be offered again.
        </motion.p>

        {/* Capacity counter + countdown */}
        <motion.div variants={staggerItem} className="flex flex-col items-center gap-4 mb-8">
          <BetaCapacityCounter className="max-w-sm w-full" />
          <BetaCountdown />
        </motion.div>

        {/* CTA */}
        <motion.div variants={staggerItem}>
          <Link
            href="/join"
            onClick={() => analytics.ctaClicked('founding_member', 'beta_section', '/join')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--teed-green-9)] text-white text-lg font-semibold rounded-xl hover:bg-[var(--teed-green-10)] transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            Apply for Founding Access
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Benefit chips */}
        <motion.div variants={staggerItem} className="mt-8 flex flex-wrap justify-center gap-3">
          {[
            'Lifetime Free',
            'Early Access',
            'Founding Badge',
            'Direct Input',
          ].map((benefit) => (
            <span
              key={benefit}
              className="px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-secondary)]"
            >
              {benefit}
            </span>
          ))}
        </motion.div>

        <motion.p variants={staggerItem} className="mt-6 text-sm text-[var(--text-tertiary)]">
          Have an invite code?{' '}
          <Link
            href="/join"
            className="text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] font-medium underline underline-offset-2"
          >
            Redeem it here
          </Link>
        </motion.p>
      </motion.div>
    </section>
  );
}
