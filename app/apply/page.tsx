import { Metadata } from 'next';
import ApplyForm from './ApplyForm';

export const metadata: Metadata = {
  title: 'Apply for Beta Access - Teed',
  description: 'Join the Teed beta program and help shape the future of curation sharing',
};

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-page)] to-[var(--sky-2)]">
      {/* Header */}
      <div className="pt-12 pb-8 px-4 text-center">
        <a href="/" className="inline-block mb-6">
          <span className="text-[var(--font-size-8)] font-semibold text-[var(--text-primary)]">
            Teed
          </span>
        </a>
        <h1 className="text-[var(--font-size-7)] font-bold text-[var(--text-primary)]">
          Join the Beta
        </h1>
        <p className="mt-2 text-[var(--text-secondary)] max-w-md mx-auto">
          Help us build the future of sharing curated collections.
          Early access, exclusive perks, and a voice in what we build next.
        </p>
      </div>

      {/* Form Container */}
      <div className="px-4 pb-16">
        <div className="max-w-lg mx-auto">
          <ApplyForm />

          {/* Sign in option */}
          <div className="mt-8 text-center">
            <p className="text-[var(--text-secondary)]">
              Already have an account?{' '}
              <a
                href="/login?redirect=/dashboard"
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
