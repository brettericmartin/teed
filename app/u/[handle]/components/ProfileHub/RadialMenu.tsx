'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface RadialMenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface RadialMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: RadialMenuItem[];
  anchorRect: DOMRect | null;
}

export default function RadialMenu({ isOpen, onClose, items, anchorRect }: RadialMenuProps) {
  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Don't render if no anchor position
  if (!anchorRect) return null;

  // Calculate center of avatar
  const centerX = anchorRect.left + anchorRect.width / 2;
  const centerY = anchorRect.top + anchorRect.height / 2;

  // Radial geometry - items spread in a circle around the avatar
  const radius = 90;

  const getItemPosition = (index: number, total: number) => {
    // Spread items evenly in a circle, starting from top (-90 degrees)
    const angleStep = 360 / total;
    const angle = -90 + (index * angleStep);
    const radians = (angle * Math.PI) / 180;

    return {
      x: Math.cos(radians) * radius,
      y: Math.sin(radians) * radius,
    };
  };

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-[100]"
            onClick={onClose}
          />

          {/* Menu container - positioned at avatar center */}
          <div
            className="fixed z-[101]"
            style={{
              left: centerX,
              top: centerY,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Menu items radiating outward */}
            {items.map((item, index) => {
              const position = getItemPosition(index, items.length);

              return (
                <motion.button
                  key={item.key}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: position.x,
                    y: position.y,
                  }}
                  exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                    delay: index * 0.05,
                  }}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick();
                      onClose();
                    }
                  }}
                  disabled={item.disabled}
                  className={`
                    absolute flex items-center gap-2 px-3.5 py-2 rounded-full
                    bg-[var(--surface)] shadow-xl border border-[var(--border-subtle)]
                    text-[var(--text-primary)] text-sm font-medium
                    whitespace-nowrap
                    transition-colors
                    -translate-x-1/2 -translate-y-1/2
                    ${item.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-[var(--teed-green-2)] hover:border-[var(--teed-green-7)]'
                    }
                  `}
                >
                  <span className="text-[var(--teed-green-9)]">{item.icon}</span>
                  <span>{item.label}</span>
                </motion.button>
              );
            })}

            {/* Close button at center (over avatar) */}
            <motion.button
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={onClose}
              className="
                absolute -translate-x-1/2 -translate-y-1/2
                w-16 h-16 rounded-full
                bg-[var(--teed-green-9)] text-white shadow-xl
                flex items-center justify-center
                hover:bg-[var(--teed-green-10)]
                transition-colors
              "
            >
              <X className="w-7 h-7" />
            </motion.button>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document level
  if (typeof document !== 'undefined') {
    return createPortal(menuContent, document.body);
  }

  return null;
}
