'use client';

export default function HeroSection() {
  return (
    <div>
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--teed-green-2)] border border-[var(--teed-green-6)] rounded-full text-sm font-medium text-[var(--teed-green-11)] mb-6">
        <span className="w-2 h-2 rounded-full bg-[var(--teed-green-9)] animate-pulse" />
        Founding Member Applications Open
      </div>

      {/* Main headline */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] leading-tight">
        Teed is{' '}
        <span className="text-[var(--teed-green-9)]">invitation-only.</span>
      </h1>

      {/* Subheadline */}
      <p className="mt-4 text-xl sm:text-2xl text-[var(--text-secondary)]">
        We're accepting <span className="font-semibold">50 founding curators</span>{' '}
        who want to share their favorite products with the world.
      </p>

      {/* Value prop */}
      <p className="mt-6 text-lg text-[var(--text-tertiary)] max-w-2xl mx-auto">
        Create beautiful, shareable collections of your gear. Add affiliate links with one click.
        Let AI identify products from your photos.
      </p>
    </div>
  );
}
