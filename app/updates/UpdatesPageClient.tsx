'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PATCH_NOTES } from './data/patchNotes';
import { PatchNoteCard } from './components/PatchNoteCard';

export default function UpdatesPageClient() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.fade-in-section');
    elements.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  const latestNote = PATCH_NOTES.find(note => note.isLatest);
  const previousNotes = PATCH_NOTES.filter(note => !note.isLatest);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header Section */}
      <section className="pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="fade-in-section">
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Updates
            </h1>
            <p className="text-xl text-[var(--text-secondary)]">
              What&apos;s new in Teed
            </p>
          </div>
        </div>
      </section>

      {/* Latest Release - Hero Card */}
      {latestNote && (
        <section className="pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="fade-in-section mb-6">
              <span className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Latest Release
              </span>
            </div>
            <PatchNoteCard note={latestNote} isHero animationDelay="animation-delay-200" />
          </div>
        </section>
      )}

      {/* Previous Releases Grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8 bg-[var(--surface-elevated)]">
        <div className="max-w-4xl mx-auto pt-16">
          <div className="fade-in-section mb-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              Previous Releases
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {previousNotes.map((note, index) => (
              <PatchNoteCard
                key={note.version}
                note={note}
                animationDelay={`animation-delay-${(index % 4) * 200}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[var(--surface)]">
        <div className="max-w-4xl mx-auto text-center fade-in-section">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Ready to try these features?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Start curating your collections with Teed today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3 bg-[var(--teed-green-8)] text-white font-semibold rounded-[var(--radius-lg)] hover:bg-[var(--teed-green-9)] transition-all duration-300 shadow-[var(--shadow-3)] hover:shadow-[var(--shadow-4)] hover:scale-105"
            >
              Get Started
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center justify-center px-8 py-3 bg-[var(--surface)] text-[var(--text-primary)] font-semibold rounded-[var(--radius-lg)] border border-[var(--border-default)] hover:border-[var(--teed-green-6)] transition-all duration-300"
            >
              Explore Bags
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
