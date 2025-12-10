'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Package,
  Settings,
  Shield,
} from 'lucide-react';
import type { AuditLogEntry } from '@/lib/types/admin';

export default function AuditLogsClient() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('');
  const perPage = 25;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', perPage.toString());
      params.set('offset', (page * perPage).toString());
      if (actionFilter) params.set('action', actionFilter);
      if (targetTypeFilter) params.set('targetType', targetTypeFilter);

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, targetTypeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionIcon = (action: string) => {
    if (action.startsWith('user.')) return <User className="w-4 h-4" />;
    if (action.startsWith('content.')) return <Package className="w-4 h-4" />;
    if (action.startsWith('settings.') || action.startsWith('affiliate.'))
      return <Settings className="w-4 h-4" />;
    if (action.startsWith('admin.')) return <Shield className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('ban'))
      return 'text-red-600 bg-red-50';
    if (action.includes('create') || action.includes('restore'))
      return 'text-green-600 bg-green-50';
    if (action.includes('update') || action.includes('change'))
      return 'text-amber-600 bg-amber-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\./g, ' > ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const totalPages = Math.ceil(total / perPage);

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
                Audit Logs
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Track all admin actions across the platform
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
            className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--teed-green-6)]"
          >
            <option value="">All Actions</option>
            <option value="user.role_change">Role Changes</option>
            <option value="content.delete">Content Deleted</option>
            <option value="content.flag">Content Flagged</option>
            <option value="admin.login">Admin Logins</option>
            <option value="affiliate.configure">Affiliate Config</option>
          </select>

          <select
            value={targetTypeFilter}
            onChange={(e) => {
              setTargetTypeFilter(e.target.value);
              setPage(0);
            }}
            className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--teed-green-6)]"
          >
            <option value="">All Targets</option>
            <option value="user">Users</option>
            <option value="bag">Bags</option>
            <option value="item">Items</option>
            <option value="settings">Settings</option>
          </select>

          <button
            onClick={fetchLogs}
            className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <div className="flex-1" />

          <p className="text-sm text-[var(--text-secondary)] self-center">
            {total} total logs
          </p>
        </div>

        {/* Logs Table */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)]">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--text-tertiary)]" />
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        Loading logs...
                      </p>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <FileText className="w-8 h-8 mx-auto text-[var(--text-tertiary)]" />
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        No audit logs found
                      </p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--surface-elevated)]">
                      <td className="px-6 py-4">
                        <p className="text-sm text-[var(--text-primary)]">
                          {new Date(log.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {log.admin_email}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] capitalize">
                          {log.admin_role.replace('_', ' ')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(
                            log.action
                          )}`}
                        >
                          {getActionIcon(log.action)}
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {log.target_type ? (
                          <div>
                            <p className="text-sm text-[var(--text-primary)] capitalize">
                              {log.target_type}
                            </p>
                            {log.target_id && (
                              <p className="text-xs text-[var(--text-tertiary)] font-mono truncate max-w-[120px]">
                                {log.target_id}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-[var(--text-tertiary)]">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <pre className="text-xs text-[var(--text-secondary)] bg-[var(--surface-elevated)] p-2 rounded overflow-auto max-w-[300px] max-h-[60px]">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
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
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg border border-[var(--border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface-elevated)]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-[var(--border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface-elevated)]"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
