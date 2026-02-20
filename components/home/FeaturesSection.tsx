'use client';

import { Share2, Sparkles, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, smoothTransition, bouncySpring } from '@/lib/animations';
import type { Variants } from 'framer-motion';

// Custom icon entrance animations
const iconSlideRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
};

const iconScaleRotate: Variants = {
  hidden: { opacity: 0, scale: 0, rotate: -90 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: bouncySpring,
  },
};

const iconFadeUp: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
};

const iconDropBounce: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
};

const features = [
  {
    icon: Share2,
    title: 'Looks amazing everywhere',
    description:
      'Stunning visual pages with custom URLs. Share publicly or keep them private.',
    gradient: 'from-[var(--sky-3)] to-[var(--sky-5)]',
    iconColor: 'text-[var(--sky-11)]',
    hoverBorder: 'hover:border-[var(--sky-6)]',
    iconVariant: iconSlideRight,
    tintBg: 'bg-[var(--sky-1)]',
    accentBorder: 'border-t-[var(--sky-7)]',
  },
  {
    icon: Sparkles,
    title: 'Drag, drop, done',
    description:
      'Drag-and-drop sorting, custom categories, and featured items. Organize your way.',
    gradient: 'from-[var(--amber-3)] to-[var(--amber-5)]',
    iconColor: 'text-[var(--amber-11)]',
    hoverBorder: 'hover:border-[var(--amber-6)]',
    iconVariant: iconScaleRotate,
    tintBg: 'bg-[var(--sand-1)]',
    accentBorder: 'border-t-[var(--copper-7)]',
  },
  {
    icon: Users,
    title: 'Your own creator page',
    description:
      'Custom handle, public profile, and a home for all your collections.',
    gradient: 'from-[var(--teed-green-3)] to-[var(--teed-green-5)]',
    iconColor: 'text-[var(--teed-green-10)]',
    hoverBorder: 'hover:border-[var(--teed-green-6)]',
    iconVariant: iconFadeUp,
    tintBg: 'bg-[var(--teed-green-1)]',
    accentBorder: 'border-t-[var(--teed-green-8)]',
  },
  {
    icon: Zap,
    title: 'Instant everything',
    description:
      'Paste a link and watch AI fill in the details. Real-time updates, blazing performance.',
    gradient: 'from-[var(--sky-3)] to-[var(--sky-5)]',
    iconColor: 'text-[var(--sky-11)]',
    hoverBorder: 'hover:border-[var(--sky-6)]',
    iconVariant: iconDropBounce,
    tintBg: 'bg-[var(--sky-1)]',
    accentBorder: 'border-t-[var(--sky-7)]',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--surface-elevated)]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={smoothTransition}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-xs font-medium tracking-widest uppercase text-[var(--text-tertiary)] border border-[var(--border-subtle)] rounded-full mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Simple but <span className="font-serif italic">powerful</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            The tools you need to create beautiful, organized collections
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid sm:grid-cols-2 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={staggerItem} className="group">
              <div
                className={`h-full p-8 ${feature.tintBg} rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-4)] transition-all duration-500 border border-[var(--border-subtle)] border-t-2 ${feature.accentBorder} ${feature.hoverBorder} hover:-translate-y-2`}
              >
                <motion.div
                  variants={feature.iconVariant}
                  className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-[var(--radius-lg)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </motion.div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
