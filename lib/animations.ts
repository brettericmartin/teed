// Animation variants for Framer Motion
// These provide consistent, reusable animation patterns across the app

import type { Variants, Transition } from 'framer-motion';

// ============================================
// TRANSITIONS
// ============================================

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30
};

export const snappySpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25
};

export const gentleSpring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25
};

export const bouncySpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 20
};

export const smoothTransition: Transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] // Apple's easing
};

export const quickTransition: Transition = {
  duration: 0.15,
  ease: [0.4, 0, 0.2, 1]
};

// ============================================
// BASIC VARIANTS
// ============================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: smoothTransition
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: quickTransition
  }
};

export const fadeDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: smoothTransition
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: quickTransition
  }
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springTransition
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: quickTransition
  }
};

export const scaleUp: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: bouncySpring
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: quickTransition
  }
};

// ============================================
// SLIDE VARIANTS
// ============================================

export const slideUp: Variants = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: springTransition
  },
  exit: {
    y: '100%',
    transition: smoothTransition
  }
};

export const slideDown: Variants = {
  initial: { y: '-100%' },
  animate: {
    y: 0,
    transition: springTransition
  },
  exit: {
    y: '-100%',
    transition: smoothTransition
  }
};

export const slideRight: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: 0,
    transition: springTransition
  },
  exit: {
    x: '-100%',
    transition: smoothTransition
  }
};

export const slideLeft: Variants = {
  initial: { x: '100%' },
  animate: {
    x: 0,
    transition: springTransition
  },
  exit: {
    x: '100%',
    transition: smoothTransition
  }
};

// ============================================
// STAGGER CONTAINERS
// ============================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

// ============================================
// STAGGER ITEMS
// ============================================

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springTransition
  }
};

export const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springTransition
  }
};

export const staggerItemFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: smoothTransition
  }
};

// ============================================
// MODAL VARIANTS
// ============================================

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 }
  }
};

export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springTransition
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2 }
  }
};

export const drawerContent: Variants = {
  hidden: {
    x: '100%',
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: springTransition
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.25 }
  }
};

// ============================================
// TOAST VARIANTS
// ============================================

export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    y: -20,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: snappySpring
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: quickTransition
  }
};

// ============================================
// BUTTON VARIANTS
// ============================================

export const buttonHover = {
  scale: 1.02,
  transition: snappySpring
};

export const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1 }
};

export const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
};

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 8
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2 }
  }
};

// ============================================
// EXPAND/COLLAPSE VARIANTS
// ============================================

export const expandCollapse: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.2 }
    }
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.2, delay: 0.1 }
    }
  }
};

// ============================================
// CARD VARIANTS
// ============================================

export const cardHover = {
  y: -4,
  boxShadow: '0 8px 24px rgba(31, 58, 46, 0.15)',
  transition: smoothTransition
};

export const cardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springTransition
  },
  hover: {
    y: -4,
    transition: smoothTransition
  }
};

// ============================================
// SUCCESS ANIMATION
// ============================================

export const successPop: Variants = {
  initial: {
    scale: 0,
    opacity: 0
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20
    }
  }
};

export const checkmarkDraw: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.4, ease: 'easeOut' },
      opacity: { duration: 0.1 }
    }
  }
};

// ============================================
// SKELETON LOADING
// ============================================

export const skeletonPulse: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Creates a stagger container with custom timing
 */
export function createStaggerContainer(
  staggerDelay: number = 0.1,
  initialDelay: number = 0.05
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay
      }
    }
  };
}

/**
 * Creates a custom fade-up variant with specified distance
 */
export function createFadeUp(distance: number = 20): Variants {
  return {
    initial: { opacity: 0, y: distance },
    animate: {
      opacity: 1,
      y: 0,
      transition: smoothTransition
    },
    exit: {
      opacity: 0,
      y: -distance / 2,
      transition: quickTransition
    }
  };
}

/**
 * Creates a delayed animation variant
 */
export function withDelay(variants: Variants, delay: number): Variants {
  return {
    ...variants,
    animate: {
      ...variants.animate,
      transition: {
        ...(typeof variants.animate === 'object' && 'transition' in variants.animate
          ? variants.animate.transition
          : {}),
        delay
      }
    }
  };
}
