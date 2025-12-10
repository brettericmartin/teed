'use client';

import { ExternalLink, Trophy } from 'lucide-react';

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

interface ListViewItemProps {
  item: Item;
  isHero: boolean;
  onItemClick: () => void;
  onLinkClick: (linkId: string, itemId: string, url: string) => void;
  getLinkCTA: (link: ItemLink) => string;
  getLinkDomain: (url: string) => string;
}

export default function ListViewItem({
  item,
  isHero,
  onItemClick,
  onLinkClick,
  getLinkCTA,
  getLinkDomain,
}: ListViewItemProps) {
  const primaryLink = item.links.find(l => l.kind === 'product') || item.links[0];

  return (
    <article
      className={`flex items-center gap-4 p-4 bg-[var(--surface)] border-b border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer ${
        isHero ? 'border-l-4 border-l-[var(--amber-6)] bg-[var(--amber-1)] hover:bg-[var(--amber-2)]' : ''
      }`}
      onClick={onItemClick}
    >
      {/* Photo */}
      {item.photo_url ? (
        <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 bg-[var(--sky-2)] rounded-lg overflow-hidden">
          <img
            src={item.photo_url}
            alt={item.custom_name || 'Item photo'}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 bg-[var(--sky-2)] rounded-lg flex items-center justify-center">
          <span className="text-[var(--text-tertiary)] text-xs">No image</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {item.brand && (
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            {item.brand}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate">
            {item.custom_name}
          </h3>
          {item.quantity > 1 && (
            <span className="px-1.5 py-0.5 bg-[var(--sky-3)] text-[var(--evergreen-12)] text-xs font-medium rounded">
              ×{item.quantity}
            </span>
          )}
          {isHero && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-[var(--amber-3)] text-[var(--amber-11)] text-xs font-medium rounded">
              <Trophy className="w-3 h-3 fill-current" />
              Hero
            </span>
          )}
        </div>
        {item.notes && (
          <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5 italic">
            {item.notes}
          </p>
        )}
      </div>

      {/* Primary CTA */}
      {primaryLink && (
        <a
          href={primaryLink.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            onLinkClick(primaryLink.id, item.id, primaryLink.url);
          }}
          className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 min-h-[40px] bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
        >
          <span className="hidden sm:inline">{getLinkCTA(primaryLink)}</span>
          <span className="sm:hidden">Shop</span>
          <span className="hidden xs:inline sm:inline">{getLinkDomain(primaryLink.url)}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </article>
  );
}
