'use client';

import { FolderPlus, Package, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainerSlow, staggerItem, smoothTransition } from '@/lib/animations';

const steps = [
  {
    number: 1,
    icon: FolderPlus,
    title: 'Create a collection',
    description:
      'Pick a name, choose a category. Done.',
  },
  {
    number: 2,
    icon: Package,
    title: 'Add your gear',
    description:
      'Paste a link or search. AI fills in the details.',
  },
  {
    number: 3,
    icon: Share2,
    title: 'Share your link',
    description:
      'One URL. Drop it in your bio, DMs, anywhere.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={smoothTransition}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            How it works
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Three simple steps to start sharing what you use
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainerSlow}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8 relative"
        >
          {/* Connecting lines on desktop */}
          <div className="hidden lg:block absolute top-[3.5rem] left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-0.5 bg-[var(--border-subtle)]" />

          {steps.map((step) => (
            <motion.div key={step.number} variants={staggerItem} className="text-center relative">
              {/* Numbered circle */}
              <div className="w-14 h-14 rounded-full bg-[var(--teed-green-8)] text-white text-xl font-bold flex items-center justify-center mx-auto mb-5 relative z-10">
                {step.number}
              </div>

              {/* Icon */}
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center text-[var(--teed-green-9)]">
                <step.icon className="w-8 h-8" />
              </div>

              {/* Text */}
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                {step.title}
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
