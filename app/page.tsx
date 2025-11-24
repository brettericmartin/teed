'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Camera, Share2, Sparkles, TrendingUp, Users, Zap } from 'lucide-react';

const ROTATING_WORDS = [
  'Gear',
  'Golf Bag',
  'Makeup Kit',
  'Shopping Haul',
  'Desk Setup',
  'Camera Kit',
  'Travel Kit',
  'Skincare',
  'Tech Stack',
  'Fitness Gear',
  'Daily Carry',
  'Book Collection',
  'Art Supplies',
  'Kitchen Setup',
];

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showFixedHero, setShowFixedHero] = useState(true);
  const [heroOpacity, setHeroOpacity] = useState(1);
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const useCasesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);

    // Scroll-triggered word rotation
    const handleScroll = () => {
      if (!heroRef.current) return;

      const heroRect = heroRef.current.getBoundingClientRect();
      const heroHeight = heroRef.current.offsetHeight;
      // Calculate scroll progress through the hero section
      const scrollProgress = Math.max(0, Math.min(1, -heroRect.top / (heroHeight - window.innerHeight)));

      const wordIndex = Math.min(
        ROTATING_WORDS.length - 1,
        Math.floor(scrollProgress * ROTATING_WORDS.length)
      );

      setCurrentWordIndex(wordIndex);

      // Smoothly fade out fixed hero when approaching end of hero section
      const heroBottom = heroRect.bottom;
      // Start fading when hero bottom is within 600px of viewport top (earlier = smoother)
      const fadeStartThreshold = 600;
      if (heroBottom > fadeStartThreshold) {
        setHeroOpacity(1);
        setShowFixedHero(true);
      } else if (heroBottom > 100) {
        // Smoothly interpolate opacity from 1 to 0, with easing
        const rawOpacity = (heroBottom - 100) / (fadeStartThreshold - 100);
        // Apply ease-out curve for smoother visual transition
        const opacity = rawOpacity * rawOpacity;
        setHeroOpacity(opacity);
        setShowFixedHero(true);
      } else {
        // Fully hide before the features section appears
        setHeroOpacity(0);
        setShowFixedHero(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

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
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden">
      {/* Hero Section - Creates scroll distance for word cycling */}
      <section ref={heroRef} className="relative" style={{ height: `${100 + ROTATING_WORDS.length * 10}vh` }}>

        {/* "Share your" text - positioned above the laptop screen */}
        {showFixedHero && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 transition-all duration-700 pointer-events-none top-[12%] sm:top-[10%] md:top-[8%] ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ zIndex: 50, opacity: isVisible ? heroOpacity : 0 }}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-[var(--text-primary)] whitespace-nowrap drop-shadow-sm">
            Share your
          </h2>
        </div>
        )}

        {/* Fixed layers - stay in place while scrolling through hero section */}
        {showFixedHero && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>

          {/* Solid background - fades out slower than content to hide features underneath */}
          <div
            className="absolute inset-0 transition-opacity duration-200"
            style={{
              backgroundColor: '#dfd5cf',
              zIndex: 0,
              // Background stays more opaque longer, then fades quickly at the end
              opacity: Math.min(1, heroOpacity * 1.5)
            }}
          />

          {/* Layer 1: Scrolling words - centered in screen area */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center top-[22%] sm:top-[21%] md:top-[20%] h-[5%] w-[10%] transition-opacity duration-150"
            style={{ zIndex: 1, opacity: heroOpacity }}
          >
            <div className="relative flex items-center justify-center">
              {ROTATING_WORDS.map((word, index) => (
                <span
                  key={word}
                  className={`absolute text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold text-[var(--teed-green-10)] transition-all duration-300 whitespace-nowrap ${
                    index === currentWordIndex
                      ? 'opacity-100 transform translate-y-0'
                      : index < currentWordIndex
                      ? 'opacity-0 transform -translate-y-3'
                      : 'opacity-0 transform translate-y-3'
                  }`}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          {/* Layer 2 (FRONT): Hero image with transparent laptop screen */}
          <div className="absolute inset-0 transition-opacity duration-150" style={{ zIndex: 10, opacity: heroOpacity }}>
            <Image
              src="/hero-screen-v11.png"
              alt="Curated collection of gear - golf clubs, camera, laptop, makeup, and more"
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>

          {/* CTA Button - positioned on laptop trackpad */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-auto top-[44%] sm:top-[43%] md:top-[42%] ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ zIndex: 20, opacity: isVisible ? heroOpacity : 0 }}
          >
            <Link
              href="/discover"
              className="group relative inline-flex px-6 py-3 sm:px-8 sm:py-3 md:px-10 md:py-4 bg-[var(--teed-green-8)] text-white text-base sm:text-lg font-semibold rounded-[var(--radius-xl)] hover:bg-[var(--teed-green-9)] transition-all duration-300 shadow-[var(--shadow-4)] hover:shadow-[var(--shadow-5)] hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10">Explore</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--teed-green-9)] to-[var(--teed-green-10)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>

          {/* Scroll hint */}
          <div
            className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-300 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ zIndex: 20, opacity: isVisible ? heroOpacity : 0 }}
          >
            <div className="flex flex-col items-center gap-2 text-[var(--text-secondary)]">
              <span className="text-sm font-medium">Scroll to explore</span>
              <div className="w-6 h-10 border-2 border-[var(--text-tertiary)] rounded-full flex items-start justify-center p-2">
                <div className="w-1 h-3 bg-[var(--text-tertiary)] rounded-full animate-scroll" />
              </div>
            </div>
          </div>

          {/* Bottom gradient fade for smooth transition to features section */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{
              zIndex: 30,
              background: 'linear-gradient(to bottom, transparent, var(--surface-elevated))'
            }}
          />
        </div>
        )}
      </section>

      {/* Transition spacer - creates smooth color transition from hero to features */}
      <div
        className="relative h-32"
        style={{
          background: 'linear-gradient(to bottom, #dfd5cf 0%, var(--surface-elevated) 100%)'
        }}
      />

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
