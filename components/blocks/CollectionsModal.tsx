'use client';

import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BagCard, Bag } from '@/components/bags';

const ITEMS_PER_PAGE = 12;

interface CollectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bags: Bag[];
  handle: string;
  isOwner?: boolean;
  featuredBagIds?: string[];
  onToggleFeatured?: (bagId: string) => void;
}

export default function CollectionsModal({
  isOpen,
  onClose,
  bags,
  handle,
  isOwner = false,
  featuredBagIds = [],
  onToggleFeatured,
}: CollectionsModalProps) {
  const router = useRouter();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Handle mounting for portal
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Same pattern as CarouselView.tsx
    setPortalContainer(document.body);
  }, []);

  // Reset page when modal opens
  useLayoutEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on prop change
      setCurrentPage(0);
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleEscape]);

  // Pagination
  const totalBags = bags.length;
  const totalPages = Math.ceil(totalBags / ITEMS_PER_PAGE);
  const needsPagination = totalBags > ITEMS_PER_PAGE;
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const displayBags = bags.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const isFeaturedOnProfile = (bagId: string) => featuredBagIds.includes(bagId);

  const handleBagClick = (bag: Bag) => {
    onClose();
    if (isOwner) {
      router.push(`/u/${handle}/${bag.code}/edit`);
    } else {
      router.push(`/u/${handle}/${bag.code}`);
    }
  };

  if (!isOpen || !portalContainer) {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="collections-modal-title"
    >
      <div
        className="bg-[var(--surface)] rounded-xl sm:rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl max-h-[90vh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border-subtle)]">
          <h2
            id="collections-modal-title"
            className="text-lg font-semibold text-[var(--text-primary)]"
          >
            All Collections ({totalBags})
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--surface-hover)] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Modal content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {displayBags.map((bag) => (
              <BagCard
                key={bag.id}
                bag={bag}
                size="standard"
                showFeaturedStar
                isFeaturedOnProfile={isFeaturedOnProfile(bag.id)}
                isOwner={isOwner}
                onToggleFeatured={onToggleFeatured}
                onClick={() => handleBagClick(bag)}
              />
            ))}
          </div>

          {/* Pagination */}
          {needsPagination && (
            <div className="mt-4 sm:mt-6 flex flex-col items-center gap-2">
              <span className="text-xs text-[var(--text-tertiary)]">
                {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalBags)} of {totalBags}
              </span>

              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--teed-green-9)] bg-[var(--surface-hover)] hover:bg-[var(--surface-active)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-0.5 sm:gap-1">
                  {(() => {
                    const maxVisible = 5;
                    const pages: (number | 'ellipsis')[] = [];

                    if (totalPages <= maxVisible) {
                      for (let i = 0; i < totalPages; i++) pages.push(i);
                    } else {
                      pages.push(0);
                      if (currentPage > 2) pages.push('ellipsis');
                      const start = Math.max(1, currentPage - 1);
                      const end = Math.min(totalPages - 2, currentPage + 1);
                      for (let i = start; i <= end; i++) {
                        if (!pages.includes(i)) pages.push(i);
                      }
                      if (currentPage < totalPages - 3) pages.push('ellipsis');
                      if (!pages.includes(totalPages - 1)) pages.push(totalPages - 1);
                    }

                    return pages.map((page, idx) => {
                      if (page === 'ellipsis') {
                        return <span key={`ellipsis-${idx}`} className="px-1 text-[var(--text-tertiary)]">...</span>;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                            page === currentPage
                              ? 'bg-[var(--teed-green-9)] text-white'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                          }`}
                        >
                          {page + 1}
                        </button>
                      );
                    });
                  })()}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--teed-green-9)] bg-[var(--surface-hover)] hover:bg-[var(--surface-active)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex-shrink-0 flex justify-center px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--border-subtle)]">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--teed-green-9)] bg-[var(--surface-hover)] hover:bg-[var(--surface-active)] rounded-full transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalContainer);
}
