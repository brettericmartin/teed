import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Pencil, Trash2, MessageSquare, Key, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ChatGPT Integration Privacy Policy - Teed.club',
  description: 'Privacy policy for the Teed ChatGPT integration',
};

export default function GPTPrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-elevated)]">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teed
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[var(--teed-green-3)] rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-[var(--teed-green-9)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                ChatGPT Integration Privacy Policy
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Teed Assistant for ChatGPT
              </p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-tertiary)]">
            Last updated: December 2024
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
          <div className="p-6 sm:p-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Introduction</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                This privacy policy explains how the Teed ChatGPT integration (&quot;Teed Assistant&quot;)
                collects, uses, and protects your data when you use our custom GPT within ChatGPT.
                By authorizing the Teed Assistant, you agree to this policy.
              </p>
            </section>

            {/* Data Access */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">What Data We Access</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                When you authorize the Teed Assistant, it gains access to the following data
                from your Teed account:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--surface-elevated)]">
                  <div className="w-8 h-8 rounded-full bg-[var(--teed-green-3)] flex items-center justify-center flex-shrink-0">
                    <Eye className="w-4 h-4 text-[var(--teed-green-9)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Profile Information</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Your handle, display name, bio, and avatar URL
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--surface-elevated)]">
                  <div className="w-8 h-8 rounded-full bg-[var(--sky-3)] flex items-center justify-center flex-shrink-0">
                    <Eye className="w-4 h-4 text-[var(--sky-9)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Bags & Items</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      All your bags (public and private), items within them, descriptions,
                      brands, and associated links
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Actions */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">What Actions We Can Perform</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                The Teed Assistant can perform the following actions on your behalf:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--surface-elevated)]">
                  <div className="w-8 h-8 rounded-full bg-[var(--amber-3)] flex items-center justify-center flex-shrink-0">
                    <Pencil className="w-4 h-4 text-[var(--amber-9)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Create & Edit</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Create new bags, add items to bags, and update existing bag/item information
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--surface-elevated)]">
                  <div className="w-8 h-8 rounded-full bg-[var(--red-3)] flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-4 h-4 text-[var(--red-9)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Delete</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Delete bags and remove items when you request it
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ChatGPT Data */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">ChatGPT & OpenAI Data Handling</h2>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--amber-2)] border border-[var(--amber-6)]">
                <MessageSquare className="w-5 h-5 text-[var(--amber-9)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--amber-11)] mb-2">Important Notice</p>
                  <p className="text-sm text-[var(--amber-11)]">
                    When you use the Teed Assistant within ChatGPT, your conversations and
                    interactions are also subject to OpenAI&apos;s privacy policy and data handling
                    practices. OpenAI may log and process your conversations as described in
                    their terms of service.
                  </p>
                </div>
              </div>
              <p className="text-[var(--text-secondary)] mt-4 leading-relaxed">
                We recommend reviewing{' '}
                <a
                  href="https://openai.com/policies/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--teed-green-9)] underline hover:text-[var(--teed-green-10)]"
                >
                  OpenAI&apos;s Privacy Policy
                </a>
                {' '}to understand how they handle your data.
              </p>
            </section>

            {/* Data Storage */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">How We Store & Protect Data</h2>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)] mt-1">•</span>
                  <span>All data is stored securely in our Supabase-hosted PostgreSQL database</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)] mt-1">•</span>
                  <span>OAuth tokens are managed by Supabase Auth and are not stored in plaintext</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)] mt-1">•</span>
                  <span>We use HTTPS for all API communications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)] mt-1">•</span>
                  <span>Row-Level Security (RLS) ensures you can only access your own data</span>
                </li>
              </ul>
            </section>

            {/* Revoking Access */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Revoking Access</h2>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--surface-elevated)]">
                <Key className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    You can revoke the Teed Assistant&apos;s access to your account at any time.
                    To do this:
                  </p>
                  <ol className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                    <li>1. Go to your Teed account settings</li>
                    <li>2. Navigate to &quot;Connected Applications&quot;</li>
                    <li>3. Find &quot;ChatGPT - Teed Assistant&quot; and click &quot;Revoke Access&quot;</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Data Retention</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Your bags and items remain in your Teed account until you delete them.
                Revoking the ChatGPT integration&apos;s access does not delete your existing data;
                it only prevents the integration from accessing or modifying it.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Contact Us</h2>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--surface-elevated)]">
                <Mail className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[var(--text-secondary)]">
                    If you have questions about this privacy policy or how we handle your data,
                    please contact us at:
                  </p>
                  <a
                    href="mailto:privacy@teed.club"
                    className="text-[var(--teed-green-9)] font-medium hover:underline mt-2 inline-block"
                  >
                    privacy@teed.club
                  </a>
                </div>
              </div>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Changes to This Policy</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of
                any significant changes by posting a notice on our website or through the
                ChatGPT integration. Your continued use of the Teed Assistant after changes
                are posted constitutes your acceptance of the updated policy.
              </p>
            </section>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-8 text-center text-sm text-[var(--text-tertiary)]">
          <Link href="/" className="hover:text-[var(--text-secondary)]">
            Teed
          </Link>
          {' · '}
          <Link href="/legal/terms" className="hover:text-[var(--text-secondary)]">
            Terms of Service
          </Link>
          {' · '}
          <Link href="/legal/privacy" className="hover:text-[var(--text-secondary)]">
            Main Privacy Policy
          </Link>
        </div>
      </main>
    </div>
  );
}
