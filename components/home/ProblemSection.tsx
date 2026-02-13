'use client';

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, smoothTransition } from '@/lib/animations';

const painPoints = [
  'Other gear-sharing tools need a PhD to set up',
  'You just want to show what\'s in your bag without building a whole website',
  'Christmas lists, travel kits, desk setups \u2014 nowhere simple to share them',
];

export default function ProblemSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--surface-elevated)]">
      <div className="max-w-3xl mx-auto text-center">
        {/* Problem headline */}
        <motion.h2
          variants={{
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0, transition: smoothTransition }
          }}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.5 }}
          className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-12"
        >
          Sharing what you use shouldn&apos;t be this complicated
        </motion.h2>

        {/* Pain point cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="space-y-4 mb-12"
        >
          {painPoints.map((point, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] text-left"
            >
              <p className="text-lg text-[var(--text-secondary)] line-through decoration-[var(--text-tertiary)] decoration-2">
                {point}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="w-16 h-0.5 bg-[var(--teed-green-8)] mx-auto mb-12 origin-center"
        />

        {/* Solution statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="text-2xl sm:text-3xl font-bold text-[var(--teed-green-11)] mb-3">
            Teed fixes this in 60 seconds.
          </p>
          <p className="text-lg text-[var(--text-secondary)]">
            One beautiful page. Every product. Every link. Shared anywhere.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
