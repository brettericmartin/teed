'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Check, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { GolfLoader } from '@/components/ui/GolfLoader';
import { motion, AnimatePresence } from 'framer-motion';

type SignupStep = 1 | 2;

export default function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>(1);

  // Step 1: Account credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Profile info
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle availability state
  const [handleAvailability, setHandleAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string | null;
  }>({ checking: false, available: null, error: null });

  // Check handle availability with debouncing
  useEffect(() => {
    if (step !== 2) return;

    const checkHandleAvailability = async () => {
      const cleanHandle = handle.trim().toLowerCase();

      if (cleanHandle.length === 0) {
        setHandleAvailability({ checking: false, available: null, error: null });
        return;
      }

      if (cleanHandle.length < 3) {
        setHandleAvailability({
          checking: false,
          available: false,
          error: 'Handle must be at least 3 characters'
        });
        return;
      }

      if (!/^[a-z0-9_]+$/.test(cleanHandle)) {
        setHandleAvailability({
          checking: false,
          available: false,
          error: 'Handle can only contain lowercase letters, numbers, and underscores'
        });
        return;
      }

      setHandleAvailability({ checking: true, available: null, error: null });

      try {
        const response = await fetch(`/api/profile/handle-available/${cleanHandle}`);
        const data = await response.json();

        if (data.error) {
          setHandleAvailability({
            checking: false,
            available: false,
            error: data.error
          });
        } else {
          setHandleAvailability({
            checking: false,
            available: data.available,
            error: data.available ? null : 'Handle is already taken'
          });
        }
      } catch (err) {
        setHandleAvailability({
          checking: false,
          available: false,
          error: 'Failed to check availability'
        });
      }
    };

    const timeoutId = setTimeout(checkHandleAvailability, 300);
    return () => clearTimeout(timeoutId);
  }, [handle, step]);

  // Validate step 1 and proceed
  const handleStep1Continue = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Proceed to step 2
    setStep(2);
  };

  // Go back to step 1
  const handleBackToStep1 = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!handle || !displayName) {
      setError('Please fill in all required fields');
      return;
    }

    if (!handleAvailability.available) {
      setError('Please choose an available handle');
      return;
    }

    setIsLoading(true);

    try {
      // Sign up with Supabase Auth
      // Pass handle and display_name in user metadata for the trigger
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect_to=/dashboard`,
          data: {
            handle: handle.trim().toLowerCase(),
            display_name: displayName.trim(),
            bio: bio.trim() || null,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setError('Failed to create account');
        setIsLoading(false);
        return;
      }

      // Success! Redirect to dashboard
      // The database trigger will automatically create the profile
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
      setIsLoading(false);
    }
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
        step === 1 ? 'bg-[var(--teed-green-9)] text-white' : 'bg-[var(--teed-green-3)] text-[var(--teed-green-9)]'
      }`}>
        {step > 1 ? <Check className="w-4 h-4" /> : '1'}
      </div>
      <div className={`w-12 h-0.5 transition-colors ${
        step > 1 ? 'bg-[var(--teed-green-9)]' : 'bg-[var(--border)]'
      }`} />
      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
        step === 2 ? 'bg-[var(--teed-green-9)] text-white' : 'bg-[var(--surface-hover)] text-[var(--text-tertiary)]'
      }`}>
        2
      </div>
    </div>
  );

  return (
    <div className="mt-8">
      <StepIndicator />

      {error && (
        <div className="bg-[var(--copper-2)] border border-[var(--copper-6)] rounded-[var(--radius-md)] p-4 mb-6">
          <p className="text-sm text-[var(--copper-11)]">{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Account Credentials */}
        {step === 1 && (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleStep1Continue}
            className="space-y-6"
          >
            <div className="space-y-1 mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Create your account</h2>
              <p className="text-sm text-[var(--text-secondary)]">Enter your email and choose a password</p>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Email <span className="text-[var(--copper-9)]">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Password <span className="text-[var(--copper-9)]">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
                  placeholder="At least 6 characters"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Confirm Password <span className="text-[var(--copper-9)]">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="create"
              className="w-full"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.form>
        )}

        {/* Step 2: Profile Info */}
        {step === 2 && (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="space-y-1 mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Set up your profile</h2>
              <p className="text-sm text-[var(--text-secondary)]">Choose a username and display name</p>
            </div>

            <div className="space-y-4">
              {/* Handle */}
              <div>
                <label htmlFor="handle" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Username (Handle) <span className="text-[var(--copper-9)]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-secondary)]">
                    @
                  </div>
                  <input
                    id="handle"
                    name="handle"
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase())}
                    className="w-full pl-8 pr-12 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
                    placeholder="your_handle"
                    disabled={isLoading}
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    {handleAvailability.checking && (
                      <GolfLoader size="md" />
                    )}
                    {!handleAvailability.checking && handleAvailability.available === true && (
                      <Check className="w-5 h-5 text-[var(--teed-green-9)]" />
                    )}
                    {!handleAvailability.checking && handleAvailability.available === false && (
                      <X className="w-5 h-5 text-[var(--copper-9)]" />
                    )}
                  </div>
                </div>
                {handleAvailability.error && (
                  <p className="mt-1 text-xs text-[var(--copper-9)]">{handleAvailability.error}</p>
                )}
                {handleAvailability.available && (
                  <p className="mt-1 text-xs text-[var(--teed-green-9)]">Handle is available!</p>
                )}
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  This is your unique username for sharing (e.g., teed.co/@{handle || 'you'})
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Display Name <span className="text-[var(--copper-9)]">*</span>
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent transition-all"
                  placeholder="Your Name"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  How your name appears on your profile
                </p>
              </div>

              {/* Bio (Optional) - collapsed by default */}
              <details className="group">
                <summary className="cursor-pointer text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                  Add a bio (optional)
                </summary>
                <div className="mt-3">
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] focus:border-transparent resize-none transition-all"
                    placeholder="Tell us about yourself..."
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    {bio.length}/500 characters
                  </p>
                </div>
              </details>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleBackToStep1}
                disabled={isLoading}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                variant="create"
                disabled={isLoading || !handleAvailability.available}
                className="flex-[2]"
              >
                {isLoading ? (
                  <>
                    <GolfLoader size="md" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
