'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { AdminUser } from '@/lib/types/admin';
import ApplicationRow from './components/ApplicationRow';
import BatchApproveModal from './components/BatchApproveModal';
import CapacityModal from './components/CapacityModal';
import BetaControlsTab from './components/BetaControlsTab';
import SurveyNotesTab from './components/SurveyNotesTab';

interface BetaDashboardClientProps {
  admin: AdminUser;
}

interface Application {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  priority_score: number | null;
  referral_tier: number | null;
  successful_referrals: number | null;
  approval_odds_percent: number | null;
  survey_responses: Record<string, any> | null;
  source: string | null;
  referred_by_code: string | null;
  referred_by_application_id: string | null;
  waitlist_position: number | null;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  auto_approved: boolean | null;
  auto_approval_reason: string | null;
  created_at: string;
  updated_at: string;
  referrer?: { name: string; email: string } | null;
}

interface Capacity {
  total: number;
  used: number;
  available: number;
  reserved_for_codes: number;
  effective_capacity: number;
  pending_applications: number;
  approved_this_week: number;
  is_at_capacity: boolean;
  percent_full: number;
}

interface Counts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
  waitlisted: number;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'waitlisted';
type SortOption = 'priority' | 'newest' | 'oldest' | 'referrals' | 'odds';
type TopTab = 'applications' | 'controls' | 'survey';

export default function BetaDashboardClient({ admin }: BetaDashboardClientProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [counts, setCounts] = useState<Counts>({ all: 0, pending: 0, approved: 0, rejected: 0, waitlisted: 0 });
  const [capacity, setCapacity] = useState<Capacity | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority');

  // Top tabs
  const [activeTab, setActiveTab] = useState<TopTab>('applications');

  // Modals
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);

  const fetchApplications = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        status: statusFilter,
        sort: sortBy,
        limit: '100',
      });
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/beta/applications?${params}`);
      const data = await res.json();

      if (res.ok) {
        setApplications(data.applications || []);
        setCounts(data.counts || { all: 0, pending: 0, approved: 0, rejected: 0, waitlisted: 0 });
        setCapacity(data.capacity);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchQuery, sortBy]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplications();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleApprove = async (id: string, tier: string = 'standard') => {
    try {
      const res = await fetch(`/api/admin/beta/applications/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', tier }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Refresh the list
        fetchApplications(true);
      } else {
        alert(data.error || 'Failed to approve');
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve application');
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    try {
      const res = await fetch(`/api/admin/beta/applications/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        fetchApplications(true);
      } else {
        alert(data.error || 'Failed to reject');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject application');
    }
  };

  const handleBatchApprove = async (count: number, tier: string) => {
    try {
      const res = await fetch('/api/admin/beta/applications/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, tier }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setShowBatchModal(false);
        fetchApplications(true);
        alert(`Approved ${data.approved_count} applications`);
      } else {
        alert(data.error || 'Failed to batch approve');
      }
    } catch (error) {
      console.error('Error batch approving:', error);
      alert('Failed to batch approve');
    }
  };

  const statusTabs: { key: StatusFilter; label: string; icon: React.ReactNode }[] = [
    { key: 'pending', label: 'Pending', icon: <Clock className="w-4 h-4" /> },
    { key: 'approved', label: 'Approved', icon: <CheckCircle className="w-4 h-4" /> },
    { key: 'rejected', label: 'Rejected', icon: <XCircle className="w-4 h-4" /> },
    { key: 'all', label: 'All', icon: <Users className="w-4 h-4" /> },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'priority', label: 'Priority Score' },
    { value: 'odds', label: 'Approval Odds' },
    { value: 'referrals', label: 'Most Referrals' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-[var(--sand-3)] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">
                  Beta Applications
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  Manage founding member applications
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Capacity indicator — always visible */}
              {capacity && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--sand-2)] rounded-lg">
                  <div className="text-right">
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {capacity.used} / {capacity.total}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {capacity.available} available
                    </div>
                  </div>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: `conic-gradient(var(--teed-green-9) ${capacity.percent_full}%, var(--sand-4) ${capacity.percent_full}%)`,
                    }}
                  >
                    <div className="w-9 h-9 bg-[var(--sand-2)] rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">{Math.round(capacity.percent_full)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions — only on Applications tab */}
              {activeTab === 'applications' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchApplications(true)}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>

                  {admin.role === 'super_admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCapacityModal(true)}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Capacity
                    </Button>
                  )}

                  <Button
                    variant="create"
                    size="sm"
                    onClick={() => setShowBatchModal(true)}
                    disabled={!capacity || capacity.available === 0}
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Batch Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Top Tabs */}
      <div className="sticky top-[73px] z-10 bg-white dark:bg-zinc-900 border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 py-2">
            {([
              { key: 'applications' as TopTab, label: 'Applications', icon: <Users className="w-4 h-4" /> },
              { key: 'controls' as TopTab, label: 'Controls', icon: <Settings className="w-4 h-4" /> },
              { key: 'survey' as TopTab, label: 'Survey', icon: <Sparkles className="w-4 h-4" /> },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[var(--teed-green-9)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--sand-3)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Bar — Applications tab only */}
      {activeTab === 'applications' && <div className="sticky top-[121px] z-10 bg-white dark:bg-zinc-900 border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[var(--border-subtle)] rounded-lg bg-white dark:bg-zinc-900 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-6)]"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[var(--sand-2)] rounded-lg">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    statusFilter === tab.key
                      ? 'bg-white dark:bg-zinc-800 text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-[var(--sand-4)] rounded">
                    {counts[tab.key]}
                  </span>
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-[var(--border-subtle)] rounded-lg bg-white dark:bg-zinc-900 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-6)]"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'applications' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-[var(--text-tertiary)]" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-4" />
                <h3 className="text-lg font-medium text-[var(--text-primary)]">
                  No applications found
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : `No ${statusFilter === 'all' ? '' : statusFilter} applications`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <ApplicationRow
                    key={app.id}
                    application={app}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'controls' && (
          <BetaControlsTab admin={admin} />
        )}

        {activeTab === 'survey' && (
          <SurveyNotesTab />
        )}
      </main>

      {/* Modals */}
      {showBatchModal && (
        <BatchApproveModal
          capacity={capacity}
          onClose={() => setShowBatchModal(false)}
          onApprove={handleBatchApprove}
        />
      )}

      {showCapacityModal && capacity && (
        <CapacityModal
          capacity={capacity}
          onClose={() => setShowCapacityModal(false)}
          onUpdate={() => fetchApplications(true)}
        />
      )}
    </div>
  );
}
