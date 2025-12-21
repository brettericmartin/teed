'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Maximize, Minimize, X } from 'lucide-react';

interface ItemLink {
  id: string;
  url: string;
  kind: string;
  label: string | null;
  metadata: any;
  is_auto_generated?: boolean;
}

interface Item {
  id: string;
  custom_name: string | null;
  brand: string | null;
  custom_description: string | null;
  notes: string | null;
  quantity: number;
  sort_index: number;
  photo_url: string | null;
  promo_codes: string | null;
  is_featured: boolean;
  links: ItemLink[];
}

interface CarouselViewProps {
  items: Item[];
  heroItemId: string | null;
  onItemClick: (item: Item) => void;
  onLinkClick: (linkId: string, itemId: string, url: string) => void;
}

// Color schemes for text - Using 3rd shade from design system (lightest) with dark shadows
// These light colors ensure text is always readable over photos
const TEXT_COLOR_SCHEMES = [
  {
    name: 'white',
    primary: '#FFFFFF',
    secondary: 'rgba(255,255,255,0.9)',
    shadow: '0 0 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.8)',
    shadowSmall: '0 0 20px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)',
  },
  {
    name: 'sand-3',
    primary: '#F9F3E9', // --sand-3 from design system
    secondary: 'rgba(249,243,233,0.9)',
    shadow: '0 0 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.8)',
    shadowSmall: '0 0 20px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)',
  },
  {
    name: 'sky-3',
    primary: '#E8F1F5', // --sky-3 from design system
    secondary: 'rgba(232,241,245,0.9)',
    shadow: '0 0 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.8)',
    shadowSmall: '0 0 20px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)',
  },
  {
    name: 'copper-3',
    primary: '#FAE7D9', // --copper-3 from design system
    secondary: 'rgba(250,231,217,0.9)',
    shadow: '0 0 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.8)',
    shadowSmall: '0 0 20px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)',
  },
  {
    name: 'teed-green-3',
    primary: '#E3EFE4', // --teed-green-3 from design system
    secondary: 'rgba(227,239,228,0.9)',
    shadow: '0 0 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.8)',
    shadowSmall: '0 0 20px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)',
  },
  {
    name: 'evergreen-3',
    primary: '#E8EEEA', // --evergreen-3 from design system
    secondary: 'rgba(232,238,234,0.9)',
    shadow: '0 0 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.8)',
    shadowSmall: '0 0 20px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)',
  },
];

// Get deterministic color scheme based on item ID
function getColorScheme(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
  }
  return TEXT_COLOR_SCHEMES[Math.abs(hash) % TEXT_COLOR_SCHEMES.length];
}

