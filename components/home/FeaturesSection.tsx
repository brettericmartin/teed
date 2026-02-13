'use client';

import { Share2, Sparkles, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, smoothTransition } from '@/lib/animations';

const features = [
  {
    icon: Share2,
    title: 'Looks amazing everywhere',
    description:
      'Stunning visual pages with custom URLs. Share publicly or keep them private.',
    gradient: 'from-[var(--sky-3)] to-[var(--sky-5)]',
    iconColor: 'text-[var(--sky-11)]',
    hoverBorder: 'hover:border-[var(--sky-6)]',
  },
  {
    icon: Sparkles,
    title: 'Drag, drop, done',
    description:
      'Drag-and-drop sorting, custom categories, and featured items. Organize your way.',
    gradient: 'from-[var(--amber-3)] to-[var(--amber-5)]',
    iconColor: 'text-[var(--amber-11)]',
    hoverBorder: 'hover:border-[var(--amber-6)]',
  },
  {
    icon: Users,
    title: 'Your own creator page',
    description:
      'Custom handle, public profile, and a home for all your collections.',
    gradient: 'from-[var(--teed-green-3)] to-[var(--teed-green-5)]',
    iconColor: 'text-[var(--teed-green-10)]',
    hoverBorder: 'hover:border-[var(--teed-green-6)]',
  },
  {
    icon: Zap,
    title: 'Instant everything',
    description:
      'Paste a link and watch AI fill in the details. Real-time updates, blazing performance.',
    gradient: 'from-[var(--sky-3)] to-[var(--sky-5)]',
    iconColor: 'text-[var(--sky-11)]',
    hoverBorder: 'hover:border-[var(--sky-6)]',
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
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Simple but powerful
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
                className={`h-full p-8 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-4)] transition-all duration-500 border border-[var(--border-subtle)] ${feature.hoverBorder} hover:-translate-y-2`}
              >
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-[var(--radius-lg)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
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
