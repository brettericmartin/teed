'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function SetupGuidesClient() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen pt-16 bg-[var(--surface-elevated)]">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Affiliate Program Setup Guides
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Follow these step-by-step instructions to sign up for affiliate programs and configure Teed
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Amazon Associates */}
        <section className="bg-[var(--surface)] rounded-[var(--radius-xl)] p-8 border border-[var(--border-subtle)]">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                1. Amazon Associates
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                The most popular affiliate program - earn commissions on Amazon products
              </p>
            </div>
            <a
              href="https://affiliate-program.amazon.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[var(--teed-green-8)] text-white rounded-lg hover:bg-[var(--teed-green-9)] transition-colors text-sm font-medium"
            >
              Sign Up
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--teed-green-3)] rounded-full flex items-center justify-center text-sm font-bold text-[var(--teed-green-11)]">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Go to Amazon Associates</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Visit <span className="font-mono text-xs bg-[var(--surface-elevated)] px-2 py-1 rounded">https://affiliate-program.amazon.com</span> and click "Sign Up"
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--teed-green-3)] rounded-full flex items-center justify-center text-sm font-bold text-[var(--teed-green-11)]">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Fill out your account information</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  Use your business information and select that you promote through a website
                </p>
                <div className="bg-[var(--amber-2)] border border-[var(--amber-6)] rounded-lg p-3 text-sm">
                  <p className="text-[var(--amber-11)] font-medium mb-1">💡 For "Website/Mobile App":</p>
                  <button
                    onClick={() => copyToClipboard('https://teed.app', 'teed-url')}
                    className="flex items-center gap-2 font-mono text-xs bg-white px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
                  >
                    https://teed.app
                    {copiedField === 'teed-url' ? (
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--teed-green-3)] rounded-full flex items-center justify-center text-sm font-bold text-[var(--teed-green-11)]">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Describe your website</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  Enter a description of Teed and how users will see links:
                </p>
                <div className="bg-[var(--surface-elevated)] rounded-lg p-4 text-sm space-y-2">
                  <div>
                    <p className="text-[var(--text-tertiary)] text-xs mb-1">Website Description:</p>
                    <button
                      onClick={() => copyToClipboard('Teed is a platform for creating and sharing curated collections of gear, kits, and products. Users create visual "bags" showcasing their favorite items with product links.', 'description')}
                      className="text-left w-full bg-white border border-[var(--border-subtle)] rounded p-2 hover:bg-gray-50 transition-colors flex items-start gap-2"
                    >
                      <span className="flex-1 text-[var(--text-secondary)]">
                        Teed is a platform for creating and sharing curated collections of gear, kits, and products. Users create visual "bags" showcasing their favorite items with product links.
                      </span>
                      {copiedField === 'description' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Copy className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                  </div>
                  <div>
                    <p className="text-[var(--text-tertiary)] text-xs mb-1">Topics:</p>
                    <p className="text-[var(--text-secondary)]">Select: Sports, Travel, Technology, Fashion, Home & Garden</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--teed-green-3)] rounded-full flex items-center justify-center text-sm font-bold text-[var(--teed-green-11)]">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Complete verification</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Enter your phone number and complete the verification process
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--teed-green-3)] rounded-full flex items-center justify-center text-sm font-bold text-[var(--teed-green-11)]">
                5
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Get your Associate Tag</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  Once approved, go to your account dashboard. Your Associate Tag (also called Tracking ID) will be displayed prominently.
                </p>
                <div className="bg-[var(--sky-2)] border border-[var(--sky-6)] rounded-lg p-3">
                  <p className="text-[var(--sky-11)] font-medium text-sm mb-2">📋 What to copy from Amazon:</p>
                  <div className="space-y-2">
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-[var(--text-tertiary)] mb-1">Associate Tag / Tracking ID</p>
                      <p className="font-mono text-sm text-[var(--text-secondary)]">Example: <span className="text-[var(--teed-green-9)]">teed-20</span></p>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      ➡️ Copy this and paste it into <strong>Admin → Affiliate Settings → Amazon Associate Tag</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Impact.com */}
        <section className="bg-[var(--surface)] rounded-[var(--radius-xl)] p-8 border border-[var(--border-subtle)]">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                2. Impact.com
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Partner network with thousands of brands (Nike, Adidas, Best Buy, etc.)
              </p>
            </div>
            <a
              href="https://app.impact.com/signup/influencer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[var(--teed-green-8)] text-white rounded-lg hover:bg-[var(--teed-green-9)] transition-colors text-sm font-medium"
            >
              Sign Up
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--teed-green-3)] rounded-full flex items-center justify-center text-sm font-bold text-[var(--teed-green-11)]">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Sign up as a Creator/Publisher</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Go to <span className="font-mono text-xs bg-[var(--surface-elevated)] px-2 py-1 rounded">https://app.impact.com/signup/influencer</span>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--teed-green-3)] rounded-full flex items-center justify-center text-sm font-bold text-[var(--teed-green-11)]">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Complete your profile</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  Add Teed as your primary promotion method (Website/Blog)
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--teed-green-3)] rounded-full flex items-center justify-center text-sm font-bold text-[var(--teed-green-11)]">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Apply to brand programs</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Browse available programs and apply to brands relevant to your users (Nike, Adidas, REI, Best Buy, etc.)
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--teed-green-3)] rounded-full flex items-center justify-center text-sm font-bold text-[var(--teed-green-11)]">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Get your Publisher ID</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  Once approved for programs, find your Publisher ID in Account Settings
                </p>
                <div className="bg-[var(--sky-2)] border border-[var(--sky-6)] rounded-lg p-3">
                  <p className="text-[var(--sky-11)] font-medium text-sm mb-2">📋 What to copy from Impact:</p>
                  <div className="space-y-2">
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-[var(--text-tertiary)] mb-1">Publisher ID (Account Settings)</p>
                      <p className="font-mono text-sm text-[var(--text-secondary)]">Example: <span className="text-[var(--teed-green-9)]">12345</span></p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-[var(--text-tertiary)] mb-1">Campaign ID (for each brand)</p>
                      <p className="font-mono text-sm text-[var(--text-secondary)]">Example: <span className="text-[var(--teed-green-9)]">67890</span> (optional, can be brand-specific)</p>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      ➡️ Copy these and paste into <strong>Admin → Affiliate Settings → Impact</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CJ Affiliate */}
        <section className="bg-[var(--surface)] rounded-[var(--radius-xl)] p-8 border border-[var(--border-subtle)]">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                3. CJ Affiliate (Commission Junction)
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                One of the largest affiliate networks with major retailers
              </p>
            </div>
            <a
              href="https://www.cj.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[var(--teed-green-8)] text-white rounded-lg hover:bg-[var(--teed-green-9)] transition-colors text-sm font-medium"
            >
              Sign Up
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--teed-green-3)] rounded-full flex items-center justify-center text-sm font-bold text-[var(--teed-green-11)]">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Create publisher account</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Sign up as a publisher at <span className="font-mono text-xs bg-[var(--surface-elevated)] px-2 py-1 rounded">https://www.cj.com/signup</span>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--teed-green-3)] rounded-full flex items-center justify-center text-sm font-bold text-[var(--teed-green-11)]">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Add your website</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Register https://teed.app as your promotional website
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--teed-green-3)] rounded-full flex items-center justify-center text-sm font-bold text-[var(--teed-green-11)]">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Get approved by advertisers</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Apply to advertiser programs. Each advertiser must approve you individually
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--teed-green-3)] rounded-full flex items-center justify-center text-sm font-bold text-[var(--teed-green-11)]">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Get your Website ID</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  Find your unique Website ID (also called PID) in Account Settings
                </p>
                <div className="bg-[var(--sky-2)] border border-[var(--sky-6)] rounded-lg p-3">
                  <p className="text-[var(--sky-11)] font-medium text-sm mb-2">📋 What to copy from CJ:</p>
                  <div className="space-y-2">
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-[var(--text-tertiary)] mb-1">Website ID / PID</p>
                      <p className="font-mono text-sm text-[var(--text-secondary)]">Example: <span className="text-[var(--teed-green-9)]">8712345</span></p>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      ➡️ Copy this and paste into <strong>Admin → Affiliate Settings → CJ</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Reference */}
        <section className="bg-[var(--amber-2)] rounded-[var(--radius-xl)] p-6 border border-[var(--amber-6)]">
          <h3 className="font-semibold text-[var(--amber-11)] mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Quick Reference: What You Need
          </h3>
          <div className="space-y-3 text-sm">
            <div className="bg-white rounded-lg p-3">
              <p className="font-medium text-[var(--text-primary)] mb-1">Amazon Associates</p>
              <p className="text-[var(--text-secondary)]">→ Associate Tag (e.g., "teed-20")</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="font-medium text-[var(--text-primary)] mb-1">Impact.com</p>
              <p className="text-[var(--text-secondary)]">→ Publisher ID + optional Campaign IDs</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="font-medium text-[var(--text-primary)] mb-1">CJ Affiliate</p>
              <p className="text-[var(--text-secondary)]">→ Website ID / PID</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--amber-6)]">
            <p className="text-sm text-[var(--amber-11)] font-medium">
              ➡️ Once you have these IDs, go to <Link href="/admin/affiliate-settings" className="underline font-bold">Affiliate Settings</Link> to configure them
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
