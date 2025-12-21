'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Play, Pause } from 'lucide-react';

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

// Color schemes for text - Teed brand colors only
// Light colors get dark shadows, dark colors get light shadows
const TEXT_COLOR_SCHEMES = [
  {
    name: 'white',
    primary: '#FFFFFF',
    secondary: 'rgba(255,255,255,0.9)',
    shadow: '0 0 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.8)',
    shadowSmall: '0 0 20px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)',
    button: 'bg-white text-black hover:bg-white/90',
  },
  {
    name: 'sand',
    primary: '#E7DDD0', // Teed sand
    secondary: 'rgba(231,221,208,0.9)',
    shadow: '0 0 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.8)',
    shadowSmall: '0 0 20px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)',
    button: 'bg-[#E7DDD0] text-black hover:bg-[#E7DDD0]/90',
  },
  {
    name: 'sky',
    primary: '#B8D4E3', // Teed sky
    secondary: 'rgba(184,212,227,0.9)',
    shadow: '0 0 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.8)',
    shadowSmall: '0 0 20px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)',
    button: 'bg-[#B8D4E3] text-black hover:bg-[#B8D4E3]/90',
  },
  {
    name: 'copper',
    primary: '#C4A484', // Teed copper
    secondary: 'rgba(196,164,132,0.9)',
    shadow: '0 0 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.8)',
    shadowSmall: '0 0 20px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)',
    button: 'bg-[#C4A484] text-black hover:bg-[#C4A484]/90',
  },
  {
    name: 'evergreen',
    primary: '#1B4D3E', // Teed evergreen
    secondary: 'rgba(27,77,62,0.9)',
    shadow: '0 0 40px rgba(255,255,255,0.95), 0 0 80px rgba(255,255,255,0.7), 0 4px 20px rgba(255,255,255,0.8)',
    shadowSmall: '0 0 20px rgba(255,255,255,0.95), 0 2px 10px rgba(255,255,255,0.8)',
    button: 'bg-[#1B4D3E] text-white hover:bg-[#1B4D3E]/90',
  },
  {
    name: 'dark',
    primary: '#1C1C1C', // Near black
    secondary: 'rgba(28,28,28,0.9)',
    shadow: '0 0 40px rgba(255,255,255,0.95), 0 0 80px rgba(255,255,255,0.7), 0 4px 20px rgba(255,255,255,0.8)',
    shadowSmall: '0 0 20px rgba(255,255,255,0.95), 0 2px 10px rgba(255,255,255,0.8)',
    button: 'bg-black text-white hover:bg-black/90',
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === ' ') {
        e.preventDefault();
        setIsAutoPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Touch/swipe handling
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

  if (sortedItems.length === 0) return null;

  return (
    <div className="relative w-full">
      {/* Main Carousel Container */}
      <div
        className="relative aspect-[9/16] md:aspect-[4/5] lg:aspect-[3/4] max-h-[85vh] w-full overflow-hidden rounded-2xl bg-black"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides */}
        {sortedItems.map((item, index) => {
          const isActive = index === currentIndex;
          const link = item.links.find(l => l.kind === 'product') || item.links[0];
          const colorScheme = getColorScheme(item.id);

          return (
            <div
              key={item.id}
              className={`absolute inset-0 transition-all duration-500 ease-out ${
                isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
              }`}
            >
              {/* Full Background Image */}
              {item.photo_url ? (
                <img
                  src={item.photo_url}
                  alt={item.custom_name || 'Item'}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading={index < 3 ? 'eager' : 'lazy'}
                />
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

                  {/* Product name - HUGE, left aligned */}
                  <h2
                    className="font-black leading-[0.85] tracking-tighter uppercase"
                    style={{
                      color: colorScheme.primary,
                      textShadow: colorScheme.shadow,
                      fontSize: 'clamp(2.5rem, 10vw, 7rem)',
                      wordBreak: 'break-word',
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

                  {/* CTA Button */}
                  {link && (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLinkClick(link.id, item.id, link.url);
                      }}
                      className={`inline-flex items-center gap-2 mt-2 px-6 md:px-8 py-3 md:py-4 ${colorScheme.button} text-sm md:text-base font-semibold rounded-full transition-all shadow-lg hover:scale-105 active:scale-95`}
                    >
                      <span>Shop Now</span>
                      <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                    </a>
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

        {/* Navigation Arrows */}
        {sortedItems.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 p-4 md:p-5 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full transition-all hover:scale-110 active:scale-95 shadow-xl"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 p-4 md:p-5 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full transition-all hover:scale-110 active:scale-95 shadow-xl"
              aria-label="Next slide"
            >
              <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
            </button>
          </>
        )}

        {/* Auto-play Toggle */}
        <button
          onClick={() => setIsAutoPlaying((prev) => !prev)}
          className="absolute bottom-6 right-6 p-4 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full transition-all shadow-xl"
          aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isAutoPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>
      </div>

      {/* Dot Navigation */}
      {sortedItems.length > 1 && (
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

      {/* Keyboard Hints */}
      <div className="hidden md:flex justify-center gap-6 mt-4 text-base text-[var(--text-tertiary)]">
        <span>← → Navigate</span>
        <span>Space to {isAutoPlaying ? 'pause' : 'play'}</span>
      </div>
    </div>
  );
}
