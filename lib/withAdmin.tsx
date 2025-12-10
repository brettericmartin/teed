import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { getAdminUser, hasRole, logAdminAction } from './adminAuth';
import type { AdminRole, AdminUser } from './types/admin';
import { ROLE_PERMISSIONS } from './types/admin';

/**
 * Props injected into admin-protected components
 */
export interface AdminPageProps {
  admin: AdminUser;
}

/**
 * Higher-Order Component to protect server components with admin access.
 *
 * Usage in page.tsx:
 * ```tsx
 * async function AdminPage({ admin }: AdminPageProps) {
 *   return <div>Welcome, {admin.displayName}</div>;
 * }
 *
 * export default withAdmin(AdminPage, 'admin');
 * ```
 */
export function withAdmin<P extends AdminPageProps>(
  Component: React.ComponentType<P>,
  requiredRole: AdminRole = 'moderator'
) {
  return async function ProtectedAdminPage(props: Omit<P, 'admin'>) {
    const admin = await getAdminUser();

    if (!admin) {
      redirect('/dashboard');
    }

    const hasPermission = await hasRole(requiredRole);
    if (!hasPermission) {
      // Log failed access attempt
      await logAdminAction(admin, 'admin.access_denied', null, null, {
        required_role: requiredRole,
        user_role: admin.role,
      });
      redirect('/dashboard');
    }

    return <Component {...(props as P)} admin={admin} />;
  };
}

/**
 * Utility for API route protection.
 *
 * Usage in route.ts:
 * ```tsx
 * export async function GET(request: NextRequest) {
 *   const result = await withAdminApi('admin');
 *   if ('error' in result) return result.error;
 *   const { admin } = result;
 *
 *   // Your admin logic here
 * }
 * ```
 */
export async function withAdminApi(
  requiredRole: AdminRole = 'moderator'
): Promise<{ admin: AdminUser } | { error: NextResponse }> {
  const admin = await getAdminUser();

  if (!admin) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const hasPermission = await hasRole(requiredRole);
  if (!hasPermission) {
    await logAdminAction(admin, 'admin.access_denied', null, null, {
      required_role: requiredRole,
    });
    return {
      error: NextResponse.json(
        { error: `Insufficient permissions. Required: ${requiredRole}` },
        { status: 403 }
      ),
    };
  }

  return { admin };
}

/**
 * Check if admin has a specific permission.
 *
 * Usage:
 * ```tsx
 * if (await checkPermission(admin, 'canDeleteContent')) {
 *   // Delete content
 * }
 * ```
 */
export function checkPermission(
  admin: AdminUser,
  permission: keyof typeof ROLE_PERMISSIONS.super_admin
): boolean {
  const permissions = ROLE_PERMISSIONS[admin.role];
  return permissions[permission];
}

/**
 * Get all permissions for display purposes
 */
export function getAdminPermissions(admin: AdminUser) {
  return ROLE_PERMISSIONS[admin.role];
}
