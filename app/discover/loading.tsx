import { SkeletonBagGrid } from '@/components/ui/Skeleton';

export default function DiscoverLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header skeleton */}
      <header className="sticky top-0 z-20 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Title skeleton */}
            <div className="h-8 w-32 bg-[var(--sand-4)] rounded-md animate-pulse" />

            {/* Search bar skeleton */}
            <div className="flex-1 max-w-md">
              <div className="h-10 bg-[var(--sand-4)] rounded-lg animate-pulse" />
            </div>

            {/* Filter buttons skeleton */}
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-[var(--sand-4)] rounded-lg animate-pulse" />
              <div className="h-10 w-24 bg-[var(--sand-4)] rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonBagGrid count={9} />
      </main>
    </div>
  );
}
