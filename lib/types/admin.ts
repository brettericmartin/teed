/**
 * Admin System Types
 * Type definitions for role-based admin access control
 */

// ═══════════════════════════════════════════════════════════════════
// Role Types
// ═══════════════════════════════════════════════════════════════════

export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  handle: string;
  displayName: string;
}

// ═══════════════════════════════════════════════════════════════════
// Permission Types
// ═══════════════════════════════════════════════════════════════════

export interface AdminPermissions {
  // User management
  canManageUsers: boolean; // View/edit users
  canBanUsers: boolean; // Ban/unban users
  canVerifyUsers: boolean; // Mark users as verified
  canManageAdmins: boolean; // Promote/demote admins (super_admin only)

  // Content moderation
  canDeleteContent: boolean; // Delete bags, items, links
  canHideContent: boolean; // Hide (soft-delete) content
  canRestoreContent: boolean; // Restore hidden content
  canFlagContent: boolean; // Flag inappropriate content

  // System configuration
  canConfigureAffiliate: boolean; // Manage affiliate settings
  canViewAnalytics: boolean; // View platform analytics
  canViewAuditLogs: boolean; // View admin audit trail
  canExportData: boolean; // Export platform data
}

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  super_admin: {
    canManageUsers: true,
    canBanUsers: true,
    canVerifyUsers: true,
    canManageAdmins: true,
    canDeleteContent: true,
    canHideContent: true,
    canRestoreContent: true,
    canFlagContent: true,
    canConfigureAffiliate: true,
    canViewAnalytics: true,
    canViewAuditLogs: true,
    canExportData: true,
  },
  admin: {
    canManageUsers: true,
    canBanUsers: true,
    canVerifyUsers: true,
    canManageAdmins: false, // Cannot manage super_admins or other admins
    canDeleteContent: true,
    canHideContent: true,
    canRestoreContent: true,
    canFlagContent: true,
    canConfigureAffiliate: true,
    canViewAnalytics: true,
    canViewAuditLogs: true,
    canExportData: true,
  },
  moderator: {
    canManageUsers: true, // View only in practice
    canBanUsers: false, // Must escalate to admin
    canVerifyUsers: false,
    canManageAdmins: false,
    canDeleteContent: false, // Must escalate
    canHideContent: true, // Can hide but not delete
    canRestoreContent: false,
    canFlagContent: true,
    canConfigureAffiliate: false,
    canViewAnalytics: false,
    canViewAuditLogs: false,
    canExportData: false,
  },
};

// Helper to get permissions for a role
export function getPermissionsForRole(role: AdminRole | null): AdminPermissions | null {
  if (!role) return null;
  return ROLE_PERMISSIONS[role];
}

// ═══════════════════════════════════════════════════════════════════
// Audit Log Types
// ═══════════════════════════════════════════════════════════════════

export interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  admin_email: string;
  admin_role: AdminRole;
  action: AuditAction;
  target_type: AuditTargetType | null;
  target_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type AuditAction =
  // User actions
  | 'user.role_change'
  | 'user.ban'
  | 'user.unban'
  | 'user.verify'
  | 'user.unverify'
  | 'user.delete'
  // Content actions
  | 'content.delete'
  | 'content.hide'
  | 'content.restore'
  | 'content.flag'
  | 'content.unflag'
  | 'content.feature'
  | 'content.unfeature'
  | 'content.spotlight'
  | 'content.unspotlight'
  | 'content.transfer'
  // Feedback actions
  | 'feedback.update'
  | 'feedback.resolve'
  // Settings actions
  | 'settings.update'
  | 'affiliate.configure'
  // Access actions
  | 'admin.login'
  | 'admin.access_denied'
  | 'admin.discovery.view'
  // Bulk actions
  | 'bulk.delete'
  | 'bulk.hide'
  | 'bulk.feature'
  // System actions
  | 'system.initial_setup'
  | 'system.migration';

export type AuditTargetType =
  | 'user'
  | 'bag'
  | 'item'
  | 'link'
  | 'feedback'
  | 'settings'
  | 'system'
  | 'content_ideas'
  | 'search_query'
  | 'strategic_initiatives';

// ═══════════════════════════════════════════════════════════════════
// Admin Dashboard Types
// ═══════════════════════════════════════════════════════════════════

export interface AdminStats {
  totalUsers: number;
  totalBags: number;
  totalItems: number;
  activeUsersToday: number;
  newUsersThisWeek: number;
  pendingFlags: number;
}

export interface UserForAdmin {
  id: string;
  handle: string;
  display_name: string;
  email: string;
  admin_role: AdminRole | null;
  beta_tier: string | null;
  is_verified: boolean;
  created_at: string;
  last_active_at: string | null;
  total_bags: number;
  total_views: number;
}

export interface BagForAdmin {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string | null;
  is_public: boolean;
  is_featured: boolean;
  is_flagged: boolean;
  is_hidden: boolean;
  is_spotlight: boolean;
  flag_reason: string | null;
  featured_at: string | null;
  item_count: number;
  view_count: number;
  owner: {
    id: string;
    handle: string;
    display_name: string;
  };
  created_at: string;
  updated_at: string | null;
}

// ═══════════════════════════════════════════════════════════════════
// Role Hierarchy Helpers
// ═══════════════════════════════════════════════════════════════════

const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 3,
  admin: 2,
  moderator: 1,
};

export function hasRoleLevel(userRole: AdminRole | null, requiredRole: AdminRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canManageRole(managerRole: AdminRole | null, targetRole: AdminRole | null): boolean {
  if (!managerRole) return false;
  if (managerRole !== 'super_admin') return false; // Only super_admin can manage roles
  if (targetRole === 'super_admin') return false; // Cannot demote super_admin
  return true;
}

export function getRoleDisplayName(role: AdminRole | null): string {
  if (!role) return 'User';
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    case 'moderator':
      return 'Moderator';
  }
}

export function getRoleBadgeColor(role: AdminRole | null): string {
  if (!role) return 'bg-gray-100 text-gray-800';
  switch (role) {
    case 'super_admin':
      return 'bg-purple-100 text-purple-800';
    case 'admin':
      return 'bg-amber-100 text-amber-800';
    case 'moderator':
      return 'bg-sky-100 text-sky-800';
  }
}
