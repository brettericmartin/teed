'use client';

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

const testimonials = [
  {
    quote: 'I built Teed because I was tired of DMing my gear list one product at a time. Now I just drop a link.',
    name: 'Brett',
    handle: '@brett',
    role: 'Founder',
  },
  {
    quote: "I've been looking for something exactly like this. Linktree shows links. Teed shows my actual gear.",
    name: 'Jordan',
    handle: '@jordan',
    role: 'Early adopter',
  },
  {
    quote: 'Sent my family a Teed link instead of a Christmas list spreadsheet. They actually used it.',
    name: 'Alex',
    handle: '@alex',
    role: 'Founding member',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] text-center mb-12"
        >
          What founding members are saying
        </motion.h2>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="p-6 bg-[var(--surface-elevated)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] shadow-[var(--shadow-2)]"
            >
              <blockquote className="text-[var(--text-primary)] leading-relaxed mb-4">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                {/* Avatar placeholder */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--teed-green-7)] to-[var(--teed-green-9)] flex items-center justify-center text-white font-semibold text-sm">
                  {testimonial.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm text-[var(--text-primary)]">{testimonial.name}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
