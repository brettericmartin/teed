import Link from 'next/link';
import { ItemImage } from '@/components/ui/ItemImage';

export interface SetupCardCurator {
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface SetupCardProps {
  href: string;
  title: string;
  /** The bag's cover photo (the real room). */
  coverUrl: string | null;
  /** Up to four item photos for the 2 x 2 tile fallback when there is no cover. */
  itemPhotos: { url: string; label: string }[];
  /** Pre-formatted total line, e.g. "Total listed $6,120 · 11 of 13 priced". Empty when unpriced. */
  totalLine: string;
  itemCount: number;
  curator: SetupCardCurator;
}

/**
 * Index card for a setup bag (design spec section 6). Reads as a library, not a
 * feed: hairline border, no shadow, no lift; hover only moves the border colour.
 * Every image goes through ItemImage so a rate-limited file never shows a broken glyph.
 */
export function SetupCard({ href, title, coverUrl, itemPhotos, totalLine, itemCount, curator }: SetupCardProps) {
  const curatorName = curator.display_name || curator.handle;
  const tiles = itemPhotos.slice(0, 4);

  return (
    <Link
      href={href}
      className="group flex flex-col bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden hover:border-[var(--evergreen-6)] focus-visible:border-[var(--evergreen-6)] transition-colors"
    >
      <div className="relative w-full aspect-video bg-[var(--sky-2)] overflow-hidden">
        {coverUrl ? (
          <ItemImage
            src={coverUrl}
            alt={`${title} room`}
            fallbackLabel={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : tiles.length > 0 ? (
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-[var(--border-subtle)]">
            {Array.from({ length: 4 }).map((_, i) => {
              const tile = tiles[i];
              return (
                <div key={i} className="relative bg-[var(--surface)] overflow-hidden">
                  {tile ? (
                    <ItemImage
                      src={tile.url}
                      alt={tile.label}
                      fallbackLabel={tile.label}
                      className="absolute inset-0 w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[var(--sky-2)]" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--text-tertiary)]">
            No photos yet
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] leading-snug line-clamp-2">
          {title}
        </h3>
        <p className="text-sm tabular-nums text-[var(--text-secondary)]">
          {totalLine ? `${totalLine} · ` : ''}
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          {curator.avatar_url ? (
            <span className="w-5 h-5 rounded-full overflow-hidden bg-[var(--sky-2)] flex-shrink-0">
              <ItemImage
                src={curator.avatar_url}
                alt={curatorName}
                fallbackLabel={curatorName}
                className="w-full h-full object-cover"
              />
            </span>
          ) : (
            <span className="w-5 h-5 rounded-full bg-[var(--teed-green-3)] text-[var(--teed-green-11)] text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
              {curatorName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="truncate">@{curator.handle}</span>
        </div>
      </div>
    </Link>
  );
}
