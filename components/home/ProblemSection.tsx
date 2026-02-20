'use client';

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, smoothTransition } from '@/lib/animations';

const painPoints = [
  'Other gear-sharing tools need a PhD to set up',
  'You just want to show what\'s in your bag without building a whole website',
  'Christmas lists, travel kits, desk setups — nowhere simple to share them',
];

export default function ProblemSection() {
  return (
    <section className="dark-section py-20 px-4 sm:px-6 lg:px-8 bg-[var(--sky-12)]">
      <div className="max-w-3xl mx-auto text-center">
        {/* Eyebrow label */}
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="inline-block px-3 py-1 text-xs font-medium tracking-widest uppercase text-[var(--sky-5)] border border-[rgba(255,255,255,0.2)] rounded-full mb-6"
        >
          The Problem
        </motion.span>

        {/* Problem headline */}
        <motion.h2
          variants={{
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0, transition: smoothTransition }
          }}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          className="text-3xl sm:text-4xl font-bold mb-12"
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
              className="p-5 rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-left"
            >
              <p className="relative text-lg">
                {point}
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: 0.3 + index * 0.15,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="absolute left-0 right-0 top-1/2 h-[2px] bg-[var(--copper-7)] opacity-60 origin-left"
                />
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
          className="w-16 h-0.5 bg-[var(--copper-7)] mx-auto mb-12 origin-center"
        />

        {/* Solution statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="text-2xl sm:text-3xl font-bold mb-3">
            <span className="text-[var(--teed-green-4)]">Teed</span> fixes this in 60 seconds.
          </p>
          <p className="text-lg text-[var(--text-secondary)]">
            One beautiful page. Every product. Every link. Shared anywhere.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
