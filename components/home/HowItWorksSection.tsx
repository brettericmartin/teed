'use client';

import { FolderPlus, Package, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainerSlow, staggerItem, smoothTransition } from '@/lib/animations';

const steps = [
  {
    number: 1,
    icon: FolderPlus,
    title: 'Create a collection',
    description: 'Pick a name, choose a category. Done.',
    numberColor: 'text-[var(--sky-6)]',
    iconBg: 'bg-[var(--sky-9)]',
  },
  {
    number: 2,
    icon: Package,
    title: 'Add your gear',
    description: 'Paste a link or search. AI fills in the details.',
    numberColor: 'text-[var(--copper-5)]',
    iconBg: 'bg-[var(--copper-8)]',
  },
  {
    number: 3,
    icon: Share2,
    title: 'Share your link',
    description: 'One URL. Drop it in your bio, DMs, anywhere.',
    numberColor: 'text-[var(--teed-green-5)]',
    iconBg: 'bg-[var(--teed-green-8)]',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--sand-1)]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={smoothTransition}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-xs font-medium tracking-widest uppercase text-[var(--text-tertiary)] border border-[var(--border-subtle)] rounded-full mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Three steps. <span className="font-serif italic text-[var(--copper-9)]">Sixty seconds.</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Start sharing what you use in under a minute
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
          <div className="hidden lg:block absolute top-[4rem] left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-0.5 bg-[var(--border-subtle)]" />

          {steps.map((step) => (
            <motion.div key={step.number} variants={staggerItem} className="text-center relative">
              {/* Oversized watermark number */}
              <div className="relative mx-auto mb-4 w-24 h-24 flex items-center justify-center">
                <span className={`text-8xl lg:text-9xl font-bold ${step.numberColor} opacity-50 select-none leading-none`}>
                  {step.number}
                </span>
                {/* Icon circle overlaid */}
                <div className={`absolute bottom-0 right-0 w-10 h-10 rounded-full ${step.iconBg} text-[#fff] flex items-center justify-center z-10`}>
                  <step.icon className="w-5 h-5" />
                </div>
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
