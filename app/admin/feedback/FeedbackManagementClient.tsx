'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bug,
  Lightbulb,
  HelpCircle,
  Heart,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Globe,
  Monitor,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { AdminRole } from '@/lib/types/admin';

interface Profile {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Feedback {
  id: string;
  user_id: string | null;
  type: 'bug' | 'feature' | 'question' | 'praise' | 'other';
  category: string | null;
  severity: string | null;
  subject: string;
  message: string;
  page_url: string | null;
  user_agent: string | null;
  status: string;
  priority: string;
  admin_response: string | null;
  assigned_to: string | null;
  resolution_notes: string | null;
  vote_count: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  profiles: Profile | null;
}

interface Stats {
  total: number;
  byType: {
    bug: number;
    feature: number;
    question: number;
    praise: number;
  };
  byStatus: {
    new: number;
    reviewing: number;
    resolved: number;
  };
}

interface Props {
  adminRole: AdminRole;
}

const TYPE_CONFIG = {
  bug: { icon: Bug, color: 'text-red-500', bg: 'bg-red-100', label: 'Bug' },
  feature: { icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-100', label: 'Feature' },
  question: { icon: HelpCircle, color: 'text-sky-500', bg: 'bg-sky-100', label: 'Question' },
  praise: { icon: Heart, color: 'text-pink-500', bg: 'bg-pink-100', label: 'Praise' },
  other: { icon: MessageSquare, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Other' },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  new: { color: 'text-blue-700', bg: 'bg-blue-100', label: 'New' },
  reviewing: { color: 'text-amber-700', bg: 'bg-amber-100', label: 'Reviewing' },
  planned: { color: 'text-purple-700', bg: 'bg-purple-100', label: 'Planned' },
  in_progress: { color: 'text-sky-700', bg: 'bg-sky-100', label: 'In Progress' },
  resolved: { color: 'text-green-700', bg: 'bg-green-100', label: 'Resolved' },
  wontfix: { color: 'text-gray-700', bg: 'bg-gray-100', label: "Won't Fix" },
  duplicate: { color: 'text-gray-700', bg: 'bg-gray-100', label: 'Duplicate' },
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: 'text-gray-500', label: 'Low' },
  normal: { color: 'text-blue-500', label: 'Normal' },
  high: { color: 'text-amber-500', label: 'High' },
  urgent: { color: 'text-red-500', label: 'Urgent' },
};

export default function FeedbackManagementClient({ adminRole }: Props) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail view
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/feedback?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch feedback');

      const data = await res.json();
      setFeedback(data.feedback);
      setStats(data.stats);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [page, typeFilter, statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const updateFeedback = async (id: string, updates: Partial<Feedback>) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!res.ok) throw new Error('Failed to update');

      const data = await res.json();

      // Update local state
      setFeedback((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...data.feedback } : f))
      );

      if (selectedFeedback?.id === id) {
        setSelectedFeedback({ ...selectedFeedback, ...data.feedback });
      }

      fetchFeedback(); // Refresh stats
    } catch (err) {
      console.error('Update error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return null;
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || 'Unknown';
    const os = ua.includes('Windows')
      ? 'Windows'
      : ua.includes('Mac')
        ? 'macOS'
        : ua.includes('Linux')
          ? 'Linux'
          : ua.includes('Android')
            ? 'Android'
            : ua.includes('iPhone')
              ? 'iOS'
              : 'Unknown';
    return { browser, os };
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Feedback Management
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Bug reports, feature requests, and user questions
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="p-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {stats.total}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Total</p>
            </div>
            <div className="p-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{stats.byStatus.new}</p>
              <p className="text-xs text-[var(--text-secondary)]">New</p>
            </div>
            <div className="p-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
              <p className="text-2xl font-bold text-amber-600">
                {stats.byStatus.reviewing}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Reviewing</p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-2xl font-bold text-red-600">{stats.byType.bug}</p>
              <p className="text-xs text-red-600">Bugs</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-2xl font-bold text-amber-600">
                {stats.byType.feature}
              </p>
              <p className="text-xs text-amber-600">Features</p>
            </div>
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
              <p className="text-2xl font-bold text-sky-600">
                {stats.byType.question}
              </p>
              <p className="text-xs text-sky-600">Questions</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-2xl font-bold text-green-600">
                {stats.byStatus.resolved}
              </p>
              <p className="text-xs text-green-600">Resolved</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--teed-green-9)] focus:ring-2 focus:ring-[var(--teed-green-4)] outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)]"
          >
            <option value="">All Types</option>
            <option value="bug">Bugs</option>
            <option value="feature">Features</option>
            <option value="question">Questions</option>
            <option value="praise">Praise</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)]"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="wontfix">Won&apos;t Fix</option>
            <option value="duplicate">Duplicate</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)]"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--teed-green-9)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Feedback List */}
        {!isLoading && feedback.length === 0 && (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            No feedback found matching your filters.
          </div>
        )}

        {!isLoading && feedback.length > 0 && (
          <div className="space-y-4">
            {feedback.map((item) => {
              const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
              const TypeIcon = typeConfig.icon;
              const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.new;
              const priorityConfig = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.normal;
              const isExpanded = selectedFeedback?.id === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden"
                >
                  {/* Header Row */}
                  <button
                    onClick={() =>
                      setSelectedFeedback(isExpanded ? null : item)
                    }
                    className="w-full p-4 flex items-center gap-4 text-left hover:bg-[var(--grey-2)] transition-colors"
                  >
                    <div
                      className={`w-10 h-10 ${typeConfig.bg} rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                        <span
                          className={`text-xs font-medium ${priorityConfig.color}`}
                        >
                          {priorityConfig.label}
                        </span>
                      </div>
                      <h3 className="font-medium text-[var(--text-primary)] truncate">
                        {item.subject || 'No subject'}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] truncate">
                        {item.message || 'No message'}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {formatDate(item.created_at)}
                      </p>
                      {item.profiles && (
                        <p className="text-xs text-[var(--text-secondary)]">
                          @{item.profiles.handle}
                        </p>
                      )}
                    </div>

                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-[var(--text-tertiary)]" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)]" />
                    )}
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border-subtle)] p-4 bg-[var(--grey-1)]">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Left: Content */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-medium text-[var(--text-tertiary)] uppercase mb-1">
                              Message
                            </h4>
                            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                              {item.message}
                            </p>
                          </div>

                          {item.page_url && (
                            <div>
                              <h4 className="text-xs font-medium text-[var(--text-tertiary)] uppercase mb-1">
                                Page URL
                              </h4>
                              <a
                                href={item.page_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[var(--sky-11)] hover:underline flex items-center gap-1"
                              >
                                <Globe className="w-3 h-3" />
                                {item.page_url}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          {item.user_agent && (
                            <div>
                              <h4 className="text-xs font-medium text-[var(--text-tertiary)] uppercase mb-1">
                                Browser
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                <Monitor className="w-4 h-4" />
                                {parseUserAgent(item.user_agent)?.browser} on{' '}
                                {parseUserAgent(item.user_agent)?.os}
                              </div>
                            </div>
                          )}

                          {item.profiles && (
                            <div>
                              <h4 className="text-xs font-medium text-[var(--text-tertiary)] uppercase mb-1">
                                Submitted By
                              </h4>
                              <div className="flex items-center gap-2">
                                {item.profiles.avatar_url ? (
                                  <img
                                    src={item.profiles.avatar_url}
                                    alt=""
                                    className="w-6 h-6 rounded-full"
                                  />
                                ) : (
                                  <User className="w-6 h-6 p-1 bg-[var(--grey-4)] rounded-full text-[var(--text-tertiary)]" />
                                )}
                                <span className="text-sm text-[var(--text-primary)]">
                                  {item.profiles.display_name || item.profiles.handle}
                                </span>
                                <span className="text-xs text-[var(--text-tertiary)]">
                                  @{item.profiles.handle}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right: Actions */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-medium text-[var(--text-tertiary)] uppercase mb-1">
                              Status
                            </label>
                            <select
                              value={item.status}
                              onChange={(e) =>
                                updateFeedback(item.id, { status: e.target.value })
                              }
                              disabled={isUpdating}
                              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm"
                            >
                              <option value="new">New</option>
                              <option value="reviewing">Reviewing</option>
                              <option value="planned">Planned</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="wontfix">Won&apos;t Fix</option>
                              <option value="duplicate">Duplicate</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[var(--text-tertiary)] uppercase mb-1">
                              Priority
                            </label>
                            <select
                              value={item.priority}
                              onChange={(e) =>
                                updateFeedback(item.id, { priority: e.target.value })
                              }
                              disabled={isUpdating}
                              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm"
                            >
                              <option value="low">Low</option>
                              <option value="normal">Normal</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[var(--text-tertiary)] uppercase mb-1">
                              Admin Notes
                            </label>
                            <textarea
                              value={item.resolution_notes || ''}
                              onChange={(e) =>
                                updateFeedback(item.id, {
                                  resolution_notes: e.target.value,
                                })
                              }
                              placeholder="Internal notes..."
                              rows={3}
                              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm resize-none"
                            />
                          </div>

                          {item.resolved_at && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              Resolved {formatDate(item.resolved_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-[var(--text-secondary)]">
              Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of{' '}
              {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
