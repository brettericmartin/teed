import { createServerSupabase } from './serverSupabase';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import type { AdminRole, AdminUser, AuditAction, AuditTargetType } from './types/admin';

// Re-export types for convenience
export type { AdminRole, AdminUser } from './types/admin';

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 3,
  admin: 2,
  moderator: 1,
};

/**
 * Get current user's admin role (or null if not admin)
 */
export async function getAdminRole(): Promise<AdminRole | null> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('admin_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.admin_role) {
      return null;
    }

    return profile.admin_role as AdminRole;
  } catch (error) {
    console.error('Admin role check error:', error);
    return null;
  }
}

/**
 * Check if current user has admin access (any admin role)
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getAdminRole();
  return role !== null;
}

/**
 * Check if current user has specific admin role or higher
 */
export async function hasRole(requiredRole: AdminRole): Promise<boolean> {
  const role = await getAdminRole();
  if (!role) return false;

  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user is super_admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  return hasRole('super_admin');
}

/**
 * Get full admin user info
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('admin_role, handle, display_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.admin_role) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      role: profile.admin_role as AdminRole,
      handle: profile.handle,
      displayName: profile.display_name,
    };
  } catch (error) {
    console.error('Get admin user error:', error);
    return null;
  }
}

/**
 * Require admin access - throws if not admin
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error('Unauthorized: Admin access required');
  }
  return admin;
}

/**
 * Require specific role - throws if insufficient permissions
 */
export async function requireRole(requiredRole: AdminRole): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error('Unauthorized: Admin access required');
  }

  const hasPermission = ROLE_HIERARCHY[admin.role] >= ROLE_HIERARCHY[requiredRole];
  if (!hasPermission) {
    throw new Error(`Unauthorized: ${requiredRole} role required`);
  }

  return admin;
}

/**
 * Log an admin action to audit trail
 */
export async function logAdminAction(
  admin: AdminUser,
  action: AuditAction,
  targetType: AuditTargetType | null,
  targetId: string | null,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    // Use service role for audit logging
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get request context
    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      null;
    const userAgent = headersList.get('user-agent') || null;

    await supabase.from('admin_audit_log').insert({
      admin_id: admin.id,
      admin_email: admin.email,
      admin_role: admin.role,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch (error) {
    // Log but don't fail - audit logging should not break admin operations
    console.error('Failed to log admin action:', error);
  }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(options: {
  limit?: number;
  offset?: number;
  action?: string;
  adminId?: string;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ logs: unknown[]; total: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let query = supabase
    .from('admin_audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options.action) {
    query = query.eq('action', options.action);
  }
  if (options.adminId) {
    query = query.eq('admin_id', options.adminId);
  }
  if (options.targetType) {
    query = query.eq('target_type', options.targetType);
  }
  if (options.targetId) {
    query = query.eq('target_id', options.targetId);
  }
  if (options.startDate) {
    query = query.gte('created_at', options.startDate.toISOString());
  }
  if (options.endDate) {
    query = query.lte('created_at', options.endDate.toISOString());
  }

  const limit = options.limit || 50;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch audit logs:', error);
    return { logs: [], total: 0 };
  }

  return { logs: data || [], total: count || 0 };
}

/**
 * Update a user's admin role (super_admin only)
 */
export async function updateUserRole(
  admin: AdminUser,
  targetUserId: string,
  newRole: AdminRole | null
): Promise<{ success: boolean; error?: string }> {
  if (admin.role !== 'super_admin') {
    return { success: false, error: 'Only super_admin can manage roles' };
  }

  // Cannot modify own role
  if (targetUserId === admin.id) {
    return { success: false, error: 'Cannot modify your own role' };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get target user's current role
  const { data: targetProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('admin_role, handle')
    .eq('id', targetUserId)
    .single();

  if (fetchError) {
    return { success: false, error: 'User not found' };
  }

  // Cannot demote another super_admin
  if (targetProfile.admin_role === 'super_admin') {
    return { success: false, error: 'Cannot modify another super_admin' };
  }

  // Update the role
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ admin_role: newRole })
    .eq('id', targetUserId);

  if (updateError) {
    return { success: false, error: 'Failed to update role' };
  }

  // Log the action
  await logAdminAction(admin, 'user.role_change', 'user', targetUserId, {
    target_handle: targetProfile.handle,
    previous_role: targetProfile.admin_role,
    new_role: newRole,
  });

  return { success: true };
}
