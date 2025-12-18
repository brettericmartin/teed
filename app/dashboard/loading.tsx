import { SkeletonBagGrid, Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton height={32} width={200} rounded="md" />
            <div className="mt-2">
              <Skeleton height={16} width={150} rounded="sm" />
            </div>
          </div>
          <Skeleton height={44} width={140} rounded="lg" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Skeleton height={80} width="100%" rounded="xl" />
          <Skeleton height={80} width="100%" rounded="xl" />
          <Skeleton height={80} width="100%" rounded="xl" />
        </div>

        {/* Bags grid skeleton */}
        <SkeletonBagGrid count={6} />
      </div>
    </div>
  );
}
