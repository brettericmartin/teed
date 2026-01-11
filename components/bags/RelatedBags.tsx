'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ArrowRight, ChevronRight, Loader2, DollarSign, Crown, GitFork, Link2 } from 'lucide-react';
import type { RelationshipType } from '@/lib/types/bagCollection';
import { getRelationshipLabel } from '@/lib/types/bagCollection';

interface RelatedBagData {
  id: string;
  relationship_type: RelationshipType;
  description: string | null;
  related_bag: {
    id: string;
    code: string;
    title: string;
    description: string | null;
    is_public: boolean;
    owner: {
      handle: string;
      display_name: string;
    };
  };
}

interface RelatedBagsProps {
  bagCode: string;
  showIfEmpty?: boolean;
}

export default function RelatedBags({ bagCode, showIfEmpty = false }: RelatedBagsProps) {
  const [relatedBags, setRelatedBags] = useState<RelatedBagData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRelatedBags();
  }, [bagCode]);

  const fetchRelatedBags = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bags/${bagCode}/related`);
      if (!response.ok) {
        throw new Error('Failed to fetch related bags');
      }
      const data = await response.json();
      setRelatedBags(data);
    } catch (err) {
      setError('Unable to load related bags');
      console.error('[RelatedBags] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Don't show loading state for related bags
  }

  if (error || (relatedBags.length === 0 && !showIfEmpty)) {
    return null;
  }

  const getRelationshipIcon = (type: RelationshipType) => {
    switch (type) {
      case 'budget_version':
        return <DollarSign className="w-3.5 h-3.5" />;
      case 'premium_version':
        return <Crown className="w-3.5 h-3.5" />;
      case 'sequel':
        return <ArrowRight className="w-3.5 h-3.5" />;
      case 'alternative':
        return <GitFork className="w-3.5 h-3.5" />;
      case 'companion':
        return <Link2 className="w-3.5 h-3.5" />;
      default:
        return <Package className="w-3.5 h-3.5" />;
    }
  };

  const getRelationshipColor = (type: RelationshipType) => {
    switch (type) {
      case 'budget_version':
        return 'bg-[var(--teed-green-3)] text-[var(--teed-green-11)] border-[var(--teed-green-6)]';
      case 'premium_version':
        return 'bg-[var(--amber-3)] text-[var(--amber-11)] border-[var(--amber-6)]';
      case 'sequel':
        return 'bg-[var(--sky-3)] text-[var(--sky-11)] border-[var(--sky-6)]';
      case 'alternative':
        return 'bg-[var(--copper-3)] text-[var(--copper-11)] border-[var(--copper-6)]';
      case 'companion':
        return 'bg-[var(--sand-3)] text-[var(--sand-11)] border-[var(--sand-6)]';
      default:
        return 'bg-[var(--surface-alt)] text-[var(--text-secondary)] border-[var(--border-subtle)]';
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Package className="w-4 h-4 text-[var(--text-secondary)]" />
        Related Bags
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {relatedBags.map((item) => (
          <Link
            key={item.id}
            href={`/u/${item.related_bag.owner.handle}/${item.related_bag.code}`}
            className="group flex items-start gap-3 p-3 bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] rounded-lg border border-[var(--border-subtle)] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`
                    inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded border
                    ${getRelationshipColor(item.relationship_type)}
                  `}
                >
                  {getRelationshipIcon(item.relationship_type)}
                  {getRelationshipLabel(item.relationship_type)}
                </span>
              </div>

              <h4 className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--teed-green-9)] transition-colors">
                {item.related_bag.title}
              </h4>

              {item.description && (
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-1">
                  {item.description}
                </p>
              )}

              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                by {item.related_bag.owner.display_name || item.related_bag.owner.handle}
              </p>
            </div>

            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors flex-shrink-0 mt-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
