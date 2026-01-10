'use client';

import { ExternalLink, ShoppingBag } from 'lucide-react';

interface EmbedItemCardProps {
  name: string;
  brand: string | null;
  description: string | null;
  photoUrl: string | null;
  whyChosen: string | null;
  purchaseUrl: string | null;
  bagTitle: string;
  ownerHandle: string;
  ownerName: string | null;
  bagUrl: string;
}

export default function EmbedItemCard({
  name,
  brand,
  description,
  photoUrl,
  whyChosen,
  purchaseUrl,
  bagTitle,
  ownerHandle,
  ownerName,
  bagUrl,
}: EmbedItemCardProps) {
  const displayName = ownerName || ownerHandle;

  return (
    <div className="flex bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden font-sans max-w-[500px]">
      {/* Image */}
      <div className="w-[140px] flex-shrink-0 bg-gray-100 dark:bg-gray-800">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full min-h-[140px] flex items-center justify-center text-gray-400 dark:text-gray-600">
            <ShoppingBag size={32} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3.5 flex flex-col min-w-0">
        {brand && (
          <span className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-500 mb-0.5">
            {brand}
          </span>
        )}
        <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight mb-2">
          {name}
        </h3>

        {whyChosen && (
          <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-2 line-clamp-2">
            &ldquo;{whyChosen}&rdquo;
          </p>
        )}

        {description && !whyChosen && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {description}
          </p>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-500 mt-auto mb-2.5">
          <span>From </span>
          <a
            href={bagUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7A9770] font-medium hover:underline"
          >
            {bagTitle}
          </a>
          <span> by @{ownerHandle}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {purchaseUrl && (
            <a
              href={purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#7A9770] hover:bg-[#6B8A62] text-white text-xs font-medium rounded-md transition-colors"
            >
              View Product
              <ExternalLink size={12} />
            </a>
          )}
          <a
            href={bagUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 bg-transparent border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-md hover:border-[#7A9770] hover:text-[#7A9770] transition-colors"
          >
            See Collection
          </a>
        </div>
      </div>
    </div>
  );
}
