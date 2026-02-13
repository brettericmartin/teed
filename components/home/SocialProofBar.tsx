'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { Package, Users, Sparkles } from 'lucide-react';

interface PlatformStats {
  collections: number;
  creators: number;
  items: number;
}

function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current || value === 0) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * value));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [inView, value, duration]);

  return <span ref={ref}>{displayed.toLocaleString()}</span>;
}

export default function SocialProofBar() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    fetch('/api/platform-stats')
      .then((res) => res.json())
      .then((data: PlatformStats) => {
        if (data.collections >= 10) {
          setStats(data);
        }
      })
      .catch(console.error);
  }, []);

  if (!stats) return null;

  const items = [
    { icon: Users, value: stats.creators, label: 'founding members' },
    { icon: Package, value: stats.collections, label: 'collections created' },
    { icon: Sparkles, value: stats.items, label: 'items curated' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-[var(--sand-2)] border-y border-[var(--border-subtle)]"
    >
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <item.icon className="w-5 h-5 text-[var(--teed-green-9)]" />
              <span className="font-bold text-[var(--text-primary)]">
                <AnimatedNumber value={item.value} />
              </span>
              <span className="text-sm text-[var(--text-secondary)]">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
