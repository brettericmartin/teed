'use client';

import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Package, Link2 } from 'lucide-react';
import { scaleIn } from '@/lib/animations';
import type { FeaturedBag } from './FeaturedBagCard';

interface PhoneMockupProps {
  bag: FeaturedBag | null;
}

export default function PhoneMockup({ bag }: PhoneMockupProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -40]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !bag) return;

    let animationId: number;
    let scrollPos = 0;
    const speed = 0.3; // pixels per frame

    const scroll = () => {
      scrollPos += speed;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (scrollPos >= maxScroll) {
        scrollPos = 0;
      }
      el.scrollTop = scrollPos;
      animationId = requestAnimationFrame(scroll);
    };

    // Start auto-scroll after a brief delay
    const timeout = setTimeout(() => {
      animationId = requestAnimationFrame(scroll);
    }, 1500);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animationId);
    };
  }, [bag]);

  return (
    <div ref={containerRef}>
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        style={{ y }}
        className="relative mx-auto w-[280px] sm:w-[300px]"
      >
        {/* Phone frame */}
        <div className="relative bg-[var(--grey-12)] rounded-[2.5rem] p-3 shadow-2xl">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-[var(--grey-12)] rounded-b-2xl z-10" />

          {/* Screen */}
          <div
            ref={scrollRef}
            className="bg-[var(--background)] rounded-[2rem] overflow-hidden h-[480px] sm:h-[520px] overflow-y-hidden"
          >
            {bag ? (
              <div>
                {/* Bag header image */}
                {bag.background_image ? (
                  <div className="h-[160px] relative">
                    <img
                      src={bag.background_image}
                      alt={bag.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-lg drop-shadow-lg">{bag.title}</h3>
                      <p className="text-white/80 text-xs">by {bag.owner.display_name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[120px] bg-gradient-to-br from-[var(--teed-green-6)] to-[var(--sky-6)] flex items-end p-3">
                    <div>
                      <h3 className="text-white font-bold text-lg">{bag.title}</h3>
                      <p className="text-white/80 text-xs">by {bag.owner.display_name}</p>
                    </div>
                  </div>
                )}

                {/* Items list */}
                <div className="p-3 space-y-2">
                  {bag.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)]"
                    >
                      {item.photo_url ? (
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-white border border-[var(--border-subtle)] flex-shrink-0">
                          <img
                            src={item.photo_url}
                            alt={item.custom_name || ''}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-[var(--sand-2)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-[var(--text-tertiary)]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                          {item.custom_name || 'Unnamed item'}
                        </p>
                        {item.brand && (
                          <p className="text-[10px] text-[var(--text-tertiary)] truncate">{item.brand}</p>
                        )}
                      </div>
                      {item.links && item.links.length > 0 && (
                        <div className="w-6 h-6 rounded-md bg-[var(--surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0">
                          <Link2 className="w-3 h-3 text-[var(--text-tertiary)]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Skeleton loader
              <div className="animate-pulse">
                <div className="h-[160px] bg-[var(--sand-3)]" />
                <div className="p-3 space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--surface)]">
                      <div className="w-10 h-10 rounded-md bg-[var(--sand-2)]" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-[var(--sand-3)] rounded w-3/4" />
                        <div className="h-2 bg-[var(--sand-2)] rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subtle glow effect behind phone */}
        <div className="absolute -inset-4 bg-gradient-to-br from-[var(--teed-green-4)] to-[var(--sky-4)] rounded-[3rem] -z-10 opacity-50 blur-xl" />
      </motion.div>
    </div>
  );
}