export function CarouselView({
  items,
  heroItemId,
  onItemClick,
  onLinkClick,
}: CarouselViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInstantTransition, setIsInstantTransition] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sort items - hero first, then featured, then by sort_index
  const sortedItems = [...items].sort((a, b) => {
    if (a.id === heroItemId) return -1;
    if (b.id === heroItemId) return 1;
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return a.sort_index - b.sort_index;
  });

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? sortedItems.length - 1 : prev - 1));
  }, [sortedItems.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === sortedItems.length - 1 ? 0 : prev + 1));
  }, [sortedItems.length]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(goToNext, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, goToNext]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === ' ') {
        e.preventDefault();
        setIsAutoPlaying((prev) => !prev);
      }
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, isFullscreen, toggleFullscreen]);

  // Touch/swipe handling - keeps swipe as backup
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrevious();
    }
    setTouchStart(null);
  };

  // Handle tap navigation on mobile - tap left/right zones to navigate (instant, no fade)
  const handleTapNavigation = (e: React.MouseEvent) => {
    if (!isMobile) return;

    // Don't trigger on buttons or links
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Left third = previous, right third = next, middle = do nothing (let content handle it)
    if (x < width * 0.33) {
      e.stopPropagation();
      setIsInstantTransition(true);
      goToPrevious();
    } else if (x > width * 0.67) {
      e.stopPropagation();
      setIsInstantTransition(true);
      goToNext();
    }
  };

  // Reset instant transition flag after render
  useEffect(() => {
    if (isInstantTransition) {
      // Reset after a brief moment to allow for next animated transition
      const timer = setTimeout(() => setIsInstantTransition(false), 50);
      return () => clearTimeout(timer);
    }
  }, [isInstantTransition, currentIndex]);

  if (sortedItems.length === 0) return null;

  // Fullscreen wrapper classes
  const fullscreenClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-black flex items-center justify-center'
    : 'relative w-full';

  // Carousel container classes
  const carouselClasses = isFullscreen
    ? 'relative w-full h-full overflow-hidden bg-black'
    : 'relative aspect-square max-h-[85vh] w-full max-w-3xl mx-auto overflow-hidden rounded-2xl bg-black';

  return (
    <div className={fullscreenClasses} ref={containerRef}>
      {/* Close button when fullscreen */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-50 p-3 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full transition-all"
          aria-label="Exit fullscreen"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Main Carousel Container */}
      <div
        className={carouselClasses}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleTapNavigation}
      >
        {/* Mobile tap zone indicators - subtle visual hints */}
        {isMobile && sortedItems.length > 1 && (
          <>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-16 flex items-center justify-start pl-2 z-20 pointer-events-none opacity-30">
              <ChevronLeft className="w-5 h-5 text-white drop-shadow-lg" />
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-16 flex items-center justify-end pr-2 z-20 pointer-events-none opacity-30">
              <ChevronRight className="w-5 h-5 text-white drop-shadow-lg" />
            </div>
          </>
        )}
        {/* Slides */}
        {sortedItems.map((item, index) => {
          const isActive = index === currentIndex;
          const colorScheme = getColorScheme(item.id);

          return (
            <div
              key={item.id}
              className={`absolute inset-0 ${
                isInstantTransition ? '' : 'transition-all duration-500 ease-out'
              } ${
                isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
              }`}
            >
              {/* Background Image - preserves user's crop with blurred fill for letterbox */}
              {item.photo_url ? (
                <>
                  {/* Blurred background fill for empty space */}
                  <img
                    src={item.photo_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60"
                    loading={index < 3 ? 'eager' : 'lazy'}
                    aria-hidden="true"
                  />
                  {/* Dark overlay on blurred background */}
                  <div className="absolute inset-0 bg-black/40" />
                  {/* Main image - contained to preserve user's crop */}
                  <img
                    src={item.photo_url}
                    alt={item.custom_name || 'Item'}
                    className="absolute inset-0 w-full h-full object-contain"
                    loading={index < 3 ? 'eager' : 'lazy'}
                  />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
              )}

              {/* Subtle vignette for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />

              {/* Content Overlay - Left aligned */}
              <div
                className="absolute inset-0 flex flex-col justify-end cursor-pointer"
                onClick={() => onItemClick(item)}
              >
                {/* Text content - left aligned, bottom positioned */}
                <div className="p-6 md:p-10 lg:p-12 space-y-3 md:space-y-4 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                  {/* Brand */}
                  {item.brand && (
                    <p
                      className="font-serif text-xl md:text-2xl lg:text-3xl tracking-wide uppercase"
                      style={{
                        color: colorScheme.secondary,
                        textShadow: colorScheme.shadowSmall,
                      }}
                    >
                      {item.brand}
                    </p>
                  )}

                  {/* Product name - HUGE, left aligned, scales down for long names */}
                  <h2
                    className="font-black leading-[0.85] tracking-tighter uppercase line-clamp-3"
                    style={{
                      color: colorScheme.primary,
                      textShadow: colorScheme.shadow,
                      // Scale font size down for longer names
                      fontSize: (() => {
                        const name = item.custom_name || 'Untitled';
                        const len = name.length;
                        if (len > 50) return 'clamp(1.5rem, 5vw, 3rem)';
                        if (len > 35) return 'clamp(1.75rem, 6vw, 4rem)';
                        if (len > 25) return 'clamp(2rem, 7vw, 5rem)';
                        return 'clamp(2.5rem, 10vw, 7rem)';
                      })(),
                    }}
                  >
                    {item.custom_name || 'Untitled'}
                    {item.quantity > 1 && (
                      <span className="text-[0.4em] ml-2 opacity-70">×{item.quantity}</span>
                    )}
                  </h2>

                  {/* Description */}
                  {item.custom_description && (
                    <p
                      className="font-serif text-lg md:text-2xl lg:text-3xl leading-snug line-clamp-2 max-w-2xl"
                      style={{
                        color: colorScheme.secondary,
                        textShadow: colorScheme.shadowSmall,
                      }}
                    >
                      {item.custom_description}
                    </p>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <p
                      className="font-serif text-base md:text-xl lg:text-2xl italic line-clamp-2 max-w-xl opacity-90"
                      style={{
                        color: colorScheme.secondary,
                        textShadow: colorScheme.shadowSmall,
                      }}
                    >
                      "{item.notes}"
                    </p>
                  )}

                </div>
              </div>

              {/* Slide Counter */}
              <div
                className="absolute top-4 right-4 md:top-6 md:right-6 px-5 py-2.5 bg-black/40 backdrop-blur-sm rounded-full text-xl md:text-2xl font-bold"
                style={{
                  color: colorScheme.primary,
                  textShadow: colorScheme.shadowSmall,
                }}
              >
                {index + 1} / {sortedItems.length}
              </div>

              {/* Featured Badge */}
              {item.is_featured && (
                <div className="absolute top-4 left-4 md:top-6 md:left-6 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg md:text-xl font-bold rounded-full shadow-xl">
                  Featured
                </div>
              )}
            </div>
          );
        })}

        {/* Navigation Arrows - hidden on mobile, tap zones used instead */}
        {sortedItems.length > 1 && !isMobile && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-5 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full transition-all hover:scale-110 active:scale-95 shadow-xl"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-5 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full transition-all hover:scale-110 active:scale-95 shadow-xl"
              aria-label="Next slide"
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          </>
        )}

        {/* Controls - Auto-play and Fullscreen */}
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex gap-2">
          <button
            onClick={() => setIsAutoPlaying((prev) => !prev)}
            className="p-3 md:p-4 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full transition-all shadow-xl"
            aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isAutoPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6" /> : <Play className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-3 md:p-4 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full transition-all shadow-xl"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5 md:w-6 md:h-6" /> : <Maximize className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
        </div>
      </div>

      {/* Dot Navigation - hide when fullscreen on mobile for cleaner look */}
      {sortedItems.length > 1 && !isFullscreen && (
        <div className="flex justify-center gap-3 mt-5">
          {sortedItems.map((item, index) => {
            const colorScheme = getColorScheme(item.id);
            const isActive = index === currentIndex;
            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-3 rounded-full transition-all ${
                  isActive ? 'w-12' : 'w-3 bg-[var(--border-subtle)] hover:bg-[var(--text-tertiary)]'
                }`}
                style={isActive ? { backgroundColor: colorScheme.primary } : undefined}
                aria-label={`Go to slide ${index + 1}`}
              />
            );
          })}
        </div>
      )}

      {/* Fullscreen dot navigation - positioned at bottom of screen */}
      {sortedItems.length > 1 && isFullscreen && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-40">
          {sortedItems.map((item, index) => {
            const colorScheme = getColorScheme(item.id);
            const isActive = index === currentIndex;
            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  isActive ? 'w-8' : 'w-2.5 bg-white/40 hover:bg-white/60'
                }`}
                style={isActive ? { backgroundColor: colorScheme.primary } : undefined}
                aria-label={`Go to slide ${index + 1}`}
              />
            );
          })}
        </div>
      )}

      {/* Keyboard Hints */}
      {!isFullscreen && (
        <div className="hidden md:flex justify-center gap-6 mt-4 text-base text-[var(--text-tertiary)]">
          <span>← → Navigate</span>
          <span>Space to {isAutoPlaying ? 'pause' : 'play'}</span>
          <span>F for fullscreen</span>
        </div>
      )}
    </div>
  );
}
