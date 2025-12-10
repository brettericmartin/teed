'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Search,
  ChevronDown,
  Check,
  X,
  User,
  Crown,
  ShieldCheck,
  UserCog,
  RefreshCw,
} from 'lucide-react';
import {
  type AdminRole,
  type UserForAdmin,
  getRoleDisplayName,
  getRoleBadgeColor,
  ROLE_PERMISSIONS,
} from '@/lib/types/admin';

interface Props {
  adminRole: AdminRole;
  adminId: string;
}

interface GlobalStats {
  totalUsers: number;
  superAdmins: number;
  admins: number;
  moderators: number;
}

export default function UserManagementClient({ adminRole, adminId }: Props) {
  const [users, setUsers] = useState<UserForAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalUsers: 0,
    superAdmins: 0,
    admins: 0,
    moderators: 0,
  });

  const canManageAdmins = ROLE_PERMISSIONS[adminRole].canManageAdmins;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (roleFilter !== 'all') params.set('role', roleFilter);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        if (data.stats) {
          setGlobalStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: AdminRole | null) => {
    setSavingRole(true);
    try {
      const response = await fetch('/api/admin/users/role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, admin_role: newRole } : u
          )
        );
        setEditingUserId(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update role');
    } finally {
      setSavingRole(false);
    }
  };

  const getRoleIcon = (role: AdminRole | null) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-4 h-4" />;
      case 'admin':
        return <ShieldCheck className="w-4 h-4" />;
      case 'moderator':
        return <UserCog className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
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
                User Management
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                View and manage user accounts and roles
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by handle or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--teed-green-6)]"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--teed-green-6)]"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="user">Regular User</option>
          </select>

          {/* Refresh */}
          <button
            onClick={fetchUsers}
            className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Role Management Note */}
        {!canManageAdmins && (
          <div className="mb-6 p-4 bg-[var(--amber-4)] border border-[var(--amber-6)] rounded-lg">
            <p className="text-sm text-[var(--amber-11)]">
              <Shield className="w-4 h-4 inline mr-2" />
              Only super admins can change user roles. You can view user
              information but cannot modify roles.
            </p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)]">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Beta Tier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Joined
                  </th>
                  {canManageAdmins && (
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--text-tertiary)]" />
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        Loading users...
                      </p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <User className="w-8 h-8 mx-auto text-[var(--text-tertiary)]" />
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        No users found
                      </p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-[var(--surface-elevated)]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--teed-green-4)] flex items-center justify-center">
                            <span className="text-sm font-medium text-[var(--teed-green-11)]">
                              {user.display_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">
                              {user.display_name}
                              {user.is_verified && (
                                <Check className="w-4 h-4 inline ml-1 text-[var(--teed-green-9)]" />
                              )}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)]">
                              @{user.handle}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)]">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingUserId === user.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              defaultValue={user.admin_role || 'user'}
                              onChange={(e) => {
                                const value = e.target.value;
                                handleRoleChange(
                                  user.id,
                                  value === 'user' ? null : (value as AdminRole)
                                );
                              }}
                              disabled={savingRole}
                              className="px-3 py-1.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded text-sm"
                            >
                              <option value="user">User</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                              user.admin_role
                            )}`}
                          >
                            {getRoleIcon(user.admin_role)}
                            {getRoleDisplayName(user.admin_role)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.beta_tier ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--sky-4)] text-[var(--sky-11)] capitalize">
                            {user.beta_tier}
                          </span>
                        ) : (
                          <span className="text-sm text-[var(--text-tertiary)]">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-[var(--text-primary)]">
                            {user.total_bags} bags
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {user.total_views.toLocaleString()} views
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                        {user.last_active_at && (
                          <p className="text-xs text-[var(--text-tertiary)]">
                            Active:{' '}
                            {new Date(user.last_active_at).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      {canManageAdmins && (
                        <td className="px-6 py-4 text-right">
                          {user.admin_role === 'super_admin' ? (
                            <span className="text-xs text-[var(--text-tertiary)]">
                              Protected
                            </span>
                          ) : user.id === adminId ? (
                            <span className="text-xs text-[var(--text-tertiary)]">
                              You
                            </span>
                          ) : (
                            <button
                              onClick={() => setEditingUserId(user.id)}
                              className="px-3 py-1.5 text-sm font-medium text-[var(--teed-green-11)] hover:bg-[var(--teed-green-4)] rounded transition-colors"
                            >
                              Edit Role
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-secondary)]">Total Users</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {globalStats.totalUsers}
            </p>
          </div>
          <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-secondary)]">Super Admins</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {globalStats.superAdmins}
            </p>
          </div>
          <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-secondary)]">Admins</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {globalStats.admins}
            </p>
          </div>
          <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-secondary)]">Moderators</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {globalStats.moderators}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
