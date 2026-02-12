import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

interface BagEmbedProps {
  handle: string;
  code: string;
}

export default async function BagEmbed({ handle, code }: BagEmbedProps) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: bag } = await supabase
    .from('bags')
    .select(
      `
      id, title, description, code,
      profiles!inner(handle, display_name),
      items(id, name, brand, photo_url)
    `
    )
    .eq('code', code)
    .eq('is_public', true)
    .single();

  if (!bag) {
    return (
      <div className="my-6 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
        <p className="text-sm text-[var(--text-tertiary)]">Bag not found or is private.</p>
      </div>
    );
  }

  const items = (bag.items || []) as Array<{
    id: string;
    name: string;
    brand: string | null;
    photo_url: string | null;
  }>;
  const previewItems = items.slice(0, 4);

  return (
    <div className="my-6 rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] overflow-hidden">
      {/* Item photo grid */}
      {previewItems.length > 0 && (
        <div className="grid grid-cols-4 h-24">
          {previewItems.map((item) => (
            <div
              key={item.id}
              className="bg-[var(--surface-hover)] overflow-hidden"
            >
              {item.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photo_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-tertiary)]">
                  {item.brand || item.name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="p-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-base font-semibold text-[var(--text-primary)] truncate">
            {bag.title}
          </p>
          <p className="text-sm text-[var(--text-tertiary)]">
            by @{handle} · {items.length} item{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href={`/u/${handle}/${code}`}
          className="shrink-0 px-4 py-2 text-sm font-medium text-white bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] rounded-lg transition-colors"
        >
          View Bag
        </Link>
      </div>
    </div>
  );
}
