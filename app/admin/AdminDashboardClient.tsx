'use client';

import Link from 'next/link';
import { Settings, BookOpen, DollarSign, Users, BarChart3 } from 'lucide-react';

export default function AdminDashboardClient() {
  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Admin Dashboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Platform administration and configuration
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Affiliate Settings */}
          <Link
            href="/admin/affiliate-settings"
            className="group block p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] hover:border-[var(--teed-green-6)] hover:shadow-[var(--shadow-3)] transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--teed-green-4)] to-[var(--teed-green-6)] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6 text-[var(--teed-green-11)]" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Affiliate Settings
              </h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Configure platform affiliate tags for Amazon, Impact, CJ, and more
            </p>
          </Link>

          {/* Setup Guides */}
          <Link
            href="/admin/setup-guides"
            className="group block p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] hover:border-[var(--sky-6)] hover:shadow-[var(--shadow-3)] transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--sky-4)] to-[var(--sky-6)] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-[var(--sky-11)]" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Setup Guides
              </h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Step-by-step instructions for signing up to affiliate programs
            </p>
          </Link>

          {/* Analytics (Coming Soon) */}
          <div className="p-6 bg-[var(--surface-elevated)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] opacity-60">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--amber-4)] to-[var(--amber-6)] rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[var(--amber-11)]" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Analytics
              </h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Coming soon: Affiliate click and revenue tracking
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Platform Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Affiliate Networks</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">5</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Amazon, Impact, CJ, Rakuten, ShareASale</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Admin Email</p>
              <p className="text-sm font-medium text-[var(--text-primary)] break-all">brett.eric.martin@gmail.com</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-[var(--teed-green-9)] rounded-full" />
                <span className="text-sm font-medium text-[var(--text-primary)]">Active</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
