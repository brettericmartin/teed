'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  Clock,
  User,
  Sparkles,
  FileText,
} from 'lucide-react';
import { AdminRole } from '@/lib/types/admin';
import type {
  StrategicProposal,
  ProposalStats,
  ProposalStatus,
  ProposalCategory,
} from '@/lib/types/proposal';
import {
  PROPOSAL_STATUS_CONFIG,
  PROPOSAL_CATEGORY_CONFIG,
  CONFIDENCE_CONFIG,
} from '@/lib/types/proposal';

interface Props {
  adminRole: AdminRole;
}

export default function ProposalsClient({ adminRole }: Props) {
  const [proposals, setProposals] = useState<StrategicProposal[]>([]);
  const [stats, setStats] = useState<ProposalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail view
  const [expandedProposalId, setExpandedProposalId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Local feedback state for real-time editing
  const [localFeedback, setLocalFeedback] = useState<Record<string, string>>({});
  const [localRationale, setLocalRationale] = useState<Record<string, string>>({});

  const fetchProposals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/proposals?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch proposals');

      const data = await res.json();
      setProposals(data.proposals);
      setStats(data.stats);
      setTotal(data.total);
      setTotalPages(data.totalPages);

      // Initialize local feedback state
      const feedback: Record<string, string> = {};
      const rationale: Record<string, string> = {};
      data.proposals.forEach((p: StrategicProposal) => {
        feedback[p.id] = p.admin_feedback || '';
        rationale[p.id] = p.decision_rationale || '';
      });
      setLocalFeedback(feedback);
      setLocalRationale(rationale);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const updateProposal = async (
    id: string,
    updates: { status?: ProposalStatus; admin_feedback?: string; decision_rationale?: string }
  ) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to update');

      const data = await res.json();

      // Update local state
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? data.proposal : p))
      );

      fetchProposals(); // Refresh stats
    } catch (err) {
      console.error('Update error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ProposalStatus) => {
    const feedback = localFeedback[id] || '';
    const rationale = localRationale[id] || '';
    await updateProposal(id, {
      status: newStatus,
      admin_feedback: feedback,
      decision_rationale: rationale,
    });
  };

  const saveFeedback = async (id: string) => {
    await updateProposal(id, {
      admin_feedback: localFeedback[id] || '',
      decision_rationale: localRationale[id] || '',
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const canMakeDecisions = adminRole === 'super_admin' || adminRole === 'admin';

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-[var(--amber-11)]" />
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                Strategic Proposals
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Review research proposals and make strategic decisions
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="p-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {stats.total}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Total</p>
            </div>
            <div className="p-4 bg-[var(--sky-4)] border border-[var(--sky-6)] rounded-xl">
              <p className="text-2xl font-bold text-[var(--sky-11)]">{stats.pending}</p>
              <p className="text-xs text-[var(--sky-11)]">Pending</p>
            </div>
            <div className="p-4 bg-[var(--teed-green-4)] border border-[var(--teed-green-6)] rounded-xl">
              <p className="text-2xl font-bold text-[var(--teed-green-11)]">
                {stats.approved}
              </p>
              <p className="text-xs text-[var(--teed-green-11)]">Approved</p>
            </div>
            <div className="p-4 bg-[var(--grey-4)] border border-[var(--grey-6)] rounded-xl">
              <p className="text-2xl font-bold text-[var(--grey-11)]">
                {stats.rejected}
              </p>
              <p className="text-xs text-[var(--grey-11)]">Rejected</p>
            </div>
            <div className="p-4 bg-[var(--amber-4)] border border-[var(--amber-6)] rounded-xl">
              <p className="text-2xl font-bold text-[var(--amber-11)]">
                {stats.needs_research}
              </p>
              <p className="text-xs text-[var(--amber-11)]">Needs Research</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--teed-green-9)] focus:ring-2 focus:ring-[var(--teed-green-4)] outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)]"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="needs_research">Needs Research</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)]"
          >
            <option value="">All Categories</option>
            <option value="vertical_expansion">Vertical Expansion</option>
            <option value="product_feature">Product Feature</option>
            <option value="partnership">Partnership</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="other">Other</option>
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

        {/* Empty State */}
        {!isLoading && proposals.length === 0 && (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            No proposals found matching your filters.
          </div>
        )}

        {/* Proposal Cards */}
        {!isLoading && proposals.length > 0 && (
          <div className="space-y-4">
            {proposals.map((proposal) => {
              const statusConfig = PROPOSAL_STATUS_CONFIG[proposal.status];
              const categoryConfig = PROPOSAL_CATEGORY_CONFIG[proposal.category as ProposalCategory] ||
                PROPOSAL_CATEGORY_CONFIG.other;
              const confidenceConfig = proposal.confidence_level
                ? CONFIDENCE_CONFIG[proposal.confidence_level]
                : null;
              const isExpanded = expandedProposalId === proposal.id;

              return (
                <div
                  key={proposal.id}
                  className={`bg-[var(--surface)] border rounded-xl overflow-hidden transition-all ${
                    isExpanded
                      ? `border-2 ${statusConfig.borderHover}`
                      : 'border-[var(--border-subtle)]'
                  }`}
                >
                  {/* Header Row */}
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-wrap items-start gap-4">
                      {/* Category and Status Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${categoryConfig.bg} ${categoryConfig.color}`}
                        >
                          {categoryConfig.label}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                        {confidenceConfig && (
                          <span className={`text-xs font-medium ${confidenceConfig.color}`}>
                            {confidenceConfig.label}
                          </span>
                        )}
                      </div>

                      {/* Date */}
                      <div className="ml-auto flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                        <Clock className="w-3 h-3" />
                        {formatDate(proposal.created_at)}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mt-3">
                      {proposal.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                      {proposal.summary}
                    </p>

                    {/* Expand Button */}
                    <button
                      onClick={() =>
                        setExpandedProposalId(isExpanded ? null : proposal.id)
                      }
                      className="mt-4 flex items-center gap-1 text-sm font-medium text-[var(--teed-green-11)] hover:text-[var(--teed-green-12)] transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronRight className="w-4 h-4" />
                          Expand Full Proposal
                        </>
                      )}
                    </button>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border-subtle)]">
                      {/* Full Content */}
                      <div className="p-4 sm:p-6 bg-[var(--grey-1)]">
                        <div className="prose prose-sm max-w-none text-[var(--text-primary)]">
                          <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                            {proposal.content}
                          </div>
                        </div>

                        {/* Research Sources */}
                        {proposal.research_sources && proposal.research_sources.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                            <h4 className="text-xs font-medium text-[var(--text-tertiary)] uppercase mb-2">
                              Research Sources
                            </h4>
                            <ul className="space-y-1">
                              {proposal.research_sources.map((source, index) => (
                                <li key={index} className="text-sm text-[var(--text-secondary)]">
                                  {source.startsWith('http') ? (
                                    <a
                                      href={source}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[var(--sky-11)] hover:underline flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      {source}
                                    </a>
                                  ) : (
                                    source
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Feedback Section */}
                      <div className="p-4 sm:p-6 bg-[var(--surface)] border-t border-[var(--border-subtle)]">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Feedback */}
                          <div>
                            <label className="block text-xs font-medium text-[var(--text-tertiary)] uppercase mb-2">
                              Your Feedback
                            </label>
                            <textarea
                              value={localFeedback[proposal.id] || ''}
                              onChange={(e) =>
                                setLocalFeedback((prev) => ({
                                  ...prev,
                                  [proposal.id]: e.target.value,
                                }))
                              }
                              placeholder="Add notes, questions, or feedback..."
                              rows={4}
                              className="w-full px-3 py-2 bg-[var(--grey-1)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--teed-green-9)] focus:ring-2 focus:ring-[var(--teed-green-4)] outline-none resize-none"
                            />
                          </div>

                          {/* Decision Rationale */}
                          <div>
                            <label className="block text-xs font-medium text-[var(--text-tertiary)] uppercase mb-2">
                              Decision Rationale
                            </label>
                            <textarea
                              value={localRationale[proposal.id] || ''}
                              onChange={(e) =>
                                setLocalRationale((prev) => ({
                                  ...prev,
                                  [proposal.id]: e.target.value,
                                }))
                              }
                              placeholder="Why are you approving/rejecting this?"
                              rows={4}
                              className="w-full px-3 py-2 bg-[var(--grey-1)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--teed-green-9)] focus:ring-2 focus:ring-[var(--teed-green-4)] outline-none resize-none"
                            />
                          </div>
                        </div>

                        {/* Save Feedback Button */}
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => saveFeedback(proposal.id)}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-[var(--grey-4)] hover:bg-[var(--grey-5)] text-[var(--text-primary)] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <FileText className="w-4 h-4 inline mr-1" />
                            Save Notes
                          </button>
                        </div>

                        {/* Decision Buttons */}
                        {canMakeDecisions && (
                          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                            <label className="block text-xs font-medium text-[var(--text-tertiary)] uppercase mb-3">
                              Decision
                            </label>
                            <div className="flex flex-wrap gap-3">
                              <button
                                onClick={() => handleStatusChange(proposal.id, 'approved')}
                                disabled={isUpdating || proposal.status === 'approved'}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                                  proposal.status === 'approved'
                                    ? 'bg-[var(--teed-green-9)] text-white'
                                    : 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)] hover:bg-[var(--teed-green-5)]'
                                }`}
                              >
                                <Check className="w-4 h-4" />
                                Approve
                              </button>

                              <button
                                onClick={() => handleStatusChange(proposal.id, 'rejected')}
                                disabled={isUpdating || proposal.status === 'rejected'}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                                  proposal.status === 'rejected'
                                    ? 'bg-[var(--grey-9)] text-white'
                                    : 'bg-[var(--grey-4)] text-[var(--grey-11)] hover:bg-[var(--grey-5)]'
                                }`}
                              >
                                <X className="w-4 h-4" />
                                Reject
                              </button>

                              <button
                                onClick={() => handleStatusChange(proposal.id, 'needs_research')}
                                disabled={isUpdating || proposal.status === 'needs_research'}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                                  proposal.status === 'needs_research'
                                    ? 'bg-[var(--amber-9)] text-white'
                                    : 'bg-[var(--amber-4)] text-[var(--amber-11)] hover:bg-[var(--amber-5)]'
                                }`}
                              >
                                <HelpCircle className="w-4 h-4" />
                                Needs Research
                              </button>

                              {proposal.status !== 'pending' && (
                                <button
                                  onClick={() => handleStatusChange(proposal.id, 'pending')}
                                  disabled={isUpdating}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--sky-4)] text-[var(--sky-11)] hover:bg-[var(--sky-5)] transition-all disabled:opacity-50"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  Reset to Pending
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Decision Info */}
                        {proposal.decided_at && proposal.decider && (
                          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                            <User className="w-3 h-3" />
                            Decided by @{proposal.decider.handle} on{' '}
                            {formatDate(proposal.decided_at)}
                          </div>
                        )}
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
              Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of {total}
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
