import { SkeletonBagHeader, SkeletonItemGrid } from '@/components/ui/Skeleton';

export default function BagDetailLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonBagHeader />

        <div className="mt-8">
          <SkeletonItemGrid count={8} />
        </div>
      </div>
    </div>
  );
}
