import { Suspense } from 'react';
import SignupForm from './SignupForm';

export const metadata = {
  title: 'Sign Up - Teed',
  description: 'Create your Teed account and start curating',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="pt-12 pb-8 px-4 text-center">
        <a href="/" className="inline-block mb-6">
          <span className="text-[var(--font-size-8)] font-semibold text-[var(--text-primary)]">
            Teed
          </span>
        </a>
        <h1 className="text-[var(--font-size-7)] font-bold text-[var(--text-primary)]">
          Join Teed
        </h1>
        <p className="mt-2 text-[var(--text-secondary)] max-w-md mx-auto">
          Create your account and start sharing curated collections.
        </p>
      </div>

      {/* Form Container */}
      <div className="px-4 pb-16">
        <div className="max-w-lg mx-auto">
          <Suspense>
            <SignupForm />
          </Suspense>

          {/* Sign in option */}
          <div className="mt-8 text-center">
            <p className="text-[var(--text-secondary)]">
              Already have an account?{' '}
              <a
                href="/login"
                className="text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] font-medium"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
