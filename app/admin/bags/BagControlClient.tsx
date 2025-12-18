'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Package,
  Star,
  Flag,
  EyeOff,
  Eye,
  ExternalLink,
  MoreVertical,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { type AdminRole, type BagForAdmin, ROLE_PERMISSIONS } from '@/lib/types/admin';
import { CATEGORIES, CATEGORIES_WITH_ALL } from '@/lib/categories';

interface Props {
  adminRole: AdminRole;
}

type BagStatus = 'all' | 'featured' | 'flagged' | 'hidden' | 'public' | 'private';

// Use shared categories from lib/categories.ts

interface BagStats {
  featured: number;
  flagged: number;
  hidden: number;
}

interface BagResponse {
  bags: BagForAdmin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: BagStats;
}

export default function BagControlClient({ adminRole }: Props) {
  const [bags, setBags] = useState<BagForAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<BagStats>({ featured: 0, flagged: 0, hidden: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BagStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [actionMenuBagId, setActionMenuBagId] = useState<string | null>(null);
  const [flagModalBag, setFlagModalBag] = useState<BagForAdmin | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BagForAdmin | null>(null);
  const [categoryPickerBag, setCategoryPickerBag] = useState<BagForAdmin | null>(null);
  const [selectedCategoryForBag, setSelectedCategoryForBag] = useState<string>('');

  const permissions = ROLE_PERMISSIONS[adminRole];

  const fetchBags = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', page.toString());
      params.set('limit', '20');

      const response = await fetch(`/api/admin/bags?${params.toString()}`);
      if (response.ok) {
        const data: BagResponse = await response.json();
        setBags(data.bags);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch bags:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, categoryFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchBags();
  }, [fetchBags]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClick = () => setActionMenuBagId(null);
    if (actionMenuBagId) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [actionMenuBagId]);

  const handleAction = async (
    bagId: string,
    action: 'feature' | 'unfeature' | 'flag' | 'unflag' | 'hide' | 'unhide',
    additionalUpdates?: Record<string, string | null>
  ) => {
    setActionLoading(bagId);
    setActionMenuBagId(null);

    try {
      const updates: Record<string, boolean | string | null> = { ...additionalUpdates };

      switch (action) {
        case 'feature':
          updates.is_featured = true;
          break;
        case 'unfeature':
          updates.is_featured = false;
          break;
        case 'flag':
          updates.is_flagged = true;
          updates.flag_reason = flagReason || 'Flagged by admin';
          break;
        case 'unflag':
          updates.is_flagged = false;
          break;
        case 'hide':
          updates.is_hidden = true;
          break;
        case 'unhide':
          updates.is_hidden = false;
          break;
      }

      const response = await fetch(`/api/admin/bags/${bagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const targetBag = bags.find(b => b.id === bagId);
        const newCategory = additionalUpdates?.category || targetBag?.category;

        // Update local state
        setBags((prev) =>
          prev.map((bag) => {
            if (bag.id === bagId) {
              return {
                ...bag,
                category: additionalUpdates?.category || bag.category,
                is_featured:
                  typeof updates.is_featured === 'boolean'
                    ? updates.is_featured
                    : bag.is_featured,
                is_flagged:
                  typeof updates.is_flagged === 'boolean'
                    ? updates.is_flagged
                    : bag.is_flagged,
                flag_reason:
                  updates.is_flagged === false
                    ? null
                    : typeof updates.flag_reason === 'string'
                      ? updates.flag_reason
                      : bag.flag_reason,
                is_hidden:
                  typeof updates.is_hidden === 'boolean'
                    ? updates.is_hidden
                    : bag.is_hidden,
              };
            }
            // If featuring, unfeature other bags in same category
            if (updates.is_featured === true && bag.category === newCategory && bag.is_featured) {
              return { ...bag, is_featured: false };
            }
            return bag;
          })
        );
        setFlagModalBag(null);
        setFlagReason('');
        setCategoryPickerBag(null);
        setSelectedCategoryForBag('');
      } else {
        const error = await response.json();
        alert(error.error || 'Action failed');
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle feature action - prompts for category if missing
  const handleFeature = (bag: BagForAdmin) => {
    if (!bag.category) {
      setCategoryPickerBag(bag);
      setSelectedCategoryForBag('');
    } else {
      handleAction(bag.id, 'feature');
    }
  };

  // Handle feature with category assignment
  const handleFeatureWithCategory = () => {
    if (!categoryPickerBag || !selectedCategoryForBag) return;
    handleAction(categoryPickerBag.id, 'feature', { category: selectedCategoryForBag });
  };

  const handleDelete = async (bag: BagForAdmin) => {
    setActionLoading(bag.id);

    try {
      const response = await fetch(`/api/admin/bags/${bag.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBags((prev) => prev.filter((b) => b.id !== bag.id));
        setTotal((prev) => prev - 1);
        setConfirmDelete(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadges = (bag: BagForAdmin) => {
    const badges = [];

    if (bag.is_featured) {
      badges.push(
        <span
          key="featured"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--amber-4)] text-[var(--amber-11)]"
        >
          <Star className="w-3 h-3" />
          Featured
        </span>
      );
    }

    if (bag.is_flagged) {
      badges.push(
        <span
          key="flagged"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--red-4)] text-[var(--red-11)]"
        >
          <Flag className="w-3 h-3" />
          Flagged
        </span>
      );
    }

    if (bag.is_hidden) {
      badges.push(
        <span
          key="hidden"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--grey-4)] text-[var(--grey-11)]"
        >
          <EyeOff className="w-3 h-3" />
          Hidden
        </span>
      );
    }

    if (!bag.is_public) {
      badges.push(
        <span
          key="private"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--sky-4)] text-[var(--sky-11)]"
        >
          Private
        </span>
      );
    }

    return badges;
  };

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
                Bag Control
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Manage, feature, and moderate bags
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by title, code, or description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--teed-green-6)]"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--teed-green-6)]"
          >
            {CATEGORIES_WITH_ALL.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as BagStatus);
              setPage(1);
            }}
            className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--teed-green-6)]"
          >
            <option value="all">All Bags</option>
            <option value="featured">Featured</option>
            <option value="flagged">Flagged</option>
            <option value="hidden">Hidden</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by);
              setSortOrder(order as 'asc' | 'desc');
              setPage(1);
            }}
            className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--teed-green-6)]"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="updated_at-desc">Recently Updated</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="featured_at-desc">Recently Featured</option>
          </select>

          {/* Refresh */}
          <button
            onClick={fetchBags}
            className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Results count */}
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Showing {bags.length} of {total} bags
        </p>

        {/* Bags Table */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)]">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Bag
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--text-tertiary)]" />
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        Loading bags...
                      </p>
                    </td>
                  </tr>
                ) : bags.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Package className="w-8 h-8 mx-auto text-[var(--text-tertiary)]" />
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        No bags found
                      </p>
                    </td>
                  </tr>
                ) : (
                  bags.map((bag) => (
                    <tr
                      key={bag.id}
                      className={`hover:bg-[var(--surface-elevated)] ${
                        actionLoading === bag.id ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[var(--text-primary)]">
                              {bag.title}
                            </p>
                            <Link
                              href={`/u/${bag.owner?.handle}/${bag.code}`}
                              target="_blank"
                              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)]">
                            /{bag.code}
                          </p>
                          {bag.category && (
                            <p className="text-xs text-[var(--text-tertiary)] mt-1 capitalize">
                              {bag.category}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[var(--teed-green-4)] flex items-center justify-center">
                            <span className="text-xs font-medium text-[var(--teed-green-11)]">
                              {bag.owner?.display_name?.charAt(0)?.toUpperCase() ||
                                '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              {bag.owner?.display_name}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              @{bag.owner?.handle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {getStatusBadges(bag)}
                          {!bag.is_featured &&
                            !bag.is_flagged &&
                            !bag.is_hidden &&
                            bag.is_public && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--teed-green-4)] text-[var(--teed-green-11)]">
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </span>
                            )}
                        </div>
                        {bag.flag_reason && (
                          <p className="text-xs text-[var(--red-11)] mt-1">
                            {bag.flag_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[var(--text-primary)]">
                          {bag.item_count} items
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                          {new Date(bag.created_at).toLocaleDateString()}
                        </p>
                        {bag.updated_at && (
                          <p className="text-xs text-[var(--text-tertiary)]">
                            Updated:{' '}
                            {new Date(bag.updated_at).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuBagId(
                                actionMenuBagId === bag.id ? null : bag.id
                              );
                            }}
                            disabled={actionLoading === bag.id}
                            className="p-2 rounded-lg hover:bg-[var(--surface-elevated)] transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-[var(--text-secondary)]" />
                          </button>

                          {actionMenuBagId === bag.id && (
                            <div
                              className="absolute right-0 mt-2 w-48 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] shadow-lg z-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="py-1">
                                {/* Feature/Unfeature (also controls spotlight) */}
                                {permissions.canHideContent && (
                                  <button
                                    onClick={() =>
                                      bag.is_featured
                                        ? handleAction(bag.id, 'unfeature')
                                        : handleFeature(bag)
                                    }
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-elevated)] flex items-center gap-2"
                                  >
                                    <Star
                                      className={`w-4 h-4 ${
                                        bag.is_featured
                                          ? 'text-[var(--amber-9)] fill-current'
                                          : 'text-[var(--text-secondary)]'
                                      }`}
                                    />
                                    {bag.is_featured ? 'Unfeature' : 'Feature'}
                                  </button>
                                )}

                                {/* Flag/Unflag */}
                                {permissions.canFlagContent && (
                                  <>
                                    {bag.is_flagged ? (
                                      <button
                                        onClick={() =>
                                          handleAction(bag.id, 'unflag')
                                        }
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-elevated)] flex items-center gap-2"
                                      >
                                        <XCircle className="w-4 h-4 text-[var(--teed-green-9)]" />
                                        Remove Flag
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => setFlagModalBag(bag)}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-elevated)] flex items-center gap-2"
                                      >
                                        <Flag className="w-4 h-4 text-[var(--red-9)]" />
                                        Flag Content
                                      </button>
                                    )}
                                  </>
                                )}

                                {/* Hide/Unhide */}
                                {permissions.canHideContent && (
                                  <button
                                    onClick={() =>
                                      handleAction(
                                        bag.id,
                                        bag.is_hidden ? 'unhide' : 'hide'
                                      )
                                    }
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-elevated)] flex items-center gap-2"
                                  >
                                    {bag.is_hidden ? (
                                      <>
                                        <Eye className="w-4 h-4 text-[var(--teed-green-9)]" />
                                        Unhide
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="w-4 h-4 text-[var(--text-secondary)]" />
                                        Hide
                                      </>
                                    )}
                                  </button>
                                )}

                                {/* View */}
                                <Link
                                  href={`/u/${bag.owner?.handle}/${bag.code}`}
                                  target="_blank"
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-elevated)] flex items-center gap-2"
                                >
                                  <ExternalLink className="w-4 h-4 text-[var(--text-secondary)]" />
                                  View Bag
                                </Link>

                                {/* Delete */}
                                {permissions.canDeleteContent && (
                                  <>
                                    <div className="border-t border-[var(--border-subtle)] my-1" />
                                    <button
                                      onClick={() => setConfirmDelete(bag)}
                                      className="w-full px-4 py-2 text-left text-sm text-[var(--red-9)] hover:bg-[var(--red-4)] flex items-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
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

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-secondary)]">Total Bags</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {total}
            </p>
          </div>
          <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-secondary)]">Featured</p>
            <p className="text-2xl font-bold text-[var(--amber-11)]">
              {stats.featured}
            </p>
          </div>
          <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-secondary)]">Flagged</p>
            <p className="text-2xl font-bold text-[var(--red-11)]">
              {stats.flagged}
            </p>
          </div>
          <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-secondary)]">Hidden</p>
            <p className="text-2xl font-bold text-[var(--grey-11)]">
              {stats.hidden}
            </p>
          </div>
        </div>
      </main>

      {/* Flag Modal */}
      {flagModalBag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--red-4)] flex items-center justify-center">
                  <Flag className="w-5 h-5 text-[var(--red-9)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Flag Bag
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {flagModalBag.title}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Reason for flagging
                </label>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] mb-2"
                >
                  <option value="">Select a reason...</option>
                  <option value="Spam or promotional content">
                    Spam or promotional content
                  </option>
                  <option value="Inappropriate content">
                    Inappropriate content
                  </option>
                  <option value="Copyright violation">
                    Copyright violation
                  </option>
                  <option value="Misleading information">
                    Misleading information
                  </option>
                  <option value="Other">Other</option>
                </select>
                {flagReason === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter custom reason..."
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)]"
                  />
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFlagModalBag(null);
                    setFlagReason('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(flagModalBag.id, 'flag')}
                  disabled={!flagReason}
                  className="flex-1 px-4 py-2.5 bg-[var(--red-9)] text-white rounded-lg hover:bg-[var(--red-10)] disabled:opacity-50"
                >
                  Flag Bag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--red-4)] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[var(--red-9)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Delete Bag
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-sm text-[var(--text-primary)] mb-4">
                Are you sure you want to permanently delete{' '}
                <strong>{confirmDelete.title}</strong> by @
                {confirmDelete.owner?.handle}? This will also delete all items
                and links in this bag.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2.5 border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  disabled={actionLoading === confirmDelete.id}
                  className="flex-1 px-4 py-2.5 bg-[var(--red-9)] text-white rounded-lg hover:bg-[var(--red-10)] disabled:opacity-50"
                >
                  {actionLoading === confirmDelete.id
                    ? 'Deleting...'
                    : 'Delete Bag'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Picker Modal */}
      {categoryPickerBag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--amber-4)] flex items-center justify-center">
                  <Star className="w-5 h-5 text-[var(--amber-9)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Feature Bag
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {categoryPickerBag.title}
                  </p>
                </div>
              </div>

              <p className="text-sm text-[var(--text-secondary)] mb-4">
                This bag needs a category to be featured. Please select a category:
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Category
                </label>
                <select
                  value={selectedCategoryForBag}
                  onChange={(e) => setSelectedCategoryForBag(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--teed-green-6)]"
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCategoryPickerBag(null);
                    setSelectedCategoryForBag('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFeatureWithCategory}
                  disabled={!selectedCategoryForBag}
                  className="flex-1 px-4 py-2.5 bg-[var(--amber-9)] text-white rounded-lg hover:bg-[var(--amber-10)] disabled:opacity-50"
                >
                  Feature Bag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
