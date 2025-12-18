'use client';

import { useState, useEffect } from 'react';
import FeaturedBagCard, { FeaturedBag } from './FeaturedBagCard';
import ExpandedBagItems from './ExpandedBagItems';

interface FeaturedBagsSectionProps {
  initialBags?: FeaturedBag[];
}

export default function FeaturedBagsSection({ initialBags }: FeaturedBagsSectionProps) {
  const [bags, setBags] = useState<FeaturedBag[]>(initialBags || []);
  const [expandedBagId, setExpandedBagId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!initialBags);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialBags && bags.length === 0) {
      fetchBags();
    }
  }, []);

  const fetchBags = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/featured-bags');
      if (response.ok) {
        const data = await response.json();
        setBags(data.bags || []);
      } else {
        setError(`API returned ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching featured bags:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpand = (bagId: string) => {
    setExpandedBagId(prev => prev === bagId ? null : bagId);
  };

  if (isLoading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Featured Collections
            </h2>
            <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
              Explore curated bags from creators and enthusiasts
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[var(--teed-green-8)] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-500">Error loading bags: {error}</p>
        </div>
      </section>
    );
  }

  if (bags.length === 0) {
    return null;
  }

  // Split bags into top row (3) and bottom row (2)
  const topRowBags = bags.slice(0, 3);
  const bottomRowBags = bags.slice(3, 5);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[var(--surface)]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4">
            Featured Collections
          </h2>
          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
            Explore curated bags from creators and enthusiasts
          </p>
        </div>

        {/* Top Row: 3 bags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {topRowBags.map((bag) => (
            <div key={bag.id} className="flex flex-col">
              <FeaturedBagCard
                bag={bag}
                isExpanded={expandedBagId === bag.id}
                onToggleExpand={() => handleToggleExpand(bag.id)}
              />
              {/* Expansion area */}
              <div className={`bag-expansion ${expandedBagId === bag.id ? 'expanded' : ''}`}>
                <div>
                  {expandedBagId === bag.id && (
                    <div className="mt-3 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] border border-[var(--border-subtle)] overflow-hidden">
                      <ExpandedBagItems
                        items={bag.items}
                        bagCode={bag.code}
                        owner={bag.owner}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Row: 2 bags centered */}
        {bottomRowBags.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {bottomRowBags.map((bag) => (
              <div key={bag.id} className="flex flex-col">
                <FeaturedBagCard
                  bag={bag}
                  isExpanded={expandedBagId === bag.id}
                  onToggleExpand={() => handleToggleExpand(bag.id)}
                />
                {/* Expansion area */}
                <div className={`bag-expansion ${expandedBagId === bag.id ? 'expanded' : ''}`}>
                  <div>
                    {expandedBagId === bag.id && (
                      <div className="mt-3 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] border border-[var(--border-subtle)] overflow-hidden">
                        <ExpandedBagItems
                          items={bag.items}
                          bagCode={bag.code}
                          owner={bag.owner}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
