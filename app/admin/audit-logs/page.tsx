import { redirect } from 'next/navigation';
import { getAdminUser, hasRole, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import AuditLogsClient from './AuditLogsClient';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  // Require admin role for audit logs
  if (!(await hasRole('admin'))) {
    redirect('/admin');
  }

  // Log admin access
  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'audit-logs',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <AuditLogsClient />
    </>
  );
}
