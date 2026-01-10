'use client';

import { ExternalLink } from 'lucide-react';

interface EmbedBag {
  code: string;
  title: string;
  itemCount: number;
}

interface EmbedProfileViewProps {
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  bagCount: number;
  bags: EmbedBag[];
  profileUrl: string;
}

export default function EmbedProfileView({
  handle,
  displayName,
  avatarUrl,
  bio,
  bagCount,
  bags,
  profileUrl,
}: EmbedProfileViewProps) {
  const name = displayName || handle;
  const previewBags = bags.slice(0, 3);

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#7A9770] text-white text-xl font-semibold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {name}
          </h2>
          <span className="text-sm text-[#7A9770]">@{handle}</span>
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-sm text-gray-600 dark:text-gray-400 px-4 pb-3 line-clamp-2">
          {bio}
        </p>
      )}

      {/* Stats */}
      <div className="flex justify-center py-3 border-t border-b border-gray-100 dark:border-gray-800">
        <div className="flex flex-col items-center">
          <span className="text-xl font-semibold text-gray-900 dark:text-white">
            {bagCount}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {bagCount === 1 ? 'Collection' : 'Collections'}
          </span>
        </div>
      </div>

      {/* Collections Preview */}
      {previewBags.length > 0 && (
        <div className="p-2">
          {previewBags.map((bag) => (
            <a
              key={bag.code}
              href={`${profileUrl}/${bag.code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {bag.title}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {bag.itemCount} items
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Footer CTA */}
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 px-4 py-3 bg-gray-50 dark:bg-gray-900 text-[#7A9770] text-sm font-medium border-t border-gray-100 dark:border-gray-800 hover:bg-[#E8F5E9] dark:hover:bg-gray-800 transition-colors"
      >
        <span>View all collections</span>
        <ExternalLink size={14} />
      </a>
    </div>
  );
}
