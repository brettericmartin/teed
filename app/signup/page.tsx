import { Metadata } from 'next';
import SignupForm from './SignupForm';

export const metadata: Metadata = {
  title: 'Sign Up - Teed',
  description: 'Create your Teed account to start curating and sharing your bags',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-[var(--font-size-9)] font-semibold text-[var(--text-primary)]">
            Teed
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Curations, Made Shareable
          </p>
          <h2 className="mt-6 text-[var(--font-size-6)] font-semibold text-[var(--text-primary)]">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Start curating your bags and sharing them with the world
          </p>
        </div>

        {/* Signup Form */}
        <SignupForm />

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Already have an account?{' '}
            <a
              href="/login"
              className="font-medium text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] transition-colors"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
