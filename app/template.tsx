'use client';

import { motion, Variants, Transition } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -8,
  },
};

const pageTransition: Transition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.2,
};

// True once the app has hydrated in the browser. Only set in an effect, so it is
// never true during server rendering.
let hasHydrated = false;

export default function Template({ children }: { children: ReactNode }) {
  // The first page a visitor lands on renders fully visible (server HTML used to
  // arrive at opacity 0 and stay blank until JavaScript ran). Later in-app
  // navigations keep the short fade.
  const [animateIn] = useState(() => hasHydrated);
  useEffect(() => {
    hasHydrated = true;
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial={animateIn ? 'initial' : false}
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}
