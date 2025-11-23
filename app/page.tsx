'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Camera, Share2, Sparkles, TrendingUp, Users, Zap } from 'lucide-react';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const useCasesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);

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

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--surface)] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--teed-green-2)] via-[var(--sky-2)] to-[var(--amber-2)] opacity-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,var(--teed-green-3),transparent_50%)] animate-pulse-slow" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,var(--sky-3),transparent_50%)] animate-pulse-slow animation-delay-1000" />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-[var(--teed-green-4)] rounded-full opacity-20 animate-float" />
          <div className="absolute top-40 right-20 w-32 h-32 bg-[var(--sky-4)] rounded-full opacity-20 animate-float animation-delay-2000" />
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-[var(--amber-4)] rounded-full opacity-20 animate-float animation-delay-3000" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Logo/Title */}
            <div className="mb-6 inline-block">
              <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">
                Teed
              </h1>
              <div className="h-2 bg-gradient-to-r from-[var(--teed-green-8)] via-[var(--teed-green-9)] to-[var(--teed-green-10)] rounded-full transform scale-x-0 animate-scale-in animation-delay-500" />
            </div>

            {/* Tagline */}
            <p className="text-2xl sm:text-3xl md:text-4xl text-[var(--text-secondary)] mb-6 font-medium leading-relaxed transition-all duration-1000 delay-300">
              Organize. Curate. Share.
            </p>

            <p className="text-lg sm:text-xl md:text-2xl text-[var(--text-tertiary)] mb-12 max-w-3xl mx-auto transition-all duration-1000 delay-500">
              Showcase your gear, kits, and collections with style.
              From golf bags to travel essentials, create visual lists that inspire.
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <Link
                href="/login"
                className="group relative px-8 py-4 bg-[var(--teed-green-8)] text-white text-lg font-semibold rounded-[var(--radius-xl)] hover:bg-[var(--teed-green-9)] transition-all duration-300 shadow-[var(--shadow-3)] hover:shadow-[var(--shadow-4)] hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--teed-green-9)] to-[var(--teed-green-10)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>

              <Link
                href="#features"
                className="px-8 py-4 bg-[var(--surface)] text-[var(--text-primary)] text-lg font-semibold rounded-[var(--radius-xl)] border-2 border-[var(--teed-green-8)] hover:bg-[var(--teed-green-2)] transition-all duration-300 shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-3)] hover:scale-105"
              >
                See How It Works
              </Link>
            </div>

            {/* Social Proof */}
            <div className="mt-16 text-sm text-[var(--text-tertiary)] transition-all duration-1000 delay-1000">
              <p>Trusted by creators, enthusiasts, and organizers worldwide</p>
            </div>
          </div>

          {/* Hero Banner - App Preview */}
          <div
            className={`mt-20 max-w-6xl mx-auto transition-all duration-1200 delay-900 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
            }`}
          >
            <div className="relative group">
              {/* Glow effect behind banner */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[var(--teed-green-6)] via-[var(--sky-6)] to-[var(--teed-green-6)] rounded-[var(--radius-2xl)] opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-500" />

              {/* Main banner container */}
              <div className="relative bg-[var(--surface)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-6)] border-2 border-[var(--border-subtle)] overflow-hidden group-hover:border-[var(--teed-green-6)] transition-all duration-500">
                {/* Browser chrome */}
                <div className="bg-[var(--surface-elevated)] px-4 py-3 border-b border-[var(--border-subtle)] flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--copper-8)]" />
                    <div className="w-3 h-3 rounded-full bg-[var(--amber-8)]" />
                    <div className="w-3 h-3 rounded-full bg-[var(--teed-green-8)]" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-[var(--surface)] rounded-full px-4 py-1.5 text-xs text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
                      teed.app/u/golfer/my-bag
                    </div>
                  </div>
                </div>

                {/* App mockup content */}
                <div className="bg-gradient-to-br from-[var(--teed-green-1)] to-[var(--sky-1)] p-8 sm:p-12">
                  {/* Mock bag header */}
                  <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-3)] mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="h-8 w-48 bg-gradient-to-r from-[var(--teed-green-3)] to-transparent rounded mb-2" />
                        <div className="h-4 w-32 bg-[var(--sand-3)] rounded" />
                      </div>
                      <div className="flex gap-2">
                        <div className="w-10 h-10 rounded-full bg-[var(--sky-3)]" />
                        <div className="w-10 h-10 rounded-full bg-[var(--teed-green-3)]" />
                      </div>
                    </div>
                  </div>

                  {/* Mock items grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        name: 'Titleist GT3 Driver',
                        brand: 'Titleist',
                        category: 'Golf',
                        icon: '⛳',
                        color: 'from-[var(--teed-green-4)] to-[var(--teed-green-6)]'
                      },
                      {
                        name: 'Srixon ZXi7 Irons',
                        brand: 'Srixon',
                        category: 'Golf',
                        icon: '🏌️',
                        color: 'from-[var(--sky-4)] to-[var(--sky-6)]'
                      },
                      {
                        name: 'Cotopaxi Allpa 35L',
                        brand: 'Cotopaxi',
                        category: 'Travel',
                        icon: '🎒',
                        color: 'from-[var(--amber-4)] to-[var(--amber-6)]'
                      },
                      {
                        name: 'Osprey Hikelite 26',
                        brand: 'Osprey',
                        category: 'Outdoor',
                        icon: '🏔️',
                        color: 'from-[var(--copper-4)] to-[var(--copper-6)]'
                      },
                      {
                        name: 'BioLite Headlamp 425',
                        brand: 'BioLite',
                        category: 'Tech',
                        icon: '💡',
                        color: 'from-[var(--purple-4)] to-[var(--purple-6)]'
                      },
                      {
                        name: 'MSR PocketRocket',
                        brand: 'MSR',
                        category: 'Camping',
                        icon: '🔥',
                        color: 'from-[var(--orange-4)] to-[var(--orange-6)]'
                      }
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-3)] transition-all duration-300 hover:-translate-y-1"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {/* Product image with icon */}
                        <div className={`aspect-square bg-gradient-to-br ${item.color} rounded-[var(--radius-md)] mb-3 flex items-center justify-center`}>
                          <div className="text-6xl opacity-90">{item.icon}</div>
                        </div>
                        {/* Product details */}
                        <div className="space-y-1.5">
                          <h3 className="font-semibold text-[var(--text-primary)] text-sm line-clamp-1">
                            {item.name}
                          </h3>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {item.brand}
                          </p>
                        </div>
                        {/* Category badge */}
                        <div className="mt-3 inline-flex">
                          <span className="text-xs px-2.5 py-1 bg-[var(--teed-green-3)] text-[var(--teed-green-11)] rounded-full font-medium">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating UI elements */}
              <div className="absolute -top-4 -right-4 bg-[var(--surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-4)] px-4 py-2 border border-[var(--border-subtle)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden lg:block">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[var(--teed-green-9)]" />
                  <span className="text-sm text-[var(--text-secondary)]">AI Recognition</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-[var(--surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-4)] px-4 py-2 border border-[var(--border-subtle)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden lg:block">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[var(--sky-6)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Share Publicly</span>
                </div>
              </div>

              <div className="absolute top-1/2 -right-8 bg-[var(--surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-4)] px-4 py-2 border border-[var(--border-subtle)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden xl:block">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--amber-9)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Affiliate Links</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-[var(--text-tertiary)] rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-[var(--text-tertiary)] rounded-full animate-scroll" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--surface-elevated)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 fade-in-section">
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Everything you need to showcase your collections
            </h2>
            <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
              Powerful features designed to make organizing and sharing your gear effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="fade-in-section group">
              <div className="h-full p-8 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-4)] transition-all duration-500 border border-[var(--border-subtle)] hover:border-[var(--teed-green-6)] hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--teed-green-3)] to-[var(--teed-green-5)] rounded-[var(--radius-lg)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-7 h-7 text-[var(--teed-green-10)]" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                  AI-Powered Photo Recognition
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Snap a photo, and our AI automatically identifies your products. No more manual entry.
                </p>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="fade-in-section group animation-delay-200">
              <div className="h-full p-8 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-4)] transition-all duration-500 border border-[var(--border-subtle)] hover:border-[var(--sky-6)] hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--sky-3)] to-[var(--sky-5)] rounded-[var(--radius-lg)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Share2 className="w-7 h-7 text-[var(--sky-11)]" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                  Beautiful Sharing
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Create stunning visual lists with custom URLs. Share your bags publicly or keep them private.
                </p>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="fade-in-section group animation-delay-400">
              <div className="h-full p-8 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-4)] transition-all duration-500 border border-[var(--border-subtle)] hover:border-[var(--amber-6)] hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--amber-3)] to-[var(--amber-5)] rounded-[var(--radius-lg)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-7 h-7 text-[var(--amber-11)]" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                  Smart Organization
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Drag-and-drop sorting, custom categories, and featured items. Organize your way.
                </p>
              </div>
            </div>

            {/* Feature Card 4 */}
            <div className="fade-in-section group animation-delay-600">
              <div className="h-full p-8 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-4)] transition-all duration-500 border border-[var(--border-subtle)] hover:border-[var(--copper-6)] hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--copper-3)] to-[var(--copper-5)] rounded-[var(--radius-lg)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-7 h-7 text-[var(--copper-11)]" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                  Affiliate Links
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Automatically convert product links to affiliate links. Monetize your curated collections.
                </p>
              </div>
            </div>

            {/* Feature Card 5 */}
            <div className="fade-in-section group animation-delay-800">
              <div className="h-full p-8 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-4)] transition-all duration-500 border border-[var(--border-subtle)] hover:border-[var(--teed-green-6)] hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--teed-green-3)] to-[var(--teed-green-5)] rounded-[var(--radius-lg)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 text-[var(--teed-green-10)]" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                  Community Profiles
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Build your profile with custom handles. Follow other creators and discover new gear.
                </p>
              </div>
            </div>

            {/* Feature Card 6 */}
            <div className="fade-in-section group animation-delay-1000">
              <div className="h-full p-8 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-4)] transition-all duration-500 border border-[var(--border-subtle)] hover:border-[var(--sky-6)] hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--sky-3)] to-[var(--sky-5)] rounded-[var(--radius-lg)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-7 h-7 text-[var(--sky-11)]" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                  Lightning Fast
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Built with modern tech. Instant updates, real-time changes, and blazing performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section ref={useCasesRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 fade-in-section">
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Perfect for every collection
            </h2>
            <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
              Whatever you collect, Teed makes it beautiful
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Golfers', description: 'Share your bag setup, track club changes, and discover what the pros use', emoji: '⛳' },
              { title: 'Travelers', description: 'Curate your perfect packing list, share travel essentials, and never forget an item', emoji: '✈️' },
              { title: 'Content Creators', description: 'Showcase your gear, monetize with affiliate links, and inspire your audience', emoji: '📸' },
              { title: 'Outdoor Enthusiasts', description: 'Organize hiking gear, camping equipment, and share your adventure setups', emoji: '🏔️' },
              { title: 'Productivity Nerds', description: 'Display your desk setup, tech stack, and daily carry essentials', emoji: '💼' },
              { title: 'Collectors', description: 'Catalog your collections, track acquisitions, and share with fellow enthusiasts', emoji: '🎨' }
            ].map((useCase, index) => (
              <div
                key={index}
                className={`fade-in-section p-8 bg-[var(--surface-elevated)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] hover:border-[var(--teed-green-6)] hover:shadow-[var(--shadow-3)] transition-all duration-300 animation-delay-${index * 200}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-5xl flex-shrink-0">{useCase.emoji}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-[var(--text-secondary)]">
                      {useCase.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--teed-green-2)] via-[var(--teed-green-3)] to-[var(--sky-2)]">
        <div className="max-w-4xl mx-auto text-center fade-in-section">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-primary)] mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl sm:text-2xl text-[var(--text-secondary)] mb-12">
            Join creators and enthusiasts organizing their world with Teed
          </p>
          <Link
            href="/login"
            className="inline-block px-12 py-5 bg-[var(--teed-green-8)] text-white text-xl font-semibold rounded-[var(--radius-xl)] hover:bg-[var(--teed-green-9)] transition-all duration-300 shadow-[var(--shadow-4)] hover:shadow-[var(--shadow-5)] hover:scale-105"
          >
            Create Your First Bag Free
          </Link>
          <p className="mt-6 text-sm text-[var(--text-tertiary)]">
            No credit card required • Free forever
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[var(--surface)] border-t border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-3xl font-bold text-[var(--text-primary)] mb-4">Teed</div>
          <p className="text-[var(--text-secondary)] mb-6">
            Organize. Curate. Share.
          </p>
          <div className="flex justify-center gap-6 text-sm text-[var(--text-tertiary)]">
            <Link href="/login" className="hover:text-[var(--text-primary)] transition-colors">
              Sign In
            </Link>
            <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
              Dashboard
            </Link>
          </div>
          <p className="mt-8 text-xs text-[var(--text-tertiary)]">
            © 2025 Teed. Made with care for organizers everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
}
