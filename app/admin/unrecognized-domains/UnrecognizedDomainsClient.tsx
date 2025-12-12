'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Globe,
  ArrowLeft,
  RefreshCw,
  Check,
  X,
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  AlertCircle,
  TrendingUp,
  Clock,
  Database,
} from 'lucide-react';

interface UnrecognizedDomain {
  id: string;
  domain: string;
  first_seen_at: string;
  last_seen_at: string;
  occurrence_count: number;
  sample_urls: string[];
  unique_users: number;
  status: 'pending' | 'added' | 'ignored' | 'blocked';
  notes: string | null;
  suggested_brand: string | null;
  suggested_category: string | null;
  suggested_tier: string | null;
  reviewed_at: string | null;
}

interface Stats {
  pending: number;
  added: number;
  ignored: number;
  blocked: number;
  total: number;
}

type StatusFilter = 'pending' | 'added' | 'ignored' | 'blocked' | 'all';

export default function UnrecognizedDomainsClient() {
  const [domains, setDomains] = useState<UnrecognizedDomain[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [sortBy, setSortBy] = useState<'occurrence_count' | 'last_seen_at'>('occurrence_count');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  const fetchDomains = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        sortBy,
        sortOrder: 'desc',
        limit: '100',
      });

      const response = await fetch(`/api/admin/unrecognized-domains?${params}`);
      const data = await response.json();

      if (response.ok) {
        setDomains(data.domains);
        setStats(data.stats);
      } else {
        console.error('Failed to fetch domains:', data.error);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortBy]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const updateDomainStatus = async (
    id: string,
    status: 'added' | 'ignored' | 'blocked',
    notes?: string
  ) => {
    setUpdatingId(id);
    try {
      const response = await fetch('/api/admin/unrecognized-domains', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes }),
      });

      if (response.ok) {
        // Remove from list if filtering by pending
        if (statusFilter === 'pending') {
          setDomains(prev => prev.filter(d => d.id !== id));
        } else {
          // Refresh to show updated status
          fetchDomains();
        }
      }
    } catch (error) {
      console.error('Error updating domain:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDomain(text);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case 'luxury':
        return 'bg-[var(--amber-4)] text-[var(--amber-11)]';
      case 'premium':
        return 'bg-[var(--sky-4)] text-[var(--sky-11)]';
      case 'mid':
        return 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)]';
      case 'value':
        return 'bg-[var(--grey-4)] text-[var(--grey-11)]';
      default:
        return 'bg-[var(--grey-4)] text-[var(--grey-11)]';
    }
  };

  // Generate code snippet for adding to database
  const generateCodeSnippet = (domain: UnrecognizedDomain) => {
    const brand = domain.suggested_brand || 'BRAND_NAME';
    const category = domain.suggested_category || 'category';
    const tier = domain.suggested_tier || 'mid';

    return `'${domain.domain}': { brand: '${brand}', category: '${category}', tier: '${tier}', aliases: [], isRetailer: false },`;
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--copper-4)] to-[var(--copper-6)] rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-[var(--copper-11)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  Unrecognized Domains
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  Track and add new domains to the brand database
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchDomains()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--grey-4)] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-[var(--amber-11)] mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.pending}</p>
            </div>
            <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-[var(--teed-green-11)] mb-1">
                <Database className="w-4 h-4" />
                <span className="text-sm font-medium">Added</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.added}</p>
            </div>
            <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-[var(--grey-11)] mb-1">
                <EyeOff className="w-4 h-4" />
                <span className="text-sm font-medium">Ignored</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.ignored}</p>
            </div>
            <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-[var(--error)] mb-1">
                <X className="w-4 h-4" />
                <span className="text-sm font-medium">Blocked</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.blocked}</p>
            </div>
            <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-[var(--sky-11)] mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)]">Status:</span>
            <div className="flex gap-1">
              {(['pending', 'added', 'ignored', 'blocked', 'all'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    statusFilter === s
                      ? 'bg-[var(--sky-9)] text-white'
                      : 'bg-[var(--surface)] border border-[var(--border-subtle)] hover:bg-[var(--grey-4)]'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)]">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg"
            >
              <option value="occurrence_count">Occurrences</option>
              <option value="last_seen_at">Last Seen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Domain List */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-[var(--text-secondary)]" />
          </div>
        ) : domains.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-4" />
            <p className="text-[var(--text-secondary)]">
              No unrecognized domains found with status "{statusFilter}"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <div
                key={domain.id}
                className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-mono font-semibold text-[var(--text-primary)]">
                        {domain.domain}
                      </span>
                      <button
                        onClick={() => copyToClipboard(domain.domain)}
                        className="p-1 hover:bg-[var(--grey-4)] rounded transition-colors"
                        title="Copy domain"
                      >
                        {copiedDomain === domain.domain ? (
                          <Check className="w-4 h-4 text-[var(--teed-green-9)]" />
                        ) : (
                          <Copy className="w-4 h-4 text-[var(--text-secondary)]" />
                        )}
                      </button>
                      <a
                        href={`https://${domain.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-[var(--grey-4)] rounded transition-colors"
                        title="Visit site"
                      >
                        <ExternalLink className="w-4 h-4 text-[var(--text-secondary)]" />
                      </a>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)] mb-3">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {domain.occurrence_count} occurrences
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Last seen {formatDate(domain.last_seen_at)}
                      </span>
                    </div>

                    {/* AI Suggestions */}
                    {(domain.suggested_brand || domain.suggested_category) && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {domain.suggested_brand && (
                          <span className="px-2 py-1 bg-[var(--sky-4)] text-[var(--sky-11)] text-xs rounded">
                            AI Brand: {domain.suggested_brand}
                          </span>
                        )}
                        {domain.suggested_category && (
                          <span className="px-2 py-1 bg-[var(--copper-4)] text-[var(--copper-11)] text-xs rounded">
                            AI Category: {domain.suggested_category}
                          </span>
                        )}
                        {domain.suggested_tier && (
                          <span className={`px-2 py-1 text-xs rounded ${getTierColor(domain.suggested_tier)}`}>
                            AI Tier: {domain.suggested_tier}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Sample URLs */}
                    {domain.sample_urls && domain.sample_urls.length > 0 && (
                      <details className="mb-3">
                        <summary className="text-sm text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]">
                          <Eye className="w-4 h-4 inline mr-1" />
                          View sample URLs ({domain.sample_urls.length})
                        </summary>
                        <div className="mt-2 space-y-1">
                          {domain.sample_urls.slice(0, 3).map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs font-mono text-[var(--sky-11)] hover:underline truncate"
                            >
                              {url}
                            </a>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Code Snippet */}
                    {statusFilter === 'pending' && (
                      <details className="mb-2">
                        <summary className="text-sm text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]">
                          <Copy className="w-4 h-4 inline mr-1" />
                          Copy code snippet
                        </summary>
                        <div className="mt-2 relative">
                          <pre className="p-2 bg-[var(--grey-4)] rounded text-xs font-mono overflow-x-auto">
                            {generateCodeSnippet(domain)}
                          </pre>
                          <button
                            onClick={() => copyToClipboard(generateCodeSnippet(domain))}
                            className="absolute top-1 right-1 p-1 bg-[var(--surface)] rounded hover:bg-[var(--grey-4)] transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </details>
                    )}
                  </div>

                  {/* Actions */}
                  {domain.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateDomainStatus(domain.id, 'added')}
                        disabled={updatingId === domain.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[var(--teed-green-9)] text-white rounded-lg hover:bg-[var(--teed-green-10)] transition-colors disabled:opacity-50"
                        title="Mark as added to database"
                      >
                        <Check className="w-4 h-4" />
                        Added
                      </button>
                      <button
                        onClick={() => updateDomainStatus(domain.id, 'ignored')}
                        disabled={updatingId === domain.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[var(--grey-4)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--grey-6)] transition-colors disabled:opacity-50"
                        title="Ignore this domain"
                      >
                        <EyeOff className="w-4 h-4" />
                        Ignore
                      </button>
                      <button
                        onClick={() => updateDomainStatus(domain.id, 'blocked')}
                        disabled={updatingId === domain.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[var(--error-bg)] text-[var(--error)] rounded-lg hover:bg-[var(--error)] hover:text-white transition-colors disabled:opacity-50"
                        title="Block this domain"
                      >
                        <X className="w-4 h-4" />
                        Block
                      </button>
                    </div>
                  )}

                  {/* Status badge for non-pending */}
                  {domain.status !== 'pending' && (
                    <span
                      className={`px-3 py-1.5 text-sm rounded-lg ${
                        domain.status === 'added'
                          ? 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)]'
                          : domain.status === 'ignored'
                          ? 'bg-[var(--grey-4)] text-[var(--grey-11)]'
                          : 'bg-[var(--error-bg)] text-[var(--error)]'
                      }`}
                    >
                      {domain.status.charAt(0).toUpperCase() + domain.status.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
