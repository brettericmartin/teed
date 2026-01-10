'use client';

import { ExternalLink } from 'lucide-react';

interface EmbedItem {
  id: string;
  name: string;
  brand: string | null;
  photoUrl: string | null;
}

interface EmbedBagViewProps {
  title: string;
  description: string | null;
  ownerHandle: string;
  ownerName: string | null;
  itemCount: number;
  items: EmbedItem[];
  bagUrl: string;
}

export default function EmbedBagView({
  title,
  description,
  ownerHandle,
  ownerName,
  itemCount,
  items,
  bagUrl,
}: EmbedBagViewProps) {
  const displayName = ownerName || ownerHandle;
  const previewItems = items.slice(0, 6);
  const hasMore = items.length > 6;

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden font-sans">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-1">
          <span className="text-[#7A9770] font-medium">@{ownerHandle}</span>
          <span className="opacity-50">·</span>
          <span>{itemCount} items</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-3 gap-0.5 px-0.5">
        {previewItems.map((item) => (
          <div key={item.id} className="aspect-square relative overflow-hidden group">
            <div className="w-full h-full bg-gray-100 dark:bg-gray-800">
              {item.photoUrl ? (
                <img
                  src={item.photoUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-xl font-semibold">
                  {item.brand?.[0] || item.name[0]}
                </div>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2 pt-6 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              {item.brand && (
                <span className="block text-[9px] uppercase tracking-wide text-white/70">
                  {item.brand}
                </span>
              )}
              <span className="block text-[11px] font-medium text-white truncate">
                {item.name}
              </span>
            </div>
          </div>
        ))}
        {hasMore && (
          <div className="aspect-square flex items-center justify-center bg-[#7A9770]/10 dark:bg-[#7A9770]/20 text-[#7A9770] text-lg font-semibold">
            +{items.length - 6}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <a
        href={bagUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 px-4 py-3 bg-gray-50 dark:bg-gray-900 text-[#7A9770] text-sm font-medium border-t border-gray-100 dark:border-gray-800 hover:bg-[#E8F5E9] dark:hover:bg-gray-800 transition-colors"
      >
        <span>See the full collection</span>
        <ExternalLink size={14} />
      </a>
    </div>
  );
}
