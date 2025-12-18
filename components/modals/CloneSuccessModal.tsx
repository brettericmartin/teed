'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Edit, LayoutGrid, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { modalOverlay, modalContent } from '@/lib/animations';

interface CloneSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  clonedBag: {
    code: string;
    name: string;
    itemCount: number;
    handle?: string;
  } | null;
}

export function CloneSuccessModal({ isOpen, onClose, clonedBag }: CloneSuccessModalProps) {
  if (!clonedBag) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 modal-backdrop"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] p-8 z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>

            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-6 bg-[var(--teed-green-2)] rounded-full flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
              >
                <CheckCircle className="w-12 h-12 text-[var(--teed-green-8)]" />
              </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Bag cloned successfully!
              </h2>
              <p className="text-[var(--text-secondary)]">
                Your copy of &ldquo;{clonedBag.name}&rdquo; is ready to customize.
              </p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                {clonedBag.itemCount} {clonedBag.itemCount === 1 ? 'item' : 'items'} included
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-3"
            >
              {/* Primary: Edit Bag */}
              <Link href={clonedBag.handle ? `/u/${clonedBag.handle}/${clonedBag.code}/edit` : `/bags/${clonedBag.code}/edit`} className="block">
                <MagneticButton
                  className="w-full px-6 py-3 bg-[var(--teed-green-8)] text-white rounded-xl font-semibold hover:bg-[var(--teed-green-9)] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow"
                >
                  <Edit className="w-5 h-5" />
                  Start Editing Your Bag
                </MagneticButton>
              </Link>

              {/* Secondary: View Bag */}
              <Link href={clonedBag.handle ? `/u/${clonedBag.handle}/${clonedBag.code}` : `/c/${clonedBag.code}`} className="block">
                <button className="w-full px-6 py-3 border border-[var(--border-subtle)] rounded-xl font-medium hover:bg-[var(--surface-hover)] flex items-center justify-center gap-2 transition-colors">
                  <ExternalLink className="w-5 h-5" />
                  View Public Bag
                </button>
              </Link>

              {/* Tertiary: Dashboard */}
              <Link href="/dashboard" className="block">
                <button className="w-full px-6 py-3 border border-[var(--border-subtle)] rounded-xl font-medium hover:bg-[var(--surface-hover)] flex items-center justify-center gap-2 transition-colors">
                  <LayoutGrid className="w-5 h-5" />
                  Go to Dashboard
                </button>
              </Link>

              {/* Dismiss */}
              <button
                onClick={onClose}
                className="w-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 transition-colors"
              >
                I&apos;ll do it later
              </button>
            </motion.div>

            {/* Helper Text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-xs text-center text-[var(--text-tertiary)]"
            >
              Most people start by editing and making it their own
            </motion.p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default CloneSuccessModal;
