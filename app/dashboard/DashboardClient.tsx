'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Package, User, Settings } from 'lucide-react';
import NewBagModal from './components/NewBagModal';
import { Button } from '@/components/ui/Button';

type Bag = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  is_public: boolean;
  background_image: string | null;
  created_at: string;
  updated_at: string | null;
};

type DashboardClientProps = {
  initialBags: Bag[];
  userHandle: string;
  displayName: string;
};

export default function DashboardClient({
  initialBags,
  userHandle,
  displayName,
}: DashboardClientProps) {
  const router = useRouter();
  const [bags, setBags] = useState<Bag[]>(initialBags);
  const [showNewBagModal, setShowNewBagModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateBag = async (data: { title: string; description?: string; is_public: boolean }) => {
    setIsCreating(true);

    try {
      const response = await fetch('/api/bags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create bag');
      }

      const newBag = await response.json();
      setBags([newBag, ...bags]);
      setShowNewBagModal(false);

      // Redirect to bag editor
      router.push(`/u/${userHandle}/${newBag.code}/edit`);
    } catch (error) {
      console.error('Error creating bag:', error);
      alert('Failed to create bag. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                My Bags
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <Link
                  href={`/u/${userHandle}`}
                  className="inline-flex items-center gap-1.5 py-1.5 px-2 -ml-2 rounded text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors group min-h-[36px]"
                >
                  <User className="w-4 h-4" />
                  <span className="group-hover:underline">@{userHandle}</span>
                </Link>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 py-1.5 px-2 -ml-2 rounded text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors group min-h-[36px]"
                >
                  <Settings className="w-4 h-4" />
                  <span className="group-hover:underline">Settings</span>
                </Link>
              </div>
            </div>
            <Button
              variant="create"
              onClick={() => setShowNewBagModal(true)}
              className="w-full sm:w-auto min-h-[48px]"
            >
              <Plus className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">Create New Bag</span>
              <span className="sm:hidden">New Bag</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {bags.length === 0 ? (
          // Empty State
          <div className="text-center py-20">
            <div className="bg-[var(--sky-3)] w-20 h-20 rounded-full mx-auto flex items-center justify-center">
              <Package className="h-10 w-10 text-[var(--evergreen-10)]" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-[var(--text-primary)]">No bags yet</h3>
            <p className="mt-2 text-base text-[var(--text-secondary)]">
              Get started by creating your first bag.
            </p>
            <div className="mt-8">
              <Button
                variant="create"
                onClick={() => setShowNewBagModal(true)}
              >
                Create Your First Bag
              </Button>
            </div>
          </div>
        ) : (
          // Bags Grid
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bags.map((bag) => (
              <div
                key={bag.id}
                onClick={() => router.push(`/u/${userHandle}/${bag.code}/edit`)}
                className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] border border-[var(--border-subtle)] overflow-hidden hover:shadow-[var(--shadow-3)] transition-all cursor-pointer group"
              >
                {/* Cover Image or Placeholder */}
                <div className="h-40 bg-gradient-to-br from-[var(--teed-green-6)] to-[var(--sky-6)] relative overflow-hidden">
                  {bag.background_image ? (
                    <img
                      src={bag.background_image}
                      alt={bag.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-16 h-16 text-[var(--evergreen-12)] opacity-20" />
                    </div>
                  )}
                  {/* Privacy Badge */}
                  <div className="absolute top-3 right-3">
                    {bag.is_public ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-[var(--evergreen-12)] backdrop-blur-sm">
                        Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/70 text-[var(--text-secondary)] backdrop-blur-sm">
                        Private
                      </span>
                    )}
                  </div>
                </div>

                {/* Bag Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--teed-green-9)] transition-colors line-clamp-1">
                    {bag.title}
                  </h3>
                  {bag.description && (
                    <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2">
                      {bag.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                    <span className="font-medium">/{bag.code}</span>
                    <span>{formatDate(bag.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Bag Modal */}
      {showNewBagModal && (
        <NewBagModal
          isOpen={showNewBagModal}
          onClose={() => setShowNewBagModal(false)}
          onSubmit={handleCreateBag}
          isLoading={isCreating}
        />
      )}
    </div>
  );
}
