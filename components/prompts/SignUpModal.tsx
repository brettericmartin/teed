'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { modalOverlay, modalContent } from '@/lib/animations';
import { analytics } from '@/lib/analytics';

type PendingAction = 'save' | 'clone' | 'follow' | 'add-to-bag';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userId: string) => void;
  context: {
    bagTitle: string;
    action: PendingAction;
  };
}

const ACTION_HEADERS: Record<PendingAction, string> = {
  save: 'save',
  clone: 'clone',
  follow: 'follow the creator of',
  'add-to-bag': 'add items from',
};

export function SignUpModal({ isOpen, onClose, onSuccess, context }: SignUpModalProps) {
  const pathname = usePathname();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    handle: '',
  });

  const [handleAvailability, setHandleAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string | null;
  }>({ checking: false, available: null, error: null });

  // Track modal open
  useEffect(() => {
    if (isOpen) {
      analytics.signupModalOpened(context.action);
    }
  }, [isOpen, context.action]);

  // Check handle availability with debouncing
  useEffect(() => {
    const cleanHandle = formData.handle.trim().toLowerCase();

    if (cleanHandle.length === 0) {
      setHandleAvailability({ checking: false, available: null, error: null });
      return;
    }

    if (cleanHandle.length < 3) {
      setHandleAvailability({
        checking: false,
        available: false,
        error: 'Handle must be at least 3 characters',
      });
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanHandle)) {
      setHandleAvailability({
        checking: false,
        available: false,
        error: 'Only lowercase letters, numbers, and underscores',
      });
      return;
    }

    setHandleAvailability({ checking: true, available: null, error: null });

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/profile/handle-available/${cleanHandle}`);
        const data = await response.json();

        if (data.error) {
          setHandleAvailability({ checking: false, available: false, error: data.error });
        } else {
          setHandleAvailability({
            checking: false,
            available: data.available,
            error: data.available ? null : 'Handle is already taken',
          });
        }
      } catch {
        setHandleAvailability({ checking: false, available: false, error: 'Failed to check availability' });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [formData.handle]);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const passwordError = formData.password && formData.password.length < 8
    ? 'Password must be at least 8 characters'
    : null;

  const canSubmit =
    formData.email &&
    formData.name &&
    formData.password.length >= 8 &&
    formData.handle.length >= 3 &&
    handleAvailability.available === true;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          handle: formData.handle.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      // Sign in to establish client session
      await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      analytics.signupModalCompleted(context.action);
      analytics.userSignedUp('email');

      onSuccess(data.userId);
    } catch (err) {
      console.error('Signup error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    analytics.signupModalAbandoned(context.action);
    onClose();
  };

  const actionVerb = ACTION_HEADERS[context.action];

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
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--teed-green-9)] to-[var(--teed-green-8)] p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white pr-8">
                Sign up to {actionVerb} &ldquo;{context.bagTitle}&rdquo;
              </h2>
              <p className="text-white/80 mt-1 text-sm">Create your free account in seconds</p>
            </div>

            {/* Form */}
            <div className="p-6">
              <div className="space-y-4">
                <Input
                  label="Your Name"
                  placeholder="Alex Johnson"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="alex@example.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  error={passwordError || undefined}
                />

                {/* Handle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Choose a Handle
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      @
                    </div>
                    <input
                      type="text"
                      value={formData.handle}
                      onChange={(e) => updateField('handle', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full pl-8 pr-12 px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-gray-400 dark:hover:border-zinc-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="your_handle"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {handleAvailability.checking && (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      )}
                      {!handleAvailability.checking && handleAvailability.available === true && (
                        <Check className="w-5 h-5 text-[var(--teed-green-9)]" />
                      )}
                      {!handleAvailability.checking && handleAvailability.available === false && (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  {handleAvailability.error && (
                    <p className="mt-1 text-xs text-red-500">{handleAvailability.error}</p>
                  )}
                  {handleAvailability.available && (
                    <p className="mt-1 text-xs text-[var(--teed-green-9)]">Handle is available!</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Your unique URL: teed.co/@{formData.handle || 'you'}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="mt-6">
                <Button
                  variant="create"
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>

              {/* Already have an account */}
              <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
                Already have an account?{' '}
                <Link
                  href={`/login?redirect_to=${encodeURIComponent(pathname)}`}
                  className="text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
