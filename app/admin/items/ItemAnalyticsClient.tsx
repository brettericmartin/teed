'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  TrendingUp,
  Package,
  Tag,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { type AdminRole } from '@/lib/types/admin';

interface Props {
  adminRole: AdminRole;
}

type ViewType = 'overview' | 'brands' | 'items' | 'duplicates';

interface OverviewData {
  totalItems: number;
  totalBagsWithItems: number;
  itemsWithBrand: number;
  uniqueBrands: number;
  topBrands: Array<{ name: string; count: number }>;
  potentialDuplicates: Array<{ name: string; count: number }>;
}

interface Brand {
  name: string;
  count: number;
}

interface Item {
  id: string;
  name: string;
  brand: string | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  bag: {
    id: string;
    code: string;
    title: string;
    owner: { handle: string; display_name: string } | null;
  } | null;
}

interface DuplicateGroup {
  name: string;
  count: number;
  items: Array<{
    id: string;
    name: string;
    brand: string | null;
    photo_url: string | null;
    bag_code: string;
    bag_title: string;
    owner_handle: string;
  }>;
}

export default function ItemAnalyticsClient({ adminRole }: Props) {
  const [view, setView] = useState<ViewType>('overview');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Data states
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('view', view);
      if (searchQuery) params.set('search', searchQuery);
      if (brandFilter) params.set('brand', brandFilter);
      params.set('page', page.toString());
      params.set('limit', '20');

      const response = await fetch(`/api/admin/items?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();

      switch (view) {
        case 'overview':
          setOverview(data);
          break;
        case 'brands':
          setBrands(data.brands || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
          break;
        case 'items':
          setItems(data.items || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
          break;
        case 'duplicates':
          setDuplicates(data.duplicates || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
          break;
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [view, searchQuery, brandFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when changing view or search
  useEffect(() => {
    setPage(1);
  }, [view, searchQuery, brandFilter]);

  const tabs: Array<{ id: ViewType; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'brands', label: 'Brands', icon: <Tag className="w-4 h-4" /> },
    { id: 'items', label: 'All Items', icon: <Package className="w-4 h-4" /> },
    { id: 'duplicates', label: 'Duplicates', icon: <Copy className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 rounded-lg hover:bg-[var(--surface-elevated)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                Item Analytics
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Track items, brands, and detect duplicates
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                view === tab.id
                  ? 'bg-[var(--teed-green-9)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] border border-[var(--border-subtle)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filters (for non-overview views) */}
        {view !== 'overview' && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder={
                  view === 'brands'
                    ? 'Search brands...'
                    : view === 'items'
                      ? 'Search items...'
                      : 'Search duplicates...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--teed-green-6)]"
              />
            </div>

            {view === 'items' && overview?.topBrands && (
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--teed-green-6)]"
              >
                <option value="">All Brands</option>
                {overview.topBrands.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name} ({b.count})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={fetchData}
              className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-[var(--text-tertiary)]" />
          </div>
        )}

        {/* Overview View */}
        {!loading && view === 'overview' && overview && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Items"
                value={overview.totalItems.toLocaleString()}
                color="teed-green"
              />
              <StatCard
                label="Bags with Items"
                value={overview.totalBagsWithItems.toLocaleString()}
                color="sky"
              />
              <StatCard
                label="Unique Brands"
                value={overview.uniqueBrands.toLocaleString()}
                color="amber"
              />
              <StatCard
                label="Items with Brand"
                value={`${Math.round((overview.itemsWithBrand / overview.totalItems) * 100)}%`}
                color="copper"
              />
            </div>

            {/* Top Brands */}
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Top Brands
                </h2>
                <button
                  onClick={() => setView('brands')}
                  className="text-sm text-[var(--teed-green-9)] hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {overview.topBrands.map((brand, index) => (
                  <div key={brand.name} className="flex items-center gap-4">
                    <span className="w-6 text-sm text-[var(--text-tertiary)]">
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-[var(--text-primary)]">
                          {brand.name}
                        </span>
                        <span className="text-sm text-[var(--text-secondary)]">
                          {brand.count} items
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--teed-green-9)] rounded-full"
                          style={{
                            width: `${(brand.count / overview.topBrands[0].count) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Potential Duplicates */}
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Potential Duplicates
                </h2>
                <button
                  onClick={() => setView('duplicates')}
                  className="text-sm text-[var(--teed-green-9)] hover:underline"
                >
                  View all
                </button>
              </div>
              {overview.potentialDuplicates.length > 0 ? (
                <div className="space-y-2">
                  {overview.potentialDuplicates.map((dup) => (
                    <div
                      key={dup.name}
                      className="flex items-center justify-between p-3 bg-[var(--surface-elevated)] rounded-lg"
                    >
                      <span className="text-[var(--text-primary)]">{dup.name}</span>
                      <span className="px-2 py-0.5 bg-[var(--amber-4)] text-[var(--amber-11)] rounded-full text-xs font-medium">
                        {dup.count} occurrences
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  No duplicate items detected
                </p>
              )}
            </div>
          </div>
        )}

        {/* Brands View */}
        {!loading && view === 'brands' && (
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)]">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {brands.map((brand, index) => (
                  <tr key={brand.name} className="hover:bg-[var(--surface-elevated)]">
                    <td className="px-6 py-4 text-sm text-[var(--text-tertiary)]">
                      #{(page - 1) * 20 + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-[var(--text-primary)]">
                        {brand.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-[var(--text-primary)]">
                      {brand.count}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setBrandFilter(brand.name);
                          setView('items');
                        }}
                        className="text-sm text-[var(--teed-green-9)] hover:underline"
                      >
                        View items
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Items View */}
        {!loading && view === 'items' && (
          <>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Showing {items.length} of {total} items
            </p>
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)]">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Bag
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--surface-elevated)]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.photo_url ? (
                              <img
                                src={item.photo_url}
                                alt={item.name}
                                className="w-10 h-10 rounded-lg object-cover bg-[var(--surface-elevated)]"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center">
                                <Package className="w-5 h-5 text-[var(--text-tertiary)]" />
                              </div>
                            )}
                            <span className="font-medium text-[var(--text-primary)]">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {item.brand ? (
                            <span className="px-2 py-0.5 bg-[var(--sky-4)] text-[var(--sky-11)] rounded text-xs font-medium">
                              {item.brand}
                            </span>
                          ) : (
                            <span className="text-[var(--text-tertiary)]">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                          {item.bag?.title || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                          @{item.bag?.owner?.handle || 'unknown'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.bag && (
                            <Link
                              href={`/u/${item.bag.owner?.handle}/${item.bag.code}`}
                              target="_blank"
                              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Duplicates View */}
        {!loading && view === 'duplicates' && (
          <>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Found {total} items appearing in multiple bags
            </p>
            <div className="space-y-4">
              {duplicates.map((group) => (
                <div
                  key={group.name}
                  className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden"
                >
                  <div className="px-6 py-4 bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Copy className="w-5 h-5 text-[var(--amber-9)]" />
                      <span className="font-semibold text-[var(--text-primary)]">
                        {group.name}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-[var(--amber-4)] text-[var(--amber-11)] rounded-full text-xs font-medium">
                      {group.count} occurrences
                    </span>
                  </div>
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="px-6 py-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {item.photo_url ? (
                            <img
                              src={item.photo_url}
                              alt={item.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-[var(--surface-elevated)]" />
                          )}
                          <div>
                            <p className="text-sm text-[var(--text-primary)]">
                              {item.bag_title}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)]">
                              @{item.owner_handle}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/u/${item.owner_handle}/${item.bag_code}`}
                          target="_blank"
                          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && view !== 'overview' && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface-elevated)] flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface-elevated)] flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'teed-green' | 'sky' | 'amber' | 'copper';
}) {
  const colorClasses = {
    'teed-green': 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)]',
    sky: 'bg-[var(--sky-4)] text-[var(--sky-11)]',
    amber: 'bg-[var(--amber-4)] text-[var(--amber-11)]',
    copper: 'bg-[var(--copper-4)] text-[var(--copper-11)]',
  };

  return (
    <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
      <p className="text-sm text-[var(--text-secondary)]">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colorClasses[color].split(' ')[1]}`}>
        {value}
      </p>
    </div>
  );
}
